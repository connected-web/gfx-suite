<template>
  <div class="request-details column p10">
    <h3 class="row">
      <Icon icon="circle-plus" />
      <label>Positive prompt</label>
    </h3>
    <pre><code>{{ resultsItem?.originalRequest?.positive }}</code></pre>
    <h3 class="row">
      <Icon icon="circle-minus" />
      <label>Negative prompt</label>
    </h3>
    <pre><code>{{ resultsItem?.originalRequest?.negative }}</code></pre>

    <h3 class="row">
      <Icon icon="cog" />
      <label>Request Settings</label>
    </h3>
    <div class="column p5">
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
    </div>

    <h3 class="row">
      <Icon icon="list" />
      <label>Lists in use</label>
    </h3>
    <div v-if="listEntries.length === 0" class="row p5 key-value">
      <label>No lists used in this request.</label>
    </div>
    <div v-else class="column p5">
      <div v-for="[listName, listValues] in listEntries" :key="listName" class="column p5 key-value">
        <div class="row p5 stretch">
          <label>{{ listName }}</label>
          <CopyButton @click="copyListValues(listName, listValues)" />
        </div>
        <pre><code>{{ listValues.join('\n') }}</code></pre>
      </div>
    </div>
      
    <h3 class="row">
      <Icon icon="timeline" />
      <label>Timeline</label>
    </h3>
    <div class="column p5">
      <div class="row p5 key-value">
        <label>Request Created</label>
        <label>{{ resultsItem?.originalRequest?.requestTime ?? 'Waiting on server...' }}</label>
      </div>
      <div class="row p5 key-value">
        <label>Processing Started</label>
        <label>{{ resultsItem?.started ?? 'n/a' }}</label>
      </div>
      <div class="row p5 key-value">
        <label>Processing Finished</label>
        <label>{{ resultsItem?.finished ?? 'n/a' }}</label>
      </div>
      <div class="row p5 key-value">
        <label>Results Uploaded</label>
        <label>{{ resultsItem?.uploaded ?? 'n/a' }}</label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ImageResults } from '../../clients/ImagesApi'
import CopyButton from '../../components/CopyButton.vue'
import { useToaster } from '../../composables/useToaster'

export default {
  components: { CopyButton },
  props: {
    resultsItem: {
      type: Object,
      default() {
        return {} as Partial<ImageResults>
      }
    }
  },
  setup() {
    const { showToast } = useToaster()
    return { showToast }
  },
  computed: {
    listEntries(): Array<[string, string[]]> {
      const lists = this.resultsItem?.originalRequest?.lists
      return Object.entries(lists ?? {})
    }
  },
  methods: {
    async copyListValues(listName: string, listValues: string[]) {
      const formattedValues = listValues.map(value => {
        const trimmed = value.trim()
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
          return trimmed
        }
        return `(${trimmed})`
      })
      const contents = [`${listName}:`, ...formattedValues].join('\n')
      const tokenCount = contents.trim().length > 0 ? contents.trim().split(/\s+/).length : 0
      const byteLength = new TextEncoder().encode(contents).length
      let copied = false
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(contents)
          copied = true
        }
      } catch {
        // Fallback below.
      }

      if (!copied) {
        const textArea = document.createElement('textarea')
        textArea.value = contents
        textArea.style.position = 'fixed'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        copied = document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      if (copied) {
        this.showToast(`Copied "${listName}" (${tokenCount} tokens, ${byteLength} bytes)`)
      }
    }
  }
}
</script>

<style scoped>
.key-value > * {
  flex: 1;
}
.key-value > * {
  font-family: monospace;
  padding: 4px;
  background: #eee;
}

.key-value > label:nth-child(2) {
  font-weight: bold;
  text-align: right;
}

pre {
  margin: 0;
  text-wrap: wrap;
}
</style>
