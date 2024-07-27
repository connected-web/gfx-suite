import { ImageRequest } from '../clients/ImagesApi'

export class RequestHistory {
  private history: ImageRequest[] = []
  private readonly maxHistoryLength: number

  constructor (maxHistoryLength: number) {
    this.maxHistoryLength = maxHistoryLength
    // load from local storage
    try {
      const history = JSON.parse(localStorage.getItem('requestHistory') ?? '[]')
      if (Array.isArray(history)) {
        this.history = history
      } else {
        console.error('Unexpected request history in local storage')
      }
    } catch (ex) {
      const error = ex as Error
      console.error('Failed to load request history from local storage:', error?.message)
    }
  }

  public add (request: ImageRequest): ImageRequest[] {
    if (this.history.some((p) => p?.requestId === request?.requestId)) {
      this.history = this.history.filter((p) => p?.requestId !== request?.requestId)
    }
    this.history.push(request)
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift()
    }
    // save to local storage
    localStorage.setItem('requestHistory', JSON.stringify(this.history))

    return this.history
  }

  public getHistory (): ImageRequest[] {
    return this.history
  }

  public cleanHistory (): void {
    this.history = []
    // clear local storage
    localStorage.removeItem('requestHistory')
  }
}

const singleton: RequestHistory = new RequestHistory(10)

export default singleton
