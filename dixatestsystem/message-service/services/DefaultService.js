/* eslint-disable no-unused-vars */
const { v4: uuidv4 } = require('uuid')
const InMemoryDao = require('./dao');
const Service = require('./Service');

const dao = InMemoryDao()
/**
* Add a new Message
* Add a new Message
*
* message Message Create a new Message
* no response value expected for this operation
* */
const addMessage = ({ message }) => new Promise(
  async (resolve, reject) => {
    try {
      const newMessage = {
        id: uuidv4(),
        created_at: Date.now(),
        ...message,
      }
      if (dao.writeItem(newMessage) === dao.Responses.badRequest) {
        throw { message: 'Item already exists', status: 400 }
      }
      resolve(Service.successResponse({
        message,
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
* Delete a single Message
*
* id String ID of a Message
* no response value expected for this operation
* */
const deleteMessage = ({ id }) => new Promise(
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
* Get a single message
*
* id String ID of a Message
* returns Message
* */
const getMessage = ({ id }) => new Promise(
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
* Get all Messages
*
* returns List
* */
const getMessages = () => new Promise(
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
  addMessage,
  deleteMessage,
  getMessage,
  getMessages,
};
