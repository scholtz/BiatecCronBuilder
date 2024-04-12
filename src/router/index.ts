import { createRouter, createWebHistory } from 'vue-router'
import BuilderView from '../views/BuilderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: BuilderView
    }
  ]
})

export default router
