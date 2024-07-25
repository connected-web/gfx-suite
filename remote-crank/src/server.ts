import path from 'path'
import express from 'express'
import packageJson from '../package.json' assert { type: 'json' }

import Auth, { ClientConfig } from './Auth'
import refreshSchedule, { RefreshScheduleItem } from './refreshSchedule'
import { ComfyUIClient } from './clients/ComfyUI'
import ImagesApiClient from './clients/ImagesApi'
import { LocalRequests } from './clients/LocalRequests'
import { LocalResults } from './clients/LocalResults'
import { ImageRequest, ImageResult, ResultsIndex } from './clients/SharedTypes'
import { EncryptedFileRecord, ImageUtils } from './clients/ImageUtils'
import { ImagesFtp } from './clients/ImagesFtp'

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
const comfyUiClient = new ComfyUIClient()

const resultsIndex: ResultsIndex = {}

const status = {
  state: 'running',
  version: packageJson?.version ?? '0.0.0',
  uptime: 0,
  requests: [] as string[],
  results: resultsIndex
}

let currentSchedule: RefreshScheduleItem
let accessToken: string = ''

const outstandingRequests: ImageRequest[] = []

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
    console.log('[updateServer] Checking for new requests...')
    const requestsData = await imagesApiClient.getRequests()
    newRequests = requestsData?.requests ?? []
    const work = newRequests.map(async (requestItem: ImageRequest) => {
      console.log('[updateServer] Received request:', requestItem)
      await localRequests.storeRequest(requestItem)
    })
    await Promise.allSettled(work)
    await imagesApiClient.deleteRequests(newRequests.map(requestItem => String(requestItem?.receiptHandle)))
    if (newRequests?.length > 0) {
      console.log('[updateServer] Stored and deleted', newRequests?.length, 'new requests')
    } else {
      console.log('[updateServer] No new requests found')
    }
  } catch (ex) {
    const error = ex as Error
    console.log('[updateServer] Unable to process requests', { error: error.message, newRequests })
  }

  status.requests = await localRequests.listRequests()
  status.results = await localResults.listAllResults()

  newRequests.forEach(request => {
    outstandingRequests.push(request)
  })

  await processRequests()

  const now = new Date()
  currentSchedule = refreshSchedule[now.getUTCHours()]

  /* eslint-disable @typescript-eslint/no-misused-promises */
  setTimeout(updateServer, currentSchedule?.refreshTime ?? 60000)
}

async function processRequests (): Promise<void> {
  while (outstandingRequests.length > 0) {
    const nextRequest: ImageRequest | undefined = outstandingRequests.shift()
    if (nextRequest === undefined) {
      break
    }

    try {
      const started = new Date()
      const imageUtils = new ImageUtils()
      const ftpClient = new ImagesFtp()
      const remoteDirectory = ['users', btoa(nextRequest.userId), started.toISOString().slice(0, 10)].join('/')
      ftpClient.createDirectory(remoteDirectory)
      const workflow = comfyUiClient.createWorkflow(nextRequest)

      const secureUserDetails = await imagesApiClient.getUserDetailsByUserId(nextRequest.userId)
      console.log('Retrieved user details:', secureUserDetails)
      const userEncryptionKey = secureUserDetails?.user?.decryptionKey

      const encryptedFileRecords: EncryptedFileRecord[] = []
      await comfyUiClient.invokeWorkflow(workflow, nextRequest.batchSize, async (sourceImageFile: string) => {
        let compressedFile: string | undefined
        let encryptedFileRecord: EncryptedFileRecord | undefined
        try {
          console.log('[processRequests] Compress image to JPG')
          compressedFile = await imageUtils.compressImage(sourceImageFile)
        } catch (ex) {
          const error = ex as Error
          console.info('[processRequests] Unable to compress image:', { error: error.message, sourceImageFile })
        }
        try {
          console.log('[processRequests] Deleting image:', sourceImageFile)
          await imageUtils.deleteImage(sourceImageFile)
        } catch (ex) {
          const error = ex as Error
          console.info('[processRequests] Unable to delete image:', { error: error.message, imageFile: sourceImageFile })
        }
        try {
          console.log('[processRequests] Encrypting image', path.basename(String(compressedFile)))
          encryptedFileRecord = await imageUtils.encryptImage(String(compressedFile), userEncryptionKey)
          encryptedFileRecords.push(encryptedFileRecord)
          console.log('[processRequests] Encrypted image', path.basename(encryptedFileRecord?.encryptedImagePath))
        } catch (ex) {
          const error = ex as Error
          console.info('[processRequests] Unable to encrypt image:', { error: error.message, sourceImageFile: compressedFile })
        }
        if (encryptedFileRecord !== undefined) {
          try {
            const remoteFilename = path.basename(encryptedFileRecord.encryptedImagePath)
            const remoteFilepath = path.join(remoteDirectory, remoteFilename)
            console.log('[processRequests] Upload image to FTP', remoteFilename)
            ftpClient.uploadFile(encryptedFileRecord.encryptedImagePath, remoteFilepath)
          } catch (ex) {
            const error = ex as Error
            console.info('[processRequests] Unable to upload image:', { error: error.message, imageFile: sourceImageFile })
          }
        } else {
          encryptedFileRecords.push({
            encryptedImagePath: 'unable-to-encrypt',
            iv: 'unable-to-encrypt-no-iv-set'
          })
        }
        if (encryptedFileRecords.length === nextRequest?.batchSize) {
          try {
            await storeFinalResults(imageUtils, nextRequest, started, encryptedFileRecords, remoteDirectory)
          } catch (ex) {
            const error = ex as Error
            console.log('[processRequests] Unable to store final results', encryptedFileRecords?.length, 'items, Reason:', error?.message)
          }
        } else {
          try {
            await storeProgressResults(imageUtils, nextRequest, started, encryptedFileRecords, remoteDirectory)
          } catch (ex) {
            const error = ex as Error
            console.log('[processRequests] Unable to store progress results', encryptedFileRecords?.length, 'items, Reason:', error?.message)
          }
        }
      })
    } catch (ex) {
      const error = ex as Error
      console.info('[processRequests] Unable to invoke workflow:', { error: error.message, request: nextRequest })
    }
  }
}

async function storeProgressResults (imageUtils: ImageUtils, originalRequest: ImageRequest, started: Date, encryptedFileRecords: EncryptedFileRecord[], remoteDirectory: string): Promise<void> {
  const imageResult: ImageResult = {
    originalRequest,
    started,
    finished: 'in-progress',
    generatedFiles: encryptedFileRecords.map(record => {
      return path.join(remoteDirectory, path.basename(record.encryptedImagePath))
    }),
    initializationVectors: encryptedFileRecords.map(record => record.iv)
  }
  console.log('Storing progress result:', imageResult)
  await Promise.allSettled([
    imagesApiClient.putResults(imageResult)
  ])
  console.log('Stored progress result:', imageResult?.originalRequest?.requestId, 'with', imageResult?.generatedFiles?.length, 'files')
}

async function storeFinalResults (imageUtils: ImageUtils, originalRequest: ImageRequest, started: Date, encryptedFileRecords: EncryptedFileRecord[], remoteDirectory: string): Promise<void> {
  const imageResult: ImageResult = {
    originalRequest,
    started,
    finished: new Date(),
    generatedFiles: encryptedFileRecords.map(record => {
      return path.join(remoteDirectory, path.basename(record.encryptedImagePath))
    }),
    initializationVectors: encryptedFileRecords.map(record => record.iv)
  }
  console.log('Storing final result:', imageResult)
  await Promise.allSettled([
    imagesApiClient.putResults(imageResult),
    localResults.storeResult(imageResult),
    localRequests.deleteRequest(originalRequest?.requestId)
  ])
  console.log('Stored final result:', imageResult?.originalRequest?.requestId, 'with', imageResult?.generatedFiles?.length, 'files')

  /*
  await Promise.allSettled([
    ...encryptedFileRecords.map(async record => await imageUtils.deleteImage(record.encryptedImagePath))
  ])
  console.log('Deleted encrypted files from local:', encryptedFileRecords)
  */
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

  const existingRequests = await localRequests.listRequests()
  const work = existingRequests.map(async (requestId: string) => {
    console.log('[server start] Found existing request:', requestId)
    const request = await localRequests.getRequest(requestId)
    if (request !== undefined) {
      outstandingRequests.push(request)
    }
  })
  await Promise.all(work)
  console.log('[server start] Found', existingRequests?.length, 'existing requests - starting update loop...')
  await updateServer()
})

export default app
