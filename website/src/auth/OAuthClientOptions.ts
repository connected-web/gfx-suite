import * as oauth from 'oauth4webapi'
import { LocalStorage } from './LocalStorage'

export interface OAuthClientOptions {
  url: string
  /**
   * The client ID of the application
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *  url: 'https://example.com',
   *   clientId: 'my-client-id',
   * })
   * ```
   */
  clientId: string
  /**
   * The client authentication method, see {@link oauth.ClientAuthenticationMethod}
   * @default 'none' public client
   * @see [RFC 6749 - The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749.html#section-2.3)
   * @see [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication)
   * @see [OAuth Token Endpoint Authentication Methods](https://www.iana.org/assignments/oauth-parameters/oauth-parameters.xhtml#token-endpoint-auth-method)
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *  url: 'https://example.com',
   *   clientId: 'my-client-id',
   *  tokenEndpointAuthMethod: 'client_secret_basic'
   * })
   * ```
   */
  tokenEndpointAuthMethod?: oauth.ClientAuthenticationMethod
  /**
   * The scopes requested to the OAuth server.
   * @default ''
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   *   scopes: 'openid profile email'
   * })
   * ```
   */
  scopes?: string[] | string
  /**
   * The storage to use for persisting the refresh token.
   * @default
   * `new LocalStorage('oauth')`
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   *   storage: new SessionStorage('my-app')
   * })
   * ```
   */
  storage: LocalStorage
  /**
   * The redirect URI.
   * @default
   * `document.location.origin`
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   *   redirectUri: 'https://my-app.com/callback'
   * })
   * ```
   */
  redirectUri?: string
  /**
   * The URL to redirect the user after the logout.
   * @default
   * `document.location.origin`
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   *   postLogoutRedirectUri: 'https://my-app.com'
   * })
   * ```
   */
  postLogoutRedirectUri?: string
  /**
   * The locally stored URL to redirect the user after the login.
   *
   * Use with single page webapps that use hash fragments to track state.
   * @default
   * `document.location.origin`
   * @example
   * ```typescript
   * const client = new OAuthClient({
   *   url: 'https://example.com',
   *   clientId: 'my-client-id',
   *   localPostLogoutRedirectUri: 'https://my-app.com'
   * })
   * ```
   */
  useLocalLoginRedirectUrl?: boolean
}
