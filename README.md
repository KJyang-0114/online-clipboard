# 線上剪貼簿 | Online Clipboard
 
一個支援多設備即時同步的線上剪貼簿工具，讓您輕鬆在不同設備間分享文字內容。

A multi-device synchronized online clipboard tool that makes it easy to share text content between different devices.

## ✨ 功能特色 | Features

- 🔄 **即時同步** | Real-time sync across devices
- 🔒 **安全可靠** | Secure with 24-hour auto-expiration
- 🌍 **多語言支援** | Multi-language support (中文/English/日本語)
- 📱 **響應式設計** | Responsive design for mobile and desktop
- 🚀 **快速部署** | Easy deployment on GitHub Pages
- 🔥 **無需登入** | No registration required

## 🌐 線上使用 | Live Demo

訪問：[https://kjyang-0114.github.io/online-clipboard/](https://kjyang-0114.github.io/online-clipboard/)

## 🛠️ 技術棧 | Tech Stack

- **前端 | Frontend**: React 18 + TypeScript + Vite
- **樣式 | Styling**: Tailwind CSS
- **後端服務 | Backend**: Firebase Firestore
- **國際化 | i18n**: react-i18next
- **部署 | Deployment**: GitHub Pages + GitHub Actions

## 🚀 本地開發 | Local Development

### 安裝依賴 | Install Dependencies

```bash
npm install
```

### Firebase 配置 | Firebase Configuration

1. 在 [Firebase Console](https://console.firebase.google.com/) 建立新專案
2. 啟用 Firestore Database
3. 更新 `src/firebase/config.ts` 中的配置資訊

### 啟動開發伺服器 | Start Development Server

```bash
npm run dev
```

### 建構專案 | Build Project

```bash
npm run build
```

### 部署到 GitHub Pages | Deploy to GitHub Pages

```bash
npm run deploy
```

## 📁 專案結構 | Project Structure

```
online-clipboard/
├── src/
│   ├── components/          # React 組件
│   ├── hooks/              # 自定義 Hooks
│   ├── firebase/           # Firebase 配置和服務
│   ├── i18n/               # 國際化配置
│   ├── App.tsx             # 主應用組件
│   └── main.tsx            # 程序入口
├── .github/workflows/      # GitHub Actions
├── public/                 # 靜態資源
└── dist/                   # 建構輸出
```

## 🌍 多語言支援 | Multi-language Support

支援的語言 | Supported Languages:
- 🇹🇼 繁體中文 (Traditional Chinese)
- 🇺🇸 English
- 🇯🇵 日本語 (Japanese)

## 🔧 配置說明 | Configuration

### Firebase 設定 | Firebase Setup

1. 建立 Firebase 專案
2. 啟用 Firestore Database
3. 設定安全規則：

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

### GitHub Pages 部署 | GitHub Pages Deployment

1. Fork 此專案到您的 GitHub 帳號
2. 在專案設定中啟用 GitHub Pages
3. 選擇 GitHub Actions 作為部署來源
4. 推送代碼到 `main` 分支即可自動部署

## 📱 使用方法 | How to Use

1. **建立剪貼簿** | Create Clipboard
   - 輸入文字內容
   - 點擊「建立剪貼簿」按鈕
   - 系統會生成唯一的 ID

2. **分享剪貼簿** | Share Clipboard
   - 複製分享連結
   - 在其他設備開啟連結
   - 內容會即時同步

3. **更新內容** | Update Content
   - 修改文字內容
   - 點擊「更新剪貼簿」按鈕
   - 所有設備會即時更新

4. **載入剪貼簿** | Load Clipboard
   - 輸入剪貼簿 ID
   - 點擊「載入剪貼簿」按鈕
   - 即可存取內容

## 🔐 隱私與安全 | Privacy & Security

- 所有剪貼簿內容會在 24 小時後自動過期
- 只有知道 ID 的人才能存取內容
- 不收集使用者個人資訊
- 建議不要存放敏感資訊

## 📄 開源授權 | License

MIT License - 詳見 [LICENSE](LICENSE) 文件

## 🤝 貢獻 | Contributing

歡迎提交 Issue 和 Pull Request！

1. Fork 專案
2. 建立功能分支
3. 提交變更
4. 推送到分支
5. 建立 Pull Request

## 🙏 致謝 | Acknowledgments

- [React](https://reactjs.org/) - UI 框架
- [Firebase](https://firebase.google.com/) - 後端服務
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide React](https://lucide.dev/) - 圖標庫
- [Vite](https://vitejs.dev/) - 建構工具

---

Made with ❤️ by [KJyang](https://github.com/kjyang-0114)
