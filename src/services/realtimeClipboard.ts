import { nanoid } from 'nanoid';

export interface RealtimeClipboardData {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// 使用 JSONBin.io 作為免費的後端存儲（支援 CORS）
class RealtimeClipboardManager {
  private pollingInterval: NodeJS.Timeout | null = null;
  private currentBinId: string | null = null;
  private lastContent: string = '';
  private subscribers: Array<(data: RealtimeClipboardData | null) => void> = [];
  
  // JSONBin.io API 配置
  private readonly API_BASE = 'https://api.jsonbin.io/v3/b';
  private readonly API_KEY = '$2a$10$gmgdZFGV68WWnAMItOYfyuI5RGIw8SZRYu0fDlovaV5qadOWisRia';

  // 生成隨機 ID
  generateId(): string {
    return nanoid(9);
  }

  // 計算過期時間
  private getExpiryDate(): Date {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    return now;
  }

  // 創建剪貼簿
  async create(content: string): Promise<{ id: string; expiresAt: Date }> {
    const id = this.generateId();
    const now = new Date();
    const expiresAt = this.getExpiryDate();
    
    const clipboardData: RealtimeClipboardData = {
      id,
      content,
      createdAt: now,
      updatedAt: now,
      expiresAt
    };

    try {
      // 使用 JSONBin.io 創建新的 bin
      const response = await fetch(`${this.API_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.API_KEY,
          'X-Bin-Name': `clipboard-${id}`,
          'X-Bin-Private': 'false'
        },
        body: JSON.stringify({
          clipboardId: id,
          data: clipboardData,
          metadata: {
            type: 'online-clipboard',
            version: '1.0.0'
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to create clipboard, falling back to local storage');
        throw new Error('Failed to create clipboard');
      }

      const result = await response.json();
      this.currentBinId = result.metadata?.id || id;
      
      // 保存 bin ID 到本地存儲
      if (this.currentBinId) {
        localStorage.setItem(`clipboard-bin-${id}`, this.currentBinId);
      }
      
      console.log('Created clipboard with realtime sync:', id);
      return { id, expiresAt };
    } catch (error) {
      console.error('Error creating clipboard, using fallback:', error);
      
      // 回退到本地存儲
      const localData = { ...clipboardData };
      localStorage.setItem(`clipboard-data-${id}`, JSON.stringify(localData));
      
      return { id, expiresAt };
    }
  }

  // 讀取剪貼簿
  async get(id: string): Promise<RealtimeClipboardData | null> {
    try {
      // 首先嘗試從遠端獲取
      const binId = localStorage.getItem(`clipboard-bin-${id}`) || this.currentBinId;
      
      if (binId && binId !== id) {
        try {
          const response = await fetch(`${this.API_BASE}/${binId}/latest`, {
            headers: {
              'X-Master-Key': this.API_KEY
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            const data = result.record?.data || result.data;
            
            if (data && data.id === id) {
              // 轉換日期
              const clipboardData: RealtimeClipboardData = {
                ...data,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
                expiresAt: new Date(data.expiresAt)
              };

              // 檢查是否過期
              if (clipboardData.expiresAt < new Date()) {
                return null;
              }

              return clipboardData;
            }
          }
        } catch (remoteError) {
          console.warn('Remote fetch failed, trying local:', remoteError);
        }
      }

      // 回退到本地存儲
      const localData = localStorage.getItem(`clipboard-data-${id}`);
      if (localData) {
        const data = JSON.parse(localData);
        const clipboardData: RealtimeClipboardData = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          expiresAt: new Date(data.expiresAt)
        };

        // 檢查是否過期
        if (clipboardData.expiresAt < new Date()) {
          localStorage.removeItem(`clipboard-data-${id}`);
          return null;
        }

        return clipboardData;
      }

      return null;
    } catch (error) {
      console.error('Error getting clipboard:', error);
      return null;
    }
  }

  // 更新剪貼簿
  async update(id: string, content: string): Promise<void> {
    try {
      const currentData = await this.get(id);
      if (!currentData) {
        throw new Error('Clipboard not found or expired');
      }

      const updatedData: RealtimeClipboardData = {
        ...currentData,
        content,
        updatedAt: new Date()
      };

      // 嘗試更新遠端
      const binId = localStorage.getItem(`clipboard-bin-${id}`) || this.currentBinId;
      if (binId && binId !== id) {
        try {
          const response = await fetch(`${this.API_BASE}/${binId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': this.API_KEY
            },
            body: JSON.stringify({
              clipboardId: id,
              data: updatedData
            })
          });

          if (response.ok) {
            console.log('Updated remote clipboard:', id);
            return;
          }
        } catch (remoteError) {
          console.warn('Remote update failed, updating local:', remoteError);
        }
      }

      // 回退到本地存儲更新
      localStorage.setItem(`clipboard-data-${id}`, JSON.stringify(updatedData));
      
      // 觸發 storage 事件以通知其他標籤頁
      window.dispatchEvent(new StorageEvent('storage', {
        key: `clipboard-data-${id}`,
        newValue: JSON.stringify(updatedData),
        storageArea: localStorage
      }));
      
    } catch (error) {
      console.error('Error updating clipboard:', error);
      throw error;
    }
  }

  // 刪除剪貼簿
  async delete(id: string): Promise<void> {
    try {
      // 嘗試刪除遠端
      const binId = localStorage.getItem(`clipboard-bin-${id}`) || this.currentBinId;
      if (binId && binId !== id) {
        try {
          await fetch(`${this.API_BASE}/${binId}`, {
            method: 'DELETE',
            headers: {
              'X-Master-Key': this.API_KEY
            }
          });
        } catch (remoteError) {
          console.warn('Remote delete failed:', remoteError);
        }
      }

      // 清理本地存儲
      localStorage.removeItem(`clipboard-bin-${id}`);
      localStorage.removeItem(`clipboard-data-${id}`);
      
      this.stopPolling();
    } catch (error) {
      console.error('Error deleting clipboard:', error);
      throw new Error('Failed to delete clipboard');
    }
  }

  // 監聽剪貼簿變化（實時同步）
  subscribe(
    id: string, 
    callback: (data: RealtimeClipboardData | null) => void,
    onError?: (error: Error) => void
  ): (() => void) {
    this.subscribers.push(callback);
    
    // 立即載入初始數據
    this.get(id).then(callback).catch(error => {
      console.warn('Initial load failed:', error);
      onError?.(error as Error);
    });
    
    // 開始輪詢
    this.startPolling(id);
    
    // 監聽本地存儲變化（跨標籤頁同步）
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `clipboard-data-${id}` && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          const clipboardData: RealtimeClipboardData = {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
            expiresAt: new Date(data.expiresAt)
          };
          callback(clipboardData);
        } catch (error) {
          console.error('Error parsing storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 返回取消訂閱函數
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
      if (this.subscribers.length === 0) {
        this.stopPolling();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  // 開始輪詢
  private startPolling(id: string): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      try {
        const data = await this.get(id);
        
        // 檢查內容是否有變化，使用 updatedAt 時間戳確保最後更新優先
        if (data && data.content !== this.lastContent) {
          this.lastContent = data.content;
          
          // 通知所有訂閱者，傳遞最新版本
          this.subscribers.forEach(callback => {
            callback(data);
          });
          
          console.log('Synced latest version:', new Date(data.updatedAt).toLocaleTimeString());
        }
      } catch (error) {
        console.warn('Polling error:', error);
      }
    }, 1500); // 每 1.5 秒檢查一次，提升同步速度
  }

  // 停止輪詢
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

// 單例實例
const realtimeClipboardManager = new RealtimeClipboardManager();

// 導出 API 函數
export const createClipboard = async (content: string): Promise<{ id: string; expiresAt: Date }> => {
  return realtimeClipboardManager.create(content);
};

export const getClipboard = async (id: string): Promise<RealtimeClipboardData | null> => {
  return realtimeClipboardManager.get(id);
};

export const updateClipboard = async (id: string, content: string): Promise<void> => {
  return realtimeClipboardManager.update(id, content);
};

export const deleteClipboard = async (id: string): Promise<void> => {
  return realtimeClipboardManager.delete(id);
};

export const subscribeToClipboard = (
  id: string,
  callback: (data: RealtimeClipboardData | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  return realtimeClipboardManager.subscribe(id, callback, onError);
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

export default realtimeClipboardManager;