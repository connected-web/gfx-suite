import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'

import Queues, { MessageWithReceiptType } from '../helpers/queues'

const queueUrl = process.env.REQUESTS_QUEUE_URL ?? 'no-queue-url-set'
const requestsQueue = new Queues(queueUrl)

function parseMessages (body: string): any {
  try {
    return JSON.parse(body)
  } catch (ex) {
    return {}
  }
}

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const messages: MessageWithReceiptType[] = parseMessages(event?.body ?? '[]')
  const results = await requestsQueue.deleteMessages(messages)
  const response = {
    message: `Attempted to remove ${String(results.length)} messages from queue`,
    results
  }

  return lambdaResponse(httpStatusCodes.success, JSON.stringify(response))
}
