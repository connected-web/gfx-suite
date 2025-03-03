<template>
  <div class="request-browser">
    <div class="column p5">

      <Navigation :items="yearTabs" />
      <Navigation v-if="monthTabs.length > 0" :items="monthTabs" />

      <div v-if="searchPrefix?.length > 4" class="column p5">
        <div v-if="remoteResults?.length === 0">
          <label>No results found.</label>
        </div>
        <div v-else-if="remoteResults?.length > 0">
          <label>{{ remoteResults?.length ?? '?' }} Results found:</label>
        </div>

        <div v-if="loadingResults" class="row p5">
          <LoadingSpinner />
          <label>Loading results for {{ searchPrefix }}.</label>
        </div>
      
        <div v-for="(requestItem, index) in remoteResults" :key="requestItem?.requestId" class="column p5">
          <div v-if="remoteResults[index - 1]?.dateCode !== requestItem?.dateCode" class="row p5">
            <label><b>{{ requestItem?.dateCode }}</b></label>
          </div>
          <router-link :to="`/browse/${requestItem?.dateCode}/${requestItem?.requestId?.replace('.json', '')}`" class="row p5">
            <label><code>{{ (requestItem?.requestId ?? '').slice(0, 8).toUpperCase() }}</code></label> /
            <label>{{ promptSummary(requestItem) }}</label>
            <label>({{ enhancedItem(requestItem)?.batchSize ?? '~'  }})</label> 
          </router-link>
        </div>
      </div>

      <div v-if="searchPrefix === '' || searchPrefix === undefined" class="column p5">
        <div class="row p5">
          <p>Recently made requests.</p>
          <span class="spacer"></span>
          <button class="row p5" @click="cleanHistory" :disabled="requestHistory?.length === 0">
            <Icon icon="soap" />
            <label>Clean history</label>
          </button>
        </div>
        <div class="column p5 links">
          <div v-for="(requestItem) in requestHistory" :key="requestItem?.requestId" class="column p5">
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
import ImagesApiClient, { imageMetadataCache, ImageRequest } from '../../clients/ImagesApi' 
import RequestHistory from '../../components/RequestHistory'
import PromptHistory from '../../components/PromptHistory'

import LoadingSpinner from '../../components/LoadingSpinner.vue'
import Navigation from '../../components/Navigation.vue'

const imagesApiClient = new ImagesApiClient()

const earliestDateCode = '2024-07'
const earliestYear = Number.parseInt(earliestDateCode.slice(0, 4))
const earliestMonth = Number.parseInt(earliestDateCode.slice(5, 7))

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

function yearCodesSince(year: number) {
  const years = []
  for (let i = year; i <= currentYear; i++) {
    years.push(i.toString().slice(0))
  }
  return years
}

const monthLabelsShort = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

// Only generate months up to the current month if the year is the current year
function monthCodesForYear(year: number) {
  const months = []
  const endMonth = year === currentYear ? currentMonth : 12
  const startMonth = year === earliestYear ? earliestMonth : 1
  for (let i = startMonth; i <= endMonth; i++) {
    months.push(i.toString().padStart(2, '0'))
  }
  return months
}

export default {
  components: { LoadingSpinner, Navigation },
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
      yearCodes: yearCodesSince(earliestYear),
      loadingResults: false,
      imageMetadataCache
    };
  },
  computed: {
    yearTabs() {
      const yearParts = this.yearCodes.map((yearCode) => {
        return {
          title: yearCode,
          path: `/browse/${yearCode}`,
          icon: 'calendar'
        }
      })
      return [{
        title: 'Recent',
        path: `/browse`,
        icon: 'clock-rotate-left',
      }, ...yearParts]
    },
    monthTabs() {
      const { searchPrefix } = this
      if (searchPrefix.length < 4) {
        return []
      }
      const year = Number.parseInt(searchPrefix.slice(0, 4))
      if (Number.isNaN(year)) {
        return []
      }
      return monthCodesForYear(year).map((monthCode) => {
        return {
          title: monthLabelsShort[Number.parseInt(monthCode) - 1],
          path: `/browse/${year}-${monthCode}`,
          icon: 'calendar-days'
        }
      })
    }
  },
  methods: {
    firstWords(requestItem: ImageRequest) {
      return (requestItem?.positive ?? '').replace(/[()]/g, '').split(' ').slice(0, 2)
    },
    lastWords(requestItem: ImageRequest) {
      return (requestItem?.positive ?? '').replace(/[()]/g, '').split(' ').reverse().slice(0, 2).reverse()
    },
    enhancedItem(requestItem: ImageRequest) {
      const cacheKey = `${requestItem?.dateCode}/${requestItem?.requestId?.replace('.json', '')}`
      const cachedItem = imageMetadataCache.get(cacheKey)?.originalRequest ?? {}
      const mergedItem = {
        ...cachedItem,
        ...requestItem
      }
      return mergedItem
    },
    promptSummary(requestItem: ImageRequest) {
      const mergedItem = this.enhancedItem(requestItem)
      const firstWords = this.firstWords(mergedItem)
      const lastWords = this.lastWords(mergedItem)
      return Array.from(new Set([...firstWords, ...lastWords])).join(' ')
    },
    cleanHistory() {
      RequestHistory.cleanHistory()
      this.requestHistory = []
      PromptHistory.cleanHistory()
    },
    async refreshRemoteRequests() {
      if (this.searchPrefix !== '' && this.searchPrefix.length > 4) {
        this.loadingResults = true
        const remoteResults = await imagesApiClient.listRequestsForCurrentUser(this.searchPrefix)
        this.remoteResults = remoteResults?.results ?? []
        this.loadingResults = false
      } else {
        this.remoteResults = []
      }
    }
  },
  async mounted() {
    this.requestHistory = RequestHistory.getHistory()
    this.refreshRemoteRequests()
  },
  watch: {
    async searchPrefix() {
      this.refreshRemoteRequests()
    }
  }
}
</script>
