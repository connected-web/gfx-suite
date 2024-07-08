import fs from 'fs'
import path from 'path'
import WebSocket from 'ws'

import { ComfyUIApiClient, ComfyUIWorkflow, WorkflowOutput } from '@stable-canvas/comfyui-client'

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

  createWorkflow (batchId: string, positivePrompt: string, negativePrompt: string, batchSize: number = 1): ComfyUIWorkflow {
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
      positive: enc(positivePrompt),
      negative: enc(negativePrompt),
      latent_image: cls.EmptyLatentImage({
        width: 512,
        height: 768,
        batch_size: batchSize
      })[0]
    })

    const now = new Date()
    const datePrefix = now.toISOString().substring(0, 10)
    cls.SaveImage({
      filename_prefix: `${datePrefix}/${batchId}/img_`,
      images: cls.VAEDecode({ samples, vae })[0]
    })

    return workflow
  }

  async saveUrlToFile (url: string, filepath: string): Promise<void> {
    const res = await fetch(url)
    const fileStream = fs.createWriteStream(filepath)
    await new Promise<void>((resolve, reject) => {
      if (res.body === null) {
        reject(new Error('No body in response'))
        return
      }
      res.body.pipe(fileStream)
      res.body.on('error', (error: Error) => {
        reject(error)
      })
      fileStream.on('finish', function () {
        resolve()
      })
    })
  };

  async saveWorkflowOutputs (outputs: WorkflowOutput): Promise<void> {
    const images = outputs.images ?? []
    const work = images.map(async (image) => {
      if (image.type === 'url') {
        const url = image.data
        const filename = new URLSearchParams(new URL(url).search).get(
          'filename'
        )
        if (isNone(filename)) {
          console.error('No filename in URL')
          return
        }
        const filepath = path.join(__dirname, '../../outputs', filename)
        await this.saveUrlToFile(url, filepath)
      } else if (image.type === 'buff') {
        const filename = `image-${Date.now()}.png`
        const filepath = path.join(__dirname, '../../outputs', filename)
        fs.writeFileSync(filepath, Buffer.from(image.data))
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
