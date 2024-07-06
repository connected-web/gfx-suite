export interface ApiResponseType {
  statusCode: number
  type: string
  message: string
}

export interface ImageRequestType {
  requestId: string
  type: string
  positive: string[]
  negative: string[]
  width: number
  height: number
  batchSize: number
}

export interface ImageRequestMessageType extends ImageRequestType {
  messageId: string
  receiptHandle: string
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
}
