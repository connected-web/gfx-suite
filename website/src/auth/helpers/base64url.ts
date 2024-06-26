const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function atobUrlSafe (input: string): string {
  return buf(b64u(input))
}

export function btoaUrlSafe (input: string): string {
  return b64u(buf(input))
}

function buf (input: string): Uint8Array
function buf (input: Uint8Array): string
function buf (input: string | Uint8Array): string | Uint8Array {
  if (typeof input === 'string') {
    return encoder.encode(input)
  }

  return decoder.decode(input)
}

function b64u (input: string): Uint8Array
function b64u (input: Uint8Array | ArrayBuffer): string
function b64u (input: string | Uint8Array | ArrayBuffer): string | Uint8Array {
  if (typeof input === 'string') {
    return decodeBase64Url(input)
  }

  return encodeBase64Url(input)
}

const CHUNK_SIZE = 0x8000
function encodeBase64Url (input: Uint8Array | ArrayBuffer): string {
  if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input)
  }

  const arr = []
  for (let i = 0; i < input.byteLength; i += CHUNK_SIZE) {
    // @ts-expect-error
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)))
  }
  return btoa(arr.join('')).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function decodeBase64Url (input: string): Uint8Array {
  try {
    const binary = atob(input.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  } catch {
    throw new TypeError('The input to be decoded is not correctly encoded.')
  }
}
