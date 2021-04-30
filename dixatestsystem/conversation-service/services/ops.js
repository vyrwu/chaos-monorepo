const { MessageService, QueueService } = require('@vyrwu/ts-api');

const ConversationOps = () => {
    const MessageServiceClient = new MessageService.DefaultApi();
    const QueueServiceClient = new QueueService.DefaultApi();

    return {
        addMessage: async (conversation) => {
            const response = await MessageServiceClient.addMessage({
                initial_channel: conversation.channel,
                direction: 'inbound'
            })
            if (response.status !== 200) {
                throw { message: `Message Service returned unexpected status code: ${response.status}`, status: 500 }
            }
        },
        addConversationToForcedQueue: async (conversation) => {
            const targetQueue = conversation.channel
            const queuedConversation = {
              channel: conversation.channel,
              conversation_id: conversation.id,
              isLive: true,
            }
            const getQueueResponse = await QueueServiceClient.getQueue(targetQueue)
            console.log(getQueueResponse)
            if (![200, 404].includes(getQueueResponse.status)) {
              throw { message: 'Unexpected error when fetching queue from Queue Service', status: 500 }
            }
            if (getQueueResponse.status === 404) {
              const addQueueResponse = await QueueServiceClient.addQueue({ name: targetQueue, offer_algorithm: 'oneAtATimeRandom' })
              console.log(addQueueResponse)
              if (addQueueResponse.status !== 200) {
                throw { message: 'Unexpected error when adding Queue via Queue Service', status: 500 }
              }
              const addConvToQueueResponse = await QueueServiceClient.addConversationToQueue(addQueueResponse.data.id, queuedConversation)
              console.log(addConvToQueueResponse)
              if (addConvToQueueResponse.status !== 200) {
                throw { message: 'Unexpected error when adding Conversation to Queue via Queue Service', status: 500 }
              }
            } else {
              const addConvToQueueResponse = await QueueServiceClient.addConversationToQueue(getQueueResponse.data.id, queuedConversation)
              console.log(addConvToQueueResponse)
              if (addConvToQueueResponse.status !== 200) {
                throw { message: 'Unexpected error when adding Conversation to Queue via Queue Service', status: 500 }
              }
            }
          }
    }
}

module.exports = ConversationOps
