<template>
  <div class="request-browser">
    <div class="column p5">

      <Navigation :items="yearTabs" />

      <div v-if="searchPrefix?.length > 0" class="column p5">
        <div v-if="remoteResults?.results?.length === 0">
          <label>No results found.</label>
        </div>
        <div v-else-if="remoteResults?.results?.length > 0">
          <label>{{ remoteResults?.results?.length ?? '?' }} Results found:</label>
        </div>
        <div v-else class="row p5">  
          <label>Loading results from</label>
          <label>{{ searchPrefix }}.</label>
        </div>
      
        <div v-for="requestItem in remoteResults?.results">
          <router-link :to="`/browse/${requestItem?.dateCode}/${requestItem?.requestId?.replace('.json', '')}`" class="row p5">
            <label>{{ requestItem?.dateCode }}</label> /
            <label><code>{{ (requestItem?.requestId ?? '').slice(0, 8).toUpperCase() }}</code></label> /
            <label>{{ promptSummary(requestItem) }}</label>
            <label>({{ requestItem.batchSize ?? '~'  }})</label> 
          </router-link>
        </div>
      </div>

      <div v-else class="column p5">
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
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ImagesApiClient, { ImageResults, ImageRequest } from '../../clients/ImagesApi' 
import RequestHistory from '../../components/RequestHistory'
import PromptHistory from '../../components/PromptHistory'

import Navigation from '../../components/Navigation.vue'

const imagesApiClient = new ImagesApiClient()

const currentYear = new Date().getFullYear()
function yearCodesSince(year: number) {
  const years = []
  for (let i = year; i <= currentYear; i++) {
    years.push(i.toString().slice(0))
  }
  return years
}

export default {
  components: { Navigation },
  props: {
    searchPrefix: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      requestHistory: [] as ImageRequest[],
      remoteResults: [] as ImageRequest[],
      yearCodes: yearCodesSince(2024)
    };
  },
  computed: {
    yearTabs() {
      const yearParts = this.yearCodes.map((yearCode) => {
        return {
          title: yearCode,
          path: `/browse/${yearCode}`,
          subpath: 'images',
          icon: 'calendar'
        }
      })
      return [{
        title: 'Recent',
        path: `/browse`,
        subpath: 'images',
        icon: 'clock-rotate-left',
      }, ...yearParts]
    }
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
    if (this.searchPrefix !== '') {
      this.remoteResults = await imagesApiClient.listRequestsForCurrentUser(this.searchPrefix)
    }
  },
  watch: {
    async searchPrefix() {
      this.remoteResults = []
      this.remoteResults = await imagesApiClient.listRequestsForCurrentUser(this.searchPrefix)
    }
  }
}
</script>
