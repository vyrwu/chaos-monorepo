/* eslint-disable no-unused-vars */
const fs = require('fs')
const path = require('path')
const { ChaosController } = require('@vyrwu/ts-api')
const { applyFile } = require('./util');
const Service = require('./Service');
const {
  deployChaosCanaryCluster,
  addChaosCanaryRouting,
  addFailureToService,
} = require('./ops')

/**
* Redeploys all services to their latest image.
*
* no response value expected for this operation
* */
const redeployAll = () => new Promise(
  async (resolve, reject) => {
    try {
      const k8sYamls = `${path.resolve(path.dirname(__filename), '..')}/k8sYamls`
      fs.readdir(k8sYamls, (err, serviceDirs) => {
        if (err) {
          throw err
        }
        serviceDirs.forEach((sd) => {
          const serviceDirPath = `${k8sYamls}/${sd}`
          try {
            fs.readdir(serviceDirPath, (err2, yamls) => {
              if (err2) {
                throw err2
              }
              Promise.all(yamls.map(async (yamlName) => {
                try {
                  const productionNamespace = 'production'
                  await applyFile(`${serviceDirPath}/${yamlName}`, productionNamespace)
                } catch (e) {
                  console.log(e)
                }
              }))
            })
          } catch (e) {
            console.log(e)
          }
        })
      })
      resolve(Service.successResponse(JSON.stringify({
        result: 'Redeployment started. It may take a while before changes are applied.',
      }, null, 2)));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
);

/**
* Deploys a service.
*
* no response value expected for this operation
* */
const deployChaosTest = ({ chaosRun }) => new Promise(
  async (resolve, reject) => {
    try {
      const { mode, runId } = chaosRun
      if (!['canary', 'production'].includes(mode)) {
        throw { message: `Unsupported deployment mode '${mode}'`, code: 400 }
      }
      // get the Run by ID => testId
      const runsAPi = new ChaosController.RunsApi()
      const runResponse = await runsAPi.getRun(runId)
      const { testId, mode: runMode } = runResponse.data

      if (mode !== runMode) {
        throw { message: `Deploy mode must match Run mode. Requested mode '${mode}', but found on Run: '${runMode}'`, code: 400 }
      }

      // get Test by ID => upstream, downstream, spec
      const testApi = new ChaosController.TestsApi()
      const testResponse = await testApi.getTest(testId)

      // const test = JSON.parse('{"displayName": "test", "upstreamService": "conversation-service", "downstreamService": "message-service", "spec": {"fault": {"abort": {"percentage": {"value": 100}, "httpStatus": 500}}}}')
      // const { upstreamService, downstreamService, spec } = test
      const { upstreamService, downstreamService, spec } = testResponse.data

      const makeChaosTestDeployment = (testMode) => {
        const modes = {
          canary: async (productionNamespace) => {
            // create chaos canary
            const { namespace } = await deployChaosCanaryCluster(runId)
            const chaosNamespace = namespace.body.metadata.name
            await addFailureToService(
              downstreamService,
              productionNamespace,
              spec,
              chaosNamespace,
            )
            await addChaosCanaryRouting(
              upstreamService,
              productionNamespace,
              chaosNamespace,
            )
            await runsAPi.patchRun(
              runId,
              { status: ChaosController.RunStatusEnum.Running },
            )
            return {
              namespace: chaosNamespace,
            }
          },
          production: async (productionNamespace) => {
            await addFailureToService(
              downstreamService,
              productionNamespace,
              spec,
            )
            return {
              namespace: productionNamespace,
            }
          },
        }
        if (!Object.keys(modes).includes(testMode)) {
          throw { message: `Unsupported deployment mode '${testMode}'`, code: 500 }
        }
        return modes[testMode]
      }

      const { namespace } = await makeChaosTestDeployment(mode)('production')

      resolve(Service.successResponse(JSON.stringify({
        result: 'Chaos Test has started!',
        runId,
        namespace,
      }, null, 2)));
    } catch (e) {
      console.log(e)
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
);

module.exports = {
  redeployAll,
  deployChaosTest,
};
