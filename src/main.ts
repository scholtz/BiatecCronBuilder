import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Ripple from 'primevue/ripple'
import Tooltip from 'primevue/tooltip'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(PrimeVue, { ripple: true })
app.use(ToastService)
app.use(createPinia())
app.use(router)

import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.scss'

app.directive('ripple', Ripple)
app.directive('tooltip', Tooltip)
app.mount('#app')
