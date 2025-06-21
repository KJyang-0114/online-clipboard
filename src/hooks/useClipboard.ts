import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createClipboard,
  getClipboard,
  updateClipboard,
  deleteClipboard,
  subscribeToClipboard
} from '../services/clipboardService';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export interface UseClipboardReturn {
  // State
  content: string;
  clipboardId: string;
  isConnected: boolean;
  isSyncing: boolean;
  isUserTyping: boolean;
  lastUpdated: Date | null;
  expiresAt: Date | null;
  characterCount: number;
  
  // Actions
  setContent: (content: string) => void;
  setClipboardId: (id: string) => void;
  createNewClipboard: () => Promise<void>;
  loadClipboard: (id?: string, silent?: boolean) => Promise<void>;
  updateCurrentClipboard: () => Promise<void>;
  deleteCurrentClipboard: () => Promise<void>;
  copyToClipboard: () => Promise<void>;
  clearContent: () => void;
  
  // Utilities
  getShareUrl: () => string;
  isExpired: () => boolean;
}

export const useClipboard = (): UseClipboardReturn => {
  const { t } = useTranslation();
  
  // Core state
  const [content, setContentState] = useState("");
  const [clipboardId, setClipboardIdState] = useState("");
  const [lastKnownContent, setLastKnownContent] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  
  // Refs for real-time sync control
  const isUserTypingRef = useRef(false);
  const lastUserInputRef = useRef(Date.now());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle content changes with typing detection and auto-save
  const setContent = useCallback((newContent: string) => {
    setContentState(newContent);
    isUserTypingRef.current = true;
    lastUserInputRef.current = Date.now();
    
    // Clear previous timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set user as not typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastUserInputRef.current >= 1900) {
        isUserTypingRef.current = false;
      }
    }, 2000);
    
    // Auto-save after 3 seconds of inactivity (only if clipboard exists)
    if (clipboardId && newContent.trim() && newContent !== lastKnownContent) {
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateClipboard(clipboardId, newContent);
          setLastKnownContent(newContent);
          setLastUpdated(new Date());
          console.log('Auto-saved clipboard:', clipboardId);
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }, 3000);
    }
  }, [clipboardId, lastKnownContent]);
  
  // Set clipboard ID and start real-time sync
  const setClipboardId = useCallback((id: string) => {
    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    setClipboardIdState(id);
    
    if (id) {
      // Start real-time subscription
      const unsubscribe = subscribeToClipboard(
        id,
        (data) => {
          if (data && !isUserTypingRef.current) {
            // 最後更新優先：總是接受遠端的最新版本
            const isNewerVersion = !lastUpdated || data.updatedAt > lastUpdated;
            
            if (isNewerVersion && data.content !== lastKnownContent) {
              setContentState(data.content);
              setLastKnownContent(data.content);
              setLastUpdated(data.updatedAt);
              setExpiresAt(data.expiresAt);
              setIsConnected(true);
              
              // Show sync notification if content actually changed
              if (data.content !== content) {
                toast.success(t('syncFromDevice'));
              }
            }
          } else if (!data) {
            // Clipboard not found or expired
            setExpiresAt(null);
            setLastUpdated(null);
          }
        },
        (error) => {
          setIsConnected(false);
          console.error('Sync error:', error);
        }
      );
      
      unsubscribeRef.current = unsubscribe;
    }
  }, [content, lastKnownContent, t]);
  
  // Create new clipboard
  const createNewClipboard = useCallback(async () => {
    if (!content.trim()) {
      toast.error('請輸入內容');
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await createClipboard(content);
      
      // 先更新 URL，再設定 clipboardId
      const url = new URL(window.location.href);
      url.searchParams.set('id', result.id);
      window.history.pushState({}, '', url.toString());
      
      // 設定新的剪貼簿 ID（這會觸發新的訂閱）
      setClipboardId(result.id);
      setExpiresAt(result.expiresAt);
      setLastUpdated(new Date());
      setLastKnownContent(content);
      
      toast.success(t('created'));
    } catch (error) {
      console.error('Create failed:', error);
      toast.error(t('createFailed'));
      setIsConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, [content, setClipboardId, t]);
  
  // Load clipboard
  const loadClipboard = useCallback(async (id?: string, silent = false) => {
    const targetId = id || clipboardId;
    if (!targetId) return;
    
    if (!silent) setIsSyncing(true);
    
    try {
      const data = await getClipboard(targetId);
      
      if (!data) {
        if (!silent) {
          toast.error(t('clipboardNotFound'));
        }
        return;
      }
      
      // 如果載入的是不同的剪貼簿，更新 URL 和 clipboardId
      if (targetId !== clipboardId) {
        const url = new URL(window.location.href);
        url.searchParams.set('id', targetId);
        window.history.pushState({}, '', url.toString());
        setClipboardId(targetId);
      }
      
      // Only update if user is not typing and content is different
      if (!isUserTypingRef.current && data.content !== lastKnownContent) {
        setContentState(data.content);
        setLastKnownContent(data.content);
        setLastUpdated(data.updatedAt);
        setExpiresAt(data.expiresAt);
        
        if (!silent) {
          toast.success(t('loaded'));
        }
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Load failed:', error);
      setIsConnected(false);
      if (!silent) {
        toast.error(t('loadFailed'));
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [clipboardId, lastKnownContent, t, setClipboardId]);
  
  // Update current clipboard
  const updateCurrentClipboard = useCallback(async () => {
    if (!clipboardId || !content.trim()) {
      toast.error('無法更新：缺少內容或ID');
      return;
    }
    
    setIsSyncing(true);
    try {
      // 立即更新本地狀態以提供即時反饋
      setLastKnownContent(content);
      setLastUpdated(new Date());
      
      // 顯示更新中提示
      toast.loading(t('updating'));
      
      await updateClipboard(clipboardId, content);
      
      // 顯示成功訊息和等待提示
      toast.dismiss();
      toast.success(t('updated'));
      
      // 顯示等待同步的提示
      setTimeout(() => {
        toast(t('syncWait'), {
          duration: 8000,
          icon: '⏱️'
        });
      }, 1000);
      
      setIsConnected(true);
    } catch (error) {
      console.error('Update failed:', error);
      toast.dismiss();
      setIsConnected(false);
      
      if (error instanceof Error && error.message.includes('expired')) {
        toast.error(t('clipboardNotFound'));
        setExpiresAt(null);
      } else {
        toast.error(t('updateFailed'));
      }
    } finally {
      setIsSyncing(false);
    }
  }, [clipboardId, content, t]);
  
  // Delete current clipboard
  const deleteCurrentClipboard = useCallback(async () => {
    if (!clipboardId) return;
    
    setIsSyncing(true);
    try {
      await deleteClipboard(clipboardId);
      
      // Clean up state
      setClipboardIdState("");
      setContentState("");
      setLastKnownContent("");
      setLastUpdated(null);
      setExpiresAt(null);
      
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      window.history.pushState({}, '', url.toString());
      
      toast.success(t('deleted'));
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(t('deleteFailed'));
    } finally {
      setIsSyncing(false);
    }
  }, [clipboardId, t]);
  
  // Copy to system clipboard
  const copyToClipboard = useCallback(async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      toast.success(t('copied'));
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('複製失敗');
    }
  }, [content, t]);
  
  // Clear content
  const clearContent = useCallback(() => {
    setContentState("");
    setLastKnownContent("");
  }, []);
  
  // Get share URL
  const getShareUrl = useCallback(() => {
    if (!clipboardId) return '';
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('id', clipboardId);
    return url.toString();
  }, [clipboardId]);
  
  // Check if expired
  const isExpired = useCallback(() => {
    if (!expiresAt) return false;
    return expiresAt < new Date();
  }, [expiresAt]);
  
  // Initialize from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlId = urlParams.get('id');
    if (urlId) {
      setClipboardId(urlId);
      loadClipboard(urlId, true);
    }
  }, [loadClipboard, setClipboardId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    // State
    content,
    clipboardId,
    isConnected,
    isSyncing,
    isUserTyping: isUserTypingRef.current,
    lastUpdated,
    expiresAt,
    characterCount: content.length,
    
    // Actions
    setContent,
    setClipboardId,
    createNewClipboard,
    loadClipboard,
    updateCurrentClipboard,
    deleteCurrentClipboard,
    copyToClipboard,
    clearContent,
    
    // Utilities
    getShareUrl,
    isExpired
  };
};