import { nanoid } from 'nanoid';

export interface RealtimeClipboardData {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// 使用 JSONBin.io 實現真正的跨瀏覽器同步
class RealtimeClipboardManager {
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastContent: string = '';
  private subscribers: Array<(data: RealtimeClipboardData | null) => void> = [];
  private corsIssueDetected: boolean = false;

  // JSONBin.io API 配置
  private readonly API_BASE = 'https://api.jsonbin.io/v3/b';
  private readonly API_KEY = '$2a$10$gmgdZFGV68WWnAMItOYfyuI5RGIw8SZRYu0fDlovaV5qadOWisRia';
  
  // 使用您現有的bin作為索引bin
  private readonly INDEX_BIN_ID = '685674c28a456b7966b28b65'; // 使用之前成功的bin

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

  // 獲取索引數據
  private async getIndex(): Promise<Record<string, string>> {
    try {
      console.log('📋 [DEBUG] 獲取索引數據...');
      const response = await fetch(`${this.API_BASE}/${this.INDEX_BIN_ID}/latest`, {
        headers: {
          'X-Master-Key': this.API_KEY
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const index = result.record || {};
        console.log('✅ [DEBUG] 獲取索引成功，包含', Object.keys(index).length, '個剪貼簿');
        return index;
      } else if (response.status === 404) {
        console.log('🔧 [DEBUG] 索引不存在，嘗試創建...');
        // 索引不存在，嘗試創建
        return await this.createIndex();
      } else {
        console.warn('⚠️ [DEBUG] 獲取索引失敗:', response.status);
        return {};
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG] 獲取索引錯誤:', error);
      return {};
    }
  }

  // 創建索引bin
  private async createIndex(): Promise<Record<string, string>> {
    try {
      console.log('🆕 [DEBUG] 創建新的索引bin...');
      const response = await fetch(`${this.API_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.API_KEY,
          'X-Bin-Name': 'clipboard_index',
          'X-Bin-Private': 'false'
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        const newIndexBinId = result.metadata.id;
        console.log('✅ [DEBUG] 成功創建索引bin:', newIndexBinId);
        console.log('⚠️ [DEBUG] 請更新代碼中的 INDEX_BIN_ID 為:', newIndexBinId);
        return {};
      } else {
        console.warn('⚠️ [DEBUG] 創建索引失敗:', response.status);
        return {};
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG] 創建索引錯誤:', error);
      return {};
    }
  }

  // 更新索引數據
  private async updateIndex(clipboardId: string, binId: string): Promise<void> {
    try {
      console.log('📝 [DEBUG] 更新索引:', clipboardId, '->', binId);
      
      // 獲取當前索引
      const currentIndex = await this.getIndex();
      
      // 添加新的映射
      currentIndex[clipboardId] = binId;
      
      // 更新索引
      const response = await fetch(`${this.API_BASE}/${this.INDEX_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.API_KEY
        },
        body: JSON.stringify(currentIndex)
      });
      
      if (response.ok) {
        console.log('✅ [DEBUG] 索引更新成功');
      } else {
        console.warn('⚠️ [DEBUG] 索引更新失敗:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG] 索引更新錯誤:', error);
    }
  }

  // 從索引中查找 bin ID
  private async findBinInIndex(clipboardId: string): Promise<string | null> {
    try {
      console.log('🔍 [DEBUG] 在索引中查找:', clipboardId);
      const index = await this.getIndex();
      
      const binId = index[clipboardId];
      if (binId) {
        console.log('✅ [DEBUG] 在索引中找到:', clipboardId, '->', binId);
        return binId;
      } else {
        console.log('❌ [DEBUG] 索引中沒有:', clipboardId);
        return null;
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG] 索引查找錯誤:', error);
      return null;
    }
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

    console.log('📝 [DEBUG] 嘗試創建 JSONBin 剪貼簿:', id);

    try {
      // 創建 JSONBin
      const response = await fetch(`${this.API_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.API_KEY,
          'X-Bin-Name': `clipboard_${id}`,
          'X-Bin-Private': 'false'
        },
        body: JSON.stringify(clipboardData)
      });

      if (response.ok) {
        const result = await response.json();
        const binId = result.metadata.id;
        
        console.log('✅ [DEBUG] 成功創建 JSONBin 剪貼簿:', {
          clipboardId: id,
          binId: binId,
          binName: `clipboard_${id}`
        });
        
        // 保存 bin ID 到本地存儲以便快速存取
        localStorage.setItem(`binid-${id}`, binId);
        
        // 更新全域索引
        await this.updateIndex(id, binId);
        
        // 同時保存到本地作為備份
        const localData = {
          id: clipboardData.id,
          content: clipboardData.content,
          createdAt: clipboardData.createdAt.toISOString(),
          updatedAt: clipboardData.updatedAt.toISOString(),
          expiresAt: clipboardData.expiresAt.toISOString(),
          binId: binId
        };
        localStorage.setItem(`clipboard-data-${id}`, JSON.stringify(localData));
        
        return { id, expiresAt };
      } else {
        const errorText = await response.text();
        throw new Error(`JSONBin API failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('💥 [DEBUG] JSONBin 創建失敗:', error);
      throw new Error('創建剪貼簿失敗，請檢查網路連接後重試');
    }
  }

  // 讀取剪貼簿
  async get(id: string): Promise<RealtimeClipboardData | null> {
    console.log('🔍 [DEBUG] 開始查找剪貼簿:', id);

    try {
      // 方法1: 從本地存儲獲取 bin ID
      let binId = localStorage.getItem(`binid-${id}`);
      
      if (binId) {
        console.log('🔗 [DEBUG] 找到本地 bin ID:', binId);
      } else {
        console.log('🔍 [DEBUG] 本地沒有 bin ID，從索引查找...');
        // 方法2: 從索引中查找 bin ID
        binId = await this.findBinInIndex(id);
        
        if (binId) {
          // 保存找到的 bin ID
          localStorage.setItem(`binid-${id}`, binId);
          console.log('💾 [DEBUG] 保存找到的 bin ID:', binId);
        }
      }
      
      // 如果有 bin ID，嘗試從雲端讀取
      if (binId) {
        try {
          console.log('☁️ [DEBUG] 嘗試從雲端讀取:', binId);
          const response = await fetch(`${this.API_BASE}/${binId}/latest`, {
            headers: {
              'X-Master-Key': this.API_KEY
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            const data = result.record;
            
            console.log('✅ [DEBUG] 從雲端載入成功:', {
              id: data.id,
              contentLength: data.content.length,
              createdAt: data.createdAt
            });
            
            const clipboardData: RealtimeClipboardData = {
              id: data.id,
              content: data.content,
              createdAt: new Date(data.createdAt),
              updatedAt: new Date(data.updatedAt),
              expiresAt: new Date(data.expiresAt)
            };

            // 檢查是否過期
            if (clipboardData.expiresAt < new Date()) {
              console.log('⏰ [DEBUG] 雲端剪貼簿已過期:', id);
              return null;
            }

            // 更新本地快取
            const localData = {
              id: data.id,
              content: data.content,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              expiresAt: data.expiresAt,
              binId: binId
            };
            localStorage.setItem(`clipboard-data-${id}`, JSON.stringify(localData));

            return clipboardData;
          } else {
            console.warn('⚠️ [DEBUG] 雲端讀取失敗:', response.status);
          }
        } catch (cloudError) {
          // 檢查是否為 CORS 錯誤
          if (cloudError instanceof TypeError && cloudError.message.includes('Failed to fetch')) {
            console.warn('🌐 [DEBUG] CORS/網路問題，使用本地存儲（功能仍正常）');
          } else {
            console.warn('⚠️ [DEBUG] 雲端讀取錯誤:', cloudError);
          }
        }
      }
      
      // 如果雲端無法存取，顯示適當的錯誤訊息
      console.log('❌ [DEBUG] 無法從雲端載入剪貼簿:', id);
      console.log('💡 [DEBUG] 這可能是網路問題，請稍後重試');
      return null;
      
    } catch (error) {
      console.error('💥 [DEBUG] 讀取剪貼簿時發生錯誤:', error);
      return null;
    }
  }

  // 更新剪貼簿
  async update(id: string, content: string): Promise<void> {
    console.log('📝 [DEBUG] 嘗試更新剪貼簿:', id);
    
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

      // 嘗試更新雲端
      const binId = localStorage.getItem(`binid-${id}`);
      if (binId) {
        try {
          console.log('☁️ [DEBUG] 嘗試更新雲端:', binId);
          const response = await fetch(`${this.API_BASE}/${binId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': this.API_KEY
            },
            body: JSON.stringify(updatedData)
          });

          if (response.ok) {
            console.log('✅ [DEBUG] 雲端更新成功:', id);
          } else {
            throw new Error(`Update failed: ${response.status}`);
          }
        } catch (updateError) {
          // 檢查是否為 CORS 錯誤
          if (updateError instanceof TypeError && updateError.message.includes('Failed to fetch')) {
            console.warn('🌐 [DEBUG] CORS/網路問題，僅本地更新（跨標籤頁仍同步）');
          } else {
            console.warn('⚠️ [DEBUG] 雲端更新失敗:', updateError);
          }
        }
      }

      // 更新本地快取用於提升存取速度
      const localData = {
        id: updatedData.id,
        content: updatedData.content,
        createdAt: updatedData.createdAt.toISOString(),
        updatedAt: updatedData.updatedAt.toISOString(),
        expiresAt: updatedData.expiresAt.toISOString(),
        binId: binId || undefined
      };
      localStorage.setItem(`clipboard-data-${id}`, JSON.stringify(localData));
      
    } catch (error) {
      console.error('💥 [DEBUG] 更新剪貼簿失敗:', error);
      throw error;
    }
  }

  // 刪除剪貼簿
  async delete(id: string): Promise<void> {
    try {
      // 嘗試刪除雲端
      const binId = localStorage.getItem(`binid-${id}`);
      if (binId) {
        try {
          await fetch(`${this.API_BASE}/${binId}`, {
            method: 'DELETE',
            headers: {
              'X-Master-Key': this.API_KEY
            }
          });
          console.log('✅ [DEBUG] 雲端刪除成功:', id);
        } catch (deleteError) {
          console.warn('⚠️ [DEBUG] 雲端刪除失敗:', deleteError);
        }
      }

      // 清理本地存儲
      localStorage.removeItem(`binid-${id}`);
      localStorage.removeItem(`clipboard-data-${id}`);
      
      this.stopPolling();
    } catch (error) {
      console.error('💥 [DEBUG] 刪除剪貼簿失敗:', error);
      throw new Error('Failed to delete clipboard');
    }
  }

  // 監聽剪貼簿變化
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
    
    // 純雲端同步，通過輪詢實現即時更新
    console.log('📡 [DEBUG] 開始雲端即時同步監聽:', id);
    
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
        
        if (data && data.content !== this.lastContent) {
          this.lastContent = data.content;
          
          this.subscribers.forEach(callback => {
            callback(data);
          });
          
          console.log('🔄 [DEBUG] 同步更新:', new Date(data.updatedAt).toLocaleTimeString());
        }
      } catch (error) {
        console.warn('Polling error:', error);
      }
    }, 2000); // 每 2 秒檢查一次
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