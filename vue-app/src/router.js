import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  // 新系統 - 查看
  { path: '/', component: () => import('./views/TournamentList.vue'), meta: { section: 'view' } },
  { path: '/t/:id', component: () => import('./views/TournamentView.vue'), meta: { section: 'view' } },

  // 新系統 - 管理
  { path: '/admin', component: () => import('./views/TournamentList.vue'), meta: { section: 'admin' } },
  { path: '/admin/create', component: () => import('./views/TournamentCreate.vue'), meta: { section: 'admin' } },
  { path: '/admin/t/:id', component: () => import('./views/TournamentAdmin.vue'), meta: { section: 'admin' } },

  // 舊版 - 保留相容
  { path: '/legacy', component: () => import('./views/MainView.vue'), meta: { section: 'view' } },
  { path: '/legacy/knockout16', component: () => import('./views/Ko16View.vue'), meta: { section: 'view' } },
  { path: '/legacy/admin', component: () => import('./views/MainAdmin.vue'), meta: { section: 'admin' } },
  { path: '/legacy/admin/knockout16', component: () => import('./views/Ko16Admin.vue'), meta: { section: 'admin' } },
]

export const router = createRouter({
  history: createWebHashHistory('/Matches/'),
  routes,
})
