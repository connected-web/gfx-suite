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

<script lang="ts">
const tokenRegex = /(\{list:[^}]+\}|\([^()]+\)|\S+)/g

export type PromptToken = {
  type: 'normal' | 'priority' | 'list'
  value: string
}

function parsePrompt (prompt: string): PromptToken[] {
  return (prompt.match(tokenRegex) || []).map(t => {
    if (t.startsWith('{list:')) return { type: 'list', value: t }
    if (t.startsWith('(') && t.endsWith(')')) return { type: 'priority', value: t.slice(1, -1) }
    return { type: 'normal', value: t }
  })
}

export default {
  name: 'PromptTokenEditor',
  props: {
    modelValue: { type: String, required: true },
    disabled: { type: Boolean, default: false }
  },
  emits: ['edit-token', 'new-token'],
  data () {
    return {
      tokens: parsePrompt(this.modelValue)
    }
  },
  watch: {
    modelValue (v: string) {
      this.tokens = parsePrompt(v)
    }
  },
  methods: {
    display (t: PromptToken) {
      if (t.type === 'priority') return `(${t.value})`
      return t.value
    },
    emitEdit (index: number, token: PromptToken) {
      if (this.disabled) return
      this.$emit('edit-token', { index, token })
    },
    onBackgroundClick () {
      if (this.disabled) return
      // request parent to create a new token at the end
      this.$emit('new-token')
    }
  }
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
