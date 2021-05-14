/* eslint-disable no-unused-vars */
const { v4: uuidv4 } = require('uuid')
const InMemoryDao = require('./dao');
const Service = require('./Service');
const logger = require('../logger');
const { log } = require('../logger');

const runsDao = InMemoryDao()

/**
* Add a new Run
*
* run Run Create a new Run
* no response value expected for this operation
* */
const addRun = ({ run }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`addRun: ${JSON.stringify(run)}`)
      const { badRequest } = runsDao.Responses
      const newRun = {
        id: uuidv4(),
        created_at: Date.now(),
        ...run,
      }
      if (runsDao.writeItem(newRun) === badRequest) {
        throw { message: `Run with ID '${newRun.id}' already exists`, status: 400 }
      }
      resolve(Service.successResponse({
        ...newRun,
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
* Delete Run
*
* id String ID of a Run
* no response value expected for this operation
* */
const deleteRun = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`deleteRun: ${JSON.stringify({ id })}`)
      const { notFound } = runsDao.Responses
      if (runsDao.deleteItemById(id) === notFound) {
        throw { message: `Run of ID '${id}' not found.`, code: 404 }
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
* Get a single Run
*
* id UUID ID of a Run
* returns Run
* */
const getRun = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`getRun: ${JSON.stringify({ id })}`)
      const { notFound } = runsDao.Responses
      const target = runsDao.readItemById(id)
      if (target === notFound) {
        throw { message: `Run of ID '${id}' not found.`, code: 404 }
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
* Get all Runs
*
* returns List
* */
const getRuns = () => new Promise(
  async (resolve, reject) => {
    try {
      logger.info('getRuns: {}')
      const runs = runsDao.listItems()
      resolve(Service.successResponse({
        runs,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
);

const patchRun = ({ id, run }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info('updateRun: {}')
      const patchResult = runsDao.patchItem(id, run)
      if (patchResult === runsDao.Responses.notFound) {
        throw { message: `Run '${id}' not found.`, code: 404 }
      }
      resolve(Service.successResponse({
        ...runsDao.readItemById(id),
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
)

const appendLog = ({ id, logEntry }) => new Promise(
  async (resolve, reject) => {
    try {
      const run = runsDao.readItemById(id)
      if (run === runsDao.Responses.notFound) {
        throw { message: `Run '${id}' not found.`, code: 404 }
      }
      const patchedRun = {
        ...run,
        logs: [
          ...(run.logs || []),
          {
            ...logEntry,
            timestamp: Date.now(),
          },
        ],
      }
      if (runsDao.patchItem(id, patchedRun) !== runsDao.Responses.ok) {
        throw { message: `Failed adding logs to Run '${id}'.`, code: 500 }
      }
      resolve(Service.successResponse({
        ...patchedRun,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
      ));
    }
  },
)

module.exports = {
  addRun,
  deleteRun,
  getRun,
  getRuns,
  patchRun,
  appendLog,
};
