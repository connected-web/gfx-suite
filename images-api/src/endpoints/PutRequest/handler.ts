import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'

import Queues from '../helpers/queues'

const queueUrl = process.env.REQUESTS_QUEUE_URL ?? 'no-queue-url-set'
const requestsQueue = new Queues(queueUrl)

function parseEvent (body: string): any {
  try {
    return JSON.parse(body)
  } catch (ex) {
    return {}
  }
}

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const now = new Date()
  const rawRequest = parseEvent(event?.body ?? '{}')
  const requestMessage = {
    requestId: event?.pathParameters?.requestId,
    type: 'image-batch',
    positive: rawRequest?.positive,
    negative: rawRequest?.negative,
    width: rawRequest?.width,
    height: rawRequest?.height,
    batchSize: rawRequest?.batchSize,
    requestTime: now.toISOString()
  }

  try {
    await requestsQueue.queueMessage(JSON.stringify(requestMessage))
  } catch (ex) {
    const error = ex as Error
    console.log('Unable to handle message', error?.message, rawRequest)
  }

  return lambdaResponse(httpStatusCodes.success, JSON.stringify({
    message: 'Request queued',
    request: requestMessage
  }))
}
