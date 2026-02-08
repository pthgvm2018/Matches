import { ref, onUnmounted } from 'vue'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useFirestore(storageKey) {
  const syncStatus = ref('connecting') // connecting | online | syncing | synced | error | offline
  const syncText = ref('雲端連線中...')
  let _saving = false
  let unsubscribe = null

  const docRef = doc(db, 'tournaments', storageKey)

  async function loadFromCloud() {
    try {
      syncStatus.value = 'connecting'
      syncText.value = '雲端連線中...'
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        const remoteData = snap.data()
        localStorage.setItem(storageKey, JSON.stringify(remoteData))
        syncStatus.value = 'online'
        syncText.value = '已連線'
        return remoteData
      } else {
        // No cloud data - push local data up
        const raw = localStorage.getItem(storageKey)
        if (raw) {
          try {
            const localData = JSON.parse(raw)
            if (localData.teams && localData.teams.length > 0) {
              await setDoc(docRef, localData)
            }
          } catch (e) { /* ignore */ }
        }
        syncStatus.value = 'online'
        syncText.value = '已連線（新資料庫）'
        return null
      }
    } catch (err) {
      syncStatus.value = 'error'
      syncText.value = '連線失敗: ' + (err.code || err.message)
      console.error('[Firestore] 載入失敗:', err)
      return null
    }
  }

  function startListening(onUpdate) {
    let isFirst = true
    unsubscribe = onSnapshot(docRef, (snap) => {
      if (isFirst) { isFirst = false; return }
      if (_saving) return
      if (snap.exists()) {
        const data = snap.data()
        localStorage.setItem(storageKey, JSON.stringify(data))
        syncStatus.value = 'online'
        syncText.value = '收到更新'
        onUpdate(data)
      }
    }, (err) => {
      syncStatus.value = 'error'
      syncText.value = '監聽失敗: ' + (err.code || err.message)
    })
  }

  async function saveToCloud(data) {
    // Save to localStorage first
    localStorage.setItem(storageKey, JSON.stringify(data))
    // Then push to Firestore
    _saving = true
    syncStatus.value = 'syncing'
    syncText.value = '同步中...'
    try {
      await setDoc(docRef, JSON.parse(JSON.stringify(data)))
      syncStatus.value = 'online'
      syncText.value = '已同步'
    } catch (err) {
      syncStatus.value = 'error'
      syncText.value = '同步失敗'
      console.error('[Firestore] 儲存失敗:', err)
    } finally {
      _saving = false
    }
  }

  function stopListening() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null }
  }

  onUnmounted(stopListening)

  return { syncStatus, syncText, loadFromCloud, startListening, saveToCloud, stopListening }
}
