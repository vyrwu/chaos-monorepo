/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Add a Conversation to the Queue
*
* id String ID of a Queue in which to put the conversation
* queuedConversation QueuedConversation Create a new Queue
* no response value expected for this operation
* */
const addConversationToQueue = ({ id, queuedConversation }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
        queuedConversation,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Add a new Queue
*
* queue Queue Create a new Queue
* no response value expected for this operation
* */
const addQueue = ({ queue }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        queue,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Get a single Queue
*
* id String ID of a Queue in which to put the conversation
* no response value expected for this operation
* */
const getQueue = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        id,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Get all available Queues
*
* returns List
* */
const getQueues = () => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  addConversationToQueue,
  addQueue,
  getQueue,
  getQueues,
};
