
export interface ImageRequest {
  requestId: string
  messageId: string
  type: string
  positive: string
  negative: string
  width: number
  height: number
  batchSize: number
  model?: string
  [key: string]: string | number | undefined
}

export interface ImageResult {
  originalRequest: ImageRequest
  started: Date | string
  finished: Date | string
}
