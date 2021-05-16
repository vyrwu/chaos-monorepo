import { ChaosController, K8sDeployer } from '@vyrwu/ts-api'
import axios from 'axios'

(async () => {
  const [runId, mode, upstreamService, downstreamsService, successCriterionString] = process.argv.slice(2)
  const successCriterion: ChaosController.TestSuccessCriterion = JSON.parse(successCriterionString)
  const isDev = process.env['isDev']
  const runsApi = new ChaosController.RunsApi()
  const deployerApi = new K8sDeployer.DefaultApi()

  const isTestRunningBackoff = async (runId: string, timeout: number, retries: number) => {
    let count = retries
    const poolStatus = async (): Promise<boolean> => {
      const { data } = await runsApi.getRun(runId)
      if (data.status === ChaosController.RunStatusEnum.Running) {
        return true
      }
      await delay(timeout / count)
      count--
      if (count !== 0) {
        return await poolStatus()
      }
      return false
    }
    return await poolStatus()
  }
  
  const delay = (s: number) => {
    return new Promise( resolve => setTimeout(resolve, s*1000) );
  }

  const getPrometheusQuery = (service: string, namespace: string): string => encodeURI(`sum(irate(istio_requests_total{reporter="destination",destination_service=~"${service}.${namespace}.svc.cluster.local",response_code!~"5.*"}[1m])) / sum(irate(istio_requests_total{reporter="destination",destination_service=~"${service}.${namespace}.svc.cluster.local"}[1m]))`)

  try {
    // Start the test actually
    const { Canary, Production } = K8sDeployer.ChaosRunModeEnum
    const chaosDeployResult = await deployerApi.deployChaosTest({
      runId,
      mode: mode === Canary ? Canary : Production,
    })
    await runsApi.appendLog(runId, {
      severity: ChaosController.LogEntrySeverityEnum.Info,
      message: `${JSON.stringify(chaosDeployResult)}`
    })
    // // Wait until Test started, linear backoff
    const isTestRunning = await isTestRunningBackoff(runId, 25, 5)
    if (!isTestRunning) {
      throw new Error(`Timeout waiting for a run '${runId}' to start.`)
    }
    const compare = (comparisonOperator: string) => {
      const {Equal, LessThan, GreaterThan} = ChaosController.TestSuccessCriterionComparisonOperatorEnum
      const comparisons = {
        [`${Equal}`]: (a: number, b: number) => a === b,
        [`${GreaterThan}`]: (a: number, b: number) => a > b,
        [`${LessThan}`]: (a: number, b: number) => a < b,
      }
      if (Object.keys(comparisons).includes(comparisonOperator)) {
        throw new Error(`Unsupported comparison operator '${comparisonOperator}'. Supported: ${JSON.stringify(ChaosController.TestSuccessCriterionComparisonOperatorEnum, null, 2)}`)
      }
      return comparisons[comparisonOperator]
    }
    const { comparisonOperator, service, threshold } = successCriterion

    await runsApi.appendLog(runId, {
        severity: ChaosController.LogEntrySeverityEnum.Info,
        message: `Starting Chaos Test Evaluation (Success Criterion: ${JSON.stringify(successCriterion)})`
    })
    let testStatus: ChaosController.RunResultsStatusEnum = ChaosController.RunResultsStatusEnum.Pass;
    for (let i = 0; i < 5; i++) {
      await delay(5)
      const { data: queryResponse } = await axios.get(`http://${isDev ? 'localhost' : 'prometheus'}:9090/api/v1/query?query=${getPrometheusQuery(service as string, chaosDeployResult.data.namespace as string)}`)
      const [_, serverSuccessRate] = queryResponse.data.result[0].value // value between 0 and 1
      const isTestSuccessful = compare(comparisonOperator as string)(threshold as number, serverSuccessRate)
      if (!isTestSuccessful) {
        await runsApi.appendLog(runId, {
          severity: ChaosController.LogEntrySeverityEnum.Info,
          message: `FAIL: ${serverSuccessRate} (expected ${comparisonOperator} ${threshold}).`
        })
        testStatus = ChaosController.RunResultsStatusEnum.Fail
        return
      }
      await runsApi.appendLog(runId, {
        severity: ChaosController.LogEntrySeverityEnum.Info,
        message: `OK: ${serverSuccessRate} (expected ${comparisonOperator} ${threshold}).`
      })
    }
    await runsApi.patchRun(runId, {
      status: ChaosController.RunStatusEnum.Completed,
      results: {
        upstreamService: {
          name: upstreamService,
          logDump: '' // logs here
        },
        downstreamService: {
          name: downstreamsService,
          logDump: '' // logs here
        },
        status: testStatus
      }
    })
  } catch (err) {
    console.log(err)
    Promise.all([
      runsApi.patchRun(runId, { status: ChaosController.RunStatusEnum.Crashed }),
      deployerApi.redeployAll(),
      await runsApi.appendLog(runId, {
        severity: ChaosController.LogEntrySeverityEnum.Fatal,
        message: `CHAOS WORKER ERROR: ${JSON.stringify(err)}`
      })
    ]).catch(e => {
      console.log(e)
    })
    process.exit(1)
  }
})();
