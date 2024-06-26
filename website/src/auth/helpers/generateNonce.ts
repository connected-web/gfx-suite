export function generateNonce (): string {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~'
  const result: string[] = []
  crypto.getRandomValues(new Uint8Array(32)).forEach(c => {
    result.push(charset[c % charset.length])
  })
  return result.join('')
}
