// const AWS = require('aws-sdk');

const InMemoryDao = () => {
  // consider implementing DB too
  // AWS.config.update({ region: 'eu-west-1' });
  // const DynamoDBClient = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
  // const DynamoDBTableName = 'chaos-secalekdev-conversations';
  let items = []
  const Responses = {
    notFound: 'Not Found',
    ok: 'OK',
    badRequest: 'Bad Request',
  }
  return {
    Responses,
    listItems: () => ([...items]),
    readItemById: (id) => (
      items.find(item => item.id === id) || Responses.notFound
    ),
    writeItem: (newItem) => {
      const exists = items.find(item => item.id === newItem.id)
      if (exists) {
        return Responses.badRequest
      }
      items = [...items, newItem]
      return Responses.ok
    },
    putItem: (id, newItem) => {
      const i = items.findIndex(item => item.id === id)
      const replacement = { id, ...newItem }
      if (i === -1) {
        items = [...items, replacement]
      } else {
        items[i] = replacement
      }
    },
    deleteItemById: (id) => {
      const i = items.findIndex(item => item.id === id)
      if (i === -1) {
        return Responses.notFound
      }
      items.splice(i, 1)
      return Responses.ok
    },
  }
}

module.exports = InMemoryDao
