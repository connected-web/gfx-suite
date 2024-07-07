import express from 'express'
import packageJson from '../package.json' assert { type: 'json' }

import Auth, { ClientConfig } from './Auth'

const app = express()
const startDate = new Date()

const {
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

const status = {
  state: 'running',
  version: packageJson?.version ?? '0.0.0',
  uptime: 0
}

let accessToken = ''
async function updateServer (): Promise<void> {
  status.uptime = process.uptime()
  const latestAccessToken = await auth.getLatestAccessToken()
  if (latestAccessToken !== accessToken) {
    accessToken = latestAccessToken
    console.log('Updated access token:', accessToken?.length, 'bytes', `(${accessToken?.substring(0, 8)}...)`)
  }
  /* eslint-disable @typescript-eslint/no-misused-promises */
  setTimeout(updateServer, 5000)
}

app.get('/', (req, res) => {
  res.json({
    message: `Server has been running since ${startDate.toISOString()}`,
    status,
    apiEnv,
    oauthTokenEndpoint,
    clientId,
    clientSecret: clientSecret?.substring(0, 8) + '... (truncated)'
  })
})

const port = process?.env?.PORT ?? 3000
app.listen(port, async () => {
  console.log(`GFX Suite : Remote Crank Server is running on port http://localhost:${port}`)
  await updateServer()
})

export default app
