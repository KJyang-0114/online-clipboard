import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { nanoid } from 'nanoid';

export interface ClipboardData {
  id: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
}

const CLIPBOARD_COLLECTION = 'clipboards';
const EXPIRY_HOURS = 24;

// 生成隨機 ID
export const generateClipboardId = (): string => {
  return nanoid(9);
};

// 計算過期時間
const getExpiryDate = (): Timestamp => {
  const now = new Date();
  now.setHours(now.getHours() + EXPIRY_HOURS);
  return Timestamp.fromDate(now);
};

// 檢查是否過期
const isExpired = (expiresAt: Timestamp): boolean => {
  return expiresAt.toDate() < new Date();
};

// 創建剪貼簿
export const createClipboard = async (content: string): Promise<{ id: string; expiresAt: Date }> => {
  const id = generateClipboardId();
  const now = Timestamp.now();
  const expiresAt = getExpiryDate();
  
  const clipboardData: ClipboardData = {
    id,
    content,
    createdAt: now,
    updatedAt: now,
    expiresAt
  };
  
  try {
    await setDoc(doc(db, CLIPBOARD_COLLECTION, id), clipboardData);
    return { id, expiresAt: expiresAt.toDate() };
  } catch (error) {
    console.error('Error creating clipboard:', error);
    throw new Error('Failed to create clipboard');
  }
};

// 讀取剪貼簿
export const getClipboard = async (id: string): Promise<ClipboardData | null> => {
  try {
    const docRef = doc(db, CLIPBOARD_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data() as ClipboardData;
    
    // 檢查是否過期
    if (isExpired(data.expiresAt)) {
      // 自動刪除過期數據
      await deleteDoc(docRef);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting clipboard:', error);
    throw new Error('Failed to get clipboard');
  }
};

// 更新剪貼簿
export const updateClipboard = async (id: string, content: string): Promise<void> => {
  try {
    const docRef = doc(db, CLIPBOARD_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Clipboard not found');
    }
    
    const data = docSnap.data() as ClipboardData;
    
    // 檢查是否過期
    if (isExpired(data.expiresAt)) {
      await deleteDoc(docRef);
      throw new Error('Clipboard expired');
    }
    
    await updateDoc(docRef, {
      content,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating clipboard:', error);
    throw error;
  }
};

// 刪除剪貼簿
export const deleteClipboard = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, CLIPBOARD_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting clipboard:', error);
    throw new Error('Failed to delete clipboard');
  }
};

// 監聽剪貼簿變化（實時同步）
export const subscribeToClipboard = (
  id: string, 
  callback: (data: ClipboardData | null) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const docRef = doc(db, CLIPBOARD_COLLECTION, id);
  
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      
      const data = docSnap.data() as ClipboardData;
      
      // 檢查是否過期
      if (isExpired(data.expiresAt)) {
        deleteDoc(docRef).catch(console.error);
        callback(null);
        return;
      }
      
      callback(data);
    },
    (error) => {
      console.error('Error listening to clipboard:', error);
      onError?.(new Error('Failed to sync clipboard'));
    }
  );
};

// 格式化時間
export const formatTime = (timestamp: Timestamp, locale: string = 'zh-TW'): string => {
  const date = timestamp.toDate();
  return date.toLocaleString(locale);
};

// 計算剩餘時間
export const getRemainingTime = (expiresAt: Timestamp): string => {
  const now = new Date();
  const expiry = expiresAt.toDate();
  const diff = expiry.getTime() - now.getTime();
  
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