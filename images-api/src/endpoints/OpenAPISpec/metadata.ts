
import path from 'path'
import { OpenAPIBasicModels, OpenAPIEnums, OpenAPIRouteMetadata } from '@connected-web/openapi-rest-api'
import { Construct } from 'constructs'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { MethodResponse, IModel } from 'aws-cdk-lib/aws-apigateway'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Resources } from '../../Resources'

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
    return path.join(__dirname, 'handler.ts')
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
