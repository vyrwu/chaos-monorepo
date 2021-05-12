/* eslint-disable no-unused-vars */
const fs = require('fs')
const path = require('path')
const { ChaosController } = require('@vyrwu/ts-api')
const { apply } = require('./util');
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
                  await apply(`${serviceDirPath}/${yamlName}`, productionNamespace)
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
      resolve(Service.successResponse('Redeployment was successful.'));
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
      const { upstreamService, downstreamService, spec } = testResponse.data

      // create chaos canary
      const { namespace, services } = await deployChaosCanaryCluster(runId)
      console.log(`const { namespace, services } = await deployChaosCanaryCluster(runId)\n${{ namespace, services }}`)
      const result = await addFailureToService(downstreamService, 'production', namespace.body.metadata.name, spec)
      console.log(`const result = await addFailureToService(downstreamService, 'production', namespace.body.metadata.name)\n${{ result }}`)
      const routingResponse = await addChaosCanaryRouting(upstreamService, namespace.body.metadata.name)
      console.log(`const routingResponse = await addChaosCanaryRouting(upstreamService, namespace.body.metadata.name)\n${{ routingResponse }}`)
      resolve(Service.successResponse('Deployment was successful.'));
    } catch (e) {
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
