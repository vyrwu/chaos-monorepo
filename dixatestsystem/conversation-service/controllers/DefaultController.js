/**
 * The DefaultController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic reoutes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/DefaultService');
const addConversation = async (request, response) => {
  await Controller.handleRequest(request, response, service.addConversation);
};

const addMessageToConversation = async (request, response) => {
  await Controller.handleRequest(request, response, service.addMessageToConversation);
};

const deleteConversation = async (request, response) => {
  await Controller.handleRequest(request, response, service.deleteConversation);
};

const getConversation = async (request, response) => {
  await Controller.handleRequest(request, response, service.getConversation);
};

const getConversations = async (request, response) => {
  await Controller.handleRequest(request, response, service.getConversations);
};

const getMessagesInConversation = async (request, response) => {
  await Controller.handleRequest(request, response, service.getMessagesInConversation);
};


module.exports = {
  addConversation,
  addMessageToConversation,
  deleteConversation,
  getConversation,
  getConversations,
  getMessagesInConversation,
};
