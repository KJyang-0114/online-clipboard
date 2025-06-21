// 剪貼簿服務配置和抽象層
import { 
  createClipboard as firebaseCreate,
  getClipboard as firebaseGet,
  updateClipboard as firebaseUpdate,
  deleteClipboard as firebaseDelete,
  subscribeToClipboard as firebaseSubscribe,
  ClipboardData as FirebaseClipboardData
} from '../firebase/clipboard';

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
export type ClipboardServiceType = 'firebase' | 'local';

// 配置管理
class ClipboardServiceConfig {
  private serviceType: ClipboardServiceType = 'local'; // 默認使用本地存儲
  
  constructor() {
    // 嘗試檢測 Firebase 是否可用
    this.detectService();
  }
  
  private async detectService(): Promise<void> {
    try {
      // 嘗試使用 Firebase（可以添加簡單的連接測試）
      const isFirebaseAvailable = await this.testFirebaseConnection();
      if (isFirebaseAvailable) {
        this.serviceType = 'firebase';
        console.log('使用 Firebase 作為後端服務');
      } else {
        this.serviceType = 'local';
        console.log('使用本地存儲作為後端服務');
      }
    } catch (error) {
      this.serviceType = 'local';
      console.log('Firebase 不可用，使用本地存儲作為後端服務');
    }
  }
  
  private async testFirebaseConnection(): Promise<boolean> {
    try {
      // 這裡可以添加 Firebase 連接測試
      // 暫時返回 false，強制使用本地存儲
      return false;
    } catch {
      return false;
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
const convertFirebaseData = (data: FirebaseClipboardData): ClipboardData => ({
  id: data.id,
  content: data.content,
  createdAt: data.createdAt.toDate(),
  updatedAt: data.updatedAt.toDate(),
  expiresAt: data.expiresAt.toDate()
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
  
  if (serviceType === 'firebase') {
    return await firebaseCreate(content);
  } else {
    return await localCreate(content);
  }
};

export const getClipboard = async (id: string): Promise<ClipboardData | null> => {
  const serviceType = config.getServiceType();
  
  if (serviceType === 'firebase') {
    const data = await firebaseGet(id);
    return data ? convertFirebaseData(data) : null;
  } else {
    const data = await localGet(id);
    return data ? convertLocalData(data) : null;
  }
};

export const updateClipboard = async (id: string, content: string): Promise<void> => {
  const serviceType = config.getServiceType();
  
  if (serviceType === 'firebase') {
    await firebaseUpdate(id, content);
  } else {
    await localUpdate(id, content);
  }
};

export const deleteClipboard = async (id: string): Promise<void> => {
  const serviceType = config.getServiceType();
  
  if (serviceType === 'firebase') {
    await firebaseDelete(id);
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
  
  if (serviceType === 'firebase') {
    return firebaseSubscribe(
      id,
      (data) => callback(data ? convertFirebaseData(data) : null),
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
    name: serviceType === 'firebase' ? 'Firebase Firestore' : '本地存儲',
    description: serviceType === 'firebase' 
      ? '雲端同步，支援跨設備即時更新' 
      : '本地存儲，支援跨標籤頁同步',
    supportsRealtime: true,
    supportsCrossDevice: serviceType === 'firebase'
  };
};

// 切換服務（用於測試或配置）
export const switchService = (type: ClipboardServiceType) => {
  config.setServiceType(type);
};

export default config;