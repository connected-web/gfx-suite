import ConnectedWebAuth from './auth/ConnectedWebAuth'

export default class Auth {
  static instance: Auth | undefined
  connectedWebAuth: ConnectedWebAuth

  constructor (identityMode: 'uat' | 'prod') {
    this.connectedWebAuth = ConnectedWebAuth.create(identityMode)

    Auth.instance = this
  }

  async onInitialized (listener: EventListenerOrEventListenerObject): Promise<void> {
    this.connectedWebAuth.emitter.on('initialized', listener)
  }

  async getLatestAccessToken (): Promise<string> {
    return await this.connectedWebAuth.getLatestAccessToken()
  }

  async login (): Promise<void> {
    return await this.connectedWebAuth.login()
  }

  async logout (): Promise<void> {
    return await this.connectedWebAuth.logout()
  }

  get loggedIn (): boolean {
    return this.connectedWebAuth.loggedIn
  }

  get noAccessToken (): boolean {
    return this.connectedWebAuth.noAccessToken
  }

  get userName (): string {
    return this.connectedWebAuth.userName
  }

  get initials (): string {
    const name = this.userName
    return name.split(' ').map((n) => n[0]).join('')
  }

  get principalId (): string {
    return this.connectedWebAuth.principalId
  }
}
