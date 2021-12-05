import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import VueUploadComponent from 'vue-upload-component'

createApp(App).component('file-upload', VueUploadComponent).mount('#app')
