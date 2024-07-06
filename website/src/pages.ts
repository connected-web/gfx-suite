import Home from './pages/Home.vue'
import UserDetails from './pages/UserDetails.vue'
import RequestQueue from './pages/RequestQueue.vue'

export default [
  { path: '/', component: Home },
  { path: '/user', component: Home },
  { path: '/user/details', component: UserDetails },
  { path: '/queue', component: RequestQueue }
]
