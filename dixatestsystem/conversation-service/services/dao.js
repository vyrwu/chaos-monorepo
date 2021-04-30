// const AWS = require('aws-sdk');

const ConversationsInMemoryDao = () => {
    // consider implementing DB too
    // AWS.config.update({ region: 'eu-west-1' });
    // const DynamoDBClient = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
    // const DynamoDBTableName = 'chaos-secalekdev-conversations';
    let conversations = []
    const Responses = {
      notFound: 'Not Found',
      ok: 'OK',
      badRequest: 'Bad Request',
    }
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
}
  
module.exports = ConversationsInMemoryDao
