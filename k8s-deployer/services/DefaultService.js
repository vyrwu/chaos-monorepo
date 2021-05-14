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
      if (mode !== 'canary') {
        throw { message: `Unsupported deployment mode '${mode}'`, code: 400 }
      }
      // get the Run by ID => testId
      const runsAPi = new ChaosController.RunsApi()
      const runResponse = await runsAPi.getRun(runId)
      const { testId } = runResponse.data
      // get Test by ID => upstream, downstream, spec
      const testApi = new ChaosController.TestsApi()
      const testResponse = await testApi.getTest(testId)

      // const test = JSON.parse('{"displayName": "test", "upstreamService": "conversation-service", "downstreamService": "message-service", "spec": {"fault": {"abort": {"percentage": {"value": 100}, "httpStatus": 500}}}}')
      // const { upstreamService, downstreamService, spec } = test
      const { upstreamService, downstreamService, spec } = testResponse.data

      // create chaos canary
      const { namespace } = await deployChaosCanaryCluster(runId)
      const productionNamespace = 'production'
      const chaosNamespace = namespace.body.metadata.name
      await addFailureToService(
        downstreamService,
        productionNamespace,
        chaosNamespace,
        spec,
      )
      await addChaosCanaryRouting(
        upstreamService,
        productionNamespace,
        chaosNamespace,
      )

      const updateRunStatusRes = await runsAPi.patchRun(
        runId,
        { status: ChaosController.RunStatusEnum.Running },
      )
      resolve(Service.successResponse(JSON.stringify({
        result: 'Chaos Test has started!',
        runId,
        namespace: mode === 'canary' ? chaosNamespace : productionNamespace,
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
