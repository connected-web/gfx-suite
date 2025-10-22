<template>
  <div class="column p5">

    <h2 class="row p5">
      <Icon icon="image" />
      <label>Browse Images</label>
    </h2>

    <div v-if="props.requestId" class="breadcrumbs column p5">
      <router-link :to="`/browse/${String(props.dateCode)?.substring(0, 7)}`" class="back-button row p5 left">
        <Icon icon="circle-arrow-left" />
        <label>Back</label>
      </router-link>
      <div class="row p5 stretch">
        <router-link v-if="previousResultLink() !== undefined" :to="previousResultLink()" class="previous-button row p5 left">
          <Icon icon="circle-chevron-left" />
          <label>Previous</label>
        </router-link>
        <router-link v-if="nextResultsLink() !== undefined" :to="nextResultsLink()" class="next-button row p5 right">
          <label>Next</label>
          <Icon icon="circle-chevron-right" />
        </router-link>
      </div>
    </div>

    <RequestBrowser v-if="!props.requestId" :searchPrefix="props.searchPrefix" />

    <div v-else-if="loadingResults && !resultsItem" class="loading row p5 left">
      <LoadingSpinner />
      <label>Loading results...</label>
    </div>

    <div v-else-if="props.requestId" class="column p5">
      <div v-if="resultsError?.message" class="row p5 key-value warning">
        <label>Error:</label>
        <span>{{ resultsError?.message }}</span>
      </div>
      <div v-else class="column p5">
        <Navigation :items="tabItems.value" />
        <RequestDetails v-if="props.tab === 'details'" :resultsItem="resultsItem" />
        <ImageBrowser v-if="props.tab === '' || props.tab === 'images'" :resultsItem="resultsItem" :decryptedImages="decryptedImages" />

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
            <router-link :to="`/create/${props.dateCode}/${props.requestId}`" class="button row p5 center">
              <Icon icon="paint-roller" />
              <label>Create more?</label>
            </router-link>
          </h3>
        </div>
      </div>

      <div v-if="props.requestId" class="breadcrumbs column p5">
        <router-link :to="`/browse/${String(props.dateCode)?.substring(0, 7)}`" class="back-button row p5 left">
          <Icon icon="circle-arrow-left" />
          <label>Back</label>
        </router-link>
        <div class="row p5 stretch">
          <router-link v-if="previousResultLink() !== undefined" :to="previousResultLink()" class="previous-button row p5 left">
            <Icon icon="circle-chevron-left" />
            <label>Previous</label>
          </router-link>
          <router-link v-if="nextResultsLink() !== undefined" :to="nextResultsLink()" class="next-button row p5 right">
            <label>Next</label>
            <Icon icon="circle-chevron-right" />
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import ImagesApiClient, { imageMetadataCache, ImageResults, ImageRequest } from '../clients/ImagesApi'
import { ImageUtils } from '../clients/ImageUtils'

import LoadingSpinner from '../components/LoadingSpinner.vue'
import Navigation from '../components/Navigation.vue'
import RequestBrowser from './components/RequestBrowser.vue'
import RequestDetails from './components/RequestDetails.vue'
import ImageBrowser from './components/ImageBrowser.vue'

const props = defineProps({
  dateCode: { type: String, default: undefined },
  requestId: { type: String, default: undefined },
  tab: { type: String, default: 'images' },
  searchPrefix: { type: String, default: '' }
})

const imagesApiClient = new ImagesApiClient()
let imageUtils: ImageUtils
let reloadTimeout: number | any

const userDetails = ref<any>({})
const remoteResults = ref<ImageRequest[]>([])
const results = reactive<Record<string, ImageResults | Error>>({})
const loadingResults = ref(false)
const decryptedImages = ref<Record<string, string | Error>>({})

const baseTabItems = [
  { title: 'Images ({{imageCount}})', path: '?', subpath: 'images', icon: 'image' },
  { title: 'Details', path: '?', subpath: 'details', icon: 'list' }
]

function clone(data: any): any {
  return JSON.parse(JSON.stringify(data))
}

const resultsItem = computed(() => results[String(props.requestId)] as ImageResults)
const resultsError = computed(() => results[String(props.requestId)] as Error)

const tabItems = computed(() => {
  const { dateCode, requestId } = props
  return clone(baseTabItems).map((item: any) => {
    item.path = '/browse/' + [dateCode, requestId, item.subpath].join('/')
    item.title = item.title.replaceAll('{{imageCount}}', resultsItem.value?.generatedFiles?.length ?? '?')
    return item
  })
})

async function fetchUserDetails() {
  userDetails.value = await imagesApiClient.getUserDetails()
}

function enhancedItem(requestItem: ImageRequest) {
  const cacheKey = `${requestItem?.dateCode}/${requestItem?.requestId?.replace('.json', '')}`
  const cachedItem = imageMetadataCache.get(cacheKey)?.originalRequest ?? {}
  return { ...cachedItem, ...requestItem }
}

function expectedError(image: string | Error) {
  return image instanceof Error ? image : null
}

function stillGenerating(item: ImageResults) {
  return item?.generatedFiles?.length < item?.originalRequest?.batchSize
}

async function loadResults(dateCode: string, requestId: string) {
  loadingResults.value = true
  const resultsEntry: ImageResults = await imagesApiClient.getResults(dateCode, requestId)
  clearTimeout(reloadTimeout)
  const err = expectedError(resultsEntry as any)
  if (err?.message === 'The specified key does not exist.') {
    results[requestId] = { name: 'Key not found', message: 'Waiting for progress update from server...' } as any
    reloadTimeout = setTimeout(() => loadImagesForRequestId(dateCode, requestId).catch(console.error), 6000 + Math.floor(4000 * Math.random()))
  } else if (resultsEntry?.originalRequest?.batchSize !== resultsEntry?.generatedFiles?.length) {
    results[requestId] = resultsEntry
    reloadTimeout = setTimeout(() => loadImagesForRequestId(dateCode, requestId).catch(console.error), 4000 + Math.floor(4000 * Math.random()))
  } else {
    results[requestId] = resultsEntry
  }
  loadingResults.value = false
}

async function loadImages(requestId: string) {
  const resultsItemValue = results[requestId] as ImageResults
  if (!resultsItemValue) return
  const still = stillGenerating(resultsItemValue)
  if (resultsItemValue?.generatedFiles?.length > 0) {
    const imagePaths = resultsItemValue.generatedFiles
    const imageIVs = resultsItemValue.initializationVectors
    const work = imagePaths.map(async (imagePath, index) => {
      const url = `https://images.connected-web.net/${imagePath}`
      const iv = imageIVs[index]
      decryptedImages.value[imagePath] = 'loading'
      try {
        const imageBlob = await imageUtils.createImageFromEncryptedUrl(url, iv)
        decryptedImages.value[imagePath] = imageBlob
      } catch (ex: any) {
        if (ex.name === 'OperationError') {
          decryptedImages.value[imagePath] = still
            ? { name: 'Generating Image', message: 'Image is currently generating...' }
            : { name: 'Image Unavailable', message: 'Image not found' }
        } else {
          decryptedImages.value[imagePath] = ex
          console.log('Image load error:', ex)
        }
      }
    })
    await Promise.allSettled(work)
  }
}

async function loadImagesForRequestId(dateCode: string, requestId: string) {
  await loadResults(dateCode, requestId)
  await loadImages(requestId)
}

async function refreshRemoteRequests() {
  const searchPrefix = props.dateCode?.substring(0, 7) ?? ''
  if (searchPrefix && searchPrefix.length > 4) {
    loadingResults.value = true
    const remote = await imagesApiClient.listRequestsForCurrentUser(searchPrefix)
    remoteResults.value = remote?.results ?? []
    loadingResults.value = false
  } else {
    remoteResults.value = []
  }
}

function previousResultLink() {
  const index = remoteResults.value.findIndex(i => String(i.requestId).replace('.json', '') === props.requestId)
  if (index > 0) {
    const prev = remoteResults.value[index - 1]
    return `/browse/${prev.dateCode}/${String(prev.requestId).replace('.json', '')}`
  }
}

function nextResultsLink() {
  const index = remoteResults.value.findIndex(i => String(i.requestId).replace('.json', '') === props.requestId)
  if (index < remoteResults.value.length - 1) {
    const next = remoteResults.value[index + 1]
    return `/browse/${next.dateCode}/${String(next.requestId).replace('.json', '')}`
  }
}

onMounted(async () => {
  await fetchUserDetails()
  imageUtils = new ImageUtils(userDetails.value?.user?.decryptionKey ?? 'no-decryption-key-found')
  if (props.dateCode && props.requestId) {
    await loadImagesForRequestId(props.dateCode, props.requestId)
  }
  await refreshRemoteRequests()
})

onUnmounted(() => clearTimeout(reloadTimeout))

watch(() => props.requestId, async newVal => {
  if (props.dateCode && (props.requestId || newVal)) {
    await loadImagesForRequestId(String(props.dateCode ?? ''), String(props.requestId ?? newVal ?? ''))
  }
})

watch(() => props.dateCode, () => refreshRemoteRequests())
</script>

<style scoped>
@media screen and (max-width: 800px) {
  .back-button,
  .previous-button,
  .next-button {
    padding: 1em;
  }
}
</style>
