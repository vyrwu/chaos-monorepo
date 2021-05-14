// TODO: collect SLA for a service
import { V1beta1RunAsUserStrategyOptions } from '@kubernetes/client-node'
import { ChaosController, K8sDeployer } from '@vyrwu/ts-api'
import axios from 'axios'

(async () => {
  const [runId, mode, upstreamService, downstreamsService] = process.argv.slice(2)
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

  const getPrometheusQuery = (service: string, namespace: string): string => encodeURI(`sum(irate(istio_requests_total{reporter="destination",destination_service=~"${service}.${namespace}.svc.cluster.local",response_code!~"5.*"}[1m])) / sum(irate(istio_requests_total{reporter="destination",destination_service=~"conversation-service.${namespace}.svc.cluster.local"}[1m]))`)

  try {
    // Start the test actually
    const { Canary, Production } = K8sDeployer.ChaosRunModeEnum
    const chaosDeployResult = await deployerApi.deployChaosTest({
      runId,
      mode: mode === Canary ? Canary : Production,
    })
    // Wait until Test started, linear backoff
    const isTestRunning = await isTestRunningBackoff(runId, 25, 5)
    if (!isTestRunning) {
      throw new Error(`Timeout waiting for a run '${runId}' to start.`)
    }
    // Collect Prometheus metric
    const queryResults = await axios.get(`http://prometheus:9090/api/v1/query?query=${getPrometheusQuery(upstreamService, chaosDeployResult.data.namespace as string)}`)
    // TODO: If metric OK, PASS the test
    // TODO: If metric not OK, snapshot pod logs and FAIL the test 
    
  } catch (err) {
    console.log(err)
    Promise.all([
      runsApi.patchRun(runId, { status: ChaosController.RunStatusEnum.Crashed }),
      deployerApi.redeployAll(),
      runsApi.appendLog(runId, {
        severity: ChaosController.LogEntrySeverityEnum.Fatal,
        message: `CHAOS WORKER ERROR: ${JSON.stringify(err)}`
      })
    ]).catch(e => {
      console.log(e)
    })
    process.exit(1)
  }
})();
