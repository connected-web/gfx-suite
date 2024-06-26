<template>
  <div class="navigation">
    <router-link v-for="item in items" :key="item.path" :to="item.path" class="nav-item">{{ item.title }}</router-link>
  </div>
</template>

<script lang="ts">

export interface NavigationItem {
  title: string
  path: string
}

export default {
  props: {
    items: Array as () => NavigationItem[],
    default: () => [] as NavigationItem[]
  }
}
</script>

<style scoped>
.navigation {
  display: flex;
  justify-content: space-around;
  background-color: #f3f3f3;
}

.nav-item {
  text-decoration: none;
  color: #333;
  flex: 1;
  background-color: #f3f3f3;
  transition: background-color 0.5s;
  padding: 10px;
}
.nav-item:hover {
  background-color: #ddd;
}
</style>