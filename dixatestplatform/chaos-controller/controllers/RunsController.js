/**
 * The RunsController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic reoutes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/RunsService');
const addRun = async (request, response) => {
  await Controller.handleRequest(request, response, service.addRun);
};

const appendLog = async (request, response) => {
  await Controller.handleRequest(request, response, service.appendLog);
};

const deleteRun = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteRun);
};

const getRun = async (request, response) => {
  await Controller.handleRequest(request, response, service.getRun);
};

const getRuns = async (request, response) => {
  await Controller.handleRequest(request, response, service.getRuns);
};

const patchRun = async (request, response) => {
  await Controller.handleRequest(request, response, service.patchRun);
};


module.exports = {
  addRun,
  appendLog,
  deleteRun,
  getRun,
  getRuns,
  patchRun,
};
