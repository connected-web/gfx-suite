<template>
  <div class="column p5">
    <textarea v-model="prompt"></textarea>

    <div class="row p5">
      <label>Batch size:</label>
      <input type="number" v-model="batchSize" placeholder="Batch size" />
      <label>Image Dimensions</label>
      <input type="number" v-model="imageWidth" placeholder="Image width" :step="64">
      <input type="number" v-model="imageHeight" placeholder="Image height" :step="64">
    </div>

    <select v-model="prompt">
      <option value="">Select a prompt...</option>
      <option v-for="prompt in promptHistory" :value="prompt">{{ prompt }}</option>
    </select>

    <button @click="activateWorkflow" :disabled="invoking">Activate Workflow</button>

    <div v-if="invoking" class="row p10">
      <span class="loading-animation"></span>
      <span>Requesting images...</span>
    </div>

    <button @click="images = []" :disabled="invoking">Reset images</button>
    <div class="row p10">
      Loaded {{ images.length }} images.
    </div>
    <div class="row p10">
      <img v-for="image in images" :src="image" />
    </div>
  </div>
</template>

<script lang="ts">

import promptHistory from '../components/PromptHistory'

export default {
  data() {
    return {
      title: 'GFX Suite',
      description: 'This site provides authenticated access to the Connected Web Images API.',
      promptHistory: [] as string[],
      prompt: '',
      invoking: false,
      images: [] as string[],
      batchSize: 1,
      imageWidth: 512,
      imageHeight: 768
    }
  },
  mounted() {
    this.promptHistory = promptHistory.getHistory()
  },
  methods: {
    async activateWorkflow() {

    }
  }
}
</script>

<style scoped>
textarea {
  height: 100px;
  min-height: 100px;
  resize: vertical;
  border: 1px solid #ccc;
  border-radius: 5px;
}
</style>