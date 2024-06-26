import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Auth from './Auth'
import * as VueRouter from 'vue-router'

import setupIcons from './icons'
import pageRoutes from './pages'

const auth = new Auth('prod')
console.log('Initialised Auth', { auth })

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: pageRoutes as VueRouter.RouteRecordRaw[]
})

const app = createApp(App)
app.use(router)
app.config.productionTip = false
setupIcons(app)
app.mount('#app')

// curl -H "Authorization: Bearer $ACCESS_TOKEN" https://images.dev.connected-web.services/status
