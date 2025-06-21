# Firebase 設定指南 | Firebase Setup Guide

## 🔥 Firebase 專案設定

### 1. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」或「Create a project」
3. 輸入專案名稱：`online-clipboard` 或您喜歡的名稱
4. 選擇是否啟用 Google Analytics（可選）
5. 等待專案建立完成

### 2. 啟用 Firestore Database

1. 在 Firebase Console 左側選單中，點擊「Firestore Database」
2. 點擊「建立資料庫」或「Create database」
3. 選擇「以測試模式啟動」（Start in test mode）
4. 選擇資料庫位置（建議選擇離您最近的區域）
5. 點擊「完成」

### 3. 設定 Web 應用程式

1. 在專案概覽頁面，點擊「</> Web」圖示
2. 輸入應用程式暱稱：`online-clipboard-web`
3. 勾選「同時設定此應用程式的 Firebase Hosting」（可選）
4. 點擊「註冊應用程式」
5. 複製 Firebase 配置代碼

### 4. 更新應用程式配置

將複製的配置代碼更新到 `src/firebase/config.ts` 文件中：

```typescript
const firebaseConfig = {
  apiKey: "您的-API-KEY",
  authDomain: "您的專案ID.firebaseapp.com",
  projectId: "您的專案ID",
  storageBucket: "您的專案ID.appspot.com",
  messagingSenderId: "您的發送者ID",
  appId: "您的應用程式ID"
};
```

### 5. 設定 Firestore 安全規則

1. 在 Firebase Console 中，前往「Firestore Database」
2. 點擊「規則」標籤
3. 將規則更新為：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clipboards/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**注意：** 這是開發用的寬鬆規則。在生產環境中，您應該設定更嚴格的安全規則。

### 6. 生產環境安全規則（建議）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clipboards/{clipboardId} {
      // 允許讀取和寫入，但限制文檔大小和頻率
      allow read, write: if 
        request.time < resource.data.expiresAt &&
        request.time > resource.data.createdAt &&
        resource.data.content.size() < 10000; // 限制內容大小為 10KB
    }
  }
}
```

## 🔒 隱私和安全考量

1. **數據過期**: 所有剪貼簿內容會在 24 小時後自動過期
2. **隨機 ID**: 使用隨機生成的 9 位字符 ID，難以猜測
3. **無個人資訊**: 不收集使用者個人資訊
4. **HTTPS**: 所有數據傳輸都通過 HTTPS 加密

## 📊 Firebase 使用量限制

Firebase Spark（免費）方案限制：
- **Firestore 讀取**: 每日 50,000 次
- **Firestore 寫入**: 每日 20,000 次
- **Firestore 刪除**: 每日 20,000 次
- **儲存空間**: 1 GB

對於個人使用或小規模應用，這些限制通常足夠。

## 🚀 部署前檢查清單

- [ ] Firebase 專案已建立
- [ ] Firestore Database 已啟用
- [ ] Web 應用程式已註冊
- [ ] 配置文件已更新
- [ ] 安全規則已設定
- [ ] 本地測試通過

## 🔧 故障排除

### 常見問題

1. **Firebase 初始化失敗**
   - 檢查配置文件是否正確
   - 確認 API Key 是否有效

2. **權限被拒絕**
   - 檢查 Firestore 安全規則
   - 確認規則語法正確

3. **網路連接問題**
   - 檢查網路連接
   - 確認 Firebase 服務狀態

### 偵錯技巧

1. 開啟瀏覽器開發者工具
2. 查看 Console 標籤中的錯誤訊息
3. 檢查 Network 標籤中的 API 請求

## 📱 本地開發（無 Firebase）

如果您不想使用 Firebase，可以使用本地存儲版本：

1. 修改 `src/hooks/useClipboard.ts`
2. 使用 localStorage 替代 Firebase
3. 注意：本地版本不支援跨設備同步

---

需要幫助？請在 [GitHub Issues](https://github.com/kjyang-0114/online-clipboard/issues) 中提問！