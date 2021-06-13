import { ChaosController, K8sDeployer } from '@vyrwu/ts-api'
import { isPredicateTrueBackoff, log, observeTest } from './util';

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

  const successCriterion: null | ChaosController.TestSuccessCriterion = successCriterionString === "" ? null : JSON.parse(successCriterionString)
  const routingSpec: ChaosController.RoutingSpec = JSON.parse(routingSpecString)

  // const isDev = process.env['isDev']
  const runsApi = new ChaosController.RunsApi()
  const deployerApi = new K8sDeployer.DefaultApi()
  await log(runId, {
    severity: ChaosController.LogEntrySeverityEnum.Info,
    message: `Chaos worker started!`
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

    // Check if successCriterion present

    await log(runId, {
      severity: ChaosController.LogEntrySeverityEnum.Info,
      message: `Chaos experiment started successfully! Experiment resources will NOT be cleaned-up automatically - you must do manually via the '/test/{id}/stop' endpoint.`
    })

    if (successCriterion) {
      await log(runId, {
        severity: ChaosController.LogEntrySeverityEnum.Info,
        message: `Observing chaos experiment... (Success Criterion: ${JSON.stringify(successCriterion)})`
      })
      // TODO Observe only if success criterion exists.
      const testStatus: ChaosController.RunResultsStatusEnum = await observeTest(runId,
        chaosDeployResult.data.namespace as string,
        successCriterion)

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
    } else {
      await runsApi.patchRun(runId, { status: ChaosController.RunStatusEnum.Completed })
    }
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
