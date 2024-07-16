import Jimp from 'jimp'
import fs from 'fs'

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
}
