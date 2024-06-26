import Home from './pages/Home.vue'
import UserDetails from './pages/UserDetails.vue'

export default [
  { path: '/', component: Home },
  { path: '/user', component: Home },
  { path: '/user/details', component: UserDetails }
]
