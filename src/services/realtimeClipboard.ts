import { nanoid } from 'nanoid';

export interface RealtimeClipboardData {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// 使用 GitHub Gist 作為免費的後端存儲
class RealtimeClipboardManager {
  private pollingInterval: NodeJS.Timeout | null = null;
  private currentGistId: string | null = null;
  private lastContent: string = '';
  private subscribers: Array<(data: RealtimeClipboardData | null) => void> = [];

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
      // 使用 GitHub Gist API 創建新的 gist
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Online Clipboard - ${id}`,
          public: true,
          files: {
            [`clipboard-${id}.json`]: {
              content: JSON.stringify(clipboardData)
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create clipboard');
      }

      const result = await response.json();
      this.currentGistId = result.id;
      
      // 保存 gist ID 到本地存儲
      localStorage.setItem(`clipboard-gist-${id}`, result.id);
      
      return { id, expiresAt };
    } catch (error) {
      console.error('Error creating clipboard:', error);
      throw new Error('Failed to create clipboard');
    }
  }

  // 讀取剪貼簿
  async get(id: string): Promise<RealtimeClipboardData | null> {
    try {
      // 嘗試從本地存儲獲取 gist ID
      const gistId = localStorage.getItem(`clipboard-gist-${id}`) || this.currentGistId;
      
      if (!gistId) {
        // 嘗試搜索公開的 gist
        const searchResponse = await fetch(`https://api.github.com/gists/public?per_page=100`);
        if (!searchResponse.ok) {
          return null;
        }
        
        const gists = await searchResponse.json();
        const targetGist = gists.find((gist: any) => 
          gist.description && gist.description.includes(id)
        );
        
        if (!targetGist) {
          return null;
        }
        
        this.currentGistId = targetGist.id;
        localStorage.setItem(`clipboard-gist-${id}`, targetGist.id);
      }

      const response = await fetch(`https://api.github.com/gists/${gistId || this.currentGistId}`);
      
      if (!response.ok) {
        return null;
      }

      const gist = await response.json();
      const fileName = Object.keys(gist.files)[0];
      const fileContent = gist.files[fileName].content;
      const data = JSON.parse(fileContent);
      
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

      const gistId = localStorage.getItem(`clipboard-gist-${id}`) || this.currentGistId;
      if (!gistId) {
        throw new Error('Gist ID not found');
      }

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [`clipboard-${id}.json`]: {
              content: JSON.stringify(updatedData)
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update clipboard');
      }
    } catch (error) {
      console.error('Error updating clipboard:', error);
      throw error;
    }
  }

  // 刪除剪貼簿
  async delete(id: string): Promise<void> {
    try {
      const gistId = localStorage.getItem(`clipboard-gist-${id}`) || this.currentGistId;
      if (gistId) {
        await fetch(`https://api.github.com/gists/${gistId}`, {
          method: 'DELETE'
        });
        localStorage.removeItem(`clipboard-gist-${id}`);
      }
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
      onError?.(error as Error);
    });
    
    // 開始輪詢
    this.startPolling(id);
    
    // 返回取消訂閱函數
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
      if (this.subscribers.length === 0) {
        this.stopPolling();
      }
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
        
        // 檢查內容是否有變化
        if (data && data.content !== this.lastContent) {
          this.lastContent = data.content;
          
          // 通知所有訂閱者
          this.subscribers.forEach(callback => {
            callback(data);
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // 每 3 秒檢查一次（GitHub API 有速率限制）
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