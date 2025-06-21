import { nanoid } from 'nanoid';

export interface LocalClipboardData {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

const STORAGE_KEY = 'online-clipboard-data';
const EXPIRY_HOURS = 24;

// 本地存儲管理類
class LocalClipboardManager {
  private data: Map<string, LocalClipboardData> = new Map();

  constructor() {
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  // 從 localStorage 載入數據
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          this.data.set(key, {
            ...value,
            createdAt: new Date(value.createdAt),
            updatedAt: new Date(value.updatedAt),
            expiresAt: new Date(value.expiresAt)
          });
        });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  // 保存到 localStorage
  private saveToStorage(): void {
    try {
      const obj: Record<string, any> = {};
      this.data.forEach((value, key) => {
        obj[key] = {
          ...value,
          createdAt: value.createdAt.toISOString(),
          updatedAt: value.updatedAt.toISOString(),
          expiresAt: value.expiresAt.toISOString()
        };
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // 清理過期數據
  private cleanup(): void {
    const now = new Date();
    let changed = false;
    
    this.data.forEach((value, key) => {
      if (value.expiresAt < now) {
        this.data.delete(key);
        changed = true;
      }
    });
    
    if (changed) {
      this.saveToStorage();
    }
  }

  // 啟動定期清理
  private startCleanupTimer(): void {
    // 每小時清理一次
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  // 生成過期時間
  private getExpiryDate(): Date {
    const now = new Date();
    now.setHours(now.getHours() + EXPIRY_HOURS);
    return now;
  }

  // 生成隨機 ID
  generateId(): string {
    return nanoid(9);
  }

  // 創建剪貼簿
  create(content: string): { id: string; expiresAt: Date } {
    const id = this.generateId();
    const now = new Date();
    const expiresAt = this.getExpiryDate();
    
    const clipboardData: LocalClipboardData = {
      id,
      content,
      createdAt: now,
      updatedAt: now,
      expiresAt
    };
    
    this.data.set(id, clipboardData);
    this.saveToStorage();
    
    return { id, expiresAt };
  }

  // 讀取剪貼簿
  get(id: string): LocalClipboardData | null {
    this.cleanup(); // 每次讀取時清理過期數據
    
    const data = this.data.get(id);
    if (!data) {
      return null;
    }
    
    // 雙重檢查是否過期
    if (data.expiresAt < new Date()) {
      this.data.delete(id);
      this.saveToStorage();
      return null;
    }
    
    return data;
  }

  // 更新剪貼簿
  update(id: string, content: string): boolean {
    const data = this.data.get(id);
    if (!data) {
      return false;
    }
    
    // 檢查是否過期
    if (data.expiresAt < new Date()) {
      this.data.delete(id);
      this.saveToStorage();
      return false;
    }
    
    data.content = content;
    data.updatedAt = new Date();
    
    this.data.set(id, data);
    this.saveToStorage();
    
    return true;
  }

  // 刪除剪貼簿
  delete(id: string): boolean {
    const existed = this.data.has(id);
    this.data.delete(id);
    if (existed) {
      this.saveToStorage();
    }
    return existed;
  }

  // 監聽變化（模擬 Firebase 的即時更新）
  subscribe(id: string, callback: (data: LocalClipboardData | null) => void): () => void {
    // 初始數據
    const initialData = this.get(id);
    callback(initialData);
    
    // 監聽 storage 事件（跨標籤頁同步）
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        this.loadFromStorage();
        const updatedData = this.get(id);
        callback(updatedData);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 定期檢查更新（同一標籤頁內的更新）
    const interval = setInterval(() => {
      const currentData = this.get(id);
      callback(currentData);
    }, 2000);
    
    // 返回取消訂閱函數
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }

  // 獲取所有剪貼簿（調試用）
  getAll(): LocalClipboardData[] {
    this.cleanup();
    return Array.from(this.data.values());
  }

  // 清空所有數據
  clear(): void {
    this.data.clear();
    this.saveToStorage();
  }
}

// 單例實例
const localClipboardManager = new LocalClipboardManager();

// 導出 API 函數（與 Firebase 版本兼容）
export const createClipboard = async (content: string): Promise<{ id: string; expiresAt: Date }> => {
  return localClipboardManager.create(content);
};

export const getClipboard = async (id: string): Promise<LocalClipboardData | null> => {
  return localClipboardManager.get(id);
};

export const updateClipboard = async (id: string, content: string): Promise<void> => {
  const success = localClipboardManager.update(id, content);
  if (!success) {
    throw new Error('Clipboard not found or expired');
  }
};

export const deleteClipboard = async (id: string): Promise<void> => {
  localClipboardManager.delete(id);
};

export const subscribeToClipboard = (
  id: string,
  callback: (data: LocalClipboardData | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  try {
    return localClipboardManager.subscribe(id, callback);
  } catch (error) {
    onError?.(error as Error);
    return () => {};
  }
};

// 格式化時間
export const formatTime = (date: Date, locale: string = 'zh-TW'): string => {
  return date.toLocaleString(locale);
};

// 計算剩餘時間
export const getRemainingTime = (expiresAt: Date): string => {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) {
    return '已過期';
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}小時${minutes}分鐘`;
  } else {
    return `${minutes}分鐘`;
  }
};

export default localClipboardManager;