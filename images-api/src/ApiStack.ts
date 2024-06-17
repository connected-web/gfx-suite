import * as cdk from 'aws-cdk-lib'

import { Construct } from 'constructs'
import { OpenAPIRestAPI, OpenAPIVerifiers, OpenAPIBasicModels } from '@connected-web/openapi-rest-api'

import { Resources } from './Resources'
import { StatusEndpoint } from './endpoints/Status'
import { OpenAPISpecEndpoint } from './endpoints/OpenAPISpec'

export interface IdentityConfig {
  verifiers: OpenAPIVerifiers
}

export interface StackParameters { hostedZoneDomain: string, serviceDataBucketName: string, identity: IdentityConfig }

/**
 * ApiStack
 *
 * The main stack for the API. This stack creates the API Gateway, and all of its endpoints.
 *
 * Use this stack as a template for your own API.
 *
 * Create your own endpoints in ./endpoints/ by extending the OpenAPIEndpoint class, and adding them to the API Gateway.
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
    const sharedResources = new Resources(scope, this)

    // Create API Gateway
    const apiGateway = new OpenAPIRestAPI<Resources>(this, 'Template API', {
      Description: 'Template API - https://github.com/connected-web/template-api',
      SubDomain: 'template-api',
      HostedZoneDomain: config.hostedZoneDomain,
      Verifiers: config?.identity.verifiers ?? []
    }, sharedResources)

    // Kick of dependency injection for shared models and model factory
    OpenAPIBasicModels.setup(this, apiGateway.restApi)

    // Add endpoints to API
    apiGateway
      .addEndpoints([
        new StatusEndpoint(),
        new OpenAPISpecEndpoint()
      ])
      .report()
  }
}
