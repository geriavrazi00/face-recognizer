import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import VueUploadComponent from 'vue-upload-component'
import VueSweetalert2 from 'vue-sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons'

library.add(faCloudUploadAlt)

createApp(App)
  .use(VueSweetalert2)
  .component('file-upload', VueUploadComponent)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')
