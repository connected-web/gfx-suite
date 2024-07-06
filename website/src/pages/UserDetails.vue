<template>
  <div class="pt-4">
    <div v-if="loggedIn">
      <h3>Your Details</h3>
      <p>Hi {{ firstName }}!</p>
      <pre>Principal ID: <b>{{ principalId }}</b></pre>
    </div>
    <div v-else>
      <h3>Guest</h3>
      <p>You are not logged in.</p>
      <p>You need to be logged in to access the GFX Suite</p>
    </div>

    <h3>Account actions</h3>
    <p v-if="loggedIn">If you're using a public computer; or need to switch accounts (for whatever reason!) you can logout below when finishing a session:</p>
    <p v-else>If you have an account you can login, or create an account below:</p>
    <button @click="loginOrLogout" :disabled="processingAuthAction">
      <LoadingSpinner v-if="processingAuthAction" />
      <Icon :icon="processingAuthAction ? 'mdi-account' : 'mdi-shield-account'" />
      <label>{{ loggedIn ? 'Logout' : 'Login' }}</label>
    </button>
  </div>
</template>

<script type="ts">
import LoadingSpinner from '../components/LoadingSpinner.vue'
import Auth from '../Auth'

export default {
  components: { LoadingSpinner },
  data() {
    return {
      processingAuthAction: false
    }
  },
  async mounted() {
    this.refreshData()
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
    async refreshData() {
      const accessToken = await Auth.instance.getLatestAccessToken()
      try {
        const result = await fetch('https://images.dev.connected-web.services/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'content-type': 'application/json'
          }
        })
        if (result.ok) {
          const data = await result.json()
          console.log('Data:', data)
        }
      } catch (error) {
        console.error('Unable to refresh data:', error)
      }
    }
  }
}
</script>
