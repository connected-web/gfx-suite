import { Construct } from 'constructs'
import path from 'path'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { MethodResponse } from 'aws-cdk-lib/aws-apigateway'

import { OpenAPIRouteMetadata } from '@connected-web/openapi-rest-api'
import { Resources } from '../../Resources'
import { ApiResponse } from '../../models/ApiResponses'

/* This section is for route metadata used by CDK to create the stack that will host your endpoint */
export class UserDetailsEndpoint extends OpenAPIRouteMetadata<Resources> {
  resources: Resources

  constructor (resources: Resources) {
    super()
    this.resources = resources
  }

  grantPermissions (scope: Construct, endpoint: NodejsFunction, resources: Resources): void {
    const serviceBucket = resources.serviceBucket
    serviceBucket.grantReadWrite(endpoint)
  }

  get operationId (): string {
    return 'userDetails'
  }

  get restSignature (): string {
    return 'GET /user/details'
  }

  get routeEntryPoint (): string {
    return path.join(__dirname, 'handler.ts')
  }

  get lambdaConfig (): NodejsFunctionProps {
    return {
      environment: {
        SERVICE_BUCKET: this.resources.serviceBucket.bucketName
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
        'application/json': ApiResponse.userDetails
      }
    }]
  }
}
