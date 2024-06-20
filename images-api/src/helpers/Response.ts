import { APIGatewayProxyResult } from 'aws-lambda'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, content-type',
  'Access-Control-Allow-Methods': '*'
}

export function lambdaResponse (statusCode: number, body: string = ''): APIGatewayProxyResult {
  return {
    statusCode,
    body,
    headers: {
      'content-type': 'application/json',
      ...corsHeaders
    }
  }
}

export const httpStatusCodes = {
  success: 200,
  created: 201,
  accepted: 202,
  noContent: 204,
  movedPermanently: 301,
  found: 302,
  seeOther: 303,
  notModified: 304,
  temporaryRedirect: 307,
  permanentRedirect: 308,
  clientError: 400,
  clientUnauthorized: 401,
  clientPaymentRequired: 402,
  clientForbidden: 403,
  notFound: 404,
  methodNotAllowed: 405,
  notAcceptable: 406,
  proxyAuthenticationRequired: 407,
  requestTimeout: 408,
  conflict: 409,
  gone: 410,
  lengthRequired: 411,
  preconditionFailed: 412,
  payloadTooLarge: 413,
  uriTooLong: 414,
  unsupportedMediaType: 415,
  rangeNotSatisfiable: 416,
  expectationFailed: 417,
  teapot: 418, // I'm a teapot (April Fools' joke)
  unprocessableEntity: 422,
  locked: 423,
  failedDependency: 424,
  tooEarly: 425,
  upgradeRequired: 426,
  preconditionRequired: 428,
  tooManyRequests: 429,
  requestHeaderFieldsTooLarge: 431,
  unavailableForLegalReasons: 451,
  serverError: 500,
  notImplemented: 501,
  badGateway: 502,
  serviceUnavailable: 503,
  gatewayTimeout: 504,
  httpVersionNotSupported: 505,
  variantAlsoNegotiates: 506,
  insufficientStorage: 507,
  loopDetected: 508,
  notExtended: 510,
  networkAuthenticationRequired: 511
}
