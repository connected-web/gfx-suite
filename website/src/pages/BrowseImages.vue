<template>
  <div class="column p5">

    <h2 class="row p5">
      <Icon icon="image" />
      <label>Browse Images</label>
    </h2>

    <div v-if="requestId" class="breadcrumbs">
      <router-link to="/browse" class="row p5 left">
        <Icon icon="circle-chevron-left" />
        <label>Back</label>
      </router-link>
    </div>

    <RequestBrowser v-if="!requestId" />

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
            <label>{{ resultsItem?.originalRequest?.requestTime ?? 'Waiting on server...' }}</label>
          </div>
          <div class="row p5 key-value">
            <label>Processing Started</label>
            <label>{{ resultsItem?.started ?? 'n/a' }}</label>
          </div>
          <div class="row p5 key-value">
            <label>Processing Finished</label>
            <label>{{ resultsItem?.finished ?? 'n/a' }}</label>
          </div>
          <div class="row p5 key-value">
            <label>Results Uploaded</label>
            <label>{{ resultsItem?.uploaded ?? 'n/a' }}</label>
          </div>
        </div>
        <pre v-if="false"><code>{{ resultsItem }}</code></pre>
        
        <h3 class="row">
          <Icon icon="image" />
          <label>Images</label>
        </h3>
        <div class="image-browser">
          <div v-for="(imagePath, index) in resultsItem?.generatedFiles" :key="imagePath"
            class="row column center image-placeholder" :style="{ minWidth: imageWidth(resultsItem, 'px'), height: imageHeight(resultsItem, 'px'), aspectRatio: `auto ${imageWidth(resultsItem, '')}/${imageHeight(resultsItem, '')}` }">
            <div v-if="decryptedImages[imagePath] === 'loading'" class="row p5 left">
              <LoadingSpinner />
              <label>Loading image...</label>
            </div>
            <div v-else-if="expectedError(decryptedImages[imagePath])?.name ?? expectedError(decryptedImages[imagePath])?.message">
              <div class="column center">
                <LoadingSpinner v-if="stillGenerating(resultsItem)" />
                <Icon v-else icon="heart-crack" />
                <pre><code>{{ expectedError(decryptedImages[imagePath])?.name }}</code></pre>
                <pre><code>{{ expectedError(decryptedImages[imagePath])?.message }}</code></pre>
              </div>
            </div>
            <img v-else-if="decryptedImages[imagePath]" :src="String(decryptedImages[imagePath])" :width="imageWidth(resultsItem)" :height="imageHeight(resultsItem)" />
            <div v-else>
              <Icon icon="image" />
            </div>
          </div>
        </div>
        <h3 v-if="resultsItem?.generatedFiles?.length === 0" class="row p5 center">
          <LoadingSpinner />
          <label>Waiting for server to pick up request...</label>
        </h3>
        <h3 v-else-if="resultsItem?.generatedFiles?.length < resultsItem?.originalRequest?.batchSize" class="row p5 center">
          <LoadingSpinner />
          <label>Generating images... {{ resultsItem?.generatedFiles?.length }} / {{ resultsItem?.originalRequest?.batchSize }}</label>
        </h3>
        <div v-else class="column p10">
          <h3 class="row p5 center">
            <Icon icon="image" />
            <label>{{ resultsItem?.generatedFiles?.length }} images total</label>
          </h3>
          <h3 class="row p5 stretch">
            <router-link :to="`/create/${dateCode}/${requestId}`" class="button row p5 center">
              <Icon icon="paint-roller" />
              <label>Create more?</label>
            </router-link>
          </h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ImagesApiClient, { ImageResults, ImageRequest } from '../clients/ImagesApi' 
import { ImageUtils } from '../clients/ImageUtils'

import LoadingSpinner from '../components/LoadingSpinner.vue'
import RequestBrowser from './components/RequestBrowser.vue'

const imagesApiClient = new ImagesApiClient()

let imageUtils: ImageUtils
let reloadTimeout: number

export default {
  components: { LoadingSpinner, RequestBrowser },
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
      remoteResults: [] as ImageRequest[],
      results: {} as Record<string, ImageResults | Error>,
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
      const stillGenerating = this.stillGenerating(resultsItem)
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
              if (stillGenerating) {
                decryptedImages[imagePath] = { name: 'Generating Image', message: 'Image is currently generating...'}
              } else {
                decryptedImages[imagePath] = { name: 'Image Unavailable', message: 'Image not found' }
              }
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
    expectedError(item: any) {
      return item as Error
    },
    stillGenerating(resultsItem: ImageResults) {
      return resultsItem?.generatedFiles?.length < resultsItem?.originalRequest?.batchSize
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

@media screen and (max-width: 800px) {
  .image-browser {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 5px;
  }
  .image-browser > .image-placeholder {
    flex: 1;
  }
  .image-browser > .image-placeholder > img {
    width: 100%;
    height: 100%;
  }
}

</style>