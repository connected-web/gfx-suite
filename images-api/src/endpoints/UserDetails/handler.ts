import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'
import * as crypto from 'crypto'

import Storage from '../helpers/storage'
const storage = new Storage(process.env.SERVICE_BUCKET ?? 'no-bucket-set')

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const authorizerContext = event.requestContext.authorizer
  const principalId = authorizerContext?.principalId

  if (principalId === undefined) {
    return lambdaResponse(httpStatusCodes.failedDependency, JSON.stringify({ message: 'Missing principalId in request' }))
  }

  let user
  try {
    user = await storage.getJson(`users/${String(principalId)}.json`)
  } catch (ex) {
    const decryptionKey = crypto.randomBytes(32)
    user = {
      userId: principalId,
      decryptionKey: decryptionKey.toString('base64')
    }
    await storage.putJson(`users/${String(principalId)}.json`, user)
  }

  const response = {
    message: `Returning user details for ${String(principalId)}`,
    user
  }

  return lambdaResponse(httpStatusCodes.success, JSON.stringify(response))
}
