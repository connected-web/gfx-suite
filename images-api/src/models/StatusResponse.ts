import { OpenAPIBasicModels } from '@connected-web/openapi-rest-api'
import { JsonSchemaType, JsonSchemaVersion, IModel } from 'aws-cdk-lib/aws-apigateway'

export default class StatusResponse extends OpenAPIBasicModels {
  static get model (): IModel {
    return OpenAPIBasicModels.modelFactory?.create('StatusResponse', {
      schema: JsonSchemaVersion.DRAFT7,
      title: 'Status',
      type: JsonSchemaType.OBJECT,
      properties: {
        deploymentTime: {
          type: JsonSchemaType.STRING,
          description: 'The UTC timestamp representing the last time the server was updated'
        }
      },
      required: ['deploymentTime']
    }) as IModel
  }
}
