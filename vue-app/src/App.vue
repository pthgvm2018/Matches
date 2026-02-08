<template>
  <div class="app-nav">
    <template v-if="isAdmin">
      <router-link to="/admin">賽事列表</router-link>
      <router-link to="/admin/create">建立賽事</router-link>
      <router-link to="/" class="switch-link">← 觀看模式</router-link>
    </template>
    <template v-else>
      <router-link to="/">賽事列表</router-link>
      <router-link to="/admin" class="switch-link">管理模式 →</router-link>
    </template>
  </div>
  <router-view />
  <ToastNotification />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ToastNotification from './components/ToastNotification.vue'

const route = useRoute()
const isAdmin = computed(() => route.meta.section === 'admin')
</script>

<style>
.app-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0;
  background: #0d1440;
  border-bottom: 1px solid #233554;
  font-size: 0.8rem;
}
.app-nav a {
  padding: 8px 16px;
  color: #8892b0;
  text-decoration: none;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}
.app-nav a:hover { color: #00b4d8; }
.app-nav a.router-link-exact-active {
  color: #00b4d8;
  border-bottom-color: #00b4d8;
  background: rgba(0, 180, 216, 0.1);
}
.app-nav a.switch-link {
  margin-left: auto;
  font-size: 0.7rem;
  color: #4a5568;
  border-bottom: none;
}
.app-nav a.switch-link:hover {
  color: #00b4d8;
}
</style>
