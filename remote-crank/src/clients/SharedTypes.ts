
export interface ImageRequest {
  receiptHandle: string
  messageId: string
  requestId: string
  userId: string
  type: string
  positive: string
  negative: string
  lists: {
    [key: string]: string[]
  }
  width: number
  height: number
  batchSize: number
  model?: string
}

export interface ImageResult {
  originalRequest: ImageRequest
  started: Date | string
  finished: Date | string
  generatedFiles: string[]
  initializationVectors: string[]
}

export type FileList = string[]

export interface ResultsIndex { [key: string]: FileList }
