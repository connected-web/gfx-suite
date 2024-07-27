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
  generatedFiles: string[]
  initializationVectors: string[]
}

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

    return await response.json()
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
