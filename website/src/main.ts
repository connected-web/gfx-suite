import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Auth from './Auth'
import * as VueRouter from 'vue-router'

import setupIcons from './icons'
import pageRoutes from './pages'

async function startApp (): Promise<void> {
  const auth = new Auth('prod')
  console.log('Initialised Auth', { auth })

  const router = VueRouter.createRouter({
    history: VueRouter.createWebHistory(),
    routes: pageRoutes as VueRouter.RouteRecordRaw[]
  })

  // Force auth to initialise before starting app
  await auth.getLatestAccessToken()

  const app = createApp(App)
  app.use(router)
  setupIcons(app)
  app.mount('#app')
}

startApp()
  .then(() => {
    console.log('App started')
  })
  .catch((ex) => {
    console.log('Error starting app:', ex)
  })
