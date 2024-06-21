import { Construct } from 'constructs'
import path from 'path'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { MethodResponse } from 'aws-cdk-lib/aws-apigateway'

import { OpenAPIRouteMetadata } from '@connected-web/openapi-rest-api'
import { Resources } from '../../Resources'
import { ApiResponse } from '../../models/ApiResponse'

/* This section is for route metadata used by CDK to create the stack that will host your endpoint */
export class StatusEndpoint extends OpenAPIRouteMetadata<Resources> {
  grantPermissions (scope: Construct, endpoint: NodejsFunction, resources: Resources): void {
    const serviceBucket = resources.serviceBucket
    serviceBucket.grantRead(endpoint)
  }

  get operationId (): string {
    return 'getStatus'
  }

  get restSignature (): string {
    return 'GET /status'
  }

  get routeEntryPoint (): string {
    return path.join(__dirname, 'handler.ts')
  }

  get lambdaConfig (): NodejsFunctionProps {
    return {
      environment: {
        STATUS_INFO: JSON.stringify({
          deploymentTime: process.env.USE_MOCK_TIME ?? new Date()
        })
      }
    }
  }

  get methodResponses (): MethodResponse[] {
    return [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Content-Type': true,
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Credentials': true
      },
      responseModels: {
        'application/json': ApiResponse.model
      }
    }]
  }
}
