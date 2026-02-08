// ===== Firestore 雲端同步模組 =====
// 載入順序：firebase SDK → firebase-config.js → storage.js → firestore-sync.js → view/admin.js
//
// 功能：
// 1. 啟動時從 Firestore 拉取最新資料 → 寫入 localStorage
// 2. 每次 saveData() 同時推送到 Firestore
// 3. onSnapshot 即時監聽：其他裝置更新時自動同步（觀看頁自動刷新）
// 4. 如果 Firebase 未設定，完全不影響原有行為
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

  // 用來避免自己寫入觸發的 onSnapshot 回呼
  var _saving = false;

  // ── 覆寫 saveData：localStorage + Firestore 雙寫 ──
  var _origSave = saveData;
  saveData = function (d) {
    _origSave(d); // 先寫 localStorage（同步，確保即時生效）
    _saving = true;
    docRef.set(JSON.parse(JSON.stringify(d))).then(function () {
      _saving = false;
    }).catch(function (err) {
      _saving = false;
      console.error('[Firestore Sync] 儲存失敗:', err);
    });
  };

  // ── 啟動時從 Firestore 拉取最新資料 ──
  window._firestoreReady = docRef.get().then(function (doc) {
    if (doc.exists) {
      var remoteData = doc.data();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
      console.log('[Firestore Sync] 已從雲端載入資料');
    } else {
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
    }

    // ── 設定即時監聽（onSnapshot） ──
    // 跳過第一次（已用 get() 載入過了）
    var isFirst = true;
    docRef.onSnapshot(function (snap) {
      if (isFirst) { isFirst = false; return; }
      if (_saving) return; // 忽略自己寫入產生的回呼
      if (snap.exists) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snap.data()));
        // 發送自訂事件，讓 view.js 接收並自動重新渲染
        window.dispatchEvent(new CustomEvent('firestore-update'));
        console.log('[Firestore Sync] 收到雲端更新');
      }
    });

    return null;
  }).catch(function (err) {
    console.error('[Firestore Sync] 載入失敗:', err);
    return null;
  });
})();
