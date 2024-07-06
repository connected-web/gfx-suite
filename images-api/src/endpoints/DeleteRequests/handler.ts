import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'

import Queues, { MessageWithReceiptType } from '../helpers/queues'

const queueUrl = process.env.REQUESTS_QUEUE_URL ?? 'no-queue-url-set'
const requestsQueue = new Queues(queueUrl)

function parseMessages (body: string): any {
  try {
    const message = JSON.parse(body)
    if (message?.receiptHandle !== undefined) {
      message.ReceiptHandle = message.receiptHandle
    }
    return message
  } catch (ex) {
    return {}
  }
}

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const messages: MessageWithReceiptType[] = parseMessages(event?.body ?? '[]')
  const result = await requestsQueue.deleteMessages(messages)
  const response = {
    message: `Removed ${String(result.length)} messages from queue`
  }

  return lambdaResponse(httpStatusCodes.success, JSON.stringify(response))
}
