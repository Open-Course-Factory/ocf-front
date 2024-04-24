import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { piniaPluginPersist } from './piniaPluginPersist'

const pinia = createPinia()
pinia.use(piniaPluginPersist)

createApp(App)
    .use(router)
    .use(pinia)
    .mount('#app')