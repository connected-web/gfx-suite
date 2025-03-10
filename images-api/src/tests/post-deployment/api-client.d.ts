import type {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig
} from 'openapi-client-axios'

declare namespace Components {
  namespace Schemas {
    /**
         * Basic API Response
         */
    export interface ApiResponseModel {
      /**
             * The type of the response: success, error, or warning
             */
      type: string
      /**
             * The message content describing the response
             */
      message: string
      /**
             * The HTTP status code of the response
             */
      statusCode: number
    }
    /**
         * Basic Object
         * A basic JSON object with key value pairs
         */
    export interface BasicObjectModel {
      [name: string]: any
    }
    /**
         * Delete Requests Response
         */
    export interface DeleteRequestsModel {
      /**
             * The message content describing the response
             */
      message: string
      /**
             * The list of results for each message processed
             */
      results?: string[]
    }
    /**
         * Get Requests Response
         */
    export interface GetRequestsModel {
      /**
             * The list of requests that were retrieved
             */
      requests: Array<{
        /**
                 * The time the request was received by the server in ISO format
                 */
        requestTime?: string
        /**
                 * The negative image description
                 */
        negative: string
        /**
                 * The unique identifier for the original request
                 */
        requestId: string
        /**
                 * The width of the image
                 */
        width: number
        /**
                 * The unique identifier for this specific message
                 */
        messageId?: string
        /**
                 * The unique identifier used to delete this message once handled
                 */
        receiptHandle: string
        /**
                 * The model to use for processing
                 */
        model?: string
        /**
                 * The positive image description
                 */
        positive: string
        /**
                 * The type of request
                 */
        type: string
        /**
                 * The number of images to generate in a batch
                 */
        batchSize: number
        /**
                 * The height of the image
                 */
        height: number
      }>
      /**
             * The message content describing the response
             */
      message: string
    }
    /**
         * Get Results Response
         */
    export interface GetResultsModel {
      /**
             * The original request object
             */
      originalRequest?: {
        [key: string]: any
      }
      /**
             * The list of paths of generated files
             */
      generatedFiles?: string[]
      /**
             * The corresponding initialization vectors used to encrypt and store the generated files
             */
      initializationVectors?: string[]
      /**
             * The ISO date time string when the request was uploaded to the server
             */
      uploaded?: string
      /**
             * The ISO date time string when the request began to be processed
             */
      started?: string
      /**
             * The ISO date time string when the request finished being processed
             */
      finished?: string
      /**
             * The message content describing the response
             */
      message?: string
    }
    /**
         * List Results Response
         */
    export interface ListResultsModel {
      /**
             * The message content describing the response
             */
      message?: string
      /**
             * The list of results for the user
             */
      results?: Array<{
        /**
                 * The path to the result file
                 */
        path?: string
        /**
                 * The unique identifier for the request
                 */
        requestId?: string
        /**
                 * The date the result was generated
                 */
        dateCode?: string
      }>
    }
    /**
         * Put Request Response
         */
    export interface PutRequestModel {
      /**
             * The request that was queued for processing
             */
      request: {
        /**
                 * The time the request was received by the server in ISO format
                 */
        requestTime?: string
        /**
                 * The negative image labels
                 */
        negative: string
        /**
                 * The unique identifier for the request
                 */
        requestId: string
        /**
                 * The width of the image
                 */
        width: number
        /**
                 * The model to use for processing
                 */
        model?: string
        /**
                 * The positive image labels
                 */
        positive: string
        /**
                 * The type of request
                 */
        type: string
        /**
                 * The number of images to process in a batch
                 */
        batchSize: number
        /**
                 * The height of the image
                 */
        height: number
      }
      /**
             * The message content describing the response
             */
      message: string
    }
    /**
         * Put Results Response
         */
    export interface PutResultsModel {
      /**
             * The message content describing the response
             */
      message?: string
    }
    /**
         * User Details Response
         */
    export interface UserDetailsModel {
      /**
             * The message content describing the response
             */
      message: string
      /**
             * The user details
             */
      user: {
        /**
                 * The user's decryption key for secure data storage
                 */
        decryptionKey: string
        /**
                 * The unique identifier for the user
                 */
        userId: string
      }
    }
  }
}
declare namespace Paths {
  namespace DeleteRequests {
    namespace Responses {
      export type $200 = /* Delete Requests Response */ Components.Schemas.DeleteRequestsModel
    }
  }
  namespace GetOpenAPISpec {
    namespace Responses {
      export type $200 = /**
             * Basic Object
             * A basic JSON object with key value pairs
             */
            Components.Schemas.BasicObjectModel
    }
  }
  namespace GetRequests {
    namespace Responses {
      export type $200 = /* Get Requests Response */ Components.Schemas.GetRequestsModel
    }
  }
  namespace GetResults {
    namespace Parameters {
      export type DateCode = string
      export type RequestId = string
    }
    export interface PathParameters {
      dateCode: Parameters.DateCode
      requestId: Parameters.RequestId
    }
    namespace Responses {
      export type $200 = /* Get Results Response */ Components.Schemas.GetResultsModel
    }
  }
  namespace GetStatus {
    namespace Responses {
      export type $200 = /* Basic API Response */ Components.Schemas.ApiResponseModel
    }
  }
  namespace ListRequestsForCurrentUser {
    namespace Parameters {
      export type SearchPrefix = string
    }
    export interface PathParameters {
      searchPrefix: Parameters.SearchPrefix
    }
    namespace Responses {
      export type $200 = /* List Results Response */ Components.Schemas.ListResultsModel
    }
  }
  namespace PutRequest {
    namespace Parameters {
      export type RequestId = string
    }
    export interface PathParameters {
      requestId: Parameters.RequestId
    }
    namespace Responses {
      export type $200 = /* Put Request Response */ Components.Schemas.PutRequestModel
    }
  }
  namespace PutResults {
    namespace Responses {
      export type $200 = /* Put Results Response */ Components.Schemas.PutResultsModel
    }
  }
  namespace Request$RequestId {
    namespace Options {
      namespace Parameters {
        export type RequestId = string
      }
      export interface PathParameters {
        requestId: Parameters.RequestId
      }
    }
  }
  namespace Requests$SearchPrefix {
    namespace Options {
      namespace Parameters {
        export type SearchPrefix = string
      }
      export interface PathParameters {
        searchPrefix: Parameters.SearchPrefix
      }
    }
  }
  namespace Results$DateCode {
    namespace Options {
      namespace Parameters {
        export type DateCode = string
      }
      export interface PathParameters {
        dateCode: Parameters.DateCode
      }
    }
  }
  namespace Results$DateCode$RequestId {
    namespace Options {
      namespace Parameters {
        export type DateCode = string
        export type RequestId = string
      }
      export interface PathParameters {
        dateCode: Parameters.DateCode
        requestId: Parameters.RequestId
      }
    }
  }
  namespace User$UserId {
    namespace Options {
      namespace Parameters {
        export type UserId = string
      }
      export interface PathParameters {
        userId: Parameters.UserId
      }
    }
  }
  namespace UserByUserId {
    namespace Parameters {
      export type UserId = string
    }
    export interface PathParameters {
      userId: Parameters.UserId
    }
    namespace Responses {
      export type $200 = /* User Details Response */ Components.Schemas.UserDetailsModel
    }
  }
  namespace UserDetails {
    namespace Responses {
      export type $200 = /* User Details Response */ Components.Schemas.UserDetailsModel
    }
  }
}

export interface OperationMethods {
  /**
   * userByUserId
   */
  'userByUserId': (
    parameters: Parameters<Paths.UserByUserId.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.UserByUserId.Responses.$200>
  /**
   * putResults
   */
  'putResults': (
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.PutResults.Responses.$200>
  /**
   * getResults
   */
  'getResults': (
    parameters: Parameters<Paths.GetResults.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.GetResults.Responses.$200>
  /**
   * listRequestsForCurrentUser
   */
  'listRequestsForCurrentUser': (
    parameters: Parameters<Paths.ListRequestsForCurrentUser.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.ListRequestsForCurrentUser.Responses.$200>
  /**
   * getRequests
   */
  'getRequests': (
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.GetRequests.Responses.$200>
  /**
   * deleteRequests
   */
  'deleteRequests': (
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.DeleteRequests.Responses.$200>
  /**
   * getOpenAPISpec
   */
  'getOpenAPISpec': (
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.GetOpenAPISpec.Responses.$200>
  /**
   * putRequest
   */
  'putRequest': (
    parameters: Parameters<Paths.PutRequest.PathParameters>,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.PutRequest.Responses.$200>
  /**
   * getStatus
   */
  'getStatus': (
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.GetStatus.Responses.$200>
  /**
   * userDetails
   */
  'userDetails': (
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.UserDetails.Responses.$200>
}

export interface PathsDictionary {
  ['/user/{userId}']: {
    /**
     * userByUserId
     */
    'get': (
      parameters: Parameters<Paths.UserByUserId.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.UserByUserId.Responses.$200>
  }
  ['/results']: {
    /**
     * putResults
     */
    'put': (
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.PutResults.Responses.$200>
  }
  ['/request']: {
  }
  ['/results/{dateCode}/{requestId}']: {
    /**
     * getResults
     */
    'get': (
      parameters: Parameters<Paths.GetResults.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.GetResults.Responses.$200>
  }
  ['/requests/{searchPrefix}']: {
    /**
     * listRequestsForCurrentUser
     */
    'get': (
      parameters: Parameters<Paths.ListRequestsForCurrentUser.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.ListRequestsForCurrentUser.Responses.$200>
  }
  ['/requests']: {
    /**
     * getRequests
     */
    'get': (
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.GetRequests.Responses.$200>
    /**
     * deleteRequests
     */
    'delete': (
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.DeleteRequests.Responses.$200>
  }
  ['/openapi']: {
    /**
     * getOpenAPISpec
     */
    'get': (
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.GetOpenAPISpec.Responses.$200>
  }
  ['/']: {
  }
  ['/request/{requestId}']: {
    /**
     * putRequest
     */
    'put': (
      parameters: Parameters<Paths.PutRequest.PathParameters>,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.PutRequest.Responses.$200>
  }
  ['/status']: {
    /**
     * getStatus
     */
    'get': (
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.GetStatus.Responses.$200>
  }
  ['/user/details']: {
    /**
     * userDetails
     */
    'get': (
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig
    ) => OperationResponse<Paths.UserDetails.Responses.$200>
  }
  ['/user']: {
  }
  ['/results/{dateCode}']: {
  }
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>
