#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ApiStack } from './src/ApiStack'

const {
  ACCOUNT_PROFILE,
  AWS_ACCOUNT_CONFIG,
  AWS_ACCOUNT_ID,
  CDK_DEFAULT_ACCOUNT,
  CDK_DEFAULT_REGION
} = process.env

const accountProfile = ACCOUNT_PROFILE
const accountConfig = JSON.parse(AWS_ACCOUNT_CONFIG ?? '{}')
const accountId = AWS_ACCOUNT_ID

console.log('Account config:', { accountProfile, accountId, accountConfig })

const app = new cdk.App()
const stackName = 'ImagesAPI'
const stackTemplate = new ApiStack(app, stackName, {
  env: {
    account: CDK_DEFAULT_ACCOUNT ?? '123456789012',
    region: CDK_DEFAULT_REGION ?? 'eu-west-2'
  }
},
{
  hostedZoneDomain: accountConfig.hostedZoneDomain,
  serviceDataBucketName: ['connected-web-images-api', accountConfig.environment].join('-'),
  identity: accountConfig.identity
})

console.log('Created stack', stackTemplate.stackName)
