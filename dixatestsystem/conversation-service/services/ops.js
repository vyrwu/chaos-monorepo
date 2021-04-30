const { MessageService, QueueService } = require('@vyrwu/ts-api');
const logger = require('../logger')

const ConversationOps = () => {
  const MessageServiceClient = new MessageService.DefaultApi();
  const QueueServiceClient = new QueueService.DefaultApi();

  return {
    addMessage: async (conversation) => {
      const addMessageResponse = await MessageServiceClient.addMessage({
        initial_channel: conversation.channel,
        direction: 'inbound',
      })
      logger.debug('MessageServiceClient.addMessage', addMessageResponse)
      if (addMessageResponse.status !== 200) {
        throw { message: `Message Service returned unexpected status code: ${addMessageResponse.status}`, status: 500, addMessageResponse }
      }
    },
    addConversationToForcedQueue: async (conversation) => {
      const allQueues = await QueueServiceClient.getQueues()
      logger.debug('QueueServiceClient.getQueues', allQueues)
      if (allQueues.status !== 200) {
        throw { message: 'Unexpected error when reading Queues from Queue Service', status: 500, allQueues }
      }

      let queueId;
      const targetQueueName = conversation.channel
      const targetQueue = allQueues.data.find(queue => queue.name === targetQueueName)
      if (!targetQueue) {
        const addQueueResponse = await QueueServiceClient.addQueue({
          name: targetQueueName,
          offer_algorithm: QueueService.QueueOfferAlgorithmEnum.OneAtATimeRandom,
        })
        logger.debug('QueueServiceClient.addQueue', addQueueResponse)
        if (addQueueResponse.status !== 200) {
          throw { message: 'Unexpected error when adding Queue via Queue Service', status: 500, addQueueResponse }
        }
        queueId = addQueueResponse.data.id
      }
      queueId = targetQueue.id
      const addConvToQueueResponse = await QueueServiceClient.addConversationToQueue(
        queueId,
        {
          conversation_id: conversation.id,
          channel: conversation.channel,
        },
      )
      logger.debug('QueueServiceClient.addConversationToQueue', addConvToQueueResponse)
      if (addConvToQueueResponse.status !== 200) {
        throw { message: 'Unexpected error when adding Conversation to Queue via Queue Service', status: 500, addConvToQueueResponse }
      }
    },
  }
}

module.exports = ConversationOps
