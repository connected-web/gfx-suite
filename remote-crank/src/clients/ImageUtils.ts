import Jimp from 'jimp'
import fs from 'fs'
import crypto from 'crypto'

export type EncryptedFileRecord = {
  encryptedImagePath: string
  iv: string
}

export class ImageUtils {
  async compressImage (imagePath: string): Promise<string> {
    const image = await Jimp.read(imagePath)
    const newImagePath = imagePath.replace('.png', '.jpg')
    await image.quality(90).write(newImagePath)
    return newImagePath
  }

  async deleteImage (imagePath: string): Promise<void> {
    await fs.promises.unlink(imagePath)
  }

  async encryptImage (imagePath: string, encryptionKey: string): Promise<EncryptedFileRecord> {
    const algorithm = 'aes-256-cbc'
    const outputPath = imagePath.replace('.jpg', '.jpg.enc')
    const iv = crypto.randomBytes(16)
    const keyInBytes = Buffer.from(encryptionKey, 'base64')
    const cipher = crypto.createCipheriv(algorithm, keyInBytes, iv)
    const input = fs.createReadStream(imagePath)
    const output = fs.createWriteStream(outputPath)

    input.pipe(cipher).pipe(output)

    return { encryptedImagePath: outputPath, iv: iv.toString('hex') }
  }

  async decryptImage (encryptedBlob: Blob, keyHex: string, ivHex: string): Promise<Blob> {
    const keyPairs = keyHex.match(/.{1,2}/g) ?? []
    const key = new Uint8Array(keyPairs.map(byte => parseInt(byte, 16)))

    const ivPairs = ivHex.match(/.{1,2}/g) ?? []
    const iv = new Uint8Array(ivPairs.map(byte => parseInt(byte, 16)))

    const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
    const algorithm = { name: 'AES-CBC', iv: iv };
    const cryptoKey = await crypto.subtle.importKey('raw', key, algorithm, false, ['decrypt'])
    
    const decryptedArrayBuffer = await crypto.subtle.decrypt(algorithm, cryptoKey, encryptedArrayBuffer)
    return new Blob([decryptedArrayBuffer], { type: 'image/jpeg' })
  }

  async decryptImageFile (encryptedImageURL: string, keyHex: string, ivHex: string): Promise<Blob> {
    const encryptedBlob = await fetch(encryptedImageURL).then(response => response.blob())
    return this.decryptImage(encryptedBlob, keyHex, ivHex)
  }
}
