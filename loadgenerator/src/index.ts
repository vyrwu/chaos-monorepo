import { ConversationService } from '@vyrwu/ts-api'
import { Configuration, Conversation } from '@vyrwu/ts-api/dist/conversation-service';

const ConversationServiceAPI = (() => {
    // const localhostConfig: Configuration = {basePath: 'http://localhost:8080/v1', isJsonMime: (payload) => true}
    const ConversationServiceClient = new ConversationService.DefaultApi();
    return {
        addConversation: async (payload: Conversation) => {
            const response = await ConversationServiceClient.addConversation(payload);
            return response
        }
    }
})()

const probeConversations = () => {
    const channels = Object.values(ConversationService.ConversationChannelEnum)
    var randomChannel = channels[Math.floor(Math.random() * channels.length)];
    const payload: Conversation = {
        channel: randomChannel,
        status: ConversationService.ConversationStatusEnum.Pending,
        message: 'My headphones are still missing. When will they arrive?'
    }

    console.log('ConversationServiceAPI.addConversation')
    Promise.resolve(ConversationServiceAPI.addConversation(payload)).then(resp => {
        console.log('OK: ', resp.status)
    }).catch(err => {
        console.log('ERROR: ', err.code || err.response.status)
    })
}

const interval = 2000
console.log(`Generating load to conversation-service (${interval} ms)...`)
setInterval(probeConversations, 2000)
