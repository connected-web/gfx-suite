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
      :model-value="prompt"
      @update:model-value="prompt = $event"
      :disabled="sendingPrompt"
      @edit-token="openTokenEditor('positive', $event)"
      @new-token="newToken('positive')"
    />
    <hr />

    <h4>Negative Prompt</h4>
    <PromptTokenEditor
      :model-value="negativePrompt"
      @update:model-value="negativePrompt = $event"
      :disabled="sendingPrompt"
      @edit-token="openTokenEditor('negative', $event)"
      @new-token="newToken('negative')"
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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ImagesApiClient, { ImageResults } from '../clients/ImagesApi'
import PromptTokenEditor from './components/PromptTokenEditor.vue'
import TokenEditorModal from './components/TokenEditorModal.vue'
import promptHistory from '../components/PromptHistory'
import RequestHistory from '../components/RequestHistory'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import Auth from '../Auth'

// Props
const props = defineProps<{
  dateCode?: string
  requestId?: string
}>()

// Router
const router = useRouter()

// Constants
const defaultNegativePrompt = '((low quality))'
const tokenRegex = /(\{list:[^}]+\}|\([^()]+\)|\S+)/g

// Helper functions
function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function parsePrompt(prompt: string) {
  return (prompt.match(tokenRegex) || []).map(t => {
    if (t.startsWith('{list:')) return { type: 'list', value: t }
    if (t.startsWith('(') && t.endsWith(')')) return { type: 'priority', value: t.slice(1, -1) }
    return { type: 'normal', value: t }
  })
}

function stringifyTokens(tokens: any[]) {
  return tokens
    .filter(t => typeof t.value === 'string' && t.value.trim().length > 0 || t.type === 'list')
    .map(t => {
      if (t.type === 'priority') return `(${t.value})`
      if (t.type === 'list') return t.value
      return t.value
    })
    .join(' ')
}

function listNameFromToken(token: any) {
  if (token.type === 'list') return token.value.replace('{list:', '').replace('}', '')
  return (token.value || '').trim()
}

// State
const promptHistoryList = ref<string[]>([])
const modelSelection = ref('anime')
const prompt = ref('')
const negativePrompt = ref('')
const lists = ref<{ [key: string]: string[] }>({})
const images = ref<string[]>([])
const batchSize = ref(10)
const imageWidth = ref(512)
const imageHeight = ref(768)
const imagesApi = new ImagesApiClient()
const sendingPrompt = ref(false)
const promptSent = ref(false)
const promptIcon = ref('')
const promptStatus = ref('')

// Token editor state - track which prompt type is being edited
const tokenEditOpen = ref(false)
const tokenEdit = ref({ 
  index: -1, 
  token: { type: 'normal', value: '' } as any,
  promptType: 'positive' as 'positive' | 'negative'
})

// Computed
const listUsageCounts = computed(() => {
  const counts: Record<string, number> = {}
  const tokens = parsePrompt(prompt.value)
  tokens.forEach(t => {
    if (t.type === 'list') {
      const name = listNameFromToken(t)
      counts[name] = (counts[name] || 0) + 1
    }
  })
  // include zero counts for existing lists so they show up
  Object.keys(lists.value).forEach(name => { 
    if (!(name in counts)) counts[name] = 0 
  })
  return counts
})

// Methods
async function populatePromptFromExistingRecord(dateCode: string, requestId: string) {
  const existingRecord: ImageResults = await imagesApi.getResults(dateCode, requestId)
  const { positive, negative, batchSize: bs, width, height, model, lists: l } = existingRecord?.originalRequest ?? {}
  modelSelection.value = model ?? 'anime'
  prompt.value = positive ?? ''
  negativePrompt.value = negative ?? defaultNegativePrompt
  lists.value = l ?? {}
  batchSize.value = bs ?? 10
  imageWidth.value = Number.parseInt(String(width ?? 512))
  imageHeight.value = Number.parseInt(String(height ?? 768))
}

async function sendPrompt() {
  sendingPrompt.value = true
  try {
    const requestId = guid()
    const now = new Date()
    const dateCode = now.toISOString().slice(0, 10)
    const requestItem = {
      requestId,
      userId: Auth.instance?.principalId,
      dateCode,
      model: modelSelection.value,
      positive: prompt.value,
      negative: negativePrompt.value,
      lists: lists.value,
      batchSize: batchSize.value,
      type: 'image-batch',
      width: imageWidth.value,
      height: imageHeight.value
    }
    const initialResults: ImageResults = {
      originalRequest: requestItem,
      started: now,
      finished: 'n/a',
      uploaded: 'n/a',
      generatedFiles: [],
      initializationVectors: []
    }
    await imagesApi.putResults(initialResults)
    await imagesApi.putRequest(requestId, requestItem)
    RequestHistory.add(requestItem)
    promptHistoryList.value = promptHistory.add(prompt.value)
    promptIcon.value = 'check'
    promptStatus.value = 'Prompt sent successfully.'
    promptSent.value = true
    setTimeout(() => {
      router.push(`/browse/${dateCode}/${requestId}`)
    }, 2000)
  } catch (error) {
    promptIcon.value = 'exclamation-triangle'
    promptStatus.value = 'Failed to send prompt.'
  } finally {
    sendingPrompt.value = false
  }
}

function selectModel(model: string) {
  modelSelection.value = model
}

// Token editor methods - fixed to work with separate prompts
function openTokenEditor(promptType: 'positive' | 'negative', { index, token }: any) {
  tokenEdit.value.index = index
  tokenEdit.value.token = { ...token }
  tokenEdit.value.promptType = promptType
  tokenEditOpen.value = true
}

function closeTokenEditor() {
  tokenEditOpen.value = false
}

function newToken(promptType: 'positive' | 'negative') {
  const currentPrompt = promptType === 'positive' ? prompt.value : negativePrompt.value
  const tokens = parsePrompt(currentPrompt)
  // default new token becomes list-name seeded from empty text when saved
  tokens.push({ type: 'normal', value: '' })
  // open modal immediately for the new token at the end
  tokenEdit.value.index = tokens.length - 1
  tokenEdit.value.token = { type: 'normal', value: '' }
  tokenEdit.value.promptType = promptType
  tokenEditOpen.value = true
}

function applyTokenEdit({ index, token, listsPatch }: any) {
  // merge lists patch
  if (listsPatch && typeof listsPatch === 'object') {
    Object.keys(listsPatch).forEach(name => {
      lists.value[name] = listsPatch[name]
    })
  }
  
  // Get the correct prompt based on which one is being edited
  const currentPrompt = tokenEdit.value.promptType === 'positive' ? prompt.value : negativePrompt.value
  const tokens = parsePrompt(currentPrompt)
  
  // ensure array has an item at index (may be a fresh add)
  while (tokens.length <= index) tokens.push({ type: 'normal', value: '' })
  tokens[index] = token
  
  // Update the correct prompt
  const newPromptValue = stringifyTokens(tokens)
  if (tokenEdit.value.promptType === 'positive') {
    prompt.value = newPromptValue
  } else {
    negativePrompt.value = newPromptValue
  }
  
  closeTokenEditor()
}

function deleteToken({ index }: any) {
  // Get the correct prompt based on which one is being edited
  const currentPrompt = tokenEdit.value.promptType === 'positive' ? prompt.value : negativePrompt.value
  const tokens = parsePrompt(currentPrompt)
  
  if (index >= 0 && index < tokens.length) tokens.splice(index, 1)
  
  // Update the correct prompt
  const newPromptValue = stringifyTokens(tokens)
  if (tokenEdit.value.promptType === 'positive') {
    prompt.value = newPromptValue
  } else {
    negativePrompt.value = newPromptValue
  }
  
  closeTokenEditor()
}

function deleteList({ listName }: any) {
  if (listName && lists.value[listName]) {
    delete lists.value[listName]
    
    // Remove from both prompts
    prompt.value = stringifyTokens(
      parsePrompt(prompt.value).filter(token => 
        token.type !== 'list' || token.value !== `{list:${listName}}`
      )
    )
    negativePrompt.value = stringifyTokens(
      parsePrompt(negativePrompt.value).filter(token => 
        token.type !== 'list' || token.value !== `{list:${listName}}`
      )
    )
  }
  closeTokenEditor()
}

// Lifecycle
onMounted(async () => {
  promptHistoryList.value = promptHistory.getHistory()
  if (props.dateCode && props.requestId) {
    await populatePromptFromExistingRecord(props.dateCode, props.requestId)
  }
})
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