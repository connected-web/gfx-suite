import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'

import Storage from '../helpers/storage'
import { ImageResultsType } from '../../models/ApiResponseTypes'

const storage = new Storage(process.env.SERVICE_BUCKET ?? 'no-bucket-set')

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const dateCode = event?.pathParameters?.dateCode ?? 'no-date-code'
  const requestId = event?.pathParameters?.requestId ?? 'no-request-id'
  const authorizerContext = event.requestContext.authorizer
  const principalId = authorizerContext?.principalId

  if (principalId === undefined) {
    return lambdaResponse(httpStatusCodes.failedDependency, JSON.stringify({ message: 'Missing principalId in request' }))
  }

  const userIdBase64 = Buffer.from(principalId).toString('base64')
  const storagePath = `results/${userIdBase64}/${String(dateCode)}/${String(requestId)}.json`

  try {
    const resultsData: ImageResultsType = await storage.getJson(storagePath)
    return lambdaResponse(httpStatusCodes.success, JSON.stringify(resultsData))
  } catch (ex) {
    const error = ex as Error
    console.log('Unable to find results data', error?.message, { dateCode, requestId, userIdBase64, storagePath })

    return lambdaResponse(httpStatusCodes.notFound, JSON.stringify({
      message: error?.message
    }))
  }
}
