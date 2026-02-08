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
        <router-link v-if="isAdmin" to="/admin/create" class="btn btn-primary" style="margin-top:16px;">建立新賽事</router-link>
      </div>

      <div v-else class="tournament-grid">
        <div v-for="t in tournaments" :key="t.id" class="tournament-card">
          <router-link :to="isAdmin ? `/admin/t/${t.id}` : `/t/${t.id}`" class="card-link">
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
          <div v-if="isAdmin" class="card-actions">
            <router-link :to="`/admin/t/${t.id}`" class="btn btn-primary btn-sm">編輯</router-link>
            <button class="btn btn-danger btn-sm" @click.stop="confirmDelete(t)">刪除</button>
          </div>
        </div>
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
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTournamentList } from '../composables/useTournaments.js'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const route = useRoute()
const isAdmin = computed(() => route.meta.section === 'admin')

const { tournaments, loading, listen, stop } = useTournamentList()
onMounted(listen)
onUnmounted(stop)

async function confirmDelete(t) {
  if (!confirm(`確定要刪除「${t.name}」？此操作無法復原。`)) return
  try {
    await deleteDoc(doc(db, 'tournaments', t.id))
  } catch (e) {
    console.error('刪除失敗:', e)
    alert('刪除失敗：' + e.message)
  }
}
</script>

<style scoped>
.tournament-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;
}
.tournament-card {
  display: flex; flex-direction: column;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);
  transition: all 0.2s; overflow: hidden;
}
.tournament-card:hover {
  border-color: var(--accent); transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--shadow);
}
.card-link {
  display: block; padding: 20px;
  text-decoration: none; color: inherit; flex: 1;
}
.t-name { font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 6px; }
.t-meta {
  display: flex; gap: 16px; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 10px;
}
.t-events { display: flex; gap: 6px; flex-wrap: wrap; }

.card-actions {
  display: flex; gap: 8px; padding: 0 20px 16px;
}

.legacy-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
</style>
