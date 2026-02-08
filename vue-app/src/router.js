import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  // 查看
  { path: '/', component: () => import('./views/MainView.vue'), meta: { section: 'view' } },
  { path: '/knockout16', component: () => import('./views/Ko16View.vue'), meta: { section: 'view' } },
  // 管理
  { path: '/admin', component: () => import('./views/MainAdmin.vue'), meta: { section: 'admin' } },
  { path: '/admin/knockout16', component: () => import('./views/Ko16Admin.vue'), meta: { section: 'admin' } },
]

export const router = createRouter({
  history: createWebHashHistory('/Matches/'),
  routes,
})
