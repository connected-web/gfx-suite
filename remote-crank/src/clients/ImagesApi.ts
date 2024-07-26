import Auth from '../Auth'

import { ImageRequest, ImageResult } from './SharedTypes'

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

  async deleteRequests (receiptHandles: string[]): Promise<any> {
    const endpointUrl = `${this.baseUrl}/requests`
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const payload = receiptHandles.map(receiptHandle => {
      return {
        receiptHandle
      }
    })
    const response = await fetch(endpointUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${String(accessToken)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    return await response.json()
  }

  async getUserDetailsByUserId (userId: string): Promise<any> {
    const endpointUrl = `${this.baseUrl}/user/${userId}`
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const response = await fetch(endpointUrl, {
      headers: {
        Authorization: `Bearer ${String(accessToken)}`
      }
    })

    return await response.json()
  }

  async putResults (results: ImageResult): Promise<any> {
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
    console.log('getResults', { endpointUrl, dateCode, requestId })
    const accessToken = await Auth.instance?.getLatestAccessToken()
    const response = await fetch(endpointUrl, {
      headers: {
        Authorization: `Bearer ${String(accessToken)}`
      }
    })

    return await response.json()
  }
}
