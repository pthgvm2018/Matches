// Firestore CRUD for tournament list + individual tournament
import { ref } from 'vue'
import { collection, doc, getDoc, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'tournaments'

// --- 賽事列表 ---
export function useTournamentList() {
  const tournaments = ref([])
  const loading = ref(true)
  let unsubscribe = null

  async function load() {
    loading.value = true
    try {
      const snap = await getDocs(collection(db, COLLECTION))
      tournaments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(t => t.name)  // 排除舊版格式文件（沒有 name 屬性）
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    } catch (e) {
      console.error('[useTournamentList] load failed:', e)
    } finally {
      loading.value = false
    }
  }

  function listen() {
    unsubscribe = onSnapshot(collection(db, COLLECTION), (snap) => {
      tournaments.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(t => t.name)  // 排除舊版格式文件（沒有 name 屬性）
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      loading.value = false
    }, (err) => {
      console.error('[useTournamentList] listen error:', err)
    })
  }

  function stop() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
  }

  return { tournaments, loading, load, listen, stop }
}

// --- 單一賽事 CRUD ---
export function useTournament(tournamentId) {
  const data = ref(null)
  const loading = ref(true)
  const saving = ref(false)
  let unsubscribe = null

  const docRef = doc(db, COLLECTION, tournamentId)

  async function load() {
    loading.value = true
    try {
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        data.value = { id: snap.id, ...snap.data() }
      }
    } catch (e) {
      console.error('[useTournament] load failed:', e)
    } finally {
      loading.value = false
    }
  }

  function listen(onChange) {
    let isFirst = true
    unsubscribe = onSnapshot(docRef, (snap) => {
      // 跳過第一次回調（已經 load() 過了）
      if (isFirst) { isFirst = false; return }
      if (saving.value) return
      if (snap.exists()) {
        data.value = { id: snap.id, ...snap.data() }
        if (onChange) onChange(data.value)
      }
      loading.value = false
    }, (err) => {
      console.error('[useTournament] listen error:', err)
    })
  }

  async function save(tournamentData) {
    saving.value = true
    try {
      const toSave = JSON.parse(JSON.stringify(tournamentData))
      delete toSave.id
      await setDoc(docRef, toSave)
      data.value = { id: tournamentId, ...toSave }
    } catch (e) {
      console.error('[useTournament] save failed:', e)
      throw e
    } finally {
      saving.value = false
    }
  }

  async function remove() {
    try {
      await deleteDoc(docRef)
    } catch (e) {
      console.error('[useTournament] delete failed:', e)
      throw e
    }
  }

  function stop() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
  }

  return { data, loading, saving, load, listen, save, remove, stop }
}

// --- 建立新賽事 ---
export async function createTournamentDoc(tournament) {
  const id = tournament.id
  const toSave = JSON.parse(JSON.stringify(tournament))
  delete toSave.id
  await setDoc(doc(db, COLLECTION, id), toSave)
  return id
}
