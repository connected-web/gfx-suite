<template>
  <button class="copy-button row p5 center" :aria-label="label" @click="$emit('click')">
    <Icon icon="copy" />
    <span>{{ label }}</span>
  </button>
</template>

<script lang="ts">
export default {
  emits: ['click'],
  props: {
    label: {
      type: String,
      default: 'Copy'
    }
  }
}
</script>

<style scoped>
.copy-button {
  margin-left: auto;
}
</style>
