import * as CryptoJS from 'crypto-js'

export abstract class Storage {
  protected baseKey: string

  /**
   * Creates a new storage instance.
   * @param baseKey - The base key for storage.
   */
  constructor (baseKey = '') {
    this.baseKey = baseKey
  }

  /**
   * Determines if the current browser supports this storage type.
   * @returns true if the storage type is supported.
   */
  public static supported (): boolean {
    return true
  }

  /**
   * Returns true if the storage has a value for the given key.
   * @param name - The storage key.
   * @returns true if the storage has a value for the given key.
   */
  public has (name: string): boolean {
    return this.get(name) !== null && this.get(name) !== undefined
  }

  /**
   * Returns a scoped key for storage.
   * @param key - The storage key.
   * @returns the scoped key for storage.
   */
  protected key (key = ''): string {
    if (this.baseKey !== '' && !key.includes(this.baseKey)) {
      return `${this.baseKey}.${key}`
    }

    return key
  }

  /**
   * Get and decrypt an encrypted value from local storage.
   * @param key - The storage key
   * @param defaultValue - The default value to return if the key is not found
   * @returns the decrypted value from local storage or null
   * @throws if the local storage is not supported.
   * @example
   * ```typescript
   * const storage = new LocalStorage('oauth')
   * storage.setEncrypted('test', 'value')
   * expect(storage.getEncrypted('test')).toBe('value')
   * ```
   */
  public getEncrypted (key: string, defaultValue?: string): string | null {
    const value = this.get(key, defaultValue)
    return typeof value === 'string' ? this.decrypt(value) : null
  }

  /**
   * Set an encrypted value in local storage.
   * @param key - The storage key.
   * @param value - The value to encrypt and store.
   * @throws if the local storage is not supported.
   * @example
   * ```typescript
   * const storage = new LocalStorage('oauth')
   * storage.setEncrypted('test', 'value')
   * expect(storage.getEncrypted('test')).toBe('value')
   * ```
   */
  public setEncrypted (key: string, value?: string | null): void {
    if (typeof value === 'string' && value !== '') {
      value = this.encrypt(value)
    }
    this.set(key, value)
  }

  /**
   * Get the passphrase used to encrypt and decrypt data
   *
   * @returns the passphrase as a string
   */
  private get aesKey (): string {
    return typeof window !== 'undefined' ? window.location.origin : 'user.identity.connected-web.services'
  }

  /**
   * Encrypt a utf8 text value using a locally specified AES key
   * @param txt
   * @returns the encrypted text
   */
  private encrypt (txt: string): string {
    return CryptoJS.AES.encrypt(txt, this.aesKey).toString()
  }

  /**
   * Decrypt a utf8 text value using a locally specified AES key
   * @param txtToDecrypt
   * @returns the decrypted text
   */
  private decrypt (txtToDecrypt: string): string {
    return CryptoJS.AES.decrypt(txtToDecrypt, this.aesKey).toString(CryptoJS.enc.Utf8)
  }

  /**
   * Get a value from this storage.
   *
   * @param name
   * @param defaultValue
   */
  abstract get (name: string, defaultValue?: string): string | null | undefined

  /**
   * Set a value in this storage.
   *
   * @param name
   * @param value
   */
  abstract set (name: string, value: unknown): void

  /**
   * Delete a value from this storage.
   *
   * @param name
   */
  abstract delete (name: string): void

  /**
   * Clear all values from this storage.
   */
  abstract clear (): void
}
