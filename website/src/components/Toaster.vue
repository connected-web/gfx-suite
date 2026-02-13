<template>
  <div v-if="toast.visible" class="toaster row p5 center" role="status" aria-live="polite">
    <Icon icon="circle-check" />
    <label>{{ toast.message }}</label>
  </div>
</template>

<script setup lang="ts">
import { useToaster } from '../composables/useToaster'

const { toast } = useToaster()
</script>

<style scoped>
.toaster {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: #1f2937;
  color: #f9fafb;
  border: 1px solid #111827;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
}
</style>
