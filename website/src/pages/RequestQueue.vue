<template>
  <div class="column p10">
    <h2>Requests Queue</h2>
    <p>Information about active requests.</p>
    <div class="row p5 left">
      <button @click="refreshData" class="row p5" :disabled="loadingRequests">
        <Icon icon="envelope" />
        <label>Check Requests</label>
      </button>
    </div>
    <h3>Requests</h3>
    <LoadingSpinner v-if="loadingRequests" />
    <p v-if="(requests?.length ?? 0) === 0" class="warning">No requests found</p>
    <p v-if="requestsStatus" class="warning">{{ requestsStatus }}</p>
    <div class="column p5">
      <div v-for="item in requests" :key="item?.messageId" class="column p5 request-card card">
        <div class="row p5 stretch">
          <label>Message ID</label>
          <label>{{ item?.messageId }}</label>
        </div>
        <div class="row p5 stretch">
          <label>Request ID</label>
          <label>{{ item?.requestId }}</label>
        </div>
        <div class="row p5 stretch">
          <label>Type</label>
          <label>{{ item?.type }}</label>
        </div>
        <div class="row p5 stretch">
          <label>Positive</label>
          <label>{{ item?.positive }}</label>
        </div>
        <div class="row p5 stretch">
          <label>Negative</label>
          <label>{{ item?.negative }}</label>
        </div>
        <div class="row p5 stretch">
          <label>Width</label>
          <label>{{ item?.width }}</label>
        </div>
        <div class="row p5 stretch">
          <label>Height</label>
          <label>{{ item?.height }}</label>
        </div>
        <div class="row p5 stretch">
          <label>Batch Size</label>
          <label>{{ item?.batchSize }}</label>
        </div>
        <div class="row p5 stretch">
          <label>Model</label>
          <label>{{ item?.model }}</label>
        </div>
        <div class="row p5 stretch">
          <label>Request Time</label>
          <label>{{ item?.requestTime }}</label>
        </div>
        <div class="row p5 right">
          <button @click="deleteRequest(item)" class="row p5">
            <Icon icon="trash" />
            <label>Delete Request</label>
          </button>
        </div>
      </div>
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
      loadingRequests: false,
      requestsStatus: undefined as string | undefined,
      requests: []
    }
  },
  async mounted() {

  },
  methods: {
    async refreshData() {
      this.loadingRequests = true
      this.requestsStatus = undefined
      try {
        const requestsResponse = await this.imagesApi.getRequests()
        const requestList = requestsResponse?.requests ?? []
        this.requestsStatus = requestsResponse?.message ?? 'Unrecognised response from server'
        this.requests = requestList
      } catch (ex) {
        const error = ex as Error
        this.requestsStatus = error.message
      }
      this.loadingRequests = false
    },
    async deleteRequest(item: any) {
      const updatedRequests = [...this.requests].filter(r => r.receiptHandle !== item?.receiptHandle)
      this.requests = updatedRequests

      const deleteResponse = await this.imagesApi.deleteRequest(item?.receiptHandle)
      console.log('Delete response:', { deleteResponse })
      this.requestsStatus = deleteResponse?.message ?? 'Unrecognised delete response from server'
    }
  }
}
</script>