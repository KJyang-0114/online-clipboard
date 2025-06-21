// 剪貼簿服務配置和抽象層
import {
  createClipboard as realtimeCreate,
  getClipboard as realtimeGet,
  updateClipboard as realtimeUpdate,
  deleteClipboard as realtimeDelete,
  subscribeToClipboard as realtimeSubscribe,
  RealtimeClipboardData
} from './realtimeClipboard';

import {
  createClipboard as localCreate,
  getClipboard as localGet,
  updateClipboard as localUpdate,
  deleteClipboard as localDelete,
  subscribeToClipboard as localSubscribe,
  LocalClipboardData
} from './localClipboard';

// 統一的數據接口
export interface ClipboardData {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// 服務類型
export type ClipboardServiceType = 'realtime' | 'local';

// 配置管理
class ClipboardServiceConfig {
  private serviceType: ClipboardServiceType = 'realtime'; // 使用即時同步實現跨設備同步
  
  constructor() {
    // 直接使用即時同步
    this.detectService();
  }
  
  private async detectService(): Promise<void> {
    try {
      // 啟用本地即時同步支援跨設備同步
      this.serviceType = 'realtime';
      console.log('使用本地存儲實現跨瀏覽器同步');
    } catch (error) {
      this.serviceType = 'local';
      console.log('即時同步初始化失敗，回退到本地存儲');
    }
  }
  
  getServiceType(): ClipboardServiceType {
    return this.serviceType;
  }
  
  setServiceType(type: ClipboardServiceType): void {
    this.serviceType = type;
    console.log(`切換到 ${type} 服務`);
  }
}

// 單例配置實例
const config = new ClipboardServiceConfig();

// 數據轉換函數
const convertRealtimeData = (data: RealtimeClipboardData): ClipboardData => ({
  id: data.id,
  content: data.content,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  expiresAt: data.expiresAt
});

const convertLocalData = (data: LocalClipboardData): ClipboardData => ({
  id: data.id,
  content: data.content,
  createdAt: data.createdAt,
  updatedAt: data.updatedAt,
  expiresAt: data.expiresAt
});

// 統一的服務 API
export const createClipboard = async (content: string): Promise<{ id: string; expiresAt: Date }> => {
  const serviceType = config.getServiceType();
  
  if (serviceType === 'realtime') {
    return await realtimeCreate(content);
  } else {
    return await localCreate(content);
  }
};

export const getClipboard = async (id: string): Promise<ClipboardData | null> => {
  const serviceType = config.getServiceType();
  
  if (serviceType === 'realtime') {
    const data = await realtimeGet(id);
    return data ? convertRealtimeData(data) : null;
  } else {
    const data = await localGet(id);
    return data ? convertLocalData(data) : null;
  }
};

export const updateClipboard = async (id: string, content: string): Promise<void> => {
  const serviceType = config.getServiceType();
  
  if (serviceType === 'realtime') {
    await realtimeUpdate(id, content);
  } else {
    await localUpdate(id, content);
  }
};

export const deleteClipboard = async (id: string): Promise<void> => {
  const serviceType = config.getServiceType();
  
  if (serviceType === 'realtime') {
    await realtimeDelete(id);
  } else {
    await localDelete(id);
  }
};

export const subscribeToClipboard = (
  id: string,
  callback: (data: ClipboardData | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const serviceType = config.getServiceType();
  
  if (serviceType === 'realtime') {
    return realtimeSubscribe(
      id,
      (data) => callback(data ? convertRealtimeData(data) : null),
      onError
    );
  } else {
    return localSubscribe(
      id,
      (data) => callback(data ? convertLocalData(data) : null),
      onError
    );
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

// 服務信息
export const getServiceInfo = () => {
  const serviceType = config.getServiceType();
  return {
    type: serviceType,
    name: serviceType === 'realtime' ? '本地存儲即時同步' : '本地存儲',
    description: serviceType === 'realtime'
      ? '使用本地存儲實現跨瀏覽器即時同步'
      : '本地存儲，支援跨標籤頁同步',
    supportsRealtime: true,
    supportsCrossDevice: serviceType === 'realtime'
  };
};

// 切換服務（用於測試或配置）
export const switchService = (type: ClipboardServiceType) => {
  config.setServiceType(type);
};

export default config;