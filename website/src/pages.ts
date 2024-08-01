import Home from './pages/Home.vue'
import UserDetails from './pages/UserDetails.vue'
import RequestQueue from './pages/RequestQueue.vue'
import CreateRequest from './pages/CreateRequest.vue'
import BrowseImages from './pages/BrowseImages.vue'
import Status from './pages/Status.vue'

const primaryNav = [
  { path: '/', component: Home, icon: 'home', primaryNav: true, navTitle: 'Home' },
  { path: '/user/details', component: UserDetails, icon: 'user-shield' },
  { path: '/create', component: CreateRequest, icon: 'paint-roller', primaryNav: true, navTitle: 'Create' },
  { path: '/browse', component: BrowseImages, icon: 'image', primaryNav: true, navTitle: 'Browse' },
  { path: '/status', component: Status, icon: 'chart-simple', primaryNav: true, navTitle: 'Status' }
]

export default [
  ...primaryNav,
  { path: '/user', component: Home },
  { path: '/browse/:dateCode', props: true, component: BrowseImages },
  { path: '/browse/:dateCode/:requestId', props: true, component: BrowseImages },,
  { path: '/browse/:dateCode/:requestId/:tab', props: true, component: BrowseImages },
  { path: '/create/:dateCode/:requestId', props: true, component: CreateRequest },
  { path: '/queue', component: RequestQueue, icon: 'rectangle-list', navTitle: 'Requests' }
]
