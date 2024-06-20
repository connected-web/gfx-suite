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
  static get model (): IModel {
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
}
