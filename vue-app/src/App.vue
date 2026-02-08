<template>
  <div class="app-nav" v-if="showAppNav">
    <router-link to="/">主站觀看</router-link>
    <router-link to="/admin">主站管理</router-link>
    <router-link to="/knockout16">16強觀看</router-link>
    <router-link to="/knockout16/admin">16強管理</router-link>
  </div>
  <router-view />
  <SyncStatus />
  <ToastNotification />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SyncStatus from './components/SyncStatus.vue'
import ToastNotification from './components/ToastNotification.vue'

const route = useRoute()
const showAppNav = computed(() => true)
</script>

<style>
.app-nav {
  display: flex;
  justify-content: center;
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
</style>
