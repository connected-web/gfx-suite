<template>
  <div class="column p10">
    <h2 class="row p5">
      <Icon icon="paint-roller" />
      <label>Create Image</label>
    </h2>
    <p>Choose a style:</p>
    <div class="row p5 stretch">
      <button @click="selectModel('anime')" :class="{ selected: modelSelection === 'anime', 'row center': true }">
        <Icon icon="face-grin-wink">Anime</Icon>
      </button>
      <button @click="selectModel('realistic')" :class="{ selected: modelSelection === 'realistic', 'row center': true }">
        <Icon icon="camera">Realistic</Icon>
      </button>
    </div>

    <h4>Positive Prompt</h4>
    <PromptTokenEditor
      v-model="prompt"
      :disabled="sendingPrompt"
      @edit-token="openTokenEditor"
      @new-token="newToken"
    />
    <hr />

    <h4>Negative Prompt</h4>
    <PromptTokenEditor
      v-model="negativePrompt"
      :disabled="sendingPrompt"
      @edit-token="openTokenEditor"
      @new-token="newToken"
    />
    <hr />

    <h4>Dimensions</h4>
    <div class="card row p5 stretch">
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

    <hr />

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
    
    <hr />

    <div class="column p5">
      <h3>Verification</h3>
      <h4>Positive Prompt</h4>
      <pre class="card"><code>{{ prompt }}</code></pre>
      <h4>Negative Prompt</h4>
      <pre class="card"><code>{{ negativePrompt }}</code></pre>
      <h4>Lists</h4>
      <pre class="card"><code>{{ lists }}</code></pre>
    </div>

    <TokenEditorModal
      v-if="tokenEditOpen"
      :index="tokenEdit.index"
      :token="tokenEdit.token"
      :lists="lists"
      :usageMap="listUsageCounts"
      @save="applyTokenEdit"
      @delete="deleteToken"
      @deleteList="deleteList"
      @close="closeTokenEditor"
    />
  </div>
</template>

<script lang="ts">
import ImagesApiClient, { ImageResults } from '../clients/ImagesApi'
import PromptTokenEditor from './components/PromptTokenEditor.vue'
import TokenEditorModal from './components/TokenEditorModal.vue'
import promptHistory from '../components/PromptHistory'
import RequestHistory from '../components/RequestHistory'

import LoadingSpinner from '../components/LoadingSpinner.vue'
import Auth from '../Auth'

function guid () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const defaultNegativePrompt = '((low quality))'

// token helpers (kept here to avoid extra imports)
const tokenRegex = /(\{list:[^}]+\}|\([^()]+\)|\S+)/g

function parsePrompt (prompt: string) {
  return (prompt.match(tokenRegex) || []).map(t => {
    if (t.startsWith('{list:')) return { type: 'list', value: t }
    if (t.startsWith('(') && t.endsWith(')')) return { type: 'priority', value: t.slice(1, -1) }
    return { type: 'normal', value: t }
  })
}

function stringifyTokens (tokens: any[]) {
  return tokens
    .filter(t => typeof t.value === 'string' && t.value.trim().length > 0 || t.type === 'list')
    .map(t => {
      if (t.type === 'priority') return `(${t.value})`
      if (t.type === 'list') return t.value
      return t.value
    })
    .join(' ')
}

function listNameFromToken (token: any) {
  if (token.type === 'list') return token.value.replace('{list:', '').replace('}', '')
  return (token.value || '').trim()
}

export default {
  components: { LoadingSpinner, PromptTokenEditor, TokenEditorModal },
  props: {
    dateCode: { type: String, default: '' },
    requestId: { type: String, default: '' }
  },
  data () {
    return {
      title: 'GFX Suite',
      description: 'This site provides authenticated access to the Connected Web Images API.',
      promptHistory: [] as string[],
      modelSelection: 'anime',
      prompt: '',
      negativePrompt: '',
      lists: {} as { [key: string]: string[] },
      images: [] as string[],
      batchSize: 10,
      imageWidth: 512,
      imageHeight: 768,
      imagesApi: new ImagesApiClient(),
      sendingPrompt: false,
      promptSent: false,
      promptIcon: '',
      promptStatus: '',

      tokenEditOpen: false,
      tokenEdit: { index: -1, token: { type: 'normal', value: '' } as any }
    }
  },
  computed: {
    listUsageCounts (): Record<string, number> {
      const counts: Record<string, number> = {}
      const tokens = parsePrompt(this.prompt)
      tokens.forEach(t => {
        if (t.type === 'list') {
          const name = listNameFromToken(t)
          counts[name] = (counts[name] || 0) + 1
        }
      })
      // include zero counts for existing lists so they show up
      Object.keys(this.lists).forEach(name => { if (!(name in counts)) counts[name] = 0 })
      return counts
    }
  },
  async mounted () {
    this.promptHistory = promptHistory.getHistory()
    if (this.dateCode && this.requestId) {
      await this.populatePromptFromExistingRecord(this.dateCode, this.requestId)
    }
  },
  methods: {
    async populatePromptFromExistingRecord (dateCode: string, requestId: string) {
      const existingRecord: ImageResults = await this.imagesApi.getResults(dateCode, requestId)
      const { positive, negative, batchSize, width, height, model, lists } = existingRecord?.originalRequest ?? {}
      this.modelSelection = model ?? 'anime'
      this.prompt = positive ?? ''
      this.negativePrompt = negative ?? defaultNegativePrompt
      this.batchSize = batchSize ?? 10
      this.imageWidth = Number.parseInt(String(width ?? 512))
      this.imageHeight = Number.parseInt(String(height ?? 768))
      if (lists) this.lists = lists
    },
    async sendPrompt () {
      this.sendingPrompt = true
      try {
        const requestId = guid()
        const now = new Date()
        const dateCode = now.toISOString().slice(0, 10)
        const requestItem = {
          requestId,
          userId: Auth.instance?.principalId,
          dateCode,
          model: this.modelSelection,
          positive: this.prompt,
          negative: this.negativePrompt,
          lists: this.lists,
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
    },
    selectModel (model: string) { this.modelSelection = model },

    // token editor wiring
    openTokenEditor ({ index, token }: any) {
      this.tokenEdit.index = index
      this.tokenEdit.token = { ...token }
      this.tokenEditOpen = true
    },
    closeTokenEditor () { this.tokenEditOpen = false },
    newToken () {
      const tokens = parsePrompt(this.prompt)
      // default new token becomes list-name seeded from empty text when saved
      tokens.push({ type: 'normal', value: '' })
      // open modal immediately for the new token at the end
      this.tokenEdit.index = tokens.length - 1
      this.tokenEdit.token = { type: 'normal', value: '' }
      this.tokenEditOpen = true
      // do not update prompt yet; it will be updated on save or removed on delete/cancel
      // keep a shadow but not committed
    },
    applyTokenEdit ({ index, token, listsPatch }: any) {
      // merge lists patch
      if (listsPatch && typeof listsPatch === 'object') {
        Object.keys(listsPatch).forEach(name => {
          this.lists[name] = listsPatch[name]
        })
      }
      const tokens = parsePrompt(this.prompt)
      // ensure array has an item at index (may be a fresh add)
      while (tokens.length <= index) tokens.push({ type: 'normal', value: '' })
      tokens[index] = token
      this.prompt = stringifyTokens(tokens)
      this.closeTokenEditor()
    },
    deleteToken ({ index }: any) {
      const tokens = parsePrompt(this.prompt)
      if (index >= 0 && index < tokens.length) tokens.splice(index, 1)
      this.prompt = stringifyTokens(tokens)
      this.closeTokenEditor()
    },
    deleteList ({ listName }: any) {
      if (listName && this.lists[listName]) {
        delete this.lists[listName]
        this.prompt = stringifyTokens(parsePrompt(this.prompt).filter(token => token.type !== 'list' || token.value !== `{list:${listName}}`))
      }
      this.closeTokenEditor()
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
  .row.stretch { flex-wrap: wrap }
}
.selected { background-color: #ccc }
</style>