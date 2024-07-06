<template>
  <h2>Requests Queue</h2>
  <p>Information about active requests.</p>
</template>

<script lang="ts">

export default {
  data() {
    return {}
  },
  async mounted() {
    this.refreshData()
  },
  methods: {
    refreshData() {
      // TODO: Fetch requests using auth token
    }
  }
}
</script>