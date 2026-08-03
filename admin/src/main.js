import { createApp } from 'vue'
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'
import './styles/global.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).use(TDesign).mount('#app')
