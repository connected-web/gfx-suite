<template>
  <div class="app-frame">
    <div class="column">
      <div class="row p5 page-header">
        <div class="column p5 left">
          <h1>{{ title }}</h1>
        </div>
        <router-link to="/user/details" class="button align-self-center">
          <div :prepend-icon="loggedIn ? 'mdi-account' : 'mdi-shield-account'">
            {{ loggedIn ? userInitials : 'Guest' }}
          </div>
        </router-link>
      </div>
      <Navigation v-if="loggedIn" :items="navigationItems" />
      <div v-if="loggedIn" class="content-frame">
        <router-view></router-view>
      </div>
      <div v-else>
        <p class="warning column p5 center">
          <span>Please login to access the GFX Suite.</span>
          <button @click="login" :disabled="processingAuthAction" class="row p5">
            <LoadingSpinner v-if="processingAuthAction" />
            <Icon :icon="loggedIn ? 'lock' : 'key'" />
            <label>{{ loggedIn ? 'Logout' : 'Login' }}</label>
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Auth from './Auth'

import Navigation from './components/Navigation.vue'
import LoadingSpinner from './components/LoadingSpinner.vue';
import pages from './pages'

const navigationItems = pages.filter(item => (item as any)?.primaryNav).map(item => {
  return {
    title: item.navTitle ?? 'Untitled',
    path: item.path ?? '/',
    icon: item.icon ?? 'star'
  }
})

export default {
  components: { Navigation, LoadingSpinner },
  data() {
    return {
      title: 'GFX Suite',
      processingAuthAction: false,
      navigationItems
    }
  },
  computed: {
    loggedIn() {
      return Auth.instance?.loggedIn ?? false
    },
    userName() {
      return Auth.instance?.userName ?? 'Guest'
    },
    userInitials() {
      return Auth.instance?.initials
    }
  },
  mounted() {
    const self = this
    Auth.instance?.onInitialized(async () => {
      console.log('Auth initialized in App.vue')
      await Auth.instance?.getLatestAccessToken()
      self.$forceUpdate()
    })
  },
  methods: {
    async login() {
      this.processingAuthAction = true
      await Auth.instance?.login()
      this.processingAuthAction = false
      this.$forceUpdate()
    }
  }
}
</script>

<style scoped>
.app-frame {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
}

.page-header {
  border-bottom: 4px solid #ccc;
  padding: 10px;
}

.content-frame {
  padding: 10px;
}
</style>
