import { Construct } from 'constructs'
import path from 'path'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { MethodResponse } from 'aws-cdk-lib/aws-apigateway'

import { OpenAPIRouteMetadata } from '@connected-web/openapi-rest-api'
import { Resources } from '../../Resources'
import { ApiResponse } from '../../models/ApiResponse'

/* This section is for route metadata used by CDK to create the stack that will host your endpoint */
export class GetRequestsEndpoint extends OpenAPIRouteMetadata<Resources> {
  resources: Resources

  constructor (resources: Resources) {
    super()
    this.resources = resources
  }

  grantPermissions (scope: Construct, endpoint: NodejsFunction, resources: Resources): void {
    const serviceBucket = resources.serviceBucket
    const requestsQueue = resources.requestsQueue
    serviceBucket.grantRead(endpoint)
    requestsQueue.grantConsumeMessages(endpoint)
  }

  get operationId (): string {
    return 'getRequests'
  }

  get restSignature (): string {
    return 'GET /requests'
  }

  get routeEntryPoint (): string {
    return path.join(__dirname, 'handler.ts')
  }

  get lambdaConfig (): NodejsFunctionProps {
    return {
      environment: {
        SERVICE_BUCKET: this.resources.serviceBucket.bucketName,
        REQUESTS_QUEUE_URL: this.resources.requestsQueue.queueUrl
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
        'application/json': ApiResponse.getRequests
      }
    }]
  }
}
