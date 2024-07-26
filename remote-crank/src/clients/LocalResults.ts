import fs from 'fs'
import path from 'path'

import LocalData from './LocalData'

import { ImageResult, ResultsIndex } from './SharedTypes'

/**
 * Local Results are organised stored in the results folder, and organised by date code (yyyy-mm)/{requestId}.
 */
export class LocalResults extends LocalData {
  async storeResult (resultItem: ImageResult): Promise<void> {
    const resultId = resultItem?.originalRequest?.requestId ?? 'no-result-id-on-store'
    const datecode = (resultItem.started as Date)?.toISOString().substring(0, 7)
    const filename = `results/${datecode}/${resultId}.json`
    return await this.writeJson(filename, resultItem)
  }

  async getResult (datecode: string, resultId: string): Promise<ImageResult | undefined> {
    const filename = `results/${datecode}/${resultId}.json`
    return await this.readJson(filename)
  }

  async listDateCodes (): Promise<string[]> {
    const resultsPath = path.join(this.localDataPath, 'results')
    const fileList = fs.readdirSync(resultsPath)
    return fileList.filter(folder => folder.match(/\d{4}-\d{2}/))
  }

  async listResults (datecode: string): Promise<string[]> {
    const resultsPath = path.join(this.localDataPath, 'results', datecode)
    const fileList = fs.readdirSync(resultsPath)
    return fileList.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''))
  }

  async listAllResults (): Promise<ResultsIndex> {
    const resultDateCodes = await this.listDateCodes()
    const resultsList = await Promise.all(resultDateCodes.map(async (datecode: string) => {
      return {
        datecode,
        results: await this.listResults(datecode)
      }
    }))
    return resultsList.reduce<ResultsIndex>((acc: ResultsIndex, item) => {
      acc[item.datecode] = item.results
      return acc
    }, {})
  }

  async deleteResult (datecode: string, resultId: string): Promise<void> {
    const filepath = path.join(this.localDataPath, 'results', datecode, `${resultId}.json`)
    try {
      return fs.unlinkSync(filepath)
    } catch (ex) {
      const error = ex as Error
      console.info('[LocalData] Unable to delete result', { resultId, error: error.message })
    }
  }
}
