<template>
  <div class="column p10">
    <h2 class="row p5">
      <Icon icon="rectangle-list" />
      <label>Status</label>
    </h2>
    <p>Information about the service.</p>
    <div class="row p5 left">
      <button @click="refreshData" class="row p5" :disabled="loadingStatus">
        <Icon icon="chart-simple" />
        <label>Check Status</label>
      </button>
    </div>
    <h3>Service Status</h3>
    <div v-if="loadingStatus" class="row p5 left">
      <LoadingSpinner />
      <label>Loading service status...</label>
    </div>
    <div v-else>
      <pre><code>{{ status }}</code></pre>
    </div>
  </div>
</template>

<script lang="ts">
import ImagesApiClient from '../clients/ImagesApi'
import LoadingSpinner from '../components/LoadingSpinner.vue'

export default {
  components: { LoadingSpinner },
  data() {
    return {
      imagesApi: new ImagesApiClient(),
      loadingStatus: false,
      status: undefined as any | undefined,
      statusError: undefined as string | undefined
    }
  },
  async mounted() {
    await this.refreshData()
  },
  methods: {
    async refreshData() {
      this.loadingStatus = true
      this.status = undefined
      this.statusError = undefined
      try {
        const statusResponse = await this.imagesApi.getStatus()
        this.status = statusResponse
      } catch (ex) {
        const error = ex as Error
        this.statusError = error.message
      }
      this.loadingStatus = false
    }
  }
}
</script>