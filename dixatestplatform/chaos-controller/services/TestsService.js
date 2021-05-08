/* eslint-disable no-unused-vars */
const k8s = require('@kubernetes/client-node')
const { v4: uuidv4 } = require('uuid')
const { K8sDeployer } = require('@vyrwu/ts-api')
const InMemoryDao = require('./dao');
const Service = require('./Service');
const logger = require('../logger');
const RunsService = require('./RunsService')

const testsDao = InMemoryDao()

const k8sDeployerApi = new K8sDeployer.DefaultApi()

let kc
try {
  kc = new k8s.KubeConfig()
  kc.loadFromDefault()
} catch (e) {
  console.log(e)
  process.exit(1)
}
const k8sBatchApi = kc.makeApiClient(k8s.BatchV1Api);

/**
* Add a new Test
*
* test Test Create a new Test
* no response value expected for this operation
* */
const addTest = ({ test }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`addTest: ${JSON.stringify(test)}`)
      // add conversation
      const { badRequest } = testsDao.Responses
      const newTest = {
        id: uuidv4(),
        created_at: Date.now(),
        ...test,
      }
      if (testsDao.writeItem(newTest) === badRequest) {
        throw { message: `Conversation with ID '${test.id}' already exists`, status: 400 }
      }
      resolve(Service.successResponse({
        newTest,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
);
/**
* Delete Test
*
* id String ID of a Test
* no response value expected for this operation
* */
const deleteTest = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`deleteTest: ${JSON.stringify({ id })}`)
      const { notFound } = testsDao.Responses
      if (testsDao.deleteItemById(id) === notFound) {
        throw { message: `Test of ID '${id}' not found.`, code: 404 }
      }
      resolve(Service.successResponse({
        id,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
);
/**
* Get a single Test
*
* id UUID ID of a Test
* returns Test
* */
const getTest = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`getTest: ${JSON.stringify({ id })}`)
      const { notFound } = testsDao.Responses
      const target = testsDao.readItemById(id)
      if (target === notFound) {
        throw { message: `Test of ID '${id}' not found.\n`, code: 404 }
      }
      resolve(Service.successResponse({
        ...target,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
);
/**
* Get all tests
*
* returns List
* */
const getTests = () => new Promise(
  async (resolve, reject) => {
    try {
      logger.info('getTests: {}')
      const tests = testsDao.listItems()
      resolve(Service.successResponse({
        tests,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
);
/**
* Execute test scenarios.
*
* id String ID of the test to execute
* mode String
* no response value expected for this operation
* */
const runTest = ({ id, mode }) => new Promise(
  async (resolve, reject) => {
    try {
      const test = await getTest({ id })
      if (test.code === 500) {
        throw { message: test.error, status: test.code }
      }
      // START JOB - RUN CHAOS EXPERIMENT
      logger.info('runTest', { id, mode })
      const { newRun } = await RunsService.addRun({
        testId: id,
        status: 'scheduled',
        mode,
      })
      // const result = await k8sBatchApi.createNamespacedJob('default', {
      //   apiVersion: 'batch/v1',
      //   kind: 'Job',
      //   metadata: {
      //     generateName: 'chaos-run-',
      //     labels: {
      //       runId: newRun.id,
      //       testId: id,
      //       testMode: mode,
      //     },
      //   },
      //   spec: {
      //     template: {
      //       metadata: {
      //         annotations: {
      //           'sidecar.istio.io/inject': 'false',
      //         },
      //       },
      //       spec: {
      //         containers: [
      //           {
      //             generateName: 'chaos-worker-',
      //             image: 'busybox',
      //             command: ['node', 'dist/index.js'],
      //             args: [''],
      //           },
      //         ],
      //         restartPolicy: 'Never',
      //       },
      //     },
      //   },
      // })
      // deployment name (upstream/downstream)
      // virtual service definitions
      resolve(Service.successResponse(`Chaos Test scheduled in '${mode}' mode. Check Job ID: '${result.response.body.metadata.name}'\n`));
    } catch (e) {
      console.log(e)
      reject(Service.rejectResponse(
        e.error || 'Internal Server Error',
        e.code || 500,
      ));
    }
  },
);
/**
* Stops the test scenario immediately, in a Big Red Button fashion.
*
* id String ID of the test to stop
* no response value expected for this operation
* */
const stopTest = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      // Modify run - set status to aborted
      await k8sDeployerApi.redeployAll()
      resolve(Service.successResponse(`Chaos Test '${id}' aborted.`));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
);

module.exports = {
  addTest,
  deleteTest,
  getTest,
  getTests,
  runTest,
  stopTest,
};
