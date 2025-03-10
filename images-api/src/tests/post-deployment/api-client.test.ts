import { expect, describe, it, beforeAll } from '@jest/globals'

import axios from 'axios'
import OpenAPIClientAxios, { Document } from 'openapi-client-axios'
import { Client as ApiClientUnderTest } from './api-client'

import fs from 'node:fs/promises'
import path from 'node:path'

import Ajv from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import draft7MetaSchema from 'ajv/dist/refs/json-schema-draft-07.json'

const ajv = new Ajv({ allErrors: true, strict: false })
ajv.addMetaSchema(draft7MetaSchema)
addFormats(ajv)

const {
  POST_DEPLOYMENT_SERVER_DOMAIN,
  POST_DEPLOYMENT_AUTH_URL,
  POST_DEPLOYMENT_CLIENT_ID,
  POST_DEPLOYMENT_CLIENT_SECRET,
  CONNECTED_WEB_DEV_SSO_CLIENT_ID,
  CONNECTED_WEB_DEV_SSO_SECRET,
  CONNECTED_WEB_PROD_SSO_CLIENT_ID,
  CONNECTED_WEB_PROD_SSO_SECRET
} = process.env

interface ServerInfo {
  baseURL: string
  headers: {
    [param: string]: string
  }
}

const clientConfigs = {
  'not-set': {
    error: 'No mode set; use --dev or --prod to specify credentials realm'
  },
  dev: {
    clientId: CONNECTED_WEB_DEV_SSO_CLIENT_ID as string,
    clientSecret: CONNECTED_WEB_DEV_SSO_SECRET as string,
    oauthTokenEndpoint: 'https://connected-web-dev.auth.eu-west-2.amazoncognito.com/oauth2/token',
    serviceUnderTest: 'https://images.dev.connected-web.services'
  },
  prod: {
    clientId: CONNECTED_WEB_PROD_SSO_CLIENT_ID as string,
    clientSecret: CONNECTED_WEB_PROD_SSO_SECRET as string,
    oauthTokenEndpoint: 'https://connected-web.auth.eu-west-2.amazoncognito.com/oauth2/token',
    serviceUnderTest: 'https://images.prod.connected-web.services'
  },
  ci: {
    clientId: POST_DEPLOYMENT_CLIENT_ID as string,
    clientSecret: POST_DEPLOYMENT_CLIENT_SECRET as string,
    oauthTokenEndpoint: POST_DEPLOYMENT_AUTH_URL as string,
    serviceUnderTest: POST_DEPLOYMENT_SERVER_DOMAIN as string
  }
}

const clientConfig = POST_DEPLOYMENT_AUTH_URL !== undefined ? clientConfigs.ci : clientConfigs.dev
console.log('Using client config:', { clientConfig })
const serverConfig: ServerInfo = {
  baseURL: clientConfig.serviceUnderTest,
  headers: {
    authorization: 'Bearer not-specified',
    'content-type': 'application/json'
  }
}

async function getOAuthToken (): Promise<string> {
  const { clientId, clientSecret, oauthTokenEndpoint } = clientConfig
  const requestPayload = [
    'grant_type=client_credentials',
    `client_id=${clientId}`
  ].join('&')
  const requestHeaders = {
    accept: 'application/json',
    'content-type': 'application/x-www-form-urlencoded',
    authorization: `Basic ${btoa([clientId, clientSecret].join(':'))}`
  }
  const tokenResponse = await axios.post(oauthTokenEndpoint, requestPayload, { headers: requestHeaders })
  return tokenResponse?.data?.access_token ?? 'not-set'
}

describe('Open API Spec', () => {
  let openapiDoc: Document
  const downloadedOpenAPIDocPath = path.join(__dirname, './downloaded-app-openapi.json')

  console.log('Server:', { serverConfig })

  beforeAll(async () => {
    console.log('Implicit test: it should download the openapi spec for the App Store from /openapi')
    const oauthToken = await getOAuthToken()
    console.log('Received OAuth Token:', { oauthToken: `${oauthToken?.length} bytes` })
    serverConfig.headers.authorization = `Bearer ${oauthToken}`
    const basicClient = axios.create(serverConfig)
    // console.log('Created basic Axios client using:', { serverConfig })

    const response = await basicClient.get('/openapi')
    openapiDoc = response.data
    const fileBody = JSON.stringify(openapiDoc, null, 2)
    await fs.writeFile(downloadedOpenAPIDocPath, fileBody, 'utf-8')
    console.log('Downloaded Open API Spec from /openapi endpoint:', { bytes: fileBody.length }, 'to', downloadedOpenAPIDocPath)
    ajv.addSchema(openapiDoc, 'app-openapi.json')
  })

  describe('Open API Document', () => {
    it('should contain an info block with title and description', async () => {
      const { version, ...testableProps } = openapiDoc.info
      expect(testableProps).toEqual({
        title: 'Images API',
        description: 'Images API - https://github.com/connected-web/gfx-suite'
      })
    })

    it('should contain a list of paths', async () => {
      const pathStrings = Object.keys(openapiDoc.paths as any).sort()
      expect(pathStrings).toEqual([
        '/',
        '/openapi',
        '/request',
        '/request/{requestId}',
        '/requests',
        '/requests/{searchPrefix}',
        '/results',
        '/results/{dateCode}',
        '/results/{dateCode}/{requestId}',
        '/status',
        '/user',
        '/user/details',
        '/user/{userId}'
      ])
    })

    it('should be possible to create an Open API Client based on the spec', async () => {
      // Note: this requires a manual run of: npm run typegen:for-post-deployment
      // Which uses the openapi-client-axios-typegen package to create appStore-client.d.ts
      const axiosApi = new OpenAPIClientAxios({ definition: openapiDoc, axiosConfigDefaults: { headers: serverConfig.headers } })
      const appStoreClient = await axiosApi.getClient()
      const actualClientKeys = Object.keys(appStoreClient)
      expect(actualClientKeys).toEqual(
        expect.arrayContaining([
          'getOpenAPISpec',
          'getStatus'
        ])
      )
    })
  })

  describe('Basic Client Endpoints', () => {
    let appClient: ApiClientUnderTest
    beforeAll(async () => {
      const axiosApi = new OpenAPIClientAxios({
        definition: openapiDoc,
        axiosConfigDefaults: {
          headers: serverConfig.headers,
          validateStatus: function (status) {
            return status >= 200 // don't throw errors on non-200 codes
          }
        }
      })

      appClient = await axiosApi.getClient<ApiClientUnderTest>()
      appClient.interceptors.response.use((response) => response, (error) => {
        console.log('Caught client error:', error.message)
      })
    })

    it('should be possible to getOpenAPISpec', async () => {
      const response = await appClient.getOpenAPISpec()

      console.log('Get Open API Spec:', response.status, response.statusText, JSON.stringify(response.data, null, 2)?.length, 'bytes received')

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/BasicObjectModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })

    it('should be possible to getStatus', async () => {
      const response = await appClient.getStatus()

      console.log('Get Status:', response.status, response.statusText, JSON.stringify(response.data, null, 2))

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/BasicObjectModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })
  })

  describe('Request Endpoints', () => {
    let appClient: ApiClientUnderTest
    beforeAll(async () => {
      const axiosApi = new OpenAPIClientAxios({
        definition: openapiDoc,
        axiosConfigDefaults: {
          headers: serverConfig.headers,
          validateStatus: function (status) {
            return status >= 200 // don't throw errors on non-200 codes
          }
        }
      })

      appClient = await axiosApi.getClient<ApiClientUnderTest>()
      appClient.interceptors.response.use((response) => response, (error) => {
        console.log('Caught client error:', error.message)
      })
    })

    it('should be possible to create a request', async () => {
      const response = await appClient.putRequest({ requestId: 'test-suite' }, {
        description: 'This is a test request',
        width: 512,
        height: 768,
        batchSize: 1,
        negative: 'rubbish',
        positive: 'masterwork'
      })

      console.log('Create Request:', response.status, response.statusText, JSON.stringify(response.data, null, 2))

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/PutRequestModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })

    const receiptHandles: any = []
    it('should be possible to get a list of requests', async () => {
      const response = await appClient.getRequests()

      console.log('Get Requests:', response.status, response.statusText, JSON.stringify(response.data, null, 2))

      const requests: any = (response.data as any)?.requests ?? []
      requests.forEach((request: any) => {
        receiptHandles.push({ ReceiptHandle: request.receiptHandle })
      })

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/GetRequestsModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })

    it('should be possible to delete requests', async () => {
      const response = await appClient.deleteRequests({}, receiptHandles)

      console.log('Delete Requests:', response.status, response.statusText, JSON.stringify(response.data, null, 2))

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/DeleteRequestsModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })
  })

  describe('User Endpoints', () => {
    let appClient: ApiClientUnderTest
    beforeAll(async () => {
      const axiosApi = new OpenAPIClientAxios({
        definition: openapiDoc,
        axiosConfigDefaults: {
          headers: serverConfig.headers,
          validateStatus: function (status) {
            return status >= 200 // don't throw errors on non-200 codes
          }
        }
      })

      appClient = await axiosApi.getClient<ApiClientUnderTest>()
      appClient.interceptors.response.use((response) => response, (error) => {
        console.log('Caught client error:', error.message)
      })
    })

    it('should be possible to get user details for the current user', async () => {
      const response = await appClient.userDetails()

      console.log('Get User Details:', response.status, response.statusText, JSON.stringify(response.data, null, 2))

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/UserDetailsModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })

    it('should be possible to get user details for a specific user', async () => {
      const response = await appClient.userByUserId({ userId: 'test-suite' })

      console.log('Get User:', response.status, response.statusText, JSON.stringify(response.data, null, 2))

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/UserDetailsModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })
  })

  describe('Results', () => {
    let appClient: ApiClientUnderTest
    beforeAll(async () => {
      const axiosApi = new OpenAPIClientAxios({
        definition: openapiDoc,
        axiosConfigDefaults: {
          headers: serverConfig.headers,
          validateStatus: function (status) {
            return status >= 200 // don't throw errors on non-200 codes
          }
        }
      })

      appClient = await axiosApi.getClient<ApiClientUnderTest>()
      appClient.interceptors.response.use((response) => response, (error) => {
        console.log('Caught client error:', error.message)
      })
    })

    it('should be possible to store results for an image batch', async () => {
      const payload = {
        requestId: 'test-suite',
        started: '2024-07-11T05:30:05.434Z',
        finished: '2024-07-11T05:32:03.874Z',
        generatedFiles: ['2024-07/test-image.jpg'],
        initializationVectors: ['MTIzNA==']
      }
      const response = await appClient.putResults({}, payload)

      console.log('Store Results:', response.status, response.statusText, JSON.stringify(response.data, null, 2))

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/PutResultsModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })

    it('should be possible to retrieve stored results for an image batch', async () => {
      const response = await appClient.getResults({ dateCode: '2024-07', requestId: 'test-suite' })

      console.log('Get Results:', response.status, response.statusText, JSON.stringify(response.data, null, 2))

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/GetResultsModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })
  })

  describe('List results', () => {
    let appClient: ApiClientUnderTest
    beforeAll(async () => {
      const axiosApi = new OpenAPIClientAxios({
        definition: openapiDoc,
        axiosConfigDefaults: {
          headers: serverConfig.headers,
          validateStatus: function (status) {
            return status >= 200 // don't throw errors on non-200 codes
          }
        }
      })

      appClient = await axiosApi.getClient<ApiClientUnderTest>()
      appClient.interceptors.response.use((response) => response, (error) => {
        console.log('Caught client error:', error.message)
      })
    })

    it('should be possible to list results for a specific date code', async () => {
      const response = await appClient.listRequestsForCurrentUser({ searchPrefix: '2024-07' })

      console.log('List Results:', response.status, response.statusText, JSON.stringify(response.data, null, 2))

      ajv.validate({ $ref: 'app-openapi.json#/components/schemas/ListResultsModel' }, response.data)
      expect(ajv.errors ?? []).toEqual([])
    })
  })
})
