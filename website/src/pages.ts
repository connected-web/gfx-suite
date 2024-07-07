import Home from './pages/Home.vue'
import UserDetails from './pages/UserDetails.vue'
import RequestQueue from './pages/RequestQueue.vue'
import CreateRequest from './pages/CreateRequest.vue'
import BrowseImages from './pages/BrowseImages.vue'

export default [
  { path: '/', component: Home, icon: 'home', primaryNav: true, navTitle: 'Home' },
  { path: '/user', component: Home },
  { path: '/user/details', component: UserDetails, icon: 'user-shield' },
  { path: '/create', component: CreateRequest, icon: 'paint-roller', primaryNav: true, navTitle: 'Create' },
  { path: '/browse', component: BrowseImages, icon: 'image', primaryNav: true, navTitle: 'Browse' },
  { path: '/queue', component: RequestQueue, icon: 'rectangle-list', primaryNav: true, navTitle: 'Requests' }
]
