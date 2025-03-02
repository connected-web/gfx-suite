<template>
  <div class="navigation row stretch wrap">
    <router-link v-for="item in items" :key="item.path" :to="item.path" :class="{
      'nav-item row p5 center': true,
      'router-link-parent-active': linkIsChildPath(item),
      'router-link-child-active': linkIsParentPath(item)
    }">
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
  },
  computed: {
    currentPath() {
      return this.trimPath(this.$route.path)
    }
  },
  methods: {
    trimPath(path: string) {
      const trimStart = path.startsWith('/') ? path.slice(1) : path
      const trimEnd = trimStart.endsWith('/') ? trimStart.slice(0, -1) : trimStart
      return trimEnd
    },
    linkIsChildPath(item: NavigationItem) {
      const pathParts = this.currentPath.split('/')
      const parentPath = pathParts.join('/')
      return this.trimPath(item.path).includes(this.currentPath)
    },
    linkIsParentPath(item: NavigationItem) {
      return this.currentPath.includes(this.trimPath(item.path))
    }
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
  padding: 6px 12px;
}
.nav-item:hover {
  background-color: #ddd;
}

@media screen  and (max-width: 500px) {
  .nav-item.row.p5 {
    flex-direction: column;
  }
}

.router-link-active {
  background-color: #ddd;
}

.router-link-parent-active {
  background-color: rgb(241, 238, 225);
}

.router-link-child-active {
  background-color: rgb(219, 222, 226);
}

</style>