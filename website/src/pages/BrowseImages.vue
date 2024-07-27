<template>
  <div class="column p5">
    <div v-if="requestId" class="breadcrumbs">
      <router-link to="/browse" class="row p5 left">
        <Icon icon="circle-chevron-left" />
        <label>Back</label>
      </router-link>
    </div>

    <h2 class="row p5">
      <Icon icon="image" />
      <label>Browse Images</label>
    </h2>

    <div v-if="!requestId" class="column p5">
      <h3 class="row p5">
        <label>Recent Images</label>
      </h3>
      <div class="row p5">
        <p>Recently made requests.</p>
        <span class="spacer"></span>
        <button class="row p5" @click="cleanHistory" :disabled="requestHistory?.length === 0">
          <Icon icon="soap" />
          <label>Clean history</label>
        </button>
      </div>
      <div class="column p5 links">
        <div v-for="requestItem in requestHistory">
          <router-link :to="`/browse/${requestItem?.dateCode}/${requestItem?.requestId}`" class="row p5">
            <label>{{ requestItem?.dateCode }}</label> /
            <label><code>{{ (requestItem?.requestId ?? '').slice(0, 8).toUpperCase() }}</code></label> /
            <label>{{ promptSummary(requestItem) }}</label>
            <label>({{ requestItem.batchSize  }})</label> 
          </router-link>
        </div>
      </div>
      <div v-if="requestHistory?.length === 0">
        <label>No request history to browse.</label>
      </div>
      <h3>Remote Images</h3>
      <p>Images available on the server.</p>
      <div v-if="remoteResults?.length === 0">
        <label>No remote image results to browse.</label>
      </div>
    </div>

    <div v-if="loadingResults && !resultsItem" class="loading row p5 left">
      <LoadingSpinner />
      <label>Loading results...</label>
    </div>
    <div v-else-if="requestId">
      <div v-if="resultsError?.message" class="row p5 key-value">
        <label>Error:</label>
        <span>{{ resultsError?.message }}</span>
      </div>
      <div v-else class="column p10">
        <h3 class="row">
          <Icon icon="circle-plus" />
          <label>Positive prompt</label>
        </h3>
        <pre><code>{{ resultsItem?.originalRequest?.positive }}</code></pre>
        <h3 class="row">
          <Icon icon="circle-minus" />
          <label>Negative prompt</label>
        </h3>
        <pre><code>{{ resultsItem?.originalRequest?.negative }}</code></pre>

        <h3 class="row">
          <Icon icon="cog" />
          <label>Request Settings</label>
        </h3>
        <div class="column p5">
          <div class="row p5 key-value">
            <label>Width</label>
            <label>{{ resultsItem?.originalRequest?.width }}</label>
          </div>
          <div class="row p5 key-value">
            <label>Height</label>
            <label>{{ resultsItem?.originalRequest?.height }}</label>
          </div>
          <div class="row p5 key-value">
            <label>Batch size</label>
            <label>{{ resultsItem?.originalRequest?.batchSize }}</label>
          </div>
        </div>
          
        <h3 class="row">
          <Icon icon="timeline" />
          <label>Timeline</label>
        </h3>
        <div class="column p5">
          <div class="row p5 key-value">
            <label>Request Created</label>
            <label>{{ resultsItem?.originalRequest?.requestTime }}</label>
          </div>
          <div class="row p5 key-value">
            <label>Processing Started</label>
            <label>{{ resultsItem?.started }}</label>
          </div>
          <div class="row p5 key-value">
            <label>Processing Finished</label>
            <label>{{ resultsItem?.finished }}</label>
          </div>
          <div class="row p5 key-value">
            <label>Results Uploaded</label>
            <label>{{ resultsItem?.uploaded }}</label>
          </div>
        </div>
        <pre v-if="false"><code>{{ resultsItem }}</code></pre>
        
        <h3 class="row">
          <Icon icon="image" />
          <label>Images</label>
        </h3>
        <div class="image-browser">
          <div v-for="(imagePath, index) in resultsItem?.generatedFiles" :key="imagePath"
            class="row column center image-placeholder" :style="{ width: imageWidth(resultsItem, 'px'), height: imageHeight(resultsItem, 'px')}">
            <div v-if="decryptedImages[imagePath] === 'loading'" class="row p5 left">
              <LoadingSpinner />
              <label>Loading image...</label>
            </div>
            <div v-else-if="expectedError(decryptedImages[imagePath])?.name ?? expectedError(decryptedImages[imagePath])?.message">
              <center>
                <pre><code>{{ expectedError(decryptedImages[imagePath])?.name }}</code></pre>
                <pre><code>{{ expectedError(decryptedImages[imagePath])?.message }}</code></pre>
              </center>
            </div>
            <img v-else-if="decryptedImages[imagePath]" :src="String(decryptedImages[imagePath])" :width="imageWidth(resultsItem)" :height="imageHeight(resultsItem)" />
            <div v-else>
              <Icon icon="image" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ImagesApiClient, { ImageResults, ImageRequest } from '../clients/ImagesApi' 
import { ImageUtils } from '../clients/ImageUtils'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import RequestHistory from '../components/RequestHistory'
import PromptHistory from '../components/PromptHistory'

const imagesApiClient = new ImagesApiClient()

let imageUtils: ImageUtils
let reloadTimeout: number

export default {
  components: { LoadingSpinner },
  props: {
    dateCode: {
      type: String,
      default: undefined
    },
    requestId: {
      type: String,
      default: undefined
    }
  },
  data() {
    return {
      userDetails: {} as any,
      requestHistory: [] as ImageRequest[],
      results: {} as Record<string, ImageResults | Error>,
      remoteResults: [] as ImageRequest[],
      loadingResults: false,
      decryptedImages: {} as Record<string, string | Error>
    }
  },
  computed: {
    resultsItem() {
      const { results, requestId } = this
      return results[String(requestId)] as ImageResults
    },
    resultsError() {
      const { results, requestId } = this
      return results[String(requestId)] as Error
    }
  },
  async mounted(): Promise<void> {
    const { dateCode, requestId } = this
    this.requestHistory = RequestHistory.getHistory()
    await this.fetchUserDetails()
    imageUtils = new ImageUtils(this.userDetails?.user?.decryptionKey ?? 'no-decryption-key-found')
    if (dateCode !== undefined && requestId !== undefined) {
      return this.loadImagesForRequestId(dateCode, requestId)
    }
  },
  unmounted() {
    clearTimeout(reloadTimeout)
  },
  methods: {
    async loadImagesForRequestId(dateCode: string, requestId: string) {
      await this.loadResults(dateCode, requestId)
      await this.loadImages(requestId,)
    },
    async fetchUserDetails() {
      const userDetails = await imagesApiClient.getUserDetails()
      console.log('Load user details', { userDetails })
      this.userDetails = userDetails
    },
    async loadResults(dateCode: string, requestId: string) {
      this.loadingResults = true
      const resultsEntry: ImageResults = await imagesApiClient.getResults(dateCode, requestId)
      console.log('[Load Results]', { resultsEntry, dateCode, requestId })
      clearTimeout(reloadTimeout)
      if (this.expectedError(resultsEntry)?.message === 'The specified key does not exist.') {
        this.results[requestId] = { name: 'Key not found', message: 'Waiting for progress update from server...' }
        const self = this
        reloadTimeout = setTimeout(async () => {
          try {
            self.loadImagesForRequestId(dateCode, requestId)
          } catch (ex) {
            const error = ex as Error
            console.log('[Retry results]', error?.message)
          }
        }, 6000 + Math.floor(4000 * Math.random()))
      } else if (resultsEntry?.originalRequest?.batchSize !== resultsEntry?.generatedFiles?.length) {
        this.results[requestId] = resultsEntry
        const self = this
        reloadTimeout = setTimeout(async () => {
          try {
            self.loadImagesForRequestId(dateCode, requestId)
          } catch (ex) {
            const error = ex as Error
            console.log('[Find more images]', error?.message)
          }
        }, 4000 + Math.floor(4000 * Math.random()))
      } else {
        this.results[requestId] = resultsEntry
      }
      this.loadingResults = false
    },
    async loadImages(requestId: string) {
      const { decryptedImages } = this
      const resultsItem = this.results[requestId] as ImageResults
      if (resultsItem?.generatedFiles?.length > 0) {
        const imagePaths = resultsItem?.generatedFiles
        const imageIVs = resultsItem?.initializationVectors
        const work = imagePaths.map(async (imagePath, index) => {
          const url = `https://images.connected-web.net/${imagePath}`
          const iv = imageIVs[index]
          decryptedImages[imagePath] = 'loading'
          this.decryptedImages = decryptedImages
          
          // console.log('Loading and decoding', url)
          try {
            const imageBlob = await imageUtils.createImageFromEncryptedUrl(url, iv)
            decryptedImages[imagePath] = imageBlob
            this.decryptedImages = decryptedImages
          } catch (ex) {
            const error = ex as Error
            if (error.name === 'OperationError') {
              decryptedImages[imagePath] = { name: 'Image Unavailable', message: 'Image may still be generating'}
            } else {
              decryptedImages[imagePath] = error
              console.log('Image load error:', { error })
              this.decryptedImages = decryptedImages
            }
          }
        })

        console.log('Loading images...')
        await Promise.allSettled(work)
        console.log('All images settled...')
        this.$forceUpdate()
      }
    },
    imageWidth(resultsEntry: ImageResults, suffix?: string) {
      return (resultsEntry?.originalRequest?.width ?? 100) + (suffix ?? '')
    },
    imageHeight(resultsEntry: ImageResults, suffix?: string) {
      return (resultsEntry?.originalRequest?.height ?? 100) + (suffix ?? '')
    },
    firstWords(requestItem: ImageRequest) {
      return (requestItem?.positive ?? '').split(' ').slice(0, 2)
    },
    lastWords(requestItem: ImageRequest) {
      return (requestItem?.positive ?? '').split(' ').reverse().slice(0, 2).reverse()
    },
    promptSummary(requestItem: ImageRequest) {
      const firstWords = this.firstWords(requestItem)
      const lastWords = this.lastWords(requestItem)
      return Array.from(new Set([...firstWords, ...lastWords])).join(' ')
    },
    expectedError(item: any) {
      return item as Error
    },
    cleanHistory() {
      RequestHistory.cleanHistory()
      this.requestHistory = []
      PromptHistory.cleanHistory()
    }
  },
  watch: {
    async requestId(newVal: string) {
      const { dateCode, requestId } = this
      return this.loadImagesForRequestId(String(dateCode), requestId ?? newVal)
    }
  }
}

</script>

<style scoped>
.key-value > *:first-child {
  flex: 1;
}
.key-value > * {
  min-width: 20vw;
  font-family: monospace;
  padding: 4px;
  background: #eee;
}

.key-value > label:nth-child(2) {
  font-weight: bold;
}

pre {
  margin: 0;
  text-wrap: wrap;
}

.image-placeholder {
  background: #f0f0f0;
}

.image-browser {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

a {
  background: #eee;
  padding: 2px;
  transition: background-color 200ms ease-in;
}
a:hover {
  background: #def;
  padding: 2px;
  transition: background-color 200ms ease-out;
}

@media screen and (max-width: 800px) {
  .image-browser {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 5px;
  }
  .image-browser > .image-placeholder {
    flex: 1;
    width: 100%;
  }
  .image-browser > .image-placeholder > img {
    width: 100%;
    height: 100%;
  }
}

</style>