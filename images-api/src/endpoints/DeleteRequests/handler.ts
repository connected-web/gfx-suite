import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'

import Queues from '../helpers/queues'
import { SQS } from 'aws-sdk'

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
  const messages: Array<Partial<SQS.Message>> = parseMessages(event?.body ?? '[]')
  const result = await requestsQueue.deleteMessages(messages)

  return lambdaResponse(httpStatusCodes.success, JSON.stringify({ messages: result }))
}
