/* eslint-disable no-unused-vars */
const { v4: uuidv4 } = require('uuid')
const InMemoryDao = require('./dao');
const Service = require('./Service');
const logger = require('../logger');

const testsDao = InMemoryDao()
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
        throw { message: `Test of ID '${id}' not found.`, code: 404 }
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
      // START JOB - RUN CHAOS EXPERIMENT
      // In canary mode
      // Start run
      // Create new deps, vs and destinations for upstream and downstream svcs
      // Modify original vservices to push X perc of traffic there
      // Introduce perturbations on the canary path, according to test definition
      resolve(Service.successResponse({
        id,
        mode,
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
* Stops the test scenario immediately, in a Big Red Button fashion.
*
* id String ID of the test to stop
* no response value expected for this operation
* */
const stopTest = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      // START JOB - STOP CHAOS EXPERIMENT
      // Redeoploy all services to the original states.
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

module.exports = {
  addTest,
  deleteTest,
  getTest,
  getTests,
  runTest,
  stopTest,
};
