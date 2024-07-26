import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'
import * as crypto from 'crypto'

import Storage from '../helpers/storage'
import { isAuthorizedApp } from '../helpers/authorization'

const storage = new Storage(process.env.SERVICE_BUCKET ?? 'no-bucket-set')

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userId = event.pathParameters?.userId
  const authorizerContext = event?.requestContext?.authorizer ?? {}
  const principalId = authorizerContext?.principalId
  const groups = authorizerContext?.groups?.split(',') ?? []

  console.log('[UserbyUserId] for userId:', userId, 'Authorizer principalId:', principalId, 'groups:', groups)

  if (principalId === undefined) {
    return lambdaResponse(httpStatusCodes.failedDependency, JSON.stringify({ message: 'Missing principalId in request' }))
  }

  if (!isAuthorizedApp(groups)) {
    return lambdaResponse(httpStatusCodes.clientForbidden, JSON.stringify({ message: 'Unauthorized; user is not member of required group' }))
  }

  let user
  try {
    user = await storage.getJson(`users/${String(userId)}.json`)
  } catch (ex) {
    const decryptionKey = crypto.randomBytes(32)
    user = {
      userId,
      decryptionKey: decryptionKey.toString('base64')
    }
    await storage.putJson(`users/${String(userId)}.json`, user)
  }

  const response = {
    message: `Returning user details for ${String(userId)}`,
    user
  }

  return lambdaResponse(httpStatusCodes.success, JSON.stringify(response))
}
