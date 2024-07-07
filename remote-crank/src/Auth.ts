export interface ClientConfig {
  clientId: string
  clientSecret: string
  oauthTokenEndpoint: string
}

export default class Auth {
  static instance: Auth | undefined = undefined
  private readonly clientConfig: ClientConfig
  private accessToken: string | undefined = undefined
  private tokenExpiry: number | undefined = undefined

  private outstandingPromise: Promise<string> | undefined = undefined

  constructor (clientConfig: ClientConfig) {
    this.clientConfig = clientConfig

    if (Auth.instance != null) {
      return Auth.instance
    }

    Auth.instance = this
  }

  async getOAuthToken (): Promise<string> {
    const { clientId, clientSecret, oauthTokenEndpoint } = this.clientConfig
    const requestPayload = [
      'grant_type=client_credentials',
      `client_id=${clientId}`
    ].join('&')
    const requestHeaders = {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${btoa([clientId, clientSecret].join(':'))}`
    }
    const tokenResponse = await fetch(oauthTokenEndpoint, {
      method: 'POST',
      headers: requestHeaders,
      body: requestPayload
    })
    const responseData = await tokenResponse.json()
    this.accessToken = responseData?.access_token
    this.tokenExpiry = Date.now() + (responseData?.expires_in ?? 0) * 1000

    return this.accessToken ?? 'not-set'
  }

  async getLatestAccessToken (): Promise<string> {
    if (this.outstandingPromise !== undefined) {
      return await this.outstandingPromise
    }
    if (this.accessToken === undefined) {
      console.log('No access token found, fetching new one')
      this.outstandingPromise = this.getOAuthToken()
    } else if (this.tokenExpiry === undefined || this.tokenExpiry < Date.now()) {
      console.log('Access token expired, fetching new one')
      this.outstandingPromise = this.getOAuthToken()
    } else {
      return this.accessToken
    }
    const result = await this.outstandingPromise
    this.outstandingPromise = undefined
    return result
  }
}
