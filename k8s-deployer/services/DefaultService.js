/* eslint-disable no-unused-vars */
const fs = require('fs')
const path = require('path')
const { apply } = require('./util');
const Service = require('./Service');
const { deployChaosCanaryCluster, addChaosRouting, addChaosDestinationSubset } = require('./ops')
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
                  await apply(`${serviceDirPath}/${yamlName}`)
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
const deployService = ({ name, type, spec }) => new Promise(
  async (resolve, reject) => {
    try {
      if (type !== 'chaos-canary') {
        throw { message: `Unsupported deployment type '${type}'`, code: 400 }
      }
      const defaultNamespace = 'default'
      const result = await Promise.all([
        deployChaosCanaryCluster(name, defaultNamespace),
        addChaosRouting(name, defaultNamespace, spec),
        addChaosDestinationSubset(name, defaultNamespace),
      ])
      console.log(result)
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
  deployService,
};
