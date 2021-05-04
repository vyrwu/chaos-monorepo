/**
 * The TestsController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic reoutes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/TestsService');
const addTest = async (request, response) => {
  await Controller.handleRequest(request, response, service.addTest);
};

const deleteTest = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteTest);
};

const getTest = async (request, response) => {
  await Controller.handleRequest(request, response, service.getTest);
};

const getTests = async (request, response) => {
  await Controller.handleRequest(request, response, service.getTests);
};

const runTest = async (request, response) => {
  await Controller.handleRequest(request, response, service.runTest);
};

const stopTest = async (request, response) => {
  await Controller.handleRequest(request, response, service.stopTest);
};


module.exports = {
  addTest,
  deleteTest,
  getTest,
  getTests,
  runTest,
  stopTest,
};
