# 部署指南 | Deployment Guide

## 🚀 快速部署到 GitHub Pages

### 1. 準備 GitHub 存儲庫

```bash
# 如果還沒有 Git 存儲庫，初始化一個
git init

# 添加所有檔案
git add .

# 提交檔案
git commit -m "Initial commit: Online Clipboard App"

# 連接到您的 GitHub 存儲庫
git remote add origin https://github.com/kjyang-0114/online-clipboard.git

# 推送到 GitHub
git push -u origin main
```

### 2. 啟用 GitHub Pages

1. 前往您的 GitHub 存儲庫
2. 點擊 **Settings** 標籤
3. 在左側選單中找到 **Pages**
4. 在 **Source** 下拉選單中選擇 **GitHub Actions**
5. GitHub Actions 會自動部署您的應用

### 3. 自動部署

每次您推送代碼到 `main` 分支時，GitHub Actions 會自動：
- 安裝依賴
- 建構應用程式
- 部署到 GitHub Pages

您的應用將在以下 URL 可用：
```
https://kjyang-0114.github.io/online-clipboard/
```

## 🛠️ 手動部署

如果您想手動部署：

```bash
# 安裝依賴
npm install

# 建構應用程式
npm run build

# 部署到 GitHub Pages
npm run deploy
```

## 📱 測試應用程式

### 本地測試

```bash
# 啟動開發服務器
npm run dev

# 開啟瀏覽器並前往
# http://localhost:3000
```

### 功能測試

1. **建立剪貼簿**：
   - 輸入一些文字
   - 點擊「建立剪貼簿」
   - 應該會看到生成的 ID 和 URL 更新

2. **跨標籤頁同步**：
   - 複製當前 URL
   - 開啟新的瀏覽器標籤頁
   - 貼上 URL
   - 在任一標籤頁修改內容
   - 其他標籤頁應該會自動更新

3. **載入其他剪貼簿**：
   - 在「載入剪貼簿」欄位輸入其他 ID
   - 點擊「載入剪貼簿」
   - URL 應該更新為新的 ID

## 🔧 故障排除

### 常見問題

1. **部署失敗**：
   - 檢查 GitHub Actions 日誌
   - 確認所有檔案都已正確提交
   - 檢查 `vite.config.ts` 中的 `base` 路徑

2. **應用程式無法載入**：
   - 檢查瀏覽器控制台的錯誤訊息
   - 確認所有資源路徑正確
   - 檢查 GitHub Pages 設定

3. **跨標籤頁同步不工作**：
   - 確認使用相同的瀏覽器
   - 檢查 localStorage 是否可用
   - 檢查瀏覽器控制台的錯誤

## 🎯 SEO 優化確認

部署後確認以下 SEO 元素：

1. **頁面標題**：檢查是否包含關鍵字
2. **Meta 描述**：確認描述準確且吸引人
3. **結構化資料**：使用 [Google 結構化資料測試工具](https://search.google.com/test/rich-results) 驗證
4. **多語言標籤**：確認 hreflang 標籤正確

## 📊 分析和監控

您可以添加 Google Analytics 來追蹤使用情況：

1. 在 `index.html` 中添加 Google Analytics 代碼
2. 或使用 Google Tag Manager
3. 設定轉換目標追蹤剪貼簿建立和使用

## 🔄 更新和維護

### 定期更新

1. 更新依賴：
   ```bash
   npm update
   ```

2. 安全性掃描：
   ```bash
   npm audit
   npm audit fix
   ```

3. 效能優化：
   - 監控建構檔案大小
   - 優化圖片和資源
   - 考慮代碼分割

### 功能擴展

考慮添加的功能：
- 文件上傳支援
- 密碼保護
- 自定義過期時間
- 使用統計
- 主題切換

---

需要幫助？請查看 [GitHub Issues](https://github.com/kjyang-0114/online-clipboard/issues) 或創建新的問題！