import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda/trigger/api-gateway-proxy'
import { OpenAPIBasicModels, OpenAPIEnums, OpenAPIHelpers, OpenAPIRouteMetadata } from '@connected-web/openapi-rest-api'
import { Construct } from 'constructs'
import { APIGatewayClient, GetExportCommand } from '@aws-sdk/client-api-gateway'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { MethodResponse, IModel } from 'aws-cdk-lib/aws-apigateway'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Resources } from '../Resources'

/* This handler is executed by AWS Lambda when the endpoint is invoked */
export async function handler (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  let openapiSpec, error
  try {
    const client = new APIGatewayClient({
      region: 'eu-west-2'
    })
    const command = new GetExportCommand({
      restApiId: event.requestContext.apiId,
      stageName: event.requestContext.stage,
      exportType: 'oas30'
    })
    const commandResponse = await client.send(command)
    // GetExportCommandOutput: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-api-gateway/interfaces/getexportcommandoutput.html
    const decodedBody = new TextDecoder().decode(commandResponse.body)
    openapiSpec = JSON.parse(decodedBody)
    console.log('Successfully generated Open API spec')
  } catch (ex) {
    error = (ex as Error).message
    console.log('Unable to generate Open API spec, error:', error)
  }

  const responseData = openapiSpec ?? { message: 'Unable to retrieve or decode OpenAPI Spec', openapiSpec, error, event }
  return OpenAPIHelpers.lambdaResponse(OpenAPIEnums.httpStatusCodes.success, JSON.stringify(responseData))
}

/* This section is for route metadata used by CDK to create the stack that will host your endpoint */
export class OpenAPISpecEndpoint extends OpenAPIRouteMetadata<Resources> {
  grantPermissions (scope: Construct, endpoint: NodejsFunction, resources: Resources): void {
    const apiInformationPolicy = new PolicyStatement({
      actions: ['apigateway:GET'],
      resources: ['arn:aws:apigateway:*::/restapis/*/stages/*/exports/*']
    })

    endpoint.addToRolePolicy(apiInformationPolicy)
  }

  get operationId (): string {
    return 'getOpenAPISpec'
  }

  get restSignature (): string {
    return 'GET /openapi'
  }

  get routeEntryPoint (): string {
    return __filename
  }

  get lambdaConfig (): NodejsFunctionProps {
    return {}
  }

  get methodResponses (): MethodResponse[] {
    return [{
      statusCode: String(OpenAPIEnums.httpStatusCodes.success),
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true
      },
      responseModels: {
        'application/json': OpenAPIBasicModels.singleton.BasicObjectModel
      }
    }]
  }

  get methodRequestModels (): { [param: string]: IModel } | undefined {
    return undefined
  }

  get requestParameters (): { [param: string]: boolean } | undefined {
    return undefined
  }
}
