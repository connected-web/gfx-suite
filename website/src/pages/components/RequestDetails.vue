<template>
  <div class="request-details column p10">
    <h3 class="row">
      <Icon icon="circle-plus" />
      <label>Positive prompt</label>
    </h3>
    <pre><code>{{ resultsItem?.originalRequest?.positive }}</code></pre>
    <h3 class="row">
      <Icon icon="circle-minus" />
      <label>Negative prompt</label>
    </h3>
    <pre><code>{{ resultsItem?.originalRequest?.negative }}</code></pre>

    <h3 class="row">
      <Icon icon="cog" />
      <label>Request Settings</label>
    </h3>
    <div class="column p5">
      <div class="row p5 key-value">
        <label>Width</label>
        <label>{{ resultsItem?.originalRequest?.width }}</label>
      </div>
      <div class="row p5 key-value">
        <label>Height</label>
        <label>{{ resultsItem?.originalRequest?.height }}</label>
      </div>
      <div class="row p5 key-value">
        <label>Batch size</label>
        <label>{{ resultsItem?.originalRequest?.batchSize }}</label>
      </div>
    </div>
      
    <h3 class="row">
      <Icon icon="timeline" />
      <label>Timeline</label>
    </h3>
    <div class="column p5">
      <div class="row p5 key-value">
        <label>Request Created</label>
        <label>{{ resultsItem?.originalRequest?.requestTime ?? 'Waiting on server...' }}</label>
      </div>
      <div class="row p5 key-value">
        <label>Processing Started</label>
        <label>{{ resultsItem?.started ?? 'n/a' }}</label>
      </div>
      <div class="row p5 key-value">
        <label>Processing Finished</label>
        <label>{{ resultsItem?.finished ?? 'n/a' }}</label>
      </div>
      <div class="row p5 key-value">
        <label>Results Uploaded</label>
        <label>{{ resultsItem?.uploaded ?? 'n/a' }}</label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ImageResults } from '../../clients/ImagesApi'

export default {
  props: {
    resultsItem: {
      type: Object,
      default() {
        return {} as Partial<ImageResults>
      }
    }
  }
}
</script>

<style scoped>
.key-value > *:first-child {
  flex: 1;
}
.key-value > * {
  min-width: 20vw;
  font-family: monospace;
  padding: 4px;
  background: #eee;
}

.key-value > label:nth-child(2) {
  font-weight: bold;
}

pre {
  margin: 0;
  text-wrap: wrap;
}
</style>
