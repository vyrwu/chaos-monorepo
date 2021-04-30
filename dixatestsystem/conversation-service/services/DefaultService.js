const { v4: uuidv4 } = require('uuid')
const Service = require('./Service');
const logger = require('../logger')
const ConversationOps = require('./ops')
const InMemoryDao = require('./dao');

const ops = ConversationOps()
const dao = InMemoryDao()

/**
* Add a new Conversation
*
* conversation Conversation Create a new Conversation
* no response value expected for this operation
* */
const addConversation = async ({ conversation }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`addConversation: ${JSON.stringify(conversation)}`)
      // add conversation
      const { badRequest } = dao.Responses
      const newConversation = {
        id: uuidv4(),
        created_at: Date.now(),
        ...conversation,
      }
      if (dao.writeItem(newConversation) === badRequest) {
        throw { message: `Conversation with ID '${conversation.id}' already exists`, status: 400 }
      }

      await Promise.all([
        ops.addMessage(newConversation),
        ops.addConversationToForcedQueue(newConversation),
      ])

      resolve(Service.successResponse({
        newConversation,
      }));
    } catch (e) {
      logger.error(e)
      console.log(e)
      reject(Service.rejectResponse(
        e.message || 'Internal Server Error',
        e.status || 405,
      ));
    }
  },
);
/**
* Add message to conversation
*
* id String ID of a Conversation the message should be added to
* conversationMessage ConversationMessage Add message to conversation
* no response value expected for this operation
* */
const addMessageToConversation = ({ id, conversationMessage }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`addMessageToConversation: ${JSON.stringify({ id, conversationMessage })}`)
      const { notFound } = dao.Responses
      if (dao.readItemById(id) === notFound) {
        throw { message: `Conversation of ID '${id}' not found.`, status: 404 }
      }
      // MessageServiceClient.addMessage({ conversationId: id, ...conversationMessage })
      resolve(Service.successResponse({
        id,
        conversationMessage,
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
* Delete Conversation
*
* id String ID of a Conversation
* no response value expected for this operation
* */
const deleteConversation = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`deleteConversation: ${JSON.stringify({ id })}`)
      const { notFound } = dao.Responses
      if (dao.deleteItemById(id) === notFound) {
        throw { message: `Conversation of ID '${id}' not found.`, code: 404 }
      }
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
* Get a single Conversation
*
* id String ID of a Conversation
* returns Conversation
* */
const getConversation = ({ id }) => new Promise(
  async (resolve, reject) => {
    try {
      logger.info(`getConversation: ${JSON.stringify({ id })}`)
      const { notFound } = dao.Responses
      const target = dao.readItemById(id)
      if (target === notFound) {
        throw { message: `Conversation of ID '${id}' not found.`, code: 404 }
      }
      resolve(Service.successResponse({
        ...target,
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
* Get all Conversations
*
* returns List
* */
const getConversations = () => new Promise(
  async (resolve, reject) => {
    try {
      logger.info('getConversations: {}')
      const conversations = dao.listItems()
      resolve(Service.successResponse({
        conversations,
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
* Get all Messages in the Conversation
*
* id String ID of a Conversation the message should be added to
* returns List
* */
const getMessagesInConversation = ({ id }) => new Promise(
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

module.exports = {
  addConversation,
  addMessageToConversation,
  deleteConversation,
  getConversation,
  getConversations,
  getMessagesInConversation,
};
