import { IModel, JsonSchemaType, JsonSchemaVersion } from 'aws-cdk-lib/aws-apigateway'

import { OpenAPIBasicModels } from '@connected-web/openapi-rest-api'

/**
 * ApiResponse
 *
 * This is a basic response model for the API to demonstrate how to create a response model.
 *
 * @returns ApiResponse
 */
export class ApiResponse extends OpenAPIBasicModels {
  static get apiResponse (): IModel {
    return OpenAPIBasicModels.modelFactory?.create('ApiResponse', {
      schema: JsonSchemaVersion.DRAFT7,
      title: 'Basic API Response',
      type: JsonSchemaType.OBJECT,
      properties: {
        statusCode: {
          type: JsonSchemaType.INTEGER,
          description: 'The HTTP status code of the response'
        },
        type: {
          type: JsonSchemaType.STRING,
          description: 'The type of the response: success, error, or warning'
        },
        message: {
          type: JsonSchemaType.STRING,
          description: 'The message content describing the response'
        }
      },
      required: ['statusCode', 'type', 'message']
    }) as IModel
  }

  static get putRequest (): IModel {
    return OpenAPIBasicModels.modelFactory?.create('PutRequest', {
      schema: JsonSchemaVersion.DRAFT7,
      title: 'Put Request Response',
      type: JsonSchemaType.OBJECT,
      properties: {
        message: {
          type: JsonSchemaType.STRING,
          description: 'The message content describing the response'
        },
        request: {
          type: JsonSchemaType.OBJECT,
          description: 'The request that was queued for processing',
          properties: {
            requestId: {
              type: JsonSchemaType.STRING,
              description: 'The unique identifier for the request'
            },
            type: {
              type: JsonSchemaType.STRING,
              description: 'The type of request'
            },
            positive: {
              type: JsonSchemaType.STRING,
              description: 'The positive image labels'
            },
            negative: {
              type: JsonSchemaType.STRING,
              description: 'The negative image labels'
            },
            width: {
              type: JsonSchemaType.INTEGER,
              description: 'The width of the image'
            },
            height: {
              type: JsonSchemaType.INTEGER,
              description: 'The height of the image'
            },
            batchSize: {
              type: JsonSchemaType.INTEGER,
              description: 'The number of images to process in a batch'
            }
          },
          required: ['requestId', 'type', 'positive', 'negative', 'width', 'height', 'batchSize']
        }
      },
      required: ['message', 'request']
    }) as IModel
  }

  static get getRequests (): IModel {
    return OpenAPIBasicModels.modelFactory?.create('GetRequests', {
      schema: JsonSchemaVersion.DRAFT7,
      title: 'Get Requests Response',
      type: JsonSchemaType.OBJECT,
      properties: {
        message: {
          type: JsonSchemaType.STRING,
          description: 'The message content describing the response'
        },
        requests: {
          type: JsonSchemaType.ARRAY,
          description: 'The list of requests that were retrieved',
          items: {
            type: JsonSchemaType.OBJECT,
            properties: {
              messageId: {
                type: JsonSchemaType.STRING,
                description: 'The unique identifier for this specific message'
              },
              receiptHandle: {
                type: JsonSchemaType.STRING,
                description: 'The unique identifier used to delete this message once handled'
              },
              requestId: {
                type: JsonSchemaType.STRING,
                description: 'The unique identifier for the original request'
              },
              type: {
                type: JsonSchemaType.STRING,
                description: 'The type of request'
              },
              positive: {
                type: JsonSchemaType.STRING,
                description: 'The positive image description'
              },
              negative: {
                type: JsonSchemaType.STRING,
                description: 'The negative image description'
              },
              width: {
                type: JsonSchemaType.INTEGER,
                description: 'The width of the image'
              },
              height: {
                type: JsonSchemaType.INTEGER,
                description: 'The height of the image'
              },
              batchSize: {
                type: JsonSchemaType.INTEGER,
                description: 'The number of images to generate in a batch'
              },
              model: {
                type: JsonSchemaType.STRING,
                description: 'The model to use for processing'
              }
            },
            required: ['receiptHandle', 'requestId', 'type', 'positive', 'negative', 'width', 'height', 'batchSize']
          }
        }
      },
      required: ['message', 'requests']
    }) as IModel
  }

  static get deleteRequests (): IModel {
    return OpenAPIBasicModels.modelFactory?.create('DeleteRequests', {
      schema: JsonSchemaVersion.DRAFT7,
      title: 'Delete Requests Response',
      type: JsonSchemaType.OBJECT,
      properties: {
        message: {
          type: JsonSchemaType.STRING,
          description: 'The message content describing the response'
        }
      },
      required: ['message']
    }) as IModel
  }
}
