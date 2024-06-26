<template>
  <div class="loading-spinner"></div>
</template>

<style scoped>
.loading-spinner {
  width: 12px;
  height: 12px;
  border: 3px solid #f3f3f3;
  border-left: 3px solid #3498db;
  border-right: 3px solid #34db66;
  border-radius: 50%;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>