import { describe, it, beforeAll } from '@jest/globals'

import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { ApiStack } from '../../ApiStack'

import fs from 'node:fs'

// Avoid writing to step summary during these tests
process.env.GITHUB_STEP_SUMMARY = undefined

const getTemplate = (): Template => {
  const app = new cdk.App()
  const stack = new ApiStack(app, 'MyTestStack', {
    env: {
      account: '1234567890',
      region: 'eu-west-2'
    }
  },
  {
    hostedZoneDomain: 'dummy.domain.name',
    serviceDataBucketName: 'test-stack-stub-bucket-name',
    identity: {
      verifiers: []
    }
  })
  const template = Template.fromStack(stack)
  fs.writeFileSync('src/tests/template.json', JSON.stringify(template, null, 2))
  return template
}

describe('REST API', () => {
  let template: Template

  beforeAll(() => {
    template = getTemplate()
  })

  it('Creates an AWS ApiGateway RestApi with the correct title and description', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Description: 'Template API - https://github.com/connected-web/template-api',
      Name: 'Template API'
    })
  })

  it('Creates a AWS ApiGateway Method with the operationId - getStatus', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      OperationName: 'getStatus'
    })
  })

  it('Creates a AWS ApiGateway Method with the operationId - getOpenAPISpec', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      OperationName: 'getOpenAPISpec'
    })
  })
})
