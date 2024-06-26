<template>
  <div class="app-frame">
    <div class="column p5">
      <div class="row p5">
        <div class="column p5 left">
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </div>
        <router-link to="/user/details" class="button align-self-center">
          <div :prepend-icon="loggedIn ? 'mdi-account' : 'mdi-shield-account'">
            {{ loggedIn ? userInitials : 'Guest' }}
          </div>
        </router-link>
      </div>
      <Navigation :items="navigationItems" />
      <router-view></router-view>
    </div>
  </div>
</template>

<script lang="ts">
import Auth from './Auth'

import Navigation from './components/Navigation.vue'
import promptHistory from './components/PromptHistory'

const navigationItems = [
  { title: 'Home', path: '/' },
  { title: 'Account', path: '/user/details' }
]

export default {
  components: { Navigation },
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
      imageHeight: 768,
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
    this.promptHistory = promptHistory.getHistory()
    const self = this
    Auth.instance?.onInitialized(() => {
      console.log('Auth initialized in App.vue')
      self.$forceUpdate()
    })
  },
  methods: {
    async activateWorkflow() {

    }
  }
}
</script>

<style scoped>
.app-frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
