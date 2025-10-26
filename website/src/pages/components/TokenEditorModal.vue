
<template>
  <div class="modal-backdrop" @click.self="onClose">
    <div class="modal">
      <header class="row space">
        <h3>Edit token</h3>
        <button class="icon" @click="onClose">✕</button>
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
            v-model="local.listName"
            placeholder="choose or create a list name"
            list="listNames"
            @change="onListNameChange"
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
              <button class="sm" @click="items.push('')">Add item</button>
            </div>
            <div v-if="!items.length" class="muted">No items yet</div>
            <div v-for="(it, i) in items" :key="i" class="row item">
              <input v-model="items[i]" placeholder="value" />
              <button class="sm row p5" @click="togglePriority(i)">
                <label>P</label>
                <Icon :icon="isPriority(items[i]) ? 'toggle-on' : 'toggle-off'" />
              </button>
              <button class="sm danger" @click="removeItem(i)"><Icon icon="trash" /></button>
            </div>
          </div>
        </template>
      </div>

      <footer class="row space mt6">
        <div class="row p5 left">
          <button class="danger" @click="onDelete">Delete token</button>
          <button v-if="local.type === 'list'" class="danger" @click="onDeleteList">Delete list</button>
        </div>
        <div class="row p5 right">
          <button @click="onClose">Cancel</button>
          <button class="primary" @click="onSave">Save</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TokenEditorModal',
  props: {
    index: { type: Number, required: true },
    token: { type: Object, required: true },
    lists: { type: Object, required: true },
    usageMap: { type: Object, required: true }
  },
  emits: ['save', 'delete', 'deleteList', 'close'],
  data () {
    const initial = { ...this.token }
    const initialListName = initial.type === 'list'
      ? initial.value.replace('{list:', '').replace('}', '')
      : (initial.value || '').trim()

    const items = initial.type === 'list' && this.lists[initialListName]
      ? [...this.lists[initialListName]]
      : (this.lists[initialListName] ? [...this.lists[initialListName]] : [])

    return {
      local: {
        type: initial.type,
        value: initial.type === 'priority' ? initial.value : (initial.type === 'list' ? '' : initial.value),
        listName: initialListName
      },
      items
    }
  },
  methods: {
    onListNameChange () {
      const name = this.local.listName
      this.items = this.lists[name] ? [...this.lists[name]] : []
    },
    removeItem (i: number) {
      this.items.splice(i, 1)
    },
    onSave () {
      const payload: any = { index: this.index, token: null, listsPatch: {} }
      if (this.local.type === 'list') {
        const name = this.local.listName.trim()
        // create or overwrite only the chosen list in the patch
        payload.listsPatch[name] = this.items.filter(s => s && s.trim().length > 0)
        payload.token = { type: 'list', value: `{list:${name}}` }
      } else if (this.local.type === 'priority') {
        const text = (this.local.value || '').trim()
        payload.token = { type: 'priority', value: text }
      } else {
        const text = (this.local.value || '').trim()
        payload.token = { type: 'normal', value: text }
      }
      this.$emit('save', payload)
    },
    onDelete () {
      this.$emit('delete', { index: this.index })
    },
    onDeleteList () {
      if (this.local.type === 'list') {
        const name = this.local.listName.trim()
        this.$emit('deleteList', { listName: name })
      }
    },
    onClose () { this.$emit('close') },
    isPriority (item: string) {
      return item.startsWith('(') && item.endsWith(')')
    },
    togglePriority (i: number) {
      const item = this.items[i]
      if (this.isPriority(item)) {
        this.items[i] = item.slice(1, -1)
      } else {
        this.items[i] = `(${item})`
      }
    }
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
button.icon { background: transparent; border: none; font-size: 18px }
.muted { color: #777; font-style: italic }
</style>
