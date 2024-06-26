export interface CookiesByName { [key: string]: string }

export interface DecodedAccessToken {
  'sub': string
  'cognito:groups': string[]
  'iss': string
  'version': number
  'client_id': string
  'origin_jti': string
  'token_use': 'access'
  'scope': string
  'auth_time': number
  'exp': number
  'iat': number
  'jti': string
  'username': string
}

export interface IdTokenIdentity {
  'userId': string
  'providerName': string
  'providerType': string
  'issuer': string
  'primary': string
  'dateCreated': string
}

export interface DecodedIdToken {
  'at_hash': string
  'sub': string
  'cognito:groups': string[]
  'email_verified': boolean
  'iss': string
  'cognito:username': string
  'nonce': string
  'origin_jti': string
  'aud': string
  'identities': IdTokenIdentity[]
  'token_use': 'id'
  'auth_time': number
  'exp': number
  'iat': number
  'jti': string
  'email': string
  'name': string
  'family_name': string
}

export interface CollatedAuthInfo {
  'accessToken': DecodedAccessToken
  'idToken': DecodedIdToken
  'refreshToken': string
  'tokenScopesString': string[]
  'LastAuthUser': string
}
