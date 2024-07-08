import Auth from '../Auth'

import { ImageRequest } from './SharedTypes'

export default class ImagesApiClient {
  baseUrl = 'https://images.dev.connected-web.services'

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
}
