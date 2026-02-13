<template>
  <div class="image-browser column p10">
    <h3 class="row p5">
      <Icon icon="image" />
      <label>Images</label>
      <span class="spacer"></span>
  <Icon icon="calculator">{{ resultsItem?.generatedFiles?.length ?? 0 }}</Icon>
    </h3>
    <div v-if="!viewerOpen" class="image-browser">
      <div v-for="(imagePath, index) in resultsItem?.generatedFiles" :key="imagePath"
        class="row column center image-placeholder"
        :style="{ minWidth: imageWidth(resultsItem, 'px'), height: imageHeight(resultsItem, 'px'), aspectRatio: `auto ${imageWidth(resultsItem, '')}/${imageHeight(resultsItem, '')}` }">
        <div v-if="decryptedImages[imagePath] === 'loading'" class="row p5 left">
          <LoadingSpinner />
          <label>Loading image...</label>
        </div>
        <div
          v-else-if="expectedError(decryptedImages[imagePath])?.name ?? expectedError(decryptedImages[imagePath])?.message">
          <div class="column center">
            <LoadingSpinner v-if="stillGenerating(resultsItem as any)" />
            <Icon v-else icon="heart-crack" />
            <pre><code>{{ expectedError(decryptedImages[imagePath])?.name }}</code></pre>
            <pre><code>{{ expectedError(decryptedImages[imagePath])?.message }}</code></pre>
          </div>
        </div>
        <img
          v-else-if="decryptedImages[imagePath]"
          :src="String(decryptedImages[imagePath])"
          :width="imageWidth(resultsItem)"
          :height="imageHeight(resultsItem)"
          @error="onImageError(imagePath)"
          @click="openViewer(Number(index))"
        />
        <div v-else>
          <Icon icon="image" />
        </div>
      </div>
    </div>

    <div v-if="viewerOpen" class="viewer-overlay">
      <div class="viewer-zone top" @click="closeViewer">
        <Icon icon="xmark" class="viewer-hint" />
      </div>
      <div class="viewer-zone left" @click="showPrevious">
        <Icon icon="chevron-left" class="viewer-hint" />
      </div>
      <div class="viewer-zone right" @click="showNext">
        <Icon icon="chevron-right" class="viewer-hint" />
      </div>

      <div class="viewer-image-wrap">
        <img
          v-if="currentImagePath && decryptedImages[currentImagePath] && !expectedError(decryptedImages[currentImagePath])"
          :src="String(decryptedImages[currentImagePath])"
          class="viewer-image"
        />
        <div v-else class="viewer-status">
          <LoadingSpinner />
          <label>Image unavailable</label>
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
  data() {
    return {
      viewerOpen: false,
      currentIndex: 0,
      syncingFromRoute: false
    }
  },
  computed: {
    currentImagePath(): string | undefined {
      return this.resultsItem?.generatedFiles?.[this.currentIndex]
    },
    imageCount(): number {
      return this.resultsItem?.generatedFiles?.length ?? 0
    }
  },
  watch: {
    viewerOpen(value: boolean) {
      if (value) {
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', this.onViewerKeydown)
        if (!this.syncingFromRoute) {
          this.syncRouteState()
        }
        return
      }
      document.body.style.overflow = ''
      window.removeEventListener('keydown', this.onViewerKeydown)
      if (!this.syncingFromRoute) {
        this.syncRouteState()
      }
    },
    currentIndex() {
      if (!this.syncingFromRoute) {
        this.syncRouteState()
      }
    },
    '$route.query': {
      handler() {
        this.applyRouteState()
      },
      deep: true
    },
    imageCount() {
      this.applyRouteState()
    }
  },
  mounted() {
    this.applyRouteState()
  },
  unmounted() {
    document.body.style.overflow = ''
    window.removeEventListener('keydown', this.onViewerKeydown)
  },
  methods: {
    imageWidth(resultsItem: Partial<ImageResults>, unit = 'px') {
      const width = Math.floor((resultsItem?.originalRequest?.width ?? 100) / 2)
      return `${width ?? 0}${unit}`
    },
    imageHeight(resultsItem: Partial<ImageResults>, unit = 'px') {
      const height = Math.floor((resultsItem?.originalRequest?.height ?? 100) / 2)
      return `${height ?? 0}${unit}`
    },
    stillGenerating(resultsItem: ImageResults) {
      return resultsItem?.generatedFiles?.length < resultsItem?.originalRequest?.batchSize
    },
    expectedError(image: string | Error) {
      if (image instanceof Error) {
        return image
      }
      return null
    },
    onImageError(imagePath: string) {
      this.decryptedImages[imagePath] = new Error('Missing image data')
    },
    openViewer(index: number) {
      this.currentIndex = index
      this.viewerOpen = true
    },
    closeViewer() {
      this.viewerOpen = false
    },
    showPrevious() {
      const count = this.resultsItem?.generatedFiles?.length ?? 0
      if (count === 0) return
      this.currentIndex = (this.currentIndex - 1 + count) % count
    },
    showNext() {
      const count = this.resultsItem?.generatedFiles?.length ?? 0
      if (count === 0) return
      this.currentIndex = (this.currentIndex + 1) % count
    },
    onViewerKeydown(event: KeyboardEvent) {
      if (!this.viewerOpen) return
      if (event.key === 'Escape') {
        event.preventDefault()
        this.closeViewer()
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        this.showPrevious()
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        this.showNext()
      }
    },
    routeLightboxOpen(): boolean {
      return String(this.$route?.query?.lightbox ?? '') === '1'
    },
    routeImageIndex(): number {
      const routeIndex = Number(this.$route?.query?.image)
      if (Number.isNaN(routeIndex)) {
        return 0
      }
      if (routeIndex < 0) {
        return 0
      }
      if (routeIndex >= this.imageCount) {
        return Math.max(this.imageCount - 1, 0)
      }
      return routeIndex
    },
    applyRouteState() {
      const shouldOpen = this.routeLightboxOpen()
      if (!shouldOpen || this.imageCount === 0) {
        if (this.viewerOpen) {
          this.syncingFromRoute = true
          this.viewerOpen = false
          this.syncingFromRoute = false
        }
        return
      }
      const nextIndex = this.routeImageIndex()
      this.syncingFromRoute = true
      this.currentIndex = nextIndex
      this.viewerOpen = true
      this.syncingFromRoute = false
    },
    syncRouteState() {
      const nextQuery = { ...this.$route.query } as Record<string, any>
      if (this.viewerOpen && this.imageCount > 0) {
        nextQuery.lightbox = '1'
        nextQuery.image = String(this.currentIndex)
      } else {
        delete nextQuery.lightbox
        delete nextQuery.image
      }
      const currentLightbox = String(this.$route?.query?.lightbox ?? '')
      const currentImage = String(this.$route?.query?.image ?? '')
      const nextLightbox = String(nextQuery.lightbox ?? '')
      const nextImage = String(nextQuery.image ?? '')
      if (currentLightbox === nextLightbox && currentImage === nextImage) {
        return
      }
      this.$router.replace({ query: nextQuery }).catch(() => undefined)
    }
  }
}
</script>

<style scoped>
.image-placeholder {
  background: #f0f0f0;
}

.image-placeholder img {
  cursor: pointer;
}

.image-browser {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.viewer-image-wrap {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: 0;
  box-sizing: border-box;
}

.viewer-image {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.viewer-status {
  color: #fff;
  display: flex;
  gap: 10px;
  align-items: center;
}

.viewer-zone {
  position: absolute;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.45);
  user-select: none;
  cursor: pointer;
}

.viewer-zone:hover {
  color: rgba(255, 255, 255, 0.85);
}

.viewer-zone.top {
  top: 0;
  left: 0;
  right: 0;
  height: 16vh;
}

.viewer-zone.left {
  top: 16vh;
  left: 0;
  bottom: 0;
  width: 35vw;
  justify-content: flex-start;
  padding-left: 18px;
}

.viewer-zone.right {
  top: 16vh;
  right: 0;
  bottom: 0;
  width: 35vw;
  justify-content: flex-end;
  padding-right: 18px;
}

.viewer-hint {
  font-size: 2rem;
  opacity: 0.9;
}

@media screen and (max-width: 800px) {
  .viewer-image-wrap {
    padding: 0;
  }

  .viewer-zone.top {
    height: 14vh;
  }

  .viewer-zone.left,
  .viewer-zone.right {
    top: 14vh;
    width: 44vw;
  }

  .viewer-hint {
    font-size: 1.6rem;
  }
}

@media screen and (max-width: 800px) {
  .image-browser {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 5px;
  }

  .image-browser>.image-placeholder {
    flex: 1;
  }

  .image-browser>.image-placeholder>img {
    width: 100%;
    height: 100%;
  }
}


@media screen and (max-width: 512px) {
  .image-browser {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 5px;
  }

  .image-browser>.image-placeholder {
    flex: 1;
  }

  .image-browser>.image-placeholder>img {
    width: 100%;
    height: 100%;
  }
}
</style>
