import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'

import Queues from '../helpers/queues'

const queueUrl = process.env.REQUESTS_QUEUE_URL ?? 'no-queue-url-set'
const requestsQueue = new Queues(queueUrl)

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const messages = await requestsQueue.retrieveMessages()

  return lambdaResponse(httpStatusCodes.success, JSON.stringify({ messages }))
}
