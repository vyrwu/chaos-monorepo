/* eslint-disable no-unused-vars */
const { v4: uuidv4 } = require('uuid')
const InMemoryDao = require('./dao');
const Service = require('./Service');

const dao = InMemoryDao()

/**
* Add a Conversation to the Queue
*
* id String ID of a Queue in which to put the conversation
* queuedConversation QueuedConversation Create a new Queue
* no response value expected for this operation
* */
const addConversationToQueue = ({ id, queuedConversation }) => new Promise(
  async (resolve, reject) => {
    const queue = dao.readItemById(id)
    if (!queue) {
      throw { message: 'Queue does not exists', status: 400 }
    }
    const updatedQueue = {
      ...queue,
      conversations: [
        ...queue.conversations,
        queuedConversation,
      ],
    }
    dao.putItem(id, updatedQueue)
    try {
      resolve(Service.successResponse({
        id,
        queuedConversation,
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
* Add a new Queue
*
* queue Queue Create a new Queue
* no response value expected for this operation
* */
const addQueue = ({ queue }) => new Promise(
  async (resolve, reject) => {
    try {
      if (dao.writeItem({
        id: uuidv4(),
        created_at: Date.now(),
        conversations: [],
        ...queue,
      }) === dao.Responses.badRequest) {
        throw { message: 'Queue already exists', status: 400 }
      }
      resolve(Service.successResponse({
        queue,
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
* Get a single Queue
*
* id String ID of a Queue in which to put the conversation
* no response value expected for this operation
* */
const getQueue = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      const target = dao.readItemById(id)
      if (target === dao.Responses.notFound) {
        throw { message: 'Queue not found', status: 404 }
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
* Get all available Queues
*
* returns List
* */
const getQueues = () => new Promise(
  async (resolve, reject) => {
    try {
      const queues = dao.listItems()
      resolve(Service.successResponse([...queues]));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 500,
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
