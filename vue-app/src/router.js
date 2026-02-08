import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('./views/MainView.vue') },
  { path: '/admin', component: () => import('./views/MainAdmin.vue') },
  { path: '/knockout16', component: () => import('./views/Ko16View.vue') },
  { path: '/knockout16/admin', component: () => import('./views/Ko16Admin.vue') },
]

export const router = createRouter({
  history: createWebHashHistory('/Matches/'),
  routes,
})
