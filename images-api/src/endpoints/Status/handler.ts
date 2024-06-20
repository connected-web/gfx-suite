import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { httpStatusCodes, lambdaResponse } from '../../helpers/Response'

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const statusInfo = process.env.STATUS_INFO ?? JSON.stringify({ message: 'No STATUS_INFO found on env' })
  return lambdaResponse(httpStatusCodes.success, statusInfo)
}
