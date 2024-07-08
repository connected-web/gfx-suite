import fs from 'fs'
import path from 'path'

import LocalData from './LocalData'

import { ImageRequest } from './SharedTypes'

export class LocalRequests extends LocalData {
  async storeRequest (requestItem: ImageRequest): Promise<void> {
    const requestId = requestItem?.requestId ?? 'no-request-id-on-store'
    const filename = `requests/${requestId}.json`
    return await this.writeJson(filename, requestItem)
  }

  async getRequest (requestId: string): Promise<ImageRequest | undefined> {
    const filename = `requests/${requestId}.json`
    return await this.readJson(filename)
  }

  async listRequests (): Promise<string[]> {
    const requestsPath = path.join(this.localDataPath, 'requests')
    const fileList = fs.readdirSync(requestsPath)
    return fileList.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''))
  }

  async deleteRequest (requestId: string): Promise<void> {
    const filepath = path.join(this.localDataPath, 'requests', `${requestId}.json`)
    try {
      return fs.unlinkSync(filepath)
    } catch (ex) {
      const error = ex as Error
      console.info('[LocalData] Unable to delete request', { requestId, error: error.message })
    }
  }
}
