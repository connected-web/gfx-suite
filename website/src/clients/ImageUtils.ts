const crypto = window.crypto

export interface EncryptedFileRecord {
  encryptedImagePath: string
  iv: string
}

export class ImageUtils {
  private readonly decryptionKey: string
  private successCache: Record<string, string> = {}

  constructor (decryptionKey: string) {
    this.decryptionKey = decryptionKey
  }

  async createImageFromEncryptedUrl (imagePath: string, iv: string): Promise<string> {
    const { decryptionKey } = this

    const cachedRecord = this.successCache[imagePath]
    if (cachedRecord !== undefined) {
      return cachedRecord
    }

    // Fetch the encrypted image data
    const response = await fetch(imagePath)
    const encryptedBlob = await response.blob()

    // Decrypt the image
    const decryptedBlob = await this.decryptImage(encryptedBlob, decryptionKey, iv)

    // console.log('Decrypted blob:', { decryptedBlob })

    // Create a URL for the decrypted blob to be used as the source of the image element
    const objectUrl = URL.createObjectURL(decryptedBlob)
    this.successCache[imagePath] = objectUrl
    return objectUrl
  }

  async decryptImage (encryptedBlob: Blob, keyHex: string, ivHex: string): Promise<Blob> {
    const binaryKey = atob(keyHex)
    const key = new Uint8Array(binaryKey.length)
    for (let i = 0; i < binaryKey.length; i++) {
      key[i] = binaryKey.charCodeAt(i)
    }

    const ivPairs = ivHex.match(/.{1,2}/g) ?? []
    const iv = new Uint8Array(ivPairs.map(byte => parseInt(byte, 16)))

    const encryptedArrayBuffer = await encryptedBlob.arrayBuffer()
    const algorithm = { name: 'AES-CBC', iv }
    const cryptoKey = await crypto.subtle.importKey('raw', key, algorithm, false, ['decrypt'])

    const decryptedArrayBuffer = await crypto.subtle.decrypt(algorithm, cryptoKey, encryptedArrayBuffer)
    return new Blob([decryptedArrayBuffer], { type: 'image/jpeg' })
  }

  async decryptImageFile (encryptedImageURL: string, keyHex: string, ivHex: string): Promise<Blob> {
    const encryptedBlob = await fetch(encryptedImageURL).then(async response => await response.blob())
    return await this.decryptImage(encryptedBlob, keyHex, ivHex)
  }
}
