<template>
  <div class="site-header">
    <h1>乒乓球賽事系統</h1>
    <div class="header-meta">
      <span>建立、管理、查看各種桌球賽事</span>
    </div>
  </div>

  <div class="container" style="padding-top:24px;padding-bottom:40px;">
    <div v-if="loading" class="empty-state"><p>載入中...</p></div>

    <template v-else>
      <!-- 賽事列表 -->
      <div v-if="tournaments.length === 0" class="empty-state">
        <p>目前沒有賽事</p>
        <router-link to="/admin/create" class="btn btn-primary" style="margin-top:16px;">建立新賽事</router-link>
      </div>

      <div v-else class="tournament-grid">
        <router-link v-for="t in tournaments" :key="t.id"
                     :to="`/t/${t.id}`" class="tournament-card">
          <div class="t-name">{{ t.name }}</div>
          <div class="t-meta">
            <span v-if="t.date">{{ t.date }}</span>
            <span v-if="t.venue">{{ t.venue }}</span>
          </div>
          <div class="t-events">
            <span v-for="ev in (t.events || [])" :key="ev.id" class="badge badge-accent">
              {{ ev.label }}
            </span>
          </div>
        </router-link>
      </div>
    </template>

    <!-- 舊賽事入口 -->
    <div class="legacy-section">
      <div class="card-title" style="font-size:0.9rem;margin-top:32px;">舊版賽事</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <router-link to="/legacy" class="btn btn-outline btn-sm">主站（2026 潮州邀請賽）</router-link>
        <router-link to="/legacy/knockout16" class="btn btn-outline btn-sm">16強淘汰賽</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useTournamentList } from '../composables/useTournaments.js'

const { tournaments, loading, listen, stop } = useTournamentList()
onMounted(listen)
onUnmounted(stop)
</script>

<style scoped>
.tournament-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;
}
.tournament-card {
  display: block; padding: 20px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);
  transition: all 0.2s; text-decoration: none; color: inherit;
}
.tournament-card:hover {
  border-color: var(--accent); transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow);
}
.t-name { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 6px; }
.t-meta {
  display: flex; gap: 16px; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 10px;
}
.t-events { display: flex; gap: 6px; flex-wrap: wrap; }

.legacy-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
</style>
