import fs from 'fs'
import path from 'path'

export default class LocalData {
  localDataPath: string
  constructor (localDataPath: string) {
    this.localDataPath = localDataPath
  }

  safeMakeDirectory (filepath: string): void {
    try {
      const dirpath = path.dirname(filepath)
      if (!fs.existsSync(dirpath)) {
        fs.mkdirSync(dirpath, { recursive: true })
      }
    } catch (ex) {
      const error = ex as Error
      console.error(`Error creating directory: ${error.message}`)
    }
  }

  async readJson (filename: string): Promise<any> {
    const filepath = path.join(this.localDataPath, filename)
    try {
      const body = fs.readFileSync(filepath, 'utf8')
      const data = JSON.parse(body?.toString())
      return data
    } catch (ex) {
      const error = ex as Error
      console.log('[readJson] Unable to read file', { filename, error: error.message })
    }
  }

  async writeJson (filename: string, data: any): Promise<void> {
    const filepath = path.join(this.localDataPath, filename)
    try {
      this.safeMakeDirectory(filepath)
      fs.writeFileSync(filepath, JSON.stringify(data), 'utf8')
    } catch (ex) {
      const error = ex as Error
      console.log('[writeJson] Unable to write file', { filename, error: error.message })
    }
  }
}
