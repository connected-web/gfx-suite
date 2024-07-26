import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'

import Storage from '../helpers/storage'
import { ImageResultsType } from '../../models/ApiResponseTypes'

const storage = new Storage(process.env.SERVICE_BUCKET ?? 'no-bucket-set')

function parseResults (body: string): any {
  try {
    return JSON.parse(body)
  } catch (ex) {
    return {}
  }
}

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const now = new Date()
  const rawRequest = parseResults(event?.body ?? '{}')
  console.log('[PutResults]', { rawRequest })
  const { originalRequest } = rawRequest
  const userId = originalRequest?.userId ?? 'no-user-id-from-result'
  const resultsDataToStore: ImageResultsType = {
    originalRequest: {
      userId,
      requestId: originalRequest?.requestId,
      type: originalRequest?.type,
      positive: originalRequest?.positive,
      negative: originalRequest?.negative,
      width: originalRequest?.width,
      height: originalRequest?.height,
      batchSize: originalRequest?.batchSize,
      requestTime: originalRequest?.requestTime
    },
    started: rawRequest?.started,
    finished: rawRequest?.finished,
    uploaded: now.toISOString(),
    generatedFiles: rawRequest?.generatedFiles,
    initializationVectors: rawRequest?.initializationVectors
  }

  const userIdBase64 = Buffer.from(userId).toString('base64')
  const requestDateTime = new Date(originalRequest?.requestTime ?? now)
  const dateCode = String(requestDateTime.toISOString().slice(0, 10))
  const storagePath = `results/${userIdBase64}/${dateCode}/${String(originalRequest.requestId)}.json`

  try {
    await storage.putJson(storagePath, resultsDataToStore)
  } catch (ex) {
    const error = ex as Error
    console.log('[PutResults] Unable to handle result data', error?.message, rawRequest)
  }

  return lambdaResponse(httpStatusCodes.success, JSON.stringify({
    message: 'Result stored',
    path: storagePath
  }))
}
