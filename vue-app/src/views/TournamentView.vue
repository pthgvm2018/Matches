<template>
  <div v-if="loading" class="empty-state" style="padding-top:60px;"><p>載入中...</p></div>

  <template v-else-if="data">
    <div class="site-header">
      <h1>{{ data.name }}</h1>
      <div class="header-meta">
        <span v-if="data.date">{{ data.date }}</span>
        <span v-if="data.venue">{{ data.venue }}</span>
      </div>
    </div>

    <!-- 項目 Tab -->
    <div class="nav-bar">
      <ul>
        <li v-for="ev in data.events" :key="ev.id">
          <button :class="{ active: activeEventId === ev.id }" @click="activeEventId = ev.id">
            {{ ev.label }}
          </button>
        </li>
      </ul>
    </div>

    <!-- 當前項目內容 -->
    <div class="container" style="padding-top:24px;padding-bottom:40px;">
      <template v-if="activeEvent">
        <!-- 循環賽 -->
        <RoundRobinView v-if="activeEvent.format === 'round_robin'"
                        :event="activeEvent" />

        <!-- 淘汰賽 -->
        <EliminationView v-else-if="activeEvent.format === 'elimination'"
                         :event="activeEvent" />

        <!-- 分組循環+淘汰 -->
        <GroupKnockoutView v-else-if="activeEvent.format === 'group_knockout'"
                           :event="activeEvent" />
      </template>
    </div>
  </template>

  <div v-else class="empty-state" style="padding-top:60px;">
    <p>找不到此賽事</p>
    <router-link to="/" class="btn btn-outline" style="margin-top:12px;">返回首頁</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTournament } from '../composables/useTournaments.js'
import RoundRobinView from '../components/RoundRobinView.vue'
import EliminationView from '../components/EliminationView.vue'
import GroupKnockoutView from '../components/GroupKnockoutView.vue'

const route = useRoute()
const tid = route.params.id
const { data, loading, load, listen, stop } = useTournament(tid)

const activeEventId = ref(null)
const activeEvent = computed(() => {
  if (!data.value) return null
  return data.value.events.find(e => e.id === activeEventId.value) || data.value.events[0]
})

onMounted(async () => {
  await load()
  if (data.value && data.value.events.length > 0) {
    activeEventId.value = data.value.events[0].id
  }
  listen()
})
onUnmounted(stop)
</script>
