<template>
  <router-view />
  <SyncStatus />
  <ToastNotification />
</template>

<script setup>
import SyncStatus from './components/SyncStatus.vue'
import ToastNotification from './components/ToastNotification.vue'
</script>
