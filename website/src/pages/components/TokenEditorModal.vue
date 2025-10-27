<template>
  <div class="modal-backdrop">
    <div class="modal">
      <header class="row space">
        <h3 class="modal-title">Edit token</h3>
      </header>

      <div class="form">
        <label>Type</label>
        <select v-model="local.type">
          <option value="normal">Normal</option>
          <option value="priority">Priority</option>
          <option value="list">List</option>
        </select>

        <template v-if="local.type !== 'list'">
          <label>Text</label>
          <input v-model="local.value" placeholder="token text" />
        </template>

        <template v-else>
          <label>List name</label>
          <input
            v-model="editingListName"
            placeholder="choose or create a list name"
            list="listNames"
            @input="onListNameInput"
          />
          <datalist id="listNames">
            <option
              v-for="(count, name) in usageMap"
              :key="name"
              :value="name"
            >{{ name }} (×{{ count }})</option>
          </datalist>

          <div class="items">
            <div class="row space mb4">
              <strong>Items</strong>
            </div>
            <div v-if="!editingItems.length" class="muted">No items yet</div>
            <div v-for="(it, i) in editingItems" :key="i" class="row item">
              <input v-model="editingItems[i]" placeholder="value" />
              <button class="sm row p5" @click="togglePriority(i)">
                <label>P</label>
                <Icon :icon="isPriority(editingItems[i]) ? 'toggle-on' : 'toggle-off'" />
              </button>
              <button class="sm danger" @click="removeItem(i)"><Icon icon="trash" /></button>
            </div>
            <div class="row p5 right">
              <button class="sm" @click="editingItems.push('')">
                <Icon icon="plus">Add item</Icon>
              </button>
            </div>
          </div>
        </template>
      </div>

      <footer class="row space mt6">
        <div class="row p5 left">
          <button class="danger" @click="onDelete">
            <Icon icon="trash">Delete token</Icon>
          </button>
          <button v-if="local.type === 'list'" class="danger" @click="onDeleteList">
            <Icon icon="trash">Delete list</Icon>
          </button>
        </div>
        <div class="row p5 right">
          <button @click="onClose">
            <Icon icon="arrow-left">Cancel</Icon>
          </button>
          <button class="primary" @click="onSave">
            <Icon icon="check">Save</Icon>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props
const props = defineProps<{
  index: number
  token: { type: string; value: string }
  lists: Record<string, string[]>
  usageMap: Record<string, number>
}>()

// Emits
const emit = defineEmits<{
  save: [payload: { index: number; token: any; listsPatch: Record<string, string[]> }]
  delete: [payload: { index: number }]
  deleteList: [payload: { listName: string }]
  close: []
}>()

// Extract initial list name from token
function getInitialListName(token: { type: string; value: string }): string {
  if (token.type === 'list') {
    return token.value.replace('{list:', '').replace('}', '')
  }
  return (token.value || '').trim()
}

// Initialize local state
const initialListName = getInitialListName(props.token)

const local = ref({
  type: props.token.type,
  value: props.token.type === 'priority' 
    ? props.token.value 
    : (props.token.type === 'list' ? '' : props.token.value),
  listName: initialListName
})

// Separate editing state for list name and items
const editingListName = ref(initialListName)
const editingItems = ref<string[]>(
  props.token.type === 'list' && props.lists[initialListName]
    ? [...props.lists[initialListName]]
    : (props.lists[initialListName] ? [...props.lists[initialListName]] : [])
)

// Track the last loaded list to know when user is selecting vs typing
const lastLoadedListName = ref(initialListName)

// Watch for type changes to reset editing state
watch(() => local.value.type, (newType) => {
  if (newType === 'list' && !editingListName.value) {
    // When switching to list type, initialize with current list name
    editingListName.value = local.value.listName || ''
    editingItems.value = props.lists[editingListName.value] 
      ? [...props.lists[editingListName.value]] 
      : []
    lastLoadedListName.value = editingListName.value
  }
})

// Methods
function onListNameInput(event: Event) {
  const target = event.target as HTMLInputElement
  const name = target.value.trim()
  
  // Only load items if:
  // 1. The list exists in props.lists
  // 2. The name exactly matches an existing list (indicating selection from datalist)
  // 3. We haven't already loaded this list
  if (name && props.lists[name] && name !== lastLoadedListName.value) {
    // User selected an existing list from datalist
    editingItems.value = [...props.lists[name]]
    lastLoadedListName.value = name
  }
  // Otherwise, keep the current editingItems (user is typing a new name)
}

function removeItem(i: number) {
  editingItems.value.splice(i, 1)
}

function onSave() {
  const payload: any = { index: props.index, token: null, listsPatch: {} }
  
  if (local.value.type === 'list') {
    const name = editingListName.value.trim()
    // Save the edited items under the (possibly renamed) list name
    payload.listsPatch[name] = editingItems.value.filter(s => s && s.trim().length > 0)
    payload.token = { type: 'list', value: `{list:${name}}` }
  } else if (local.value.type === 'priority') {
    const text = (local.value.value || '').trim()
    payload.token = { type: 'priority', value: text }
  } else {
    const text = (local.value.value || '').trim()
    payload.token = { type: 'normal', value: text }
  }
  
  emit('save', payload)
}

function onDelete() {
  emit('delete', { index: props.index })
}

function onDeleteList() {
  if (local.value.type === 'list') {
    const name = editingListName.value.trim()
    emit('deleteList', { listName: name })
  }
}

function onClose() {
  emit('close')
}

function isPriority(item: string): boolean {
  return item.startsWith('(') && item.endsWith(')')
}

function togglePriority(i: number) {
  const item = editingItems.value[i]
  if (isPriority(item)) {
    editingItems.value[i] = item.slice(1, -1)
  } else {
    editingItems.value[i] = `(${item})`
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
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
  box-shadow: 0 10px 30px rgba(0,0,0,.2);
  padding: 16px;
}
.modal-title {
  background: none;
  border: none;
}
.row { display: flex; align-items: center }
.space { justify-content: space-between }
.mb4 { margin-bottom: 8px }
.mt6 { margin-top: 12px }
.form { display: grid; grid-template-columns: 120px 1fr; gap: 8px 12px; align-items: center }
.form label { color: #333 }
.form input, .form select { border: 1px solid #bbb; border-radius: 6px; padding: 6px; font-family: monospace }
.items { grid-column: 1 / -1; border: 1px dashed #ddd; padding: 8px; border-radius: 6px }
.item { gap: 8px; margin-bottom: 6px }
.item input { flex: 1 }
button { border: 1px solid #aaa; border-radius: 6px; padding: 6px 10px; background: #f7f7f7; cursor: pointer }
button:hover { background: #e7e7e7 }
button.primary { background: #2d7ef7; color: #fff; border-color: #2d7ef7 }
button.danger { background: #f3d0d0; border-color: #e5a1a1 }
button.danger:hover { background: #e5a1a1 }
button.primary:hover { background: #1c5ed6 }
button.sm { padding: 4px 8px; font-size: 12px }
.muted { color: #777; font-style: italic }
</style>