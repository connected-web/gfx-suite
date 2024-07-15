export interface ApiResponseType {
  statusCode: number
  type: string
  message: string
}

export interface ImageRequestType {
  userId: string
  requestId: string
  type: string
  positive: string
  negative: string
  width: number
  height: number
  batchSize: number
  model?: string
  requestTime?: Date | string
  [key: string]: string | number | undefined | Date
}

export interface ImageRequestMessageType extends ImageRequestType {
  messageId: string
  receiptHandle: string
}

export interface ImageResultsType {
  originalRequest: ImageRequestType
  started: Date | string
  finished: Date | string
  uploaded: Date | string
  generatedFiles: string[]
  initializationVectors: string[]
}

export interface PutRequestResponseType {
  message: string
  request: ImageRequestType
}

export interface GetRequestResponseType {
  message: string
  requests: ImageRequestMessageType[]
}

export interface DeleteRequestResponseType {
  message: string
  results: string[]
}
