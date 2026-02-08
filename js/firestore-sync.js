// ===== Firestore 雲端同步模組 =====
// 載入順序：firebase SDK → firebase-config.js → storage.js → firestore-sync.js → view/admin.js
//
// 功能：
// 1. 啟動時從 Firestore 拉取最新資料 → 寫入 localStorage
// 2. 每次 saveData() 同時推送到 Firestore
// 3. 如果 Firebase 未設定，完全不影響原有行為
(function () {
  'use strict';

  // 未設定 Firebase → 跳過，維持純 localStorage 模式
  if (typeof FIREBASE_CONFIG === 'undefined' ||
      !FIREBASE_CONFIG.apiKey ||
      FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
    return;
  }

  // 確認 Firebase SDK 已載入
  if (typeof firebase === 'undefined') {
    console.warn('[Firestore Sync] Firebase SDK 未載入');
    return;
  }

  // 初始化 Firebase（避免重複初始化）
  if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
  }

  var db = firebase.firestore();
  // 用 STORAGE_KEY 作為文件 ID（主站: pingpong_tournament, ko16: ko16_tournament）
  var docRef = db.collection('tournaments').doc(STORAGE_KEY);

  // ── 覆寫 saveData：localStorage + Firestore 雙寫 ──
  var _origSave = saveData;
  saveData = function (d) {
    _origSave(d); // 先寫 localStorage（同步，確保即時生效）
    // 非同步推送到 Firestore
    docRef.set(JSON.parse(JSON.stringify(d))).catch(function (err) {
      console.error('[Firestore Sync] 儲存失敗:', err);
    });
  };

  // ── 啟動時從 Firestore 拉取最新資料 ──
  window._firestoreReady = docRef.get().then(function (doc) {
    if (doc.exists) {
      var remoteData = doc.data();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
      console.log('[Firestore Sync] 已從雲端載入資料');
      return remoteData;
    }
    // 雲端沒有資料 → 把本地資料推上去
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        var localData = JSON.parse(raw);
        if (localData.teams && localData.teams.length > 0) {
          docRef.set(localData).catch(function (err) {
            console.error('[Firestore Sync] 初始推送失敗:', err);
          });
          console.log('[Firestore Sync] 本地資料已推送到雲端');
        }
      } catch (e) { /* ignore */ }
    }
    return null;
  }).catch(function (err) {
    console.error('[Firestore Sync] 載入失敗:', err);
    return null;
  });
})();
