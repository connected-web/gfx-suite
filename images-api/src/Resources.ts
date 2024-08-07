
import { Construct } from 'constructs'
import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { StackParameters } from './ApiStack'

/**
 * Resources
 *
 * Add all the resources you want in your API to this class
 * The shared Resources object is used to create resources that are shared by multiple routes
 * This is useful for resources that are used by multiple routes, such as a bucket for storing data
 * Think of this as a way to create resources that need to be between routes, or a simple form of dependency injection
 *
 * Getters are recommended so that you can late bind as many values as possible for test purposes.
 *
 * @param scope Construct scope for this construct
 * @param stack Stack object for this construct
 *
 * @returns Resources
 */
export class Resources {
  scope: Construct
  stack: cdk.Stack
  serviceDataBucketName: string
  serviceBucket: s3.Bucket
  requestsQueue: sqs.Queue

  constructor (scope: Construct, stack: cdk.Stack, stackConfig: StackParameters) {
    this.scope = scope
    this.stack = stack
    this.serviceDataBucketName = stackConfig?.serviceDataBucketName

    this.serviceBucket = new s3.Bucket(this.stack, 'ServiceDataBucket', {
      bucketName: stackConfig?.serviceDataBucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: true
    })

    this.requestsQueue = new sqs.Queue(this.stack, 'RequestsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30)
    })
  }
}
