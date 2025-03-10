import * as cdk from 'aws-cdk-lib'

import { Construct } from 'constructs'
import { OpenAPIRestAPI, OpenAPIVerifiers, OpenAPIBasicModels } from '@connected-web/openapi-rest-api'

import { Resources } from './Resources'
import { StatusEndpoint } from './endpoints/Status/metadata'
import { OpenAPISpecEndpoint } from './endpoints/OpenAPISpec/metadata'
import { PutRequestEndpoint } from './endpoints/PutRequest/metadata'
import { GetRequestsEndpoint } from './endpoints/GetRequests/metadata'
import { DeleteRequestsEndpoint } from './endpoints/DeleteRequests/metadata'
import { UserDetailsEndpoint } from './endpoints/UserDetails/metadata'
import { UserByUserIdEndpoint } from './endpoints/UserByUserId/metadata'
import { PutResultsEndpoint } from './endpoints/PutResults/metadata'
import { GetResultsEndpoint } from './endpoints/GetResults/metadata'
import { ListRequestsForCurrentUserEndpoint } from './endpoints/ListRequestsForCurrentUser/metadata'

export interface IdentityConfig {
  verifiers: OpenAPIVerifiers
}

export interface StackParameters { hostedZoneDomain: string, serviceDataBucketName: string, identity: IdentityConfig }

/**
 * ApiStack
 *
 * The main stack for the API. This stack creates the API Gateway, and all of its endpoints.
 *
 * Create additional endpoints in ./endpoints/ by extending the OpenAPIEndpoint class, and adding them to the API Gateway.
 *
 * Share custom resources by implementing the ./Resources.ts class, which will be passed into your endpoints.
 *
 * Document custom response and request models in ./models/ by extending the OpenAPIBasicModels class, and adding them to the API Gateway.
 *
 * @param scope Construct scope for this construct
 * @param id Unique identifier for this construct
 * @param props StackProps object containing the description, subdomain, hosted zone domain, and verifiers for this API
 *
 * @returns ApiStack
 */
export class ApiStack extends cdk.Stack {
  constructor (scope: Construct, id: string, props: cdk.StackProps, config: StackParameters) {
    super(scope, id, props)

    // Create shared resources
    const sharedResources = new Resources(scope, this, config)

    // Create API Gateway
    const apiGateway = new OpenAPIRestAPI<Resources>(this, 'Images API', {
      Description: 'Images API - https://github.com/connected-web/gfx-suite',
      SubDomain: 'images',
      HostedZoneDomain: config.hostedZoneDomain,
      Verifiers: config?.identity.verifiers ?? []
    }, sharedResources)

    // Kick of dependency injection for shared models and model factory
    OpenAPIBasicModels.setup(this, apiGateway.restApi)

    // Add endpoints to API
    apiGateway
      .addEndpoints({
        'GET /status': new StatusEndpoint(),
        'GET /openapi': new OpenAPISpecEndpoint(),
        'PUT /request/{requestId}': new PutRequestEndpoint(sharedResources),
        'GET /requests': new GetRequestsEndpoint(sharedResources),
        'GET /requests/{searchPrefix}': new ListRequestsForCurrentUserEndpoint(sharedResources),
        'DELETE /requests': new DeleteRequestsEndpoint(sharedResources),
        'GET /user/details': new UserDetailsEndpoint(sharedResources),
        'GET /user/{userId}': new UserByUserIdEndpoint(sharedResources),
        'PUT /results': new PutResultsEndpoint(sharedResources),
        'GET /results/{dateCode}/{requestId}': new GetResultsEndpoint(sharedResources)
      })
      .report()
  }
}
