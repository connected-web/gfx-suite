import * as oauth from 'oauth4webapi'
import { DecodedAccessToken } from './AuthInterfaces'
import { LocalStorage } from './LocalStorage'
import { Logger } from './Logger'
import { OAuthClientOptions } from './OAuthClientOptions'
import { atobUrlSafe } from './helpers/base64url'
import { decodeToken } from './helpers/decodeToken'
import { generateNonce } from './helpers/generateNonce'

/**
 * The OAuth client.
 *
 * This class is a wrapper around the oauth4webapi networking library.
 *
 * Key methods:
 * - {@link initialize}
 * - {@link authorize}
 * - {@link handleCodeResponse}
 * - {@link refreshAccessToken}
 * - {@link userInfo}
 * - {@link logout}
 */
export class OAuthClient {
  private readonly logger: Logger = new Logger('OAuthClient', Logger.LOG_LEVELS.error)
  private readonly _client: oauth.Client
  private readonly _issuer: URL
  private readonly _scope: string
  private readonly _storage: LocalStorage
  private readonly _redirectUri: string
  private readonly _postLogoutRedirectUri: string
  private readonly _useLocalLoginRedirectUrl: boolean
  private _authorizationServer?: oauth.AuthorizationServer
  private _updatingAuthorizationServer: Promise<void> | undefined

  constructor (options: OAuthClientOptions) {
    const logLevelOverride = localStorage.getItem('OAuthClient::LogLevel')
    if (typeof logLevelOverride === 'string' && logLevelOverride !== '') {
      console.log('Change OAuthClient log level to L', logLevelOverride, { logLevels: Logger.LOG_LEVELS })
      this.logger.changeLogLevel(logLevelOverride)
    }
    this.logger.debug('OAuthClient constructor', { options })
    this._issuer = new URL(options.url)
    this._client = {
      client_id: options.clientId,
      token_endpoint_auth_method:
        options.tokenEndpointAuthMethod ?? 'none'
    }
    this._scope =
      typeof options.scopes === 'string'
        ? options.scopes
        : options.scopes?.join(' ') ?? ''
    this._storage = options.storage ?? new LocalStorage('oauth')
    this._redirectUri = options.redirectUri ?? document.location.origin
    this._postLogoutRedirectUri =
      options.postLogoutRedirectUri ?? document.location.origin
    this._useLocalLoginRedirectUrl = options.useLocalLoginRedirectUrl ?? false
  }

  private get _codeVerifier (): string | undefined | null {
    return this._storage.getEncrypted('code_verifier')
  }

  private set _codeVerifier (value) {
    this._storage.setEncrypted('code_verifier', value)
  }

  private get _refreshToken (): string | undefined | null {
    return this._storage.getEncrypted('refresh_token')
  }

  private set _refreshToken (value) {
    this._storage.setEncrypted('refresh_token', value)
  }

  private get _accessToken (): string | undefined | null {
    return this._storage.getEncrypted('access_token')
  }

  private set _accessToken (value) {
    this._storage.setEncrypted('access_token', value)
  }

  private get _idToken (): string | undefined | null {
    return this._storage.getEncrypted('id_token')
  }

  private set _idToken (value) {
    this._storage.setEncrypted('id_token', value)
  }

  private get _localPostLoginRedirectUri (): string | undefined | null {
    return this._storage.getEncrypted('post_login_redirect_uri')
  }

  private set _localPostLoginRedirectUri (value) {
    this._storage.setEncrypted('post_login_redirect_uri', value)
  }

  /**
   * Initializes the client and tries to refresh the token if a refresh token is available, see {@link refreshAccessToken}.
   * or handle the code response if a code verifier is available, see {@link handleCodeResponse}.
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * ```
   */
  public async initialize (): Promise<string | boolean> {
    const now = new Date()
    const expiryTime = this.expiryTime
    this.logger.info('Initialize', { now, expiryTime })
    const noExpiry = expiryTime == null
    const expired = expiryTime != null && now > expiryTime
    const urlParams = new URLSearchParams(window.location.search)
    if (noExpiry || expired) {
      await this.updateAuthorizationServer()
      if (typeof this._refreshToken === 'string' && this._refreshToken !== '') {
        this.logger.info('No token or token expired; refresh token available')
        return await this.refreshAccessToken()
      }
      if (typeof this._codeVerifier === 'string' && this._codeVerifier !== '') {
        this.logger.info('No token; processing response code')
        return await this.handleCodeResponse(urlParams)
      }
    }
    const accessToken = this.accessToken
    if (accessToken === undefined) {
      return false
    } else if (typeof accessToken === 'string') {
      this.logger.info('Existing token valid:', { noExpiry, expired, accessToken, decoded: this.decodedAccessToken })
      this.removeResponseCodeFromURL(urlParams)
      return await Promise.resolve(accessToken)
    } else {
      return false
    }
  }

  /**
   * Update the authorization server configuration.
   *
   * This method is called automatically by {@link initialize} and {@link authorize}.
   */
  public async updateAuthorizationServer (): Promise<void> {
    if (this._updatingAuthorizationServer != null) {
      return await this._updatingAuthorizationServer
    }
    this._updatingAuthorizationServer = new Promise((resolve, reject) => {
      this.makeAndProcessDiscoveryRequest()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this._updatingAuthorizationServer = undefined
        })
    })
    return await this._updatingAuthorizationServer
  }

  /**
   * Make and process the discovery request,
   */
  private async makeAndProcessDiscoveryRequest (): Promise<void> {
    try {
      this.logger.info('Updating authorization server details')
      const discoveryResult = await oauth.discoveryRequest(this._issuer)
      const authorizationServerDetails = await oauth.processDiscoveryResponse(this._issuer, discoveryResult)
      this.logger.info('Authorization server details:', { authorizationServerDetails })
      this._authorizationServer = authorizationServerDetails
    } catch (ex) {
      const error = ex as Error
      this.logger.error('Failed to update authorization server details:', error.message, { error })
    }
  }

  /**
   * Authorize the application redirecting the client to the authorization server.
   *
   * This metod will redirect the user to a new website for authorization.
   *
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * await client.authorize()
   * ```
   */
  public async authorize (): Promise<void> {
    await this.updateAuthorizationServer()
    this._codeVerifier = oauth.generateRandomCodeVerifier()
    const codeChallenge = await oauth.calculatePKCECodeChallenge(this._codeVerifier)
    const authorizationUrl = new URL(
      this._authorizationServer?.authorization_endpoint ??
      `${String(this._issuer.toString())}/oauth2/authorize`
    )

    this._storage.set('nonce', generateNonce())

    if (this._useLocalLoginRedirectUrl) {
      this._localPostLoginRedirectUri = document.location.toString()
    }

    authorizationUrl.searchParams.set('client_id', this._client.client_id)
    authorizationUrl.searchParams.set('code_challenge', codeChallenge)
    authorizationUrl.searchParams.set('code_challenge_method', 'S256')
    authorizationUrl.searchParams.set('redirect_uri', `${this._redirectUri}`)
    authorizationUrl.searchParams.set('response_type', 'code')
    authorizationUrl.searchParams.set('scope', this._scope)
    authorizationUrl.searchParams.set('nonce', this._storage.get('nonce') as string)
    document.location.replace(authorizationUrl.toString())
  }

  /**
   * Handle the authorization code response.
   * @param urlParams - The URL parameters.
   */
  protected async handleCodeResponse (urlParams: URLSearchParams): Promise<string | boolean> {
    if (this._authorizationServer == null) {
      await this.updateAuthorizationServer()
    }
    if (typeof this._codeVerifier !== 'string' || this._codeVerifier === '') {
      return false
    }
    if (!urlParams.has('code')) {
      this._codeVerifier = undefined
      return false
    }
    const params = oauth.validateAuthResponse(
      this._authorizationServer as oauth.AuthorizationServer,
      this._client,
      urlParams,
      oauth.expectNoState
    )
    if (oauth.isOAuth2Error(params)) {
      this._codeVerifier = undefined
      this.logger.error('OAuth 2.0 response body error when validating authorization code', { params })
      return false
    }
    const response = await oauth.authorizationCodeGrantRequest(
      this._authorizationServer as oauth.AuthorizationServer,
      this._client,
      params,
      this._redirectUri,
      this._codeVerifier
    )
    if (oauth.parseWwwAuthenticateChallenges(response) != null) {
      this._codeVerifier = undefined
      this.logger.error('Error when handling OAuth Code Response: www-authenticate challenges error')
      return false
    }
    const result = await oauth.processAuthorizationCodeOpenIDResponse(
      this._authorizationServer as oauth.AuthorizationServer,
      this._client,
      response,
      this._storage.get('nonce') as string
    )

    if (oauth.isOAuth2Error(result)) {
      this._codeVerifier = undefined
      this.logger.error('OAuth 2.0 response body error when processing authorization code', { result })
      await this.logout()
      return false
    }

    this.logger.info('OAuth Result:', { result })

    this._codeVerifier = undefined
    this._accessToken = result.access_token
    this._refreshToken = result.refresh_token
    this._idToken = result.id_token

    // Remove code from location
    const postLoginRedirectUrl = this._localPostLoginRedirectUri
    if (typeof postLoginRedirectUrl === 'string' && postLoginRedirectUrl !== '') {
      const originalUrl = postLoginRedirectUrl.replace(`?code=${String(urlParams.get('code'))}`, '')
      document.location.replace(originalUrl)
    } else {
      document.location.replace(String(document.location).replace(`?code=${String(urlParams.get('code'))}`, ''))
    }

    return String(this.accessToken)
  }

  /**
   * Remove the code from the URL.
   * @param urlParams - The URL parameters.
   */
  removeResponseCodeFromURL (urlParams: URLSearchParams): void {
    const currentUrl = String(document.location)
    if (currentUrl.includes('?code=')) {
      const codeParamPortion = `?code=${String(urlParams.get('code'))}`
      document.location.replace(currentUrl.replace(codeParamPortion, ''))
    }
  }

  /**
   * Refresh the access token.
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * await client.refreshToken()
   * ```
   * @returns The new access token.
   */
  public async refreshAccessToken (refreshToken: string | null | undefined = this._refreshToken): Promise<string | boolean> {
    this.logger.info('Refresh access token')
    if (this._authorizationServer == null) {
      await this.updateAuthorizationServer()
    }
    if (typeof refreshToken !== 'string' || refreshToken === '') {
      this.logger.info('No refresh token')
      return false
    }
    this.logger.debug('oauth.refreshTokenGrantRequest start')
    const response = await oauth.refreshTokenGrantRequest(
      this._authorizationServer as oauth.AuthorizationServer,
      this._client,
      refreshToken
    )
    this.logger.debug('oauth.processRefreshTokenResponse start')
    const result = await oauth.processRefreshTokenResponse(
      this._authorizationServer as oauth.AuthorizationServer,
      this._client,
      response
    )
    this.logger.info('Refresh token response:', response)
    if (oauth.isOAuth2Error(result)) {
      this.logger.error('OAuth 2.0 response body error when refreshing the access token', result)
      await this.logout()
      return false
    }

    this.logger.info('Refresh token result:', { result })
    this._accessToken = result.access_token
    if (result.refresh_token !== undefined) {
      this._refreshToken = result.refresh_token
    }
    this._idToken = result.id_token

    return String(this.accessToken)
  }

  /**
   * Get user details from server
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * await client.userInfo()
   * ```
   */
  public async userInfo (): Promise<any> {
    if (this._authorizationServer == null) {
      await this.updateAuthorizationServer()
    }

    const userInfoUrl = new URL(
      this._authorizationServer?.userinfo_endpoint ??
      `${String(this._issuer.toString())}/oauth2/userInfo`
    )
    const bearerToken = this.accessToken ?? 'not-set'
    let data: any
    try {
      const response = await fetch(userInfoUrl.toString(), {
        headers: {
          Authorization: `Bearer ${bearerToken}`
        }
      })
      data = await response?.json()
    } catch (ex) {
      const error = ex as Error
      return data ?? { error: `User info unavailble: ${error.message}` }
    }
    return data ?? { error: 'No data in /oauth2/userInfo response' }
  }

  /**
   * Logout the user.
   *
   * If a local logout; the page will be reloaded.
   * If not, the user will be redirected to the Authorization Server's logout endpoint.
   *
   * @param logoutHint - The hint to the Authorization Server about the End-User that is logging out.
   * @param local - Clear credentials locally, reload page, but don't notify the Authorization Server
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * client.logout()
   * ```
   */
  public async logout (logoutHint?: string, local?: boolean): Promise<void> {
    if (this._authorizationServer == null) {
      await this.updateAuthorizationServer()
    }

    this._refreshToken = undefined
    this._idToken = undefined
    this.logger.info('Logged in:', { loggedIn: this.loggedIn })
    if (this.loggedIn) {
      this._accessToken = undefined
      const logoutUrl = new URL(
        this._authorizationServer?.end_session_endpoint ??
        `${String(this._issuer.toString())}/oauth2/logout`
      )
      logoutUrl.searchParams.set(
        'post_logout_redirect_uri',
        this._postLogoutRedirectUri
      )
      if (typeof logoutHint === 'string' && logoutHint !== '') {
        logoutUrl.searchParams.set('logout_hint', logoutHint)
      }
      if (local === true) {
        document.location.reload()
      } else {
        document.location.replace(logoutUrl.toString())
      }
    }
  }

  /**
   * If an idToken is available, it can be decoded to extract its payload
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * console.log('Decoded ID Token:', client.decodedIdToken)
   * ```
   */
  get decodedIdToken (): any {
    const idToken = this._idToken
    try {
      const parts = typeof idToken === 'string' ? idToken.split('.') : []
      const encodedPayload = parts[1]

      const decodedPayload = atobUrlSafe(encodedPayload)
      return JSON.parse(decodedPayload)
    } catch (ex) {
      const error = ex as Error
      return { error: error.message, idToken }
    }
  }

  /**
   * The user is logged in.
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * if (client.loggedIn) {
   *   // User is logged in
   * }
   * ```
   */
  public get loggedIn (): boolean {
    return typeof this._accessToken === 'string' && this._accessToken !== '' && this._accessToken !== 'null'
  }

  /**
   * The retrieved access token.
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * if (client.loggedIn) {
   *   // User is logged in
   *   console.log(client.refreshToken)
   * }
   * ```
   */
  public get refreshToken (): string | undefined | null {
    return this._refreshToken
  }

  /**
   * The retrieved access token.
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * if (client.loggedIn) {
   *   // User is logged in
   *   console.log(client.accessToken)
   * }
   * ```
   */
  public get accessToken (): string | null {
    if (this._accessToken === 'null' || this._accessToken === undefined || this._accessToken === 'undefined' || this._accessToken === '') {
      return null
    }
    return this._accessToken
  }

  /**
   * The retrieved id token.
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * if (client.loggedIn) {
   *   // User is logged in
   *   console.log(client.idToken)
   * }
   * ```
   */
  public get idToken (): string | undefined | null {
    return this._idToken
  }

  /**
   * The decoded access token.
   */
  public get decodedAccessToken (): DecodedAccessToken | undefined {
    const accessToken = this._accessToken
    if (typeof accessToken === 'string' && accessToken !== '' && this._accessToken !== 'null') {
      return decodeToken(accessToken)
    }
    return undefined
  }

  /**
   * The expiry time of a stored token; calculated on retrieval.
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * await client.initialize()
   * if (client.loggedIn) {
   *   // User is logged in
   *   console.log(client.expiryTime)
   * }
   * ```
   */
  public get expiryTime (): Date | null {
    const expiry = this.decodedAccessToken?.exp ?? 0
    if (expiry === 0) {
      return null
    }
    return new Date(expiry * 1000)
  }

  /**
   * Indicates whether the client has been initialized.
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * if (!client.initialized) {
   *   await client.initialize()
   * }
   * ```
   */
  public get initialized (): boolean {
    return !(this._authorizationServer == null)
  }
}
