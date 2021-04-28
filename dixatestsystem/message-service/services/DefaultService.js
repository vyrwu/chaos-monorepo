/* eslint-disable no-unused-vars */
const Service = require('./Service');

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
      resolve(Service.successResponse({
        message,
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
