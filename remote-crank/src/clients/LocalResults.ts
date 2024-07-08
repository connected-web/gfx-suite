import fs from 'fs'
import path from 'path'

import LocalData from './LocalData'

import { ImageResult } from './SharedTypes'

export class LocalResults extends LocalData {
  async storeResult (resultItem: ImageResult): Promise<void> {
    const resultId = resultItem?.originalRequest?.requestId ?? 'no-result-id-on-store'
    const filename = `results/${resultId}.json`
    return await this.writeJson(filename, resultItem)
  }

  async getResult (resultId: string): Promise<ImageResult | undefined> {
    const filename = `results/${resultId}.json`
    return await this.readJson(filename)
  }

  async listResults (): Promise<string[]> {
    const resultsPath = path.join(this.localDataPath, 'results')
    const fileList = fs.readdirSync(resultsPath)
    return fileList.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''))
  }

  async deleteResult (resultId: string): Promise<void> {
    const filepath = path.join(this.localDataPath, 'results', `${resultId}.json`)
    try {
      return fs.unlinkSync(filepath)
    } catch (ex) {
      const error = ex as Error
      console.info('[LocalData] Unable to delete result', { resultId, error: error.message })
    }
  }
}
