<template>
  <div class="column p10 w-full">
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

    <div class="row p5 stretch prompt-toolbar">
      <h4>Positive Prompt</h4>
      <div class="row p5 right">
        <button class="icon-button" title="Copy positive prompt" @click="copyPromptToClipboard('Positive prompt', prompt)">
          <Icon icon="copy" />
        </button>
        <label class="row p5 mode-switch">
          <span>Badges</span>
          <input v-model="positivePlainTextMode" type="checkbox" />
          <span>Text</span>
        </label>
      </div>
    </div>
    <PromptTokenEditor
      v-if="!positivePlainTextMode"
      :model-value="prompt"
      @update:model-value="prompt = $event"
      :disabled="sendingPrompt"
      @edit-token="openTokenEditor('positive', $event)"
      @new-token="newToken('positive')"
    />
    <textarea v-else v-model="prompt" :disabled="sendingPrompt" />
    <hr />

    <div class="row p5 stretch prompt-toolbar">
      <h4>Negative Prompt</h4>
      <div class="row p5 right">
        <button class="icon-button" title="Copy negative prompt" @click="copyPromptToClipboard('Negative prompt', negativePrompt)">
          <Icon icon="copy" />
        </button>
        <label class="row p5 mode-switch">
          <span>Badges</span>
          <input v-model="negativePlainTextMode" type="checkbox" />
          <span>Text</span>
        </label>
      </div>
    </div>
    <PromptTokenEditor
      v-if="!negativePlainTextMode"
      :model-value="negativePrompt"
      @update:model-value="negativePrompt = $event"
      :disabled="sendingPrompt"
      @edit-token="openTokenEditor('negative', $event)"
      @new-token="newToken('negative')"
    />
    <textarea v-else v-model="negativePrompt" :disabled="sendingPrompt" />
    <hr />

    <h4>Dimensions</h4>
    <div class="card column p10 stretch">
      <div class="column p5 top">
        <label>Batch size:</label>
        <div class="row p10 preset-grid">
          <button
            v-for="size in batchSizePresets"
            :key="`batch-${size}`"
            :class="{ 'preset-button': true, selected: Number(batchSize) === size }"
            @click="applyBatchSizePreset(size)"
          >
            <Icon icon="layer-group" />
            <strong>{{ size }}</strong>
          </button>
        </div>
        <div class="row p5 stretch">
          <div class="row p5 manual-input-row">
            <label class="manual-input-label">Custom</label>
            <input class="manual-input" type="number" v-model="batchSize" placeholder="Batch size" />
          </div>
        </div>
      </div>
      <div class="column p5 stretch top">
        <label>Image Dimensions</label>
        <div class="row p10 preset-grid">
          <button
            v-for="preset in dimensionPresets"
            :key="`dim-${preset.width}x${preset.height}`"
            :class="{ 'preset-button': true, selected: Number(imageWidth) === preset.width && Number(imageHeight) === preset.height }"
            @click="applyDimensionPreset(preset.width, preset.height)"
          >
            <Icon icon="image" />
            <strong>{{ preset.width }}x{{ preset.height }}</strong>
            <span>{{ preset.label }}</span>
          </button>
        </div>
        <div class="row p5 stretch">
          <div class="row p5 manual-input-row">
            <label class="manual-input-label">Custom</label>
            <div class="row p5 manual-dimension-inputs">
              <input class="manual-input" type="number" v-model="imageWidth" placeholder="Image width" :step="64">
              <input class="manual-input" type="number" v-model="imageHeight" placeholder="Image height" :step="64">
            </div>
          </div>
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
    
    <hr />

    <div class="column p10 request-details">
      <h3 class="row">
        <Icon icon="list-check" />
        <label>Verification</label>
      </h3>
      <h4>Positive Prompt</h4>
      <pre><code>{{ prompt }}</code></pre>
      <h4>Negative Prompt</h4>
      <pre><code>{{ negativePrompt }}</code></pre>

      <h3 class="row">
        <Icon icon="list" />
        <label>Lists in use</label>
      </h3>
      <div class="row p5 right">
        <button class="row p5" @click="openListEditor()">
          <Icon icon="plus" />
          <label>Add List</label>
        </button>
        <button class="row p5" @click="pasteListFromClipboard">
          <Icon icon="paste" />
          <label>Paste List</label>
        </button>
      </div>
      <div v-if="verificationListEntries.length === 0" class="row p5 key-value">
        <label>No lists created yet.</label>
      </div>
      <div v-else class="column p5">
        <div v-for="[listName, listValues] in verificationListEntries" :key="listName" class="column p5 key-value">
          <div class="row p5 stretch">
            <label>{{ listName }}</label>
            <div class="row p5 right">
              <button class="icon-button" title="Edit list" @click="openListEditor(listName)">
                <Icon icon="pen" />
              </button>
              <button class="icon-button danger-button" title="Delete list" @click="confirmDeleteList(listName)">
                <Icon icon="trash" />
              </button>
            </div>
          </div>
          <pre><code>{{ listValues.join('\n') }}</code></pre>
        </div>
      </div>
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

    <div v-if="listEditorOpen" class="modal-backdrop">
      <div class="modal">
        <header class="row space">
          <h3 class="modal-title">{{ listEditorOriginalName ? 'Edit list' : 'Add list' }}</h3>
        </header>
        <div class="form">
          <label>List name</label>
          <input v-model="listEditorName" placeholder="list name" />
          <div class="items">
            <div class="row space mb4">
              <strong>Items</strong>
            </div>
            <div v-if="listEditorItems.length === 0" class="muted">No items yet</div>
            <div v-for="(_, i) in listEditorItems" :key="i" class="row item">
              <input v-model="listEditorItems[i]" placeholder="value" />
              <button class="sm row p5" @click="toggleListEditorPriority(i)">
                <label>P</label>
                <Icon :icon="isListEditorPriority(listEditorItems[i]) ? 'toggle-on' : 'toggle-off'" />
              </button>
              <button class="sm danger-button" @click="removeListEditorItem(i)">
                <Icon icon="trash" />
              </button>
            </div>
            <div class="row p5 right">
              <button class="sm" @click="listEditorItems.push('')">
                <Icon icon="plus">Add item</Icon>
              </button>
            </div>
          </div>
        </div>
        <footer class="row space mt6">
          <div class="row p5 left">
            <button v-if="listEditorOriginalName" class="danger-button" @click="deleteFromListEditor">
              <Icon icon="trash">Delete list</Icon>
            </button>
          </div>
          <div class="row p5 right">
            <button @click="closeListEditor">
              <Icon icon="arrow-left">Cancel</Icon>
            </button>
            <button class="primary-button" @click="saveListEditor">
              <Icon icon="check">Save</Icon>
            </button>
          </div>
        </footer>
      </div>
    </div>
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
import { useToaster } from '../composables/useToaster'

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
const { showToast } = useToaster()
const positivePlainTextMode = ref(false)
const negativePlainTextMode = ref(false)
const listEditorOpen = ref(false)
const listEditorOriginalName = ref('')
const listEditorName = ref('')
const listEditorItems = ref<string[]>([])
const batchSizePresets = [10, 20, 40, 60, 120]
const dimensionPresets = [
  { width: 512, height: 512, label: 'Small square' },
  { width: 512, height: 768, label: 'Portrait' },
  { width: 768, height: 768, label: 'Large square' },
  { width: 512, height: 1024, label: 'Long portrait' }
]

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
const verificationListEntries = computed(() => Object.entries(lists.value))

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
    showToast('Prompt sent successfully.')
    promptSent.value = true
    setTimeout(() => {
      router.push(`/browse/${dateCode}/${requestId}`)
    }, 2000)
  } catch (error) {
    showToast('Failed to send prompt.')
  } finally {
    sendingPrompt.value = false
  }
}

function selectModel(model: string) {
  modelSelection.value = model
}

function applyBatchSizePreset(size: number) {
  batchSize.value = size
}

function applyDimensionPreset(width: number, height: number) {
  imageWidth.value = width
  imageHeight.value = height
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

function openListEditor(listName = '') {
  listEditorOriginalName.value = listName
  listEditorName.value = listName
  listEditorItems.value = listName && lists.value[listName] ? [...lists.value[listName]] : []
  listEditorOpen.value = true
}

function closeListEditor() {
  listEditorOpen.value = false
}

function removeListEditorItem(index: number) {
  listEditorItems.value.splice(index, 1)
}

function isListEditorPriority(item: string): boolean {
  return item.startsWith('(') && item.endsWith(')')
}

function toggleListEditorPriority(index: number) {
  const item = listEditorItems.value[index] ?? ''
  if (isListEditorPriority(item)) {
    listEditorItems.value[index] = item.slice(1, -1)
    return
  }
  listEditorItems.value[index] = `(${item})`
}

function confirmDeleteList(listName: string) {
  if (!window.confirm(`Delete list "${listName}"?`)) return
  deleteList({ listName })
  showToast(`Deleted list "${listName}"`)
}

function deleteFromListEditor() {
  if (!listEditorOriginalName.value) return
  if (!window.confirm(`Delete list "${listEditorOriginalName.value}"?`)) return
  deleteList({ listName: listEditorOriginalName.value })
  showToast(`Deleted list "${listEditorOriginalName.value}"`)
  closeListEditor()
}

function saveListEditor() {
  const listName = listEditorName.value.trim()
  if (!listName) {
    showToast('List name is required')
    return
  }
  const originalName = listEditorOriginalName.value
  const isRename = originalName.length > 0 && originalName !== listName
  if (isRename && lists.value[listName]) {
    showToast(`List "${listName}" already exists`)
    return
  }
  const items = listEditorItems.value.map(item => item.trim()).filter(Boolean)
  lists.value[listName] = items
  if (isRename) {
    delete lists.value[originalName]
  }
  closeListEditor()
  showToast(`Saved list "${listName}"`)
}

function normalizeClipboardListItem(item: string): string {
  const trimmed = item.trim()
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

async function pasteListFromClipboard() {
  try {
    const raw = await navigator.clipboard.readText()
    const lines = raw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      showToast('Clipboard is empty')
      return
    }
    const header = lines[0]
    const listName = header.endsWith(':')
      ? header.slice(0, -1).replace(/^List\s+/i, '').trim()
      : header.trim()
    if (!listName) {
      showToast('Could not detect list name')
      return
    }
    const items = lines.slice(1).map(normalizeClipboardListItem).filter(Boolean)
    lists.value[listName] = items
    showToast(`Imported list "${listName}" (${items.length} items)`)
  } catch {
    showToast('Failed to read clipboard')
  }
}

async function copyPromptToClipboard(label: string, value: string) {
  let copied = false
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      copied = true
    }
  } catch {
    copied = false
  }

  if (!copied) {
    const textArea = document.createElement('textarea')
    textArea.value = value
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    copied = document.execCommand('copy')
    document.body.removeChild(textArea)
  }

  if (copied) {
    showToast(`${label} copied`)
  } else {
    showToast(`Failed to copy ${label.toLowerCase()}`)
  }
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
.selected { background-color: #ccc }
.preset-grid {
  flex-wrap: wrap;
}

.preset-button {
  min-width: 120px;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
}

.preset-button > span {
  font-size: 0.8em;
  opacity: 0.9;
}

.manual-input-row {
  align-items: center;
  background: #efefef;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 6px 8px;
}

.manual-input-label {
  font-size: 0.85em;
  color: #555;
  min-width: 56px;
}

.manual-dimension-inputs {
  flex: 1;
}

.manual-input {
  flex: 1;
  max-width: 220px;
}
.prompt-toolbar h4 {
  margin: 0;
}

.mode-switch {
  align-items: center;
  background: #eee;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.9em;
}

.icon-button {
  min-width: 2.2em;
  padding: 0.3em;
}
.danger-button {
  background: #f3d0d0;
  border-color: #e5a1a1;
}
.danger-button:hover {
  background: #e5a1a1;
}
.primary-button {
  background: #2d7ef7;
  color: #fff;
  border-color: #2d7ef7;
}
.primary-button:hover {
  background: #1c5ed6;
}

.request-details pre {
  margin: 0;
  text-wrap: wrap;
}

.key-value > * {
  flex: 1;
}

.key-value > * {
  font-family: monospace;
  padding: 4px;
  background: #eee;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #fff;
  width: min(720px, 94vw);
  max-height: 90vh;
  overflow: auto;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .2);
  padding: 16px;
}
.modal-title {
  background: none;
  border: none;
}
.space { justify-content: space-between }
.mb4 { margin-bottom: 8px }
.mt6 { margin-top: 12px }
.form { display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; align-items: center }
.form label { color: #333 }
.form input { border: 1px solid #bbb; border-radius: 6px; padding: 6px; font-family: monospace }
.items { grid-column: 1 / -1; border: 1px dashed #ddd; padding: 8px; border-radius: 6px }
.item { gap: 8px; margin-bottom: 6px }
.item input { flex: 1 }
.sm { padding: 4px 8px; font-size: 12px }
.muted { color: #777; font-style: italic }

@media screen and (max-width: 800px) {
  .row.stretch { flex-wrap: wrap }
  .manual-input-row {
    width: 100%;
    align-items: stretch;
  }
  .manual-input-label {
    min-width: auto;
  }
  .manual-dimension-inputs {
    width: 100%;
    flex-wrap: wrap;
  }
  .manual-input {
    max-width: none;
    min-width: 130px;
  }
}
</style>
