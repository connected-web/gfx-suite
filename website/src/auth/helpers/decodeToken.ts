import { atobUrlSafe } from './base64url'

/**
   * Decode the payload from a JWT
   *
   * @param token The JWT to decode
   * @returns the decoded payload
   */
export function decodeToken (token: string): any {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atobUrlSafe(payload))
    return decoded
  } catch (ex) {
    const error = ex as Error
    throw new Error('Unable to parse payload from token: ' + error.message)
  }
}
