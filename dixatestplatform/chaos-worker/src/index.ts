import { ChaosController, K8sDeployer } from '@vyrwu/ts-api'
import axios from 'axios'
import { delay, getPrometheusQuery, isPredicateTrueBackoff, log } from './util';

(async () => {
  // Validate script argument
  const [$1, $2, $3, $4, $5, $6] = process.argv.slice(2)
  
  const args: {[key: string]: string} = {
    runId: $1,
    mode: $2,
    upstreamService: $3,
    downstreamsService: $4,
    successCriterionString: $5,
    routingSpecString: $6,
  }

  // console.log(`Input args: ${JSON.stringify(process.argv, null, 2)}`)

  Object.keys(args).forEach((key: string) => {
    if (!args[key]) {
      throw new Error(`Missing argument: ${key}`)
    }
  })

  const {
    runId,
    mode,
    upstreamService,
    downstreamsService,
    successCriterionString,
    routingSpecString,
  } = args

  const successCriterion: ChaosController.TestSuccessCriterion = JSON.parse(successCriterionString)
  const routingSpec: ChaosController.RoutingSpec = JSON.parse(routingSpecString)

  const isDev = process.env['isDev']
  const runsApi = new ChaosController.RunsApi()
  const deployerApi = new K8sDeployer.DefaultApi()
  await log(runId, {
    severity: ChaosController.LogEntrySeverityEnum.Info,
    message: `Chaos Test Worker started!`
  })

  try {
    // Start the test actually
    const chaosDeployResult = await deployerApi.deployChaosTest({
      runId,
      mode: mode as K8sDeployer.DeploymentMode,
      routingSpec,
    })

    console.log(chaosDeployResult.data)

    // Verify that the test is running (k8s0deployer sets status to Running once it finished the deploy)
    const isTestRunning = await isPredicateTrueBackoff(
      async () => {
        const { data } = await runsApi.getRun(runId)
        if (data.status === ChaosController.RunStatusEnum.Running) {
          return true
        }
        return false
      },
      25,
      5
    )
    if (!isTestRunning) {
      throw new Error(`Timeout waiting for a run '${runId}' to start.`)
    }
    const compare = (comparisonOperator: string) => {
      const { GreaterThan, LessThan, Equal } = ChaosController.TestSuccessCriterionComparisonOperatorEnum
      const comparisons: {[key: string]: (a: number, b: number) => boolean} = {
        [Equal]: (a: number, b: number) => a === b,
        [GreaterThan]: (a: number, b: number) => a > b,
        [LessThan]: (a: number, b: number) => a < b,
      }
      if (!Object.keys(comparisons).includes(comparisonOperator)) {
        throw new Error(`Unsupported comparison operator '${comparisonOperator}'.`)
      }
      return comparisons[comparisonOperator]
    }
    const { comparisonOperator, service, threshold } = successCriterion

    // console.log("Pooling for the test run status to be 'successful'...")
    await log(runId, {
        severity: ChaosController.LogEntrySeverityEnum.Info,
        message: `Starting Chaos Test Evaluation (Success Criterion: ${JSON.stringify(successCriterion)})`
    })

    const observeTest = async (): Promise<ChaosController.RunResultsStatusEnum> => {
      for (let i = 0; i < 5; i++) {
        await delay(5)
        const getDownsteamServiceMetric = async () => {
          const { data: queryResponse } = await axios.get(`http://${isDev ? 'localhost' : 'prometheus'}:9090/api/v1/query?query=${getPrometheusQuery(service as string, chaosDeployResult.data.namespace as string)}`)
          console.log(queryResponse)
          return queryResponse.data.result[0] // value between 0 and 1
        }
        const isMetricAvailable = await isPredicateTrueBackoff(
          async () => {
            const metricData = await getDownsteamServiceMetric()
            if (!metricData) {
              return false
            }
            return true
          },
          120,
          5
        )
        if (!isMetricAvailable) {
          throw new Error(`Timeout waiting for metrics to be available. Prometheus Query: '${getPrometheusQuery(service as string, chaosDeployResult.data.namespace as string)}'.`)
        }

        const queryResponse = await getDownsteamServiceMetric()
        const serverSuccessRate = queryResponse.data.result[0].value[1] // value between 0 and 1
        console.log({
          serverSuccessRate: {
            value: serverSuccessRate,
            type: `${typeof serverSuccessRate}`
          },
        })
        const isTestSuccessful = compare(comparisonOperator as string)(parseFloat(serverSuccessRate), threshold as number)
        if (!isTestSuccessful) {
          await log(runId, {
            severity: ChaosController.LogEntrySeverityEnum.Info,
            message: `FAIL: ${serverSuccessRate} (expected ${comparisonOperator} ${threshold}).`
          })
          return ChaosController.RunResultsStatusEnum.Fail 
        }
        await log(runId, {
          severity: ChaosController.LogEntrySeverityEnum.Info,
          message: `OK: ${serverSuccessRate} (expected ${comparisonOperator} ${threshold}).`
        })
      }
      return ChaosController.RunResultsStatusEnum.Pass
    }
    // TODO Observe only if success criterion exists.
    const testStatus: ChaosController.RunResultsStatusEnum = await observeTest()
    
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
    // console.log(err)
    await Promise.all([
      runsApi.patchRun(runId, { status: ChaosController.RunStatusEnum.Crashed }),
      deployerApi.redeployAll(),
      log(runId, {
        severity: ChaosController.LogEntrySeverityEnum.Fatal,
        message: `CHAOS WORKER ERROR: ${err}`
      })
    ])
    process.exit(1)
  }
})();
