<template>
  <div class="column p10">
    <h2>Your Details</h2>
    <div v-if="loggedIn">
      <p>Hi {{ firstName }}!</p>
      <p>The only information we keep on file is your user ID; this is used to track which accounts are using our systems and how often.</p>
      <pre>User ID: <b>{{ principalId }}</b></pre>
    </div>
    <div v-else>
      <h3>Guest</h3>
      <p>You are not logged in.</p>
      <p>You need to be logged in to access the GFX Suite</p>
    </div>

    <h3>Account actions</h3>
    <p v-if="loggedIn">If you're using a public computer; or need to switch accounts (for whatever reason!) you can logout below when finishing a session:</p>
    <p v-else>If you have an account you can login, or create an account below:</p>
    <div class="row center">
      <button @click="loginOrLogout" :disabled="processingAuthAction" class="row p5">
        <LoadingSpinner v-if="processingAuthAction" />
        <Icon :icon="loggedIn ? 'lock' : 'key'" />
        <label>{{ loggedIn ? 'Logout' : 'Login' }}</label>
      </button>
    </div>
    <div class="warning column p5 left">
      <h3>Server status</h3>
      <pre><code>{{ serverStatus }}</code></pre>
    </div>
  </div>
</template>

<script lang="ts">
import LoadingSpinner from '../components/LoadingSpinner.vue'
import Auth from '../Auth'
import ImagesApiClient from '../clients/ImagesApi'

export default {
  components: { LoadingSpinner },
  data() {
    return {
      processingAuthAction: false,
      serverStatus: 'unknown',
      imagesApi: new ImagesApiClient()
    }
  },
  async mounted() {
    this.refreshStatus()
    const self = this
    Auth.instance?.onInitialized(() => {
      console.log('Auth initialized in user/Details.vue')
      self.$forceUpdate()
    })
  },
  computed: {
    loggedIn() {
      return Auth.instance?.loggedIn ?? false
    },
    userName() {
      return Auth.instance?.userName ?? 'Guest'
    },
    firstName() {
      const userName = Auth.instance?.userName
      return userName ? userName.split(' ')[0] : 'Guest'
    },
    principalId() {
      return Auth.instance?.principalId
    }
  },
  methods: {
    async loginOrLogout() {
      this.processingAuthAction = true
      if (this.loggedIn) {
        await Auth.instance?.logout()
      } else {
        await Auth.instance?.login()
      }
      this.processingAuthAction = false
      this.$forceUpdate()
    },
    async refreshStatus() {
      try {
        this.serverStatus = 'Loading server status...'
        const statusResponse = await this.imagesApi.getStatus()
        this.serverStatus = statusResponse
      } catch (ex) {
        const error = ex as Error
        console.error('Unable to load status:', error)
        this.serverStatus = `Unable to load status: ${error.message}`
      }
    }
  }
}
</script>
