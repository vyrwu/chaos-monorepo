/* eslint-disable no-unused-vars */
const Service = require('./Service');

/**
* Add a new Conversation
*
* conversation Conversation Create a new Conversation
* no response value expected for this operation
* */
const addConversation = ({ conversation }) => new Promise(
  async (resolve, reject) => {
    try {
      resolve(Service.successResponse({
        conversation,
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
* Get all Conversations
*
* returns List
* */
const getConversations = () => new Promise(
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
