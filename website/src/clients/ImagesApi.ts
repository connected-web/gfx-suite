import Auth from '../Auth'

export interface ImageRequest {
  requestId: string
  dateCode: string
  type: string
  positive: string
  negative: string
  width: number
  height: number
  batchSize: number
  model?: string
  [key: string]: string | number | undefined
}

export interface ImageResults {
  originalRequest: ImageRequest
  started: Date | string
  finished: Date | string
  uploaded: Date | string
  lastReviewed?: Date | string
  generatedFiles: string[]
  initializationVectors: string[]
}

const requestsCache: { [key: string]: any } = {}

export class ImageMetadataCache {
  private cache: { [key: string]: any } = {}

  set (key: string, value: any): void {
    this.cache[key] = value
  }

  get (key: string): any {
    return this.cache[key]
  }
}

export const imageMetadataCache = new ImageMetadataCache()

export default class ImagesApiClient {
  baseUrl = 'https://images.prod.connected-web.services'

  async getStatus (): Promise<any> {
    const endpointUrl = `${this.baseUrl}/status`
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const response = await fetch(endpointUrl, {
      headers: {
        Authorization: `Bearer ${String(accessToken)}`
      }
    })

    return await response.json()
  }

  async getRequests (): Promise<any> {
    const endpointUrl = `${this.baseUrl}/requests`
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const response = await fetch(endpointUrl, {
      headers: {
        Authorization: `Bearer ${String(accessToken)}`
      }
    })

    return await response.json()
  }

  async listRequestsForCurrentUser (searchPrefix: string): Promise<any> {
    if (requestsCache[searchPrefix] !== undefined) {
      return await Promise.resolve(requestsCache[searchPrefix])
    }

    const worker = async (): Promise<any> => {
      const endpointUrl = `${this.baseUrl}/requests/${searchPrefix}`
      const accessToken = await Auth.instance?.getLatestAccessToken()
      const response = await fetch(endpointUrl, {
        headers: {
          Authorization: `Bearer ${String(accessToken)}`
        }
      })

      return await response.json()
    }

    const future = worker()
    requestsCache[searchPrefix] = future
    return await future
  }

  async putRequest (requestId: string, requestItem: ImageRequest): Promise<any> {
    const endpointUrl = `${this.baseUrl}/request/${requestId}`
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const response = await fetch(endpointUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${String(accessToken)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestItem)
    })

    return await response.json()
  }

  async deleteRequest (receiptHandle: string): Promise<any> {
    const endpointUrl = `${this.baseUrl}/requests`
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const response = await fetch(endpointUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${String(accessToken)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ receiptHandle }])
    })

    return await response.json()
  }

  async putResults (results: ImageResults): Promise<any> {
    const endpointUrl = `${this.baseUrl}/results`
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const response = await fetch(endpointUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${String(accessToken)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(results)
    })

    return await response.json()
  }

  async getResults (dateCode: string, requestId: string): Promise<any> {
    const endpointUrl = `${this.baseUrl}/results/${dateCode}/${requestId}`
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const response = await fetch(endpointUrl, {
      headers: {
        Authorization: `Bearer ${String(accessToken)}`
      }
    })

    const results = await response.json()

    imageMetadataCache.set(`${dateCode}/${requestId}`, results)

    return results
  }

  async getUserDetails (): Promise<any> {
    const endpointUrl = `${this.baseUrl}/user/details`
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const response = await fetch(endpointUrl, {
      headers: {
        Authorization: `Bearer ${String(accessToken)}`
      }
    })

    return await response.json()
  }
}
