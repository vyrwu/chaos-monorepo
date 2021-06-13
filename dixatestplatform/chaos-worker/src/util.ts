import { ChaosController } from '@vyrwu/ts-api'
import axios from 'axios'

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

export const observeTest = async (
  runId: string,
  namespace: string,
  successCriterion: ChaosController.TestSuccessCriterion,
  isDev: boolean = false,
): Promise<ChaosController.RunResultsStatusEnum> => {
  const { comparisonOperator, service, threshold } = successCriterion
  // initial delay to let the service warm up
  await delay(60)
  let failCount = 0
  for (let i = 0; i < 10; i++) {
    if (failCount >= 3) {
      return ChaosController.RunResultsStatusEnum.Fail
    }
    await delay(10)
    const getDownsteamServiceMetric = async () => {
      const { data: queryResponse } = await axios.get(`http://${isDev ? 'localhost' : 'prometheus'}:9090/api/v1/query?query=${getPrometheusQuery(service as string, namespace)}`)
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
      throw new Error(`Timeout waiting for metrics to be available. Prometheus Query: '${getPrometheusQuery(service as string, namespace)}'.`)
    }

    const queryResponse = await getDownsteamServiceMetric()
    const serverSuccessRate = queryResponse.value[1] // value between 0 and 1
    console.log({
      queryResponse: JSON.stringify(queryResponse),
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
      continue
    }
    await log(runId, {
      severity: ChaosController.LogEntrySeverityEnum.Info,
      message: `OK: ${serverSuccessRate} (expected ${comparisonOperator} ${threshold}).`
    })
  }
  return ChaosController.RunResultsStatusEnum.Pass
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
