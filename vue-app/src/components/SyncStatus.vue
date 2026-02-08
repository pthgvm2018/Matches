<template>
  <div v-if="syncText" class="sync-status" :style="{ background: bgColor }">
    {{ syncText }}
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

const syncStatus = inject('syncStatus', null)
const syncText = inject('syncText', null)

const bgColor = computed(() => {
  if (!syncStatus?.value) return '#6c757d'
  const map = {
    connecting: '#17a2b8',
    online: '#28a745',
    syncing: '#ffc107',
    synced: '#28a745',
    error: '#dc3545',
    offline: '#6c757d',
  }
  return map[syncStatus.value] || '#6c757d'
})
</script>

<style scoped>
.sync-status {
  position: fixed;
  bottom: 10px;
  right: 10px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.72rem;
  z-index: 9999;
  color: #fff;
  opacity: 0.85;
  transition: opacity 0.3s;
}
</style>
