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

    <div v-else-if="loadingResults && !resultsItem" class="loading row p5 left">
      <LoadingSpinner />
      <label>Loading results...</label>
    </div>
    <div v-else-if="requestId">
      <div v-if="resultsError?.message" class="row p5 key-value warning">
        <label>Error:</label>
        <span>{{ resultsError?.message }}</span>
      </div>
      <div v-else class="column p5">
        <Navigation :items="tabItems" />
        <RequestDetails v-if="tab === 'details'" :resultsItem="resultsItem" />
        <ImageBrowser v-if="tab === '' || tab === 'images'" :resultsItem="resultsItem" :decryptedImages="decryptedImages" />

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
import Navigation from '../components/Navigation.vue'

import RequestBrowser from './components/RequestBrowser.vue'
import RequestDetails from './components/RequestDetails.vue'
import ImageBrowser from './components/ImageBrowser.vue'

const imagesApiClient = new ImagesApiClient()

let imageUtils: ImageUtils
let reloadTimeout: number

const tabItems = [{
  title: 'Images ({{imageCount}})',
  path: '?',
  subpath: 'images',
  icon: 'image'
}, {
  title: 'Details',
  path: '?',
  subpath: 'details',
  icon: 'list'
}]

function clone(data: any): any {
  return JSON.parse(JSON.stringify(data))
}

export default {
  components: { LoadingSpinner, Navigation, RequestBrowser, RequestDetails, ImageBrowser },
  props: {
    dateCode: {
      type: String,
      default: undefined
    },
    requestId: {
      type: String,
      default: undefined
    },
    tab: {
      type: String,
      default: 'images'
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
    tabItems() {
      const { dateCode, requestId, resultsItem } = this
      return clone(tabItems).map((item: any) => {
        console.log({ dateCode, requestId, subpath: item.subpath })
        item.path = '/browse/' + [dateCode, requestId, item.subpath].join('/')
        item.title = item.title.replaceAll('{{imageCount}}', resultsItem?.generatedFiles?.length ?? '?')
        return item
      })
    },
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
      if (this.expectedError(resultsEntry as any)?.message === 'The specified key does not exist.') {
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
    stillGenerating(resultsItem: ImageResults) {
      return resultsItem?.generatedFiles?.length < resultsItem?.originalRequest?.batchSize
    },
    expectedError(image: string | Error) {
      if (image instanceof Error) {
        return image
      }
      return null
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

</style>