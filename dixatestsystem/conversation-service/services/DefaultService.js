/* eslint-disable no-unused-vars */
const { MessageService, QueueService } = require('@vyrwu/ts-api');
const AWS = require('aws-sdk');
const Service = require('./Service');
const logger = require('../logger')
const { v4: uuidv4 } = require('uuid')

const MessageServiceClient = new MessageService.DefaultApi();
const QueueServiceClient = new QueueService.DefaultApi();

const ConversationsDao = (() => {
  // AWS.config.update({ region: 'eu-west-1' });
  // const DynamoDBClient = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
  // const DynamoDBTableName = 'chaos-secalekdev-conversations';

  let conversations = []

  const Responses = {
    notFound: 'Not Found',
    ok: 'OK',
    badRequest: 'Bad Request',
  }

  logger.info('In memory Conversation DAO started!\n')

  return {
    Responses,
    listConversations: () => ([...conversations]),
    readConversationById: (id) => (
      conversations.find(conversation => conversation.id === id) || Responses.notFound
    ),
    writeConversation: (newConversation) => {
      const exists = conversations.find(conversation => conversation.id === newConversation.id)
      if (exists) {
        return Responses.badRequest
      }
      conversations = [...conversations, newConversation]
      return Responses.ok
    },
    deleteConversationById: (id) => {
      const i = conversations.findIndex(conversation => conversation.id === id)
      if (i === -1) {
        return Responses.notFound
      }
      conversations.splice(i, 1)
      return Responses.ok
    },
  }
})()

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
      const { badRequest } = ConversationsDao.Responses
      const newConversation = {
        id: uuidv4(),
        created_at: Date.now(),
        ...conversation
      }
      if (ConversationsDao.writeConversation(newConversation) === badRequest) {
        throw { message: `Conversation with ID '${conversation.id}' already exists`, code: 400 }
      }
      // addMessage
      Promise.resolve(MessageServiceClient.addMessage({
        initial_channel: conversation.channel,
        direction: 'inbound'
      }))
        .then(res => { console.log(res) })
        .catch(err => {
        console.log(JSON.stringify(err))
        throw { message: 'Error adding message', code: 500 }
        })
      // addConversationToForcedQueue
      const targetQueue = conversation.channel
      try {
        const queuedConversation = {
          channel: newConversation.channel,
          conversation_id: newConversation.id,
          isLive: true,
        }
        const getQueueResponse = await QueueServiceClient.getQueue(targetQueue)
        if (![200, 404].includes(getQueueResponse.status)) {
          throw { message: 'Unexpected error when fetching queue from Queue Service', code: 500 }
        }
        if (getQueueResponse.status === 404) {
          const addQueueResponse = await QueueServiceClient.addQueue({ name: targetQueue, offer_algorithm: 'oneAtATimeRandom' })
          if (addQueueResponse.status !== 200) {
            throw { message: 'Unexpected error when adding Queue via Queue Service', code: 500 }
          }
          const addConvToQueueResponse = await QueueServiceClient.addConversationToQueue(addQueueResponse.data.id, queuedConversation)
          if (addConvToQueueResponse.status !== 200) {
            throw { message: 'Unexpected error when adding Conversation to Queue via Queue Service', code: 500 }
          }
        } else {
          const addConvToQueueResponse = await QueueServiceClient.addConversationToQueue(getQueueResponse.data.id, queuedConversation)
          if (addConvToQueueResponse.status !== 200) {
            throw { message: 'Unexpected error when adding Conversation to Queue via Queue Service', code: 500 }
          }
        }
      } catch (e) {
        throw e
      }
      resolve(Service.successResponse({
        newConversation,
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
      const { notFound } = ConversationsDao.Responses
      if (ConversationsDao.readConversationById(id) === notFound) {
        throw { message: `Conversation of ID '${id}' not found.`, code: 404 }
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
      const { notFound } = ConversationsDao.Responses
      if (ConversationsDao.deleteConversationById(id) === notFound) {
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
      const { notFound } = ConversationsDao.Responses
      const target = ConversationsDao.readConversationById(id)
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
      const conversations = ConversationsDao.listConversations()
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
