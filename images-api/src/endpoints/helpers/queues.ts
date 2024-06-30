import { SQS } from 'aws-sdk'

export default class Queues {
  private readonly sqs: SQS
  private readonly queueUrl: string

  constructor (queueUrl: string) {
    this.sqs = new SQS()
    this.queueUrl = queueUrl
  }

  async queueMessage (message: string): Promise<void> {
    await this.sqs.sendMessage({
      QueueUrl: this.queueUrl,
      MessageBody: message
    }).promise()
  }

  async retrieveMessages (): Promise<SQS.MessageList> {
    const params = {
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20
    }
    const result = await this.sqs.receiveMessage(params).promise()
    return result?.Messages ?? []
  }

  async deleteMessages (messages: SQS.MessageList): Promise<SQS.Message[]> {
    console.log(`Received ${String(messages?.length)} messages for processing`)
    const work = messages.map(async (message) => {
      if (message?.ReceiptHandle !== undefined) {
        console.log('Marking message as processed:', message.MessageId)
        try {
          await this.sqs.deleteMessage({
            QueueUrl: this.queueUrl,
            ReceiptHandle: message.ReceiptHandle
          }).promise()
        } catch (ex) {
          const error = ex as Error
          console.log('Unable to process message:', error?.message, 'Message', message.MessageId, message?.Body)
        }
      } else {
        console.log('No receipt handle on message:', 'Message', message.MessageId, message?.Body)
      }
      return message
    })

    return await Promise.all(work)
  }
}
