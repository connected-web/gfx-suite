<template>
  <div class="navigation row left">
    <Icon icon="home" />
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
  background-color: #f3f3f3;
  padding: 0 10px;
}

.nav-item {
  text-decoration: none;
  color: #333;
  background-color: #f3f3f3;
  transition: background-color 0.2s;
  padding: 10px 20px;
}
.nav-item:hover {
  background-color: #ddd;
}
</style>