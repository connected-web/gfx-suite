<template>
  <div class="column p5">

    <h2 class="row p5 center">
      <Icon icon="star-half-stroke" />
      <label>Rate Images</label>
    </h2>

    <div class="row p5 stretch">
      <router-link :to="`/browse/${dateCode}/${requestId}`" class="cancel-button row p5 stretch">
        <Icon icon="circle-xmark" class="row center p5">Cancel</Icon>
      </router-link>
    </div>

    <div v-if="loadingResults" class="row p5 center">
      <LoadingSpinner />
      <label>Loading images...</label>
    </div>

    <div v-else-if="!resultsItem" class="row p5 center">
      <label>No results found for this request.</label>
    </div>

    <div v-else class="column p10 center bordered shadowed">

      <div class="row p5 center">
        <label><b>{{ currentIndex + 1 }} / {{ totalImages }}</b></label>
      </div>

      <div v-if="currentImage" class="column p10 center">
        <div class="image-frame" :style="frameStyle">
          <img v-if="decryptedImages[currentImage] && typeof decryptedImages[currentImage] === 'string'"
            :src="String(decryptedImages[currentImage])" class="preview-image" />
          <div
            v-else-if="typeof decryptedImages[currentImage] === 'object' && (decryptedImages[currentImage] as any)?.message !== undefined"
            class="error-display">
            <Icon icon="heart-crack" />
            <label>Error</label>
            <p>{{ (decryptedImages[currentImage] as any).message }}</p>
          </div>
          <div v-else class="error-display">
            <LoadingSpinner />
          </div>
        </div>


        <div class="row p10 stretch spacer">
          <button class="button reject spacer" @click="markReject">Reject</button>
          <button class="button ok spacer" @click="markKeep">Keep</button>
        </div>

        <div class="row p10 stretch">
          <button class="button left" :disabled="currentIndex <= 0" @click="previousImage">
            <Icon icon="circle-chevron-left" />
            <label>Previous</label>
          </button>
          <button class="button right" :disabled="currentIndex >= totalImages - 1" @click="nextImage">
            <label>Next</label>
            <Icon icon="circle-chevron-right" />
          </button>
        </div>

        <div class="row p10 center">
          <label>{{ markedForRemovalCount }} out of {{ totalImages }} images marked for removal</label>
        </div>

        <div class="row p10 center">
          <button class="button save" :disabled="saving" @click="saveChanges">
            <Icon icon="floppy-disk" />
            <label v-if="!saving">Save Changes</label>
            <label v-else>Saving...</label>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ImagesApiClient, { ImageResults } from '../clients/ImagesApi'
import { ImageUtils } from '../clients/ImageUtils'

import LoadingSpinner from '../components/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const imagesApiClient = new ImagesApiClient()

const dateCode = String(route.params.dateCode ?? '')
const requestId = String(route.params.requestId ?? '')

const resultsItem = ref<ImageResults | null>(null)
const decryptedImages = ref<Record<string, string | Error>>({})
const currentIndex = ref(0)
const loadingResults = ref(true)
const saving = ref(false)

let imageUtils: ImageUtils

import type { CSSProperties } from 'vue'

const frameStyle = computed<CSSProperties>(() => {
  const w = resultsItem.value?.originalRequest?.width ?? 512
  const h = resultsItem.value?.originalRequest?.height ?? 512
  const ratio = (h / w) * 100
  return {
    maxWidth: '768px',
    width: '100%',
    position: 'relative' as CSSProperties['position'],
    background: '#efefef',
    border: '1px solid #ddd',
    borderRadius: '6px',
    overflow: 'hidden',
    boxShadow: '0 0 6px rgba(0,0,0,0.1)',
    aspectRatio: `${w} / ${h}`
  }
})

onMounted(async () => {
  const userDetails = await imagesApiClient.getUserDetails()
  imageUtils = new ImageUtils(userDetails?.user?.decryptionKey ?? 'no-decryption-key-found')
  await loadResults()
})

async function loadResults() {
  loadingResults.value = true
  const results = await imagesApiClient.getResults(dateCode, requestId)
  resultsItem.value = results
  await loadImages()
  loadingResults.value = false
}

async function loadImages() {
  const result = resultsItem.value
  if (!result) return
  const paths = result.generatedFiles
  const ivs = result.initializationVectors
  const work = paths.map(async (imagePath, index) => {
    const iv = ivs[index]
    const url = `https://images.connected-web.net/${imagePath}`
    try {
      if (iv && !iv.startsWith('unable-') && !iv.startsWith('marked-for-removal')) {
        const blob = await imageUtils.createImageFromEncryptedUrl(url, iv)
        decryptedImages.value[imagePath] = blob
      } else {
        decryptedImages.value[imagePath] = new Error(iv)
      }
    } catch (ex: any) {
      decryptedImages.value[imagePath] = ex
    }
  })
  await Promise.allSettled(work)
}

const currentImage = computed(() => {
  const paths = resultsItem.value?.generatedFiles ?? []
  return paths[currentIndex.value]
})

const totalImages = computed(() => resultsItem.value?.generatedFiles?.length ?? 0)

function markReject() {
  if (!resultsItem.value) return
  const index = currentIndex.value
  resultsItem.value.initializationVectors[index] = 'marked-for-removal'
  nextImage()
}

function markKeep() {
  if (!resultsItem.value) return
  const index = currentIndex.value
  const iv = resultsItem.value.initializationVectors[index]
  if (iv === 'marked-for-removal') {
    resultsItem.value.initializationVectors[index] = 'restored'
  }
  nextImage()
}

function nextImage() {
  if (currentIndex.value < totalImages.value - 1) currentIndex.value++
}

function previousImage() {
  if (currentIndex.value > 0) currentIndex.value--
}

const markedForRemovalCount = computed(() =>
  resultsItem.value?.initializationVectors.filter(iv => iv === 'marked-for-removal').length ?? 0
)

async function saveChanges() {
  if (!resultsItem.value) return
  saving.value = true
  await imagesApiClient.putResults(resultsItem.value)
  saving.value = false
  router.push(`/browse/${dateCode}/${requestId}`)
}
</script>
<style scoped>
.bordered {
  border: 1px solid #ccc;
  border-radius: 6px;
  justify-content: flex-start;
  background: #f9f9f9;
  padding: 1.5em;
}

.shadowed {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

.preview-image {
  max-width: 100%;
  max-height: 65vh;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #fff;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.15);
  object-fit: contain;
  transition: transform 0.4s ease-out;
}

.preview-image:hover,
.preview-image:focus {
  transform: scale(1.05);
}

.button.ok {
  background: #3c9;
  color: #fff;
}

.button.reject {
  background: #e66;
  color: #fff;
}

.button.save {
  background: #06f;
  color: #fff;
}

.button.cancel {
  color: #fff;
}

.button.left,
.button.right {
  flex: 1;
}

.warning {
  background-color: #ffe9e9;
  color: #900;
  border: 1px solid #e99;
  border-radius: 6px;
  padding: 0.5em 1em;
}

@media (prefers-color-scheme: dark) {
  .column.p10.center {
    background: #2b2b2b;
    border-color: #444;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.05);
  }

  .preview-image {
    background: #222;
    border-color: #444;
  }

  .warning {
    background: #443;
    color: #faa;
    border-color: #855;
  }
}
.preview-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}

.error-display {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.5em;
  color: #333;
  font-size: 0.9em;
}

@media (prefers-color-scheme: dark) {
  .image-frame {
    background: #2b2b2b;
    border-color: #444;
  }

  .error-display {
    color: #ccc;
  }
}
</style>
