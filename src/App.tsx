import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'react-hot-toast';
import {
  Wifi,
  WifiOff,
  Copy,
  Share,
  Trash2,
  RefreshCw,
  Plus,
  Download,
  Globe,
  Github
} from 'lucide-react';
import { useClipboard } from './hooks/useClipboard';
import AdSense from './components/AdSense';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('clipboard-language', lng);
    
    // Update URL parameter
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lng);
    window.history.pushState({}, '', url.toString());
  };
  
  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <select 
        value={i18n.language} 
        onChange={(e) => changeLanguage(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="zh-TW">{t('zh-TW')}</option>
        <option value="en">{t('en')}</option>
        <option value="ja">{t('ja')}</option>
      </select>
    </div>
  );
};

const StatusIndicator: React.FC<{ isConnected: boolean; isSyncing: boolean }> = ({ 
  isConnected, 
  isSyncing 
}) => {
  const { t } = useTranslation();
  
  if (isSyncing) {
    return (
      <div className="status-indicator status-syncing">
        <RefreshCw className="h-4 w-4 animate-spin" />
        {t('syncing')}
      </div>
    );
  }
  
  return (
    <div className={`status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
      {isConnected ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      {isConnected ? t('connected') : t('disconnected')}
    </div>
  );
};

const App: React.FC = () => {
  const { t } = useTranslation();
  const [inputClipboardId, setInputClipboardId] = useState('');

  
  const {
    content,
    clipboardId,
    isConnected,
    isSyncing,
    lastUpdated,
    expiresAt,
    characterCount,
    setContent,
    createNewClipboard,
    loadClipboard,
    updateCurrentClipboard,
    deleteCurrentClipboard,
    copyToClipboard,
    clearContent,
    getShareUrl,
    isExpired
  } = useClipboard();
  
  const handleLoadClipboard = () => {
    if (inputClipboardId.trim()) {
      loadClipboard(inputClipboardId.trim());
      setInputClipboardId('');
    }
  };
  
  const handleShare = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('appTitle'),
          text: t('appDescription'),
          url: shareUrl,
        });
      } catch (error) {
        // Fall back to copying URL
        await navigator.clipboard.writeText(shareUrl);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('appTitle')}</h1>
              <p className="text-sm text-gray-600">{t('appSubtitle')}</p>
            </div>
            <div className="flex items-center gap-4">
              <StatusIndicator isConnected={isConnected} isSyncing={isSyncing} />
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Current Clipboard Info */}
        {clipboardId && (
          <div className="card p-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">剪貼簿 ID: {clipboardId}</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  {lastUpdated && (
                    <div>{t('lastUpdated', { time: formatDate(lastUpdated) })}</div>
                  )}
                  {expiresAt && (
                    <div className={isExpired() ? 'text-red-600' : ''}>
                      {t('expiresIn', { time: formatDate(expiresAt) })}
                    </div>
                  )}
                  <div>{t('charactersCount', { count: characterCount })}</div>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="btn-outline"
                disabled={!clipboardId}
              >
                <Share className="h-4 w-4 mr-2" />
                {t('share')}
              </button>
            </div>
          </div>
        )}
        
        {/* Main Editor */}
        <div className="card p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              {t('appDescription')}
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('placeholder')}
              className="textarea-field h-64"
              disabled={isSyncing}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!clipboardId ? (
              <button
                onClick={createNewClipboard}
                disabled={!content.trim() || isSyncing}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('create')}
              </button>
            ) : (
              <button
                onClick={updateCurrentClipboard}
                disabled={!content.trim() || isSyncing}
                className="btn-primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('update')}
              </button>
            )}
            
            <button
              onClick={copyToClipboard}
              disabled={!content.trim()}
              className="btn-secondary"
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('copy')}
            </button>
            
            <button
              onClick={clearContent}
              disabled={!content.trim()}
              className="btn-outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('clear')}
            </button>
            
            {clipboardId && (
              <button
                onClick={deleteCurrentClipboard}
                disabled={isSyncing}
                className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </button>
            )}
          </div>
        </div>
        
        {/* Load Clipboard Section */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{t('load')}</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={inputClipboardId}
              onChange={(e) => setInputClipboardId(e.target.value)}
              placeholder={t('clipboardIdPlaceholder')}
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleLoadClipboard()}
            />
            <button
              onClick={handleLoadClipboard}
              disabled={!inputClipboardId.trim() || isSyncing}
              className="btn-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('load')}
            </button>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{t('features')}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{t('feature1').split(' ')[0]}</div>
              <div>
                <h4 className="font-medium">{t('feature1').substring(2)}</h4>
                <p className="text-sm text-gray-600">{t('feature1Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">{t('feature2').split(' ')[0]}</div>
              <div>
                <h4 className="font-medium">{t('feature2').substring(2)}</h4>
                <p className="text-sm text-gray-600">{t('feature2Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">{t('feature3').split(' ')[0]}</div>
              <div>
                <h4 className="font-medium">{t('feature3').substring(2)}</h4>
                <p className="text-sm text-gray-600">{t('feature3Desc')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl">{t('feature4').split(' ')[0]}</div>
              <div>
                <h4 className="font-medium">{t('feature4').substring(2)}</h4>
                <p className="text-sm text-gray-600">{t('feature4Desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Google AdSense 廣告 - 頁面中間 */}
        <div className="flex justify-center my-8">
          <AdSense
            adSlot="1234567890"
            className="max-w-full"
          />
        </div>
      </main>

      {/* Google AdSense 廣告 - Footer上方 */}
      <div className="flex justify-center my-8">
        <AdSense
          adSlot="2345678901"
          className="max-w-full"
        />
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
            <span>{t('madeWith')}</span>
            <span>•</span>
            <a
              href="https://github.com/kjyang-0114/online-clipboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <Github className="h-4 w-4" />
              {t('sourceCode')}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;