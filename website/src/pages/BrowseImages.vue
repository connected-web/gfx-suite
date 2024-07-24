<template>
  <div class="column p5">
    <h2 class="row p5">
      <Icon icon="image" />
      <label>Browse Images</label>
    </h2>
    <p>Generated images live here!</p>
    <div v-if="loadingResults" class="loading row p5 left">
      <LoadingSpinner />
      <label>Loading results...</label>
    </div>
    <div v-else>
      <div v-for="(resultsItem, requestId) in results" class="column p5">
        <h3 class="row">
          <Icon icon="circle-plus" />
          <label>Positive prompt</label>
        </h3>
        <pre><code>{{ resultsItem?.originalRequest?.positive }}</code></pre>
        <h3 class="row">
          <Icon icon="circle-minus" />
          <label>Negative prompt</label>
        </h3>
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
        <pre><code>{{ resultsItem?.originalRequest?.negative }}</code></pre>
        <pre><code>{{ resultsItem }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ImagesApiClient, { ImageResults} from '../clients/ImagesApi' 
import LoadingSpinner from '../components/LoadingSpinner.vue'

const stubRequestId = 'ab80b8a4-564a-46e5-9e85-87d1ab0ea6f6'
const stubDateCode = '2024-07-24'
const imagesApiClient = new ImagesApiClient()

export default {
  components: { LoadingSpinner },
  data() {
    return {
      results: {} as Record<string, ImageResults>,
      loadingResults: false
    }
  },
  async mounted() {
    this.loadResults()
  },
  methods: {
    async loadResults() {
      this.loadingResults = true
      const dateCode = stubDateCode
      const requestId = stubRequestId
      const resultsEntry = await imagesApiClient.getResults(dateCode, requestId)
      console.log('[Load Results]', { resultsEntry })
      this.results[requestId] = resultsEntry
      this.loadingResults = false
    }
  }
}

</script>

<style scoped>
.key-value > * {
  min-width: 20vw;
  font-family: monospace;
  padding: 4px;
  background: #eee;
}

.key-value > label:nth-child(2) {
  font-weight: bold;
}
</style>