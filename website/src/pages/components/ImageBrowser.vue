<template>
  <div class="image-browser column p10">
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
            <LoadingSpinner v-if="stillGenerating(resultsItem as any)" />
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
  </div>
</template>

<script lang="ts">
import { ImageResults } from '../../clients/ImagesApi'
import LoadingSpinner from '../../components/LoadingSpinner.vue'

export default {
  components: { LoadingSpinner },
  props: {
    resultsItem: {
      type: Object,
      default() {
        return {} as Partial<ImageResults>
      }
    },
    decryptedImages: {
      type: Object,
      default() {
        return {} as Record<string, string | Error>
      }
    }
  },
  methods: {
    imageWidth(resultsItem: Partial<ImageResults>, unit = 'px') {
      return `${resultsItem?.originalRequest?.width ?? 0}${unit}`
    },
    imageHeight(resultsItem: Partial<ImageResults>, unit = 'px') {
      return `${resultsItem?.originalRequest?.height ?? 0}${unit}`
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
  }
}
</script>

<style scoped>
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