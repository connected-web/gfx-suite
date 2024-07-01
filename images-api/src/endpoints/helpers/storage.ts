import * as AWS from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'

const s3 = new AWS.S3()

export type PutJsonResult = PromiseResult<AWS.S3.PutObjectOutput, AWS.AWSError>
type GetJsonResult = PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>
type ListObjectsResult = PromiseResult<AWS.S3.ListObjectsV2Output, AWS.AWSError>

export default class Storage {
  bucketName: string
  s3: AWS.S3

  constructor (bucketName: string) {
    this.bucketName = bucketName
    this.s3 = new AWS.S3()
  }

  async putJson (keyPath: string, jsonData: any, metadata: any = {}): Promise<PutJsonResult> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: keyPath,
      Body: JSON.stringify(jsonData),
      ContentType: 'application/json',
      Metadata: metadata
    }

    return await s3.putObject(params).promise()
  }

  async getJson (keyPath: string): Promise<any> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.bucketName,
      Key: keyPath
    }

    const getObjectResult: GetJsonResult = await s3.getObject(params).promise()

    let bodyData: string = ''
    try {
      if (getObjectResult.Body !== undefined) {
        bodyData = (getObjectResult.Body as Buffer).toString('utf-8')
        return JSON.parse(bodyData)
      }
    } catch (ex) {
      const error = ex as Error
      throw new Error(`Unable to parse S3 object as JSON; Key: ${keyPath}, Error: ${error.message}, Body: (${String(bodyData)})`)
    }

    throw new Error(`Failed to retrieve JSON from Key: ${keyPath}; no body returned from S3 object`)
  }

  async listJsonObjects (prefix: string, continuationToken?: string): Promise<AWS.S3.ObjectList> {
    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: this.bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken
    }

    const listObjectsResult: ListObjectsResult = await s3.listObjectsV2(params).promise()

    const jsonObjects = listObjectsResult.Contents
    if (Array.isArray(jsonObjects)) {
      return jsonObjects.filter(obj => obj.Key?.includes('.json') ?? false)
    }

    return []
  }
}
