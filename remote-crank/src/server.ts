import path from 'path'
import express from 'express'
import packageJson from '../package.json' assert { type: 'json' }

import Auth, { ClientConfig } from './Auth'
import { LocalRequests } from './clients/LocalRequests'
import { LocalResults } from './clients/LocalResults'
import refreshSchedule, { RefreshScheduleItem } from './refreshSchedule'
import ImagesApiClient from './clients/ImagesApi'
import { ImageRequest } from './clients/SharedTypes'

const app = express()
const startDate = new Date()

const {
  REMOTE_CRANK_LOCALDATA_PATH,
  GFX_SUITE_DEV_SSO_CLIENT_ID,
  GFX_SUITE_DEV_SSO_SECRET,
  GFX_SUITE_PROD_SSO_CLIENT_ID,
  GFX_SUITE_PROD_SSO_SECRET,
  NODE_ENV
} = process.env

interface EnvironmentConfig extends ClientConfig {
  imagesApiBaseUrl: string
}

const environmentSettings: { [key: string]: EnvironmentConfig } = {
  dev: {
    clientId: GFX_SUITE_DEV_SSO_CLIENT_ID as string,
    clientSecret: GFX_SUITE_DEV_SSO_SECRET as string,
    oauthTokenEndpoint: 'https://connected-web-dev.auth.eu-west-2.amazoncognito.com/oauth2/token',
    imagesApiBaseUrl: 'https://images.dev.connected-web.services'
  },
  prod: {
    clientId: GFX_SUITE_PROD_SSO_CLIENT_ID as string,
    clientSecret: GFX_SUITE_PROD_SSO_SECRET as string,
    oauthTokenEndpoint: 'https://connected-web.auth.eu-west-2.amazoncognito.com/oauth2/token',
    imagesApiBaseUrl: 'https://images.prod.connected-web.services'
  }
}

const defaultApiEnv = 'dev'
const apiEnv = NODE_ENV ?? defaultApiEnv
const environment = environmentSettings[apiEnv] ?? environmentSettings[defaultApiEnv]
const { clientId, clientSecret, oauthTokenEndpoint } = environment

const auth = new Auth(environment)
console.log('Created Auth instance with', auth)

const localDirectory = path.join(REMOTE_CRANK_LOCALDATA_PATH ?? process.cwd(), 'localdata')
const localRequests = new LocalRequests(localDirectory)
const localResults = new LocalResults(localDirectory)
const imagesApiClient = new ImagesApiClient()

const status = {
  state: 'running',
  version: packageJson?.version ?? '0.0.0',
  uptime: 0,
  requests: [] as string[],
  results: [] as string[]
}

let currentSchedule: RefreshScheduleItem
let accessToken: string = ''

async function updateServer (): Promise<void> {
  status.uptime = process.uptime()
  try {
    const latestAccessToken = await auth.getLatestAccessToken()
    if (latestAccessToken !== accessToken) {
      accessToken = latestAccessToken
      console.log('Updated access token:', accessToken?.length, 'bytes', `(${accessToken?.substring(0, 8)}...)`)
    }
  } catch (ex) {
    const error = ex as Error
    console.log('Unable to update access token:', error?.message)
  }

  let newRequests: ImageRequest[] = []
  try {
    console.log('[updateServer] Checking for new requests')
    const requestsData = await imagesApiClient.getRequests()
    newRequests = requestsData?.requests ?? []
    newRequests.forEach(async (requestItem: ImageRequest) => {
      console.log('[updateServer] Received request:', requestItem)
      await localRequests.storeRequest(requestItem)
      return
    })
    await imagesApiClient.deleteRequests(newRequests.map(requestItem => String(requestItem?.receiptHandle)))
    console.log('[updateServer] Stored and deleted', newRequests?.length, 'new requests')
  } catch (ex) {
    const error = ex as Error
    console.log('[updateServer] Unable to process requests', { error: error.message, newRequests })
  }

  status.requests = await localRequests.listRequests()
  status.results = await localResults.listResults()

  const now = new Date()
  currentSchedule = refreshSchedule[now.getUTCHours()]

  /* eslint-disable @typescript-eslint/no-misused-promises */
  setTimeout(updateServer, currentSchedule?.refreshTime ?? 60000)
}

app.get('/', (req, res) => {
  res.json({
    message: `Server has been running since ${startDate.toISOString()}`,
    status,
    apiEnv,
    oauthTokenEndpoint,
    clientId,
    clientSecret: clientSecret?.substring(0, 8) + '... (truncated)',
    schedule: currentSchedule
  })
})

app.get('/schedule', (req, res) => {
  res.json({
    currentSchedule,
    refreshSchedule
  })
})

const port = process?.env?.PORT ?? 3000
app.listen(port, async () => {
  console.log(`GFX Suite : Remote Crank Server is running on port http://localhost:${port}`)
  await updateServer()
})

export default app
