import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'

import Storage from '../helpers/storage'
import { ListResultsResponseType, ResultsPathItem } from '../../models/ApiResponseTypes'

const storage = new Storage(process.env.SERVICE_BUCKET ?? 'no-bucket-set')

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const searchPrefix = event?.pathParameters?.searchPrefix ?? 'no-search-prefix'
  const authorizerContext = event.requestContext.authorizer
  const principalId = authorizerContext?.principalId

  if (principalId === undefined) {
    return lambdaResponse(httpStatusCodes.failedDependency, JSON.stringify({ message: 'Missing principalId in request' }))
  }

  const userIdBase64 = Buffer.from(principalId).toString('base64')
  const storagePathPrefix = `results/${userIdBase64}/${String(searchPrefix)}`

  try {
    const resultsList = await storage.listJsonObjects(storagePathPrefix)
    const resultsItems: ResultsPathItem[] = resultsList.map((result) => {
      const resultPath = result.Key ?? 'no-key'
      const resultParts = resultPath.split('/')
      const requestId = resultParts.pop() ?? 'no-request-id'
      const dateCode = resultParts.pop() ?? 'no-date-code'

      return {
        path: resultPath,
        dateCode,
        requestId
      }
    })

    const resultsData: ListResultsResponseType = {
      message: `List of results found for prefix: ${searchPrefix}`,
      results: resultsItems
    }

    return lambdaResponse(httpStatusCodes.success, JSON.stringify(resultsData))
  } catch (ex) {
    const error = ex as Error
    console.log('Unable to list results data', error?.message, { searchPrefix, userIdBase64, storagePath: storagePathPrefix })

    return lambdaResponse(httpStatusCodes.notFound, JSON.stringify({
      message: error?.message
    }))
  }
}
