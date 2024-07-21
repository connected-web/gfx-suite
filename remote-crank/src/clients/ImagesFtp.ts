import { Client } from 'basic-ftp'

export interface Task {
  attempts: number
  fn: () => Promise<void>
}

export class ImagesFtp {
  client: Client
  user: string
  password: string
  workQueue: Task[] = []
  currentTask: Task | null = null
  checkQueueTimeout: NodeJS.Timeout | null = null
  closeQueueTimeout: NodeJS.Timeout | null = null

  constructor () {
    this.client = new Client()
    const {
      GFX_SUITE_IMAGES_FTP_USERNAME,
      GFX_SUITE_IMAGES_FTP_PASSWORD
    } = process.env
    this.user = GFX_SUITE_IMAGES_FTP_USERNAME ?? 'no-ftp-user-name'
    this.password = GFX_SUITE_IMAGES_FTP_PASSWORD ?? 'no-ftp-pass'
  }

  async connect (): Promise<Client> {
    const { client, user, password } = this
    const host = 'ftp.connected-web.net'
    console.log('Connecting to FTP with user:', user, 'and host:', host)
    await client.access({
      host,
      user,
      password,
      secure: true,
      secureOptions: {
        rejectUnauthorized: false
      }
    })
    return client
  }

  queueTask (fn: () => Promise<void>): void {
    const task = { attempts: 0, fn }
    this.workQueue.push(task)
  }

  createDirectory (remoteDirectory: string): void {
    const { client } = this
    this.queueTask(async () => {
      console.log('[ImagesFtp] Create directory', { remoteDirectory })
      return await client.ensureDir(remoteDirectory)
    })
    this.checkWorkQueue().catch((ex) => {
      const error = ex as Error
      console.log('[ImagesFTP] Unable to process work queue', error)
    })
  }

  uploadFile (localFilepath: string, remoteFilename: string): void {
    const { client } = this
    this.queueTask(async () => {
      console.log('[ImagesFtp] Uploading', { localFilepath, remoteFilename })
      await client.uploadFrom(localFilepath, remoteFilename)
    })
    this.checkWorkQueue().catch((ex) => {
      const error = ex as Error
      console.log('[ImagesFTP] Unable to process work queue', error)
    })
  }

  async checkWorkQueue (): Promise<void> {
    const { workQueue } = this
    if (this.currentTask !== null) {
      return
    }
    if (workQueue.length > 0) {
      console.log('[ImagesFtp] Processing work queue', { items: workQueue.length }, 'remaining')
      const task = workQueue.shift()
      if (task !== undefined) {
        task.attempts++
        try {
          this.currentTask = task
          if (this.client.closed) {
            console.log('[ImagesFtp] Reconnecting to FTP')
            await this.connect()
          }
          console.log(`[ImagesFtp] Executing task, (Attempt: ${task.attempts}`)
          await task.fn()
        } catch (ex) {
          const error = ex as Error
          console.error('[ImagesFtp] Unable to process task', { error: error.message })
          if (task.attempts < 3) {
            console.log('[ImagesFtp] Re-queueing task')
            /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
            this.checkQueueTimeout = setTimeout(async () => {
              clearTimeout(this.checkQueueTimeout ?? 0)
              workQueue.push(task)
              this.checkWorkQueue().catch((ex) => {
                const error = ex as Error
                console.log('[ImagesFTP] Unable to process work queue after requeue', error)
              })
            }, 5000)
          }
        }
        clearTimeout(this.checkQueueTimeout ?? 0)
        /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
        this.checkQueueTimeout = setTimeout(() => {
          this.checkWorkQueue().catch((ex) => {
            const error = ex as Error
            console.log('[ImagesFTP] Unable to process work queue', error)
          })
        }, 10)
        this.currentTask = null
        if (workQueue.length === 0) {
          clearTimeout(this.closeQueueTimeout ?? 0)
          /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
          this.closeQueueTimeout = setTimeout(async () => {
            console.log('[ImagesFtp] Work queue empty, closing connection')
            await this.close()
          }, 5000)
        }
      }
    }
  }

  async close (): Promise<void> {
    const { client } = this
    client.close()
  }
}
