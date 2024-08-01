<template>
  <div class="request-browser">
    <div class="column p5">
      <h3 class="row p5">
        <label>Recent Images</label>
      </h3>
      <div class="row p5">
        <p>Recently made requests.</p>
        <span class="spacer"></span>
        <button class="row p5" @click="cleanHistory" :disabled="requestHistory?.length === 0">
          <Icon icon="soap" />
          <label>Clean history</label>
        </button>
      </div>
      <div class="column p5 links">
        <div v-for="requestItem in requestHistory">
          <router-link :to="`/browse/${requestItem?.dateCode}/${requestItem?.requestId}`" class="row p5">
            <label>{{ requestItem?.dateCode }}</label> /
            <label><code>{{ (requestItem?.requestId ?? '').slice(0, 8).toUpperCase() }}</code></label> /
            <label>{{ promptSummary(requestItem) }}</label>
            <label>({{ requestItem.batchSize  }})</label> 
          </router-link>
        </div>
      </div>
      <div v-if="requestHistory?.length === 0">
        <label>No request history to browse.</label>
      </div>
      <h3>Remote Images</h3>
      <p>Images available on the server.</p>
      <div v-if="remoteResults?.length === 0">
        <label>No remote image results to browse.</label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ImageRequest } from '../../clients/ImagesApi' 
import RequestHistory from '../../components/RequestHistory'
import PromptHistory from '../../components/PromptHistory'

export default {
  data() {
    return {
      requestHistory: [] as ImageRequest[],
      remoteResults: [] as ImageRequest[],
    };
  },
  methods: {
    firstWords(requestItem: ImageRequest) {
      return (requestItem?.positive ?? '').split(' ').slice(0, 2)
    },
    lastWords(requestItem: ImageRequest) {
      return (requestItem?.positive ?? '').split(' ').reverse().slice(0, 2).reverse()
    },
    promptSummary(requestItem: ImageRequest) {
      const firstWords = this.firstWords(requestItem)
      const lastWords = this.lastWords(requestItem)
      return Array.from(new Set([...firstWords, ...lastWords])).join(' ')
    },
    cleanHistory() {
      RequestHistory.cleanHistory()
      this.requestHistory = []
      PromptHistory.cleanHistory()
    }
  },
  async mounted() {
    this.requestHistory = RequestHistory.getHistory()
  }
}
</script>

<style scoped>
a {
  background: #eee;
  padding: 2px;
  transition: background-color 200ms ease-in;
}
a:hover {
  background: #def;
  padding: 2px;
  transition: background-color 200ms ease-out;
}
</style>