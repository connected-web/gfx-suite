export class PromptHistory {
  private history: string[] = []
  private maxHistoryLength: number

  constructor (maxHistoryLength: number) {
    this.maxHistoryLength = maxHistoryLength
    // load from local storage
    try {
      const history = JSON.parse(localStorage.getItem('promptHistory') ?? '[]')
      if (Array.isArray(history)) {
        this.history = history
      } else {
        console.error('Unexpected prompt history in local storage')
      }
    } catch (ex) {
      const error = ex as Error
      console.error('Failed to load prompt history from local storage:', error?.message)
    }
  }

  public add (prompt: string): void {
    if (this.history.some((p) => p === prompt)) {
      this.history = this.history.filter((p) => p !== prompt)
    }
    this.history.push(prompt)
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift()
    }
    // save to local storage
    localStorage.setItem('promptHistory', JSON.stringify(this.history))
  }

  public getHistory (): string[] {
    return this.history
  }
}

const singleton: PromptHistory = new PromptHistory(10)

export default singleton