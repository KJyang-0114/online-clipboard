import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  'zh-TW': {
    translation: {
      // App Title & Description
      appTitle: '線上剪貼簿',
      appSubtitle: '多設備即時同步',
      appDescription: '輕鬆在不同設備間分享文字內容',
      
      // Actions
      create: '建立剪貼簿',
      update: '更新剪貼簿',
      load: '載入剪貼簿',
      copy: '複製',
      clear: '清空',
      share: '分享',
      delete: '刪除',
      
      // Status
      connected: '已連線',
      disconnected: '已斷線',
      syncing: '同步中',
      ready: '就緒',
      expired: '已過期',
      
      // Messages
      placeholder: '在此輸入您的文字內容...',
      clipboardIdPlaceholder: '輸入剪貼簿 ID',
      copied: '已複製到剪貼簿！',
      created: '剪貼簿已建立！',
      updated: '剪貼簿已更新！',
      loaded: '剪貼簿已載入！',
      deleted: '剪貼簿已刪除！',
      syncFromDevice: '內容已從其他設備同步',
      
      // Errors
      loadFailed: '載入失敗，請檢查網路連接',
      createFailed: '建立失敗，請稍後再試',
      updateFailed: '更新失敗，請稍後再試',
      deleteFailed: '刪除失敗，請稍後再試',
      clipboardNotFound: '剪貼簿不存在或已過期',
      networkError: '網路連接錯誤',
      
      // Info
      expiresIn: '過期時間：{{time}}',
      lastUpdated: '最後更新：{{time}}',
      charactersCount: '字元數：{{count}}',
      shareUrl: '分享連結',
      qrCode: 'QR Code',
      
      // Language
      language: '語言',
      'zh-TW': '繁體中文',
      'en': 'English',
      'ja': '日本語',
      
      // Footer
      madeWith: 'kjyang-0114 製作',
      author: '',
      sourceCode: '原始碼',
      
      // Features
      features: '功能特色',
      feature1: '🔄 即時同步',
      feature1Desc: '多設備間即時同步內容',
      feature2: '🔒 安全可靠',
      feature2Desc: '24小時自動過期保護',
      feature3: '🌍 多語言支援',
      feature3Desc: '支援中文、英文、日文',
      feature4: '📱 響應式設計',
      feature4Desc: '完美適配手機和電腦',
    }
  },
  'en': {
    translation: {
      // App Title & Description
      appTitle: 'Online Clipboard',
      appSubtitle: 'Multi-device Real-time Sync',
      appDescription: 'Easily share text content between different devices',
      
      // Actions
      create: 'Create Clipboard',
      update: 'Update Clipboard',
      load: 'Load Clipboard',
      copy: 'Copy',
      clear: 'Clear',
      share: 'Share',
      delete: 'Delete',
      
      // Status
      connected: 'Connected',
      disconnected: 'Disconnected',
      syncing: 'Syncing',
      ready: 'Ready',
      expired: 'Expired',
      
      // Messages
      placeholder: 'Enter your text content here...',
      clipboardIdPlaceholder: 'Enter clipboard ID',
      copied: 'Copied to clipboard!',
      created: 'Clipboard created!',
      updated: 'Clipboard updated!',
      loaded: 'Clipboard loaded!',
      deleted: 'Clipboard deleted!',
      syncFromDevice: 'Content synced from other device',
      
      // Errors
      loadFailed: 'Load failed, please check network connection',
      createFailed: 'Create failed, please try again later',
      updateFailed: 'Update failed, please try again later',
      deleteFailed: 'Delete failed, please try again later',
      clipboardNotFound: 'Clipboard not found or expired',
      networkError: 'Network connection error',
      
      // Info
      expiresIn: 'Expires in: {{time}}',
      lastUpdated: 'Last updated: {{time}}',
      charactersCount: 'Characters: {{count}}',
      shareUrl: 'Share URL',
      qrCode: 'QR Code',
      
      // Language
      language: 'Language',
      'zh-TW': '繁體中文',
      'en': 'English',
      'ja': '日本語',
      
      // Footer
      madeWith: 'Made by kjyang-0114',
      author: '',
      sourceCode: 'Source Code',
      
      // Features
      features: 'Features',
      feature1: '🔄 Real-time Sync',
      feature1Desc: 'Real-time content sync across devices',
      feature2: '🔒 Secure & Reliable',
      feature2Desc: '24-hour auto-expiration protection',
      feature3: '🌍 Multi-language',
      feature3Desc: 'Chinese, English, Japanese support',
      feature4: '📱 Responsive Design',
      feature4Desc: 'Perfect for mobile and desktop',
    }
  },
  'ja': {
    translation: {
      // App Title & Description
      appTitle: 'オンラインクリップボード',
      appSubtitle: 'マルチデバイス リアルタイム同期',
      appDescription: '異なるデバイス間でテキストコンテンツを簡単に共有',
      
      // Actions
      create: 'クリップボード作成',
      update: 'クリップボード更新',
      load: 'クリップボード読み込み',
      copy: 'コピー',
      clear: 'クリア',
      share: '共有',
      delete: '削除',
      
      // Status
      connected: '接続済み',
      disconnected: '切断',
      syncing: '同期中',
      ready: '準備完了',
      expired: '期限切れ',
      
      // Messages
      placeholder: 'こちらにテキストを入力してください...',
      clipboardIdPlaceholder: 'クリップボードIDを入力',
      copied: 'クリップボードにコピーしました！',
      created: 'クリップボードを作成しました！',
      updated: 'クリップボードを更新しました！',
      loaded: 'クリップボードを読み込みました！',
      deleted: 'クリップボードを削除しました！',
      syncFromDevice: '他のデバイスからコンテンツを同期しました',
      
      // Errors
      loadFailed: '読み込みに失敗しました。ネットワーク接続を確認してください',
      createFailed: '作成に失敗しました。後でもう一度お試しください',
      updateFailed: '更新に失敗しました。後でもう一度お試しください',
      deleteFailed: '削除に失敗しました。後でもう一度お試しください',
      clipboardNotFound: 'クリップボードが見つからないか期限切れです',
      networkError: 'ネットワーク接続エラー',
      
      // Info
      expiresIn: '有効期限: {{time}}',
      lastUpdated: '最終更新: {{time}}',
      charactersCount: '文字数: {{count}}',
      shareUrl: '共有URL',
      qrCode: 'QRコード',
      
      // Language
      language: '言語',
      'zh-TW': '繁體中文',
      'en': 'English',
      'ja': '日本語',
      
      // Footer
      madeWith: 'kjyang-0114 が作成',
      author: '',
      sourceCode: 'ソースコード',
      
      // Features
      features: '機能',
      feature1: '🔄 リアルタイム同期',
      feature1Desc: 'デバイス間でリアルタイムに同期',
      feature2: '🔒 安全で信頼性',
      feature2Desc: '24時間自動期限切れ保護',
      feature3: '🌍 多言語対応',
      feature3Desc: '中国語、英語、日本語に対応',
      feature4: '📱 レスポンシブデザイン',
      feature4Desc: 'モバイルとデスクトップに最適',
    }
  }
};

const getInitialLanguage = () => {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && resources[urlLang as keyof typeof resources]) {
    return urlLang;
  }
  
  // Check localStorage
  const savedLang = localStorage.getItem('clipboard-language');
  if (savedLang && resources[savedLang as keyof typeof resources]) {
    return savedLang;
  }
  
  // Check browser language
  const browserLang = navigator.language;
  if (browserLang.startsWith('zh')) {
    return 'zh-TW';
  } else if (browserLang.startsWith('ja')) {
    return 'ja';
  } else {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;