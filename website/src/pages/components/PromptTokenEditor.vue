<template>
  <div
    class="token-editor"
    :class="{ disabled }"
    @click="onBackgroundClick"
  >
    <div
      v-for="(token, i) in tokens"
      :key="i"
      class="token"
      :class="token.type"
      @click.stop="emitEdit(i, token)"
    >
      {{ display(token) }}
    </div>
    <div class="token new"><Icon icon="plus" /></div>
    <span v-if="!tokens.length && !disabled" class="placeholder">Click to add a token…</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const tokenRegex = /(\{list:[^}]+\}|\([^()]+\)|\S+)/g

export type PromptToken = {
  type: 'normal' | 'priority' | 'list'
  value: string
}

function parsePrompt(prompt: string): PromptToken[] {
  return (prompt.match(tokenRegex) || []).map(t => {
    if (t.startsWith('{list:')) return { type: 'list', value: t }
    if (t.startsWith('(') && t.endsWith(')')) return { type: 'priority', value: t.slice(1, -1) }
    return { type: 'normal', value: t }
  })
}

// Props
const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

// Emits
const emit = defineEmits<{
  'edit-token': [payload: { index: number; token: PromptToken }]
  'new-token': []
}>()

// State
const tokens = ref<PromptToken[]>(parsePrompt(props.modelValue))

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  tokens.value = parsePrompt(newValue)
})

// Methods
function display(t: PromptToken) {
  if (t.type === 'priority') return `(${t.value})`
  return t.value
}

function emitEdit(index: number, token: PromptToken) {
  if (props.disabled) return
  emit('edit-token', { index, token })
}

function onBackgroundClick() {
  if (props.disabled) return
  // request parent to create a new token at the end
  emit('new-token')
}
</script>

<style scoped>
.token-editor {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  cursor: text;
  border: 1px solid #ccc;
  padding: 6px;
  min-height: 2.25em;
  background: #fff;
}
.token-editor.disabled {
  cursor: not-allowed;
  opacity: .6;
}
.placeholder {
  color: #888;
  font-style: italic;
}
.token {
  padding: 0 8px;
  border-radius: 6px;
  background: #eee;
  font-family: monospace;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  min-height: 2em;
}
.token:hover {
  background: #ddd;
}
.token.priority { background: #d1eaff }
.token.list { background: #f8df9e }
</style>