
export interface ImageRequest {
  receiptHandle: string
  requestId: string
  messageId: string
  type: string
  positive: string
  negative: string
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
}

export type FileList = string[]

export type ResultsIndex = { [key: string]: FileList }