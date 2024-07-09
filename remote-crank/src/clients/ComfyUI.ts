import fs from 'fs'
import path, { dirname as pathDirname } from 'path'
import WebSocket from 'ws'
import { pipeline, Readable } from 'stream'
import { promisify } from 'util'
import { fileURLToPath } from 'url'

import { ComfyUIApiClient, ComfyUIWorkflow, WorkflowOutput } from '@stable-canvas/comfyui-client'
import { ImageRequest } from './SharedTypes'

const pipelineAsync = promisify(pipeline)
const filename = fileURLToPath(import.meta.url)
const dirname = pathDirname(filename)

function responseToReadable (response: Response): Readable {
  const reader: ReadableStreamDefaultReader<Uint8Array> = (response?.body?.getReader()) as ReadableStreamDefaultReader<Uint8Array>
  const rs = new Readable()
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  rs._read = async () => {
    const result = await reader.read()
    if (!result.done) {
      rs.push(Buffer.from(result.value))
    } else {
      rs.push(null)
    }
  }
  return rs
}

export const isNone = (x: any): x is null | undefined =>
  x === null || x === undefined

export class ComfyUIClient {
  client: ComfyUIApiClient

  constructor () {
    this.client = new ComfyUIApiClient({
      api_host: '127.0.0.1:8188',
      WebSocket,
      fetch
    })

    this.init()
  }

  init (): void {
    const { client } = this
    client.connect()

    client.on('message', (event) => {
      const { data } = event
      if (data instanceof Buffer || data instanceof ArrayBuffer) {
        console.log('Received image data')
      } else {
        console.log(data)
      }
    })
  }

  createWorkflow (imageRequest: ImageRequest): ComfyUIWorkflow {
    const workflow = new ComfyUIWorkflow()
    const cls = workflow.classes
    const [model, clip] = cls.CheckpointLoaderSimple({
      ckpt_name: 'AOM3 a1b.safetensors'
    })
    const [vae] = cls.VAELoader({
      vae_name: 'orangemix.vae.pt'
    })
    const enc = (text: string): any => cls.CLIPTextEncode({ text, clip })[0]
    const [samples] = cls.KSampler({
      seed: Math.floor(Math.random() * 2 ** 32),
      steps: 24,
      cfg: 7.5,
      sampler_name: 'euler',
      scheduler: 'karras',
      denoise: 1,
      model,
      positive: enc(imageRequest.positive),
      negative: enc(imageRequest.negative),
      latent_image: cls.EmptyLatentImage({
        width: imageRequest?.width ?? 512,
        height: imageRequest?.height ?? 512,
        batch_size: imageRequest.batchSize
      })[0]
    })

    const now = new Date()
    const datePrefix = now.toISOString().substring(0, 10)
    cls.SaveImage({
      filename_prefix: `${datePrefix}/${String(imageRequest?.requestId)}/gfxs`,
      images: cls.VAEDecode({ samples, vae })[0]
    })

    return workflow
  }

  async saveUrlToFile (url: string, filepath: string): Promise<void> {
    console.log('Saving file from URL', url, 'to', filepath)

    const res = await fetch(url)
    if (!res.ok || res.body === null) {
      throw new Error(`Failed to fetch ${url}: ${res.statusText}`)
    }

    try {
      const dirpath = path.dirname(filepath)
      if (!fs.existsSync(dirpath)){
        fs.mkdirSync(dirpath, { recursive: true });
      }
    } catch (ex) {
      const error = ex as Error
      console.error(`Error creating directory: ${error.message}`)
      throw error
    }

    try {
      const fileStream = fs.createWriteStream(filepath)
      const readable = responseToReadable(res)
      await pipelineAsync(readable, fileStream)
      console.log(`File saved to ${filepath}`)
    } catch (ex) {
      const error = ex as Error
      console.error(`Error saving file: ${error.message}`)
      throw error
    }
  }

  async saveWorkflowOutputs (outputs: WorkflowOutput): Promise<void> {
    console.log('Saving outputs:', Object.keys(outputs), outputs?.images?.length ?? 0, 'images')
    const images = outputs.images ?? []
    const work = images.map(async (image, index) => {
      console.log(`[${index}] Dealing with ${image.type}`)
      try {
        if (image.type === 'url') {
          const url = image.data
          const params = new URLSearchParams(new URL(url).search)
          const filename = params.get('filename')
          const subfolder = params.get('subfolder')
          if (isNone(filename)) {
            console.error('No filename in received URL', { url })
            return
          }
          if (isNone(subfolder)) {
            console.error('No subfolder in received URL', { url })
            return
          }
          const filepath = path.join(dirname, '../../outputs', subfolder, filename)
          console.log('Using filename from URL', { filename, filepath })
          await this.saveUrlToFile(url, filepath)
        } else if (image.type === 'buff') {
          const filename = `image-${Date.now()}.png`
          const filepath = path.join(dirname, '../../outputs', filename)
          fs.writeFileSync(filepath, Buffer.from(image.data))
        }
      } catch (ex) {
        const error = ex as Error
        console.log('Unable to save workflow outputs', { error: error.message, image })
      }
    })
    await Promise.allSettled(work)
  }

  async invokeWorkflow (workflow: ComfyUIWorkflow): Promise<void> {
    const { client } = this
    try {
      const comfyResponse = await workflow.invoke(client)
      await this.saveWorkflowOutputs(comfyResponse)
    } catch (ex) {
      const error = ex as Error
      console.log('Unable to invoke workflow:', { error: error.message, workflow })
    }
  }
}
