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
         * Basic Object
         * A basic JSON object with key value pairs
         */
    export interface BasicObjectModel {
      [name: string]: any
    }
    /**
         * Status
         */
    export interface StatusResponseModel {
      /**
             * The UTC timestamp representing the last time the server was updated
             */
      deploymentTime: string
    }
  }
}
declare namespace Paths {
  namespace GetOpenAPISpec {
    namespace Responses {
      export type $200 = /**
             * Basic Object
             * A basic JSON object with key value pairs
             */
            Components.Schemas.BasicObjectModel
    }
  }
  namespace GetStatus {
    namespace Responses {
      export type $200 = /* Status */ Components.Schemas.StatusResponseModel
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
   * getOpenAPISpec
   */
  'getOpenAPISpec': (
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig
  ) => OperationResponse<Paths.GetOpenAPISpec.Responses.$200>
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
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>
