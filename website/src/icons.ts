import Icon from './components/Icon.vue'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import * as FSVI from '@fortawesome/free-solid-svg-icons'
import * as FBSI from '@fortawesome/free-brands-svg-icons'

export default function setupIcons (app: any): void {
  library.add(FSVI.fas)
  library.add(FBSI.fab)
  app.component('FontAwesomeIcon', FontAwesomeIcon)
  app.component('Icon', Icon)
}
