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

module.exports = {
  addMessage,
};
