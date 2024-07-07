<template>
  <div class="navigation row left">
    <router-link v-for="item in items" :key="item.path" :to="item.path" class="nav-item row p5">
      <Icon :icon="item.icon ?? 'circle'" />
      <label>{{ item.title }}</label>
    </router-link>
  </div>
</template>

<script lang="ts">

export interface NavigationItem {
  title: string
  path: string
  icon: string
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
  padding: 0 0;
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