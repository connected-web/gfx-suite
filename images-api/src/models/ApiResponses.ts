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
            },
            model: {
              type: JsonSchemaType.STRING,
              description: 'The model to use for processing'
            },
            requestTime: {
              type: JsonSchemaType.STRING,
              description: 'The time the request was received by the server in ISO format'
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
              },
              requestTime: {
                type: JsonSchemaType.STRING,
                description: 'The time the request was received by the server in ISO format'
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
        },
        results: {
          type: JsonSchemaType.ARRAY,
          description: 'The list of results for each message processed',
          items: {
            type: JsonSchemaType.STRING
          }
        }
      },
      required: ['message']
    }) as IModel
  }

  static get userDetails (): IModel {
    return OpenAPIBasicModels.modelFactory?.create('UserDetails', {
      schema: JsonSchemaVersion.DRAFT7,
      title: 'User Details Response',
      type: JsonSchemaType.OBJECT,
      properties: {
        message: {
          type: JsonSchemaType.STRING,
          description: 'The message content describing the response'
        },
        user: {
          type: JsonSchemaType.OBJECT,
          description: 'The user details',
          properties: {
            userId: {
              type: JsonSchemaType.STRING,
              description: 'The unique identifier for the user'
            },
            decryptionKey: {
              type: JsonSchemaType.STRING,
              description: 'The user\'s decryption key for secure data storage'
            }
          },
          required: ['userId', 'decryptionKey']
        }
      },
      required: ['message', 'user']
    }) as IModel
  }

  static get putResults (): IModel {
    return OpenAPIBasicModels.modelFactory?.create('PutResults', {
      schema: JsonSchemaVersion.DRAFT7,
      title: 'Put Results Response',
      type: JsonSchemaType.OBJECT,
      properties: {
        message: {
          type: JsonSchemaType.STRING,
          description: 'The message content describing the response'
        }
      }
    }) as IModel
  }

  static get getResults (): IModel {
    return OpenAPIBasicModels.modelFactory?.create('GetResults', {
      schema: JsonSchemaVersion.DRAFT7,
      title: 'Get Results Response',
      type: JsonSchemaType.OBJECT,
      properties: {
        message: {
          type: JsonSchemaType.STRING,
          description: 'The message content describing the response'
        },
        originalRequest: {
          type: JsonSchemaType.OBJECT,
          description: 'The original request object'
        },
        started: {
          type: JsonSchemaType.STRING,
          description: 'The ISO date time string when the request began to be processed'
        },
        finished: {
          type: JsonSchemaType.STRING,
          description: 'The ISO date time string when the request finished being processed'
        },
        uploaded: {
          type: JsonSchemaType.STRING,
          description: 'The ISO date time string when the request was uploaded to the server'
        },
        generatedFiles: {
          type: JsonSchemaType.ARRAY,
          description: 'The list of paths of generated files',
          items: {
            type: JsonSchemaType.STRING
          }
        },
        initializationVectors: {
          type: JsonSchemaType.ARRAY,
          description: 'The corresponding initialization vectors used to encrypt and store the generated files',
          items: {
            type: JsonSchemaType.STRING
          }
        }
      }
    }) as IModel
  }

  static get listResults (): IModel {
    return OpenAPIBasicModels.modelFactory?.create('ListResults', {
      schema: JsonSchemaVersion.DRAFT7,
      title: 'List Results Response',
      type: JsonSchemaType.OBJECT,
      properties: {
        message: {
          type: JsonSchemaType.STRING,
          description: 'The message content describing the response'
        },
        results: {
          type: JsonSchemaType.ARRAY,
          description: 'The list of results for the user',
          items: {
            type: JsonSchemaType.OBJECT,
            properties: {
              path: {
                type: JsonSchemaType.STRING,
                description: 'The path to the result file'
              },
              dateCode: {
                type: JsonSchemaType.STRING,
                description: 'The date the result was generated'
              },
              requestId: {
                type: JsonSchemaType.STRING,
                description: 'The unique identifier for the request'
              }
            }
          }
        }
      }
    }) as IModel
  }
}

/**
 *
  started: Date | string
  finished: Date | string
  uploaded: Date | string
  generatedFiles: string[]
  initializationVectors: string[]
 */
