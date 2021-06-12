import { ChaosController } from '@vyrwu/ts-api'

export const isPredicateTrueBackoff = async (predicate: () => Promise<boolean>, timeout: number, retries: number) => {
  let count = retries
  const poolStatus = async (): Promise<boolean> => {
    const result = await predicate()
    if (result) {
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

// const isTestRunningBackoff = async (runId: string, timeout: number, retries: number) => {
//   let count = retries
//   const poolStatus = async (): Promise<boolean> => {
//     const { data } = await runsApi.getRun(runId)
//     if (data.status === ChaosController.RunStatusEnum.Running) {
//       return true
//     }
//     await delay(timeout / count)
//     count--
//     if (count !== 0) {
//       return await poolStatus()
//     }
//     return false
//   }
//   return await poolStatus()
// }

export const delay = (s: number) => {
  return new Promise( resolve => setTimeout(resolve, s*1000) );
}

export const getPrometheusQuery = (
  service: string,
  namespace: string
): string => encodeURI(`sum(irate(istio_requests_total{reporter="destination",destination_service=~"${service}.${namespace}.svc.cluster.local",response_code!~"5.*"}[1m])) / sum(irate(istio_requests_total{reporter="destination",destination_service=~"${service}.${namespace}.svc.cluster.local"}[1m]))`)

export const log = async (
  runId: string,
    logEntry: {
      severity: ChaosController.LogEntrySeverityEnum,
      message: string
  }
) => {
  const runsApi = new ChaosController.RunsApi()
  console.log(logEntry)
  await runsApi.appendLog(runId, logEntry)
}
