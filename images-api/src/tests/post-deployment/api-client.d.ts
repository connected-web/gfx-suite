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
  }
}
declare namespace Paths {
  namespace DeleteRequests {
    namespace Responses {
      export type $200 = /* Basic API Response */ Components.Schemas.ApiResponseModel
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
      export type $200 = /* Basic API Response */ Components.Schemas.ApiResponseModel
    }
  }
  namespace GetStatus {
    namespace Responses {
      export type $200 = /* Basic API Response */ Components.Schemas.ApiResponseModel
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
      export type $200 = /* Basic API Response */ Components.Schemas.ApiResponseModel
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
}

export interface OperationMethods {
  /**
   * getStatus
   */
  'getStatus': (
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.GetStatus.Responses.$200>
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
}

export interface PathsDictionary {
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
  ['/request']: {
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
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>
