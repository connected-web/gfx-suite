<template>
  <div class="column p5">
    <h2 class="row p5">
      <Icon icon="paint-roller" />
      <label>Create Image</label>
    </h2>
    <p>Use this form to request an image to generate.</p>
    <textarea v-model="prompt" :disabled="sendingPrompt" placeholder="Describe the image to generate..."></textarea>

    <div class="row p5 stretch">
      <div class="row p5 top">
        <label>Batch size:</label>
        <div class="row p5 stretch">
          <input type="number" v-model="batchSize" placeholder="Batch size" />
        </div>
      </div>
      <div class="row p5 stretch top">
        <label>Image Dimensions</label>
        <div class="row p5 stretch">
          <input type="number" v-model="imageWidth" placeholder="Image width" :step="64">
          <input type="number" v-model="imageHeight" placeholder="Image height" :step="64">
        </div>
      </div>
    </div>

    <select v-if="promptHistory?.length > 0" v-model="prompt">
      <option value="">Choose a previous prompt...</option>
      <option v-for="prompt in promptHistory" :value="prompt">{{ String(prompt).substring(0, 100) }}...</option>
    </select>
    <select v-else disabled>
      <option value="">Prompt history: No previous prompts</option>
    </select>

    <div class="row p5 center">
      <button @click="sendPrompt" :disabled="sendingPrompt || promptSent" class="row p5">
        <LoadingSpinner v-if="sendingPrompt" />
        <Icon v-else icon="paper-plane" />
        <label>Send Prompt</label>
      </button>
    </div>

    <div v-if="sendingPrompt" class="warning row p10">
      <span class="loading-animation"></span>
      <span>Sending prompt...</span>
    </div>
    <div v-else-if="promptStatus" class="warning row p10">
      <Icon :icon="promptIcon" />
      <span>{{ promptStatus }}</span>
    </div>
  </div>
</template>

<script lang="ts">

import ImagesApiClient, { ImageResults } from '../clients/ImagesApi'
import promptHistory from '../components/PromptHistory'
import RequestHistory from '../components/RequestHistory'

import LoadingSpinner from '../components/LoadingSpinner.vue'
import Auth from '../Auth'

function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const defaultNegativePrompt = '((low quality)) (large) (fat) (thin) (penis) (deformed) (ugly) (unhealthy)'

export default {
  components: { LoadingSpinner },
  props: {
    dateCode: {
      type: String,
      default: ''
    },
    requestId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      title: 'GFX Suite',
      description: 'This site provides authenticated access to the Connected Web Images API.',
      promptHistory: [] as string[],
      prompt: '',
      images: [] as string[],
      batchSize: 10,
      imageWidth: 512,
      imageHeight: 768,
      imagesApi: new ImagesApiClient(),
      sendingPrompt: false,
      promptSent: false,
      promptIcon: '',
      promptStatus: ''
    }
  },
  async mounted() {
    this.promptHistory = promptHistory.getHistory()
    if (this.dateCode && this.requestId) {
      await this.populatePromptFromExistingRecord(this.dateCode, this.requestId)
    }
  },
  methods: {
    async populatePromptFromExistingRecord(dateCode: string, requestId: string) {
      const existingRecord: ImageResults = await this.imagesApi.getResults(dateCode, requestId)
      const { positive, batchSize, width, height } = existingRecord?.originalRequest ?? {}
      this.prompt = positive ?? ''
      this.batchSize = batchSize ?? 10
      this.imageWidth = Number.parseInt(String(width ?? 512))
      this.imageHeight = Number.parseInt(String(height ?? 768))
    },
    async sendPrompt() {
      this.sendingPrompt = true
      try {
        const requestId = guid()
        const now = new Date()
        const dateCode = now.toISOString().slice(0, 10)
        const requestItem = {
          requestId,
          userId: Auth.instance?.principalId,
          dateCode,
          positive: this.prompt,
          negative: defaultNegativePrompt,
          batchSize: this.batchSize,
          type: 'image-batch',
          width: this.imageWidth,
          height: this.imageHeight
        }
        const initialResults: ImageResults = {
          originalRequest: requestItem,
          started: now,
          finished: 'n/a',
          uploaded: 'n/a',
          generatedFiles: [],
          initializationVectors: []
        }
        await this.imagesApi.putResults(initialResults)
        await this.imagesApi.putRequest(requestId, requestItem)
        RequestHistory.add(requestItem)
        this.promptHistory = promptHistory.add(this.prompt)
        this.promptIcon = 'check'
        this.promptStatus = 'Prompt sent successfully.'
        this.promptSent = true
        const { $router } = this
        setTimeout(() => {
          $router.push(`/browse/${dateCode}/${requestId}`)
        }, 2000)
      } catch (error) {
        this.promptIcon = 'exclamation-triangle'
        this.promptStatus = 'Failed to send prompt.'
      } finally {
        this.sendingPrompt = false
      }
    }
  }
}
</script>

<style scoped>
input, select {
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 5px;
  font-family: monospace;
}
textarea {
  height: 100px;
  min-height: 100px;
  resize: vertical;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-family: monospace;
}
select {
  overflow: hidden;
  width: 100%;
}
@media screen and (max-width: 800px) {
  .row.stretch {
    flex-wrap: wrap;
  }
}
</style>