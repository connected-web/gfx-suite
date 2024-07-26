<template>
  <div class="column p5">
    <h2 class="row p5">
      <Icon icon="home" />
      <label>Home</label>
    </h2>
    <p>Welcome to the Connected Web GFX Suite.</p>
    <p>This tool is for creating and manipulating images online!</p>
    <p>The suite requires a user login.</p>
    <hr />
    <h3>Features</h3>
    <p>The GFX Suite currently supports the following features:</p>
    <div class="card">
      <h4 class="row p5">
        <Icon icon="paint-roller" />
        <label>Image Generation</label>
      </h4>
      <p>Images are generated offline using Stable Diffusion and uploaded to a secure account.</p>
    </div>
    <div class="card">
      <h4 class="row p5">
        <Icon icon="image" />
        <label>Image Browser</label>
      </h4>
      <p>Images are uploaded as JPGs to our web hosting, and browsable through this site.</p>
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