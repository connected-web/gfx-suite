import Jimp from 'jimp'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'node:stream/promises'
import crypto from 'crypto'

export interface EncryptedFileRecord {
  encryptedImagePath: string
  iv: string
}

export class ImageUtils {
  async compressImage (imagePath: string): Promise<string> {
    const image = await Jimp.read(imagePath)
    const newImagePath = imagePath.replace('.png', '.jpg')
    console.log('Compressing image to', newImagePath)
    await image.quality(90).write(newImagePath)
    console.log('Compressed image to', newImagePath)
    return newImagePath
  }

  async deleteImage (imagePath: string): Promise<void> {
    await fs.promises.unlink(imagePath)
  }

  async encryptImage (imagePath: string, encryptionKey: string): Promise<EncryptedFileRecord> {
    const algorithm = 'aes-256-cbc'
    const fileDir = path.dirname(imagePath)
    const fileName = path.basename(imagePath)
    const guid = crypto.randomBytes(16).toString('hex')
    const encFileName = btoa(guid + fileName).replace(/=/g, '').slice(0, 16) + '.enc'
    const outputPath = path.join(fileDir, encFileName)
    const iv = crypto.randomBytes(16)
    const keyInBytes = Buffer.from(encryptionKey, 'base64')
    const cipher = crypto.createCipheriv(algorithm, keyInBytes, iv)
    const input = fs.createReadStream(imagePath)
    const output = fs.createWriteStream(outputPath)

    await pipeline(input, cipher, output)

    return { encryptedImagePath: outputPath, iv: iv.toString('hex') }
  }

  async decryptImage (encryptedBlob: Blob, keyHex: string, ivHex: string): Promise<Blob> {
    const keyPairs = keyHex.match(/.{1,2}/g) ?? []
    const key = new Uint8Array(keyPairs.map(byte => parseInt(byte, 16)))

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
