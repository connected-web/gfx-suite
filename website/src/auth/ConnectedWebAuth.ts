import { DecodedAccessToken, DecodedIdToken } from './AuthInterfaces'
import { LocalStorage } from './LocalStorage'
import { OAuthClient } from './OAuthClient'
import { OAuthClientOptions } from './OAuthClientOptions'
import { decodeToken } from './helpers/decodeToken'
import { nameFromEmail } from './helpers/nameFromEmail'

import uatConfig from './configs/uat.identity.config.json'
import prodConfig from './configs/prod.identity.config.json'
import EventEmitter from './EventEmitter'

export default class ConnectedWebAuth {
  emitter: EventEmitter
  storage: LocalStorage
  oauthClient: OAuthClient

  static create (config: 'uat' | 'prod'): ConnectedWebAuth {
    const clientConfig = config === 'uat' ? uatConfig : prodConfig
    return new ConnectedWebAuth(clientConfig)
  }

  constructor (clientConfig: Partial<OAuthClientOptions>) {
    this.emitter = new EventEmitter()
    this.storage = clientConfig.storage ?? new LocalStorage('oauth')
    const resolvedClientConfig = this.resolveClientConfig(clientConfig)

    this.oauthClient = new OAuthClient(resolvedClientConfig)
    this.oauthClient.initialize()
      .then(() => {
        this.emitter.emit('initialized', null)
      })
      .catch((ex) => {
        const error = ex as Error
        console.error('Failed to initialize Auth:', error.message, { error })
      })
  }

  /**
   * Get the latest access token
   *
   * This will first refresh the access token using the OAuth client if it has expired
   *
   * @returns the singleton instance of Auth, or undefined if it has not been initialized
   */
  async getLatestAccessToken (): Promise<string> {
    if (this.accessTokenExpired) {
      await this.oauthClient?.refreshAccessToken()
    }
    return this.accessToken ?? ''
  }

  /**
   * Login
   *
   * This will redirect the user to the OAuth server to login
   */
  async login (): Promise<void> {
    return await this.oauthClient?.authorize()
  }

  /**
   * Logout
   *
   * This will clear the local storage of access tokens and refresh the page
   */
  async logout (): Promise<void> {
    return await this.oauthClient?.logout('', true)
  }

  /**
   * Check if the user is logged in
   *
   * @returns true if the user has an access token, and the access token has not expired
   */
  get loggedIn (): boolean {
    return !this.noAccessToken && !this.accessTokenExpired
  }

  /**
   * Confirm if there is no access token available
   *
   * @returns true if there is no access token
   */
  get noAccessToken (): boolean {
    const accessToken = this.accessToken
    return typeof accessToken !== 'string' || accessToken === ''
  }

  /**
   * Confirm if the access token has expired
   *
   * @returns true if the access token has expired
   */
  get accessTokenExpired (): boolean {
    return (this.decodedAccessToken?.exp ?? 0) < (Date.now() / 1000)
  }

  /**
   * Get the access token
   */
  get accessToken (): string | null {
    return this.storage.getEncrypted('access_token')
  }

  /**
   * Get the decoded access token
   *
   * @returns the decoded access token, or undefined if there is no access token
   */
  get decodedAccessToken (): DecodedAccessToken | undefined {
    const accessToken = this.accessToken
    if (accessToken !== null && accessToken?.length > 0) {
      return decodeToken(accessToken)
    }
  }

  /**
   * Get the refresh token
   *
   * @returns the refresh token, or undefined if there is no refresh token
   */
  get refreshToken (): string | null {
    return this.storage.getEncrypted('refresh_token')
  }

  /**
   * Get the ID token
   *
   * @returns the ID token, or undefined if there is no ID token
   */
  get idToken (): string | null {
    return this.storage.getEncrypted('id_token')
  }

  /**
   * Get the decoded ID token
   *
   * @returns the decoded ID token, or undefined if there is no ID token
   */
  get decodedIdToken (): DecodedIdToken | undefined {
    if (this.idToken !== null) {
      return decodeToken(this.idToken)
    }
  }

  /**
   * Get the principal ID
   *
   * @returns the principal ID, or 'Not Authorized' if there is no ID token
   */
  get principalId (): string {
    return this.decodedIdToken?.email ?? 'Not Authorized'
  }

  /**
   * Get the user first and last name
   *
   * @returns the user name, or 'Not Authorized' if there is no ID token
   */
  get userName (): string {
    const idToken = this.decodedIdToken

    if (idToken == null) return 'Not Authorized'

    if (
      (idToken.name !== undefined && idToken.name.length > 0) &&
      (idToken.family_name !== undefined && idToken.family_name.length > 0)
    ) return `${idToken.name} ${idToken.family_name}`

    if (idToken.email !== undefined && idToken.email.length > 0) return nameFromEmail(idToken.email)

    return idToken.name ?? 'No Name'
  }

  /**
   * Get the user groups
   *
   * @returns the user groups, or an empty array if there is no ID token
   */
  get userGroups (): string[] {
    return this.storage.get('user_groups')?.split(',') ?? []
  }

  protected resolveClientConfig (clientConfig: Partial<OAuthClientOptions>): OAuthClientOptions {
    const baseConfig = {
      redirectUri: `${String(window.location.origin)}/`, // Return to execute auth handler code
      useLocalLoginRedirectUrl: true, // Return users back to the page they were viewing before auth
      postLogoutRedirectUri: `${String(window.location.origin)}/`
    }
    const result: OAuthClientOptions = {
      ...baseConfig,
      ...clientConfig
    } as any
    return result
  }
}
