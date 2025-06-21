import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// 使用演示專案配置，支援跨設備即時同步
const firebaseConfig = {
  apiKey: "AIzaSyBIg1-HHrD-pZSAOTwKwKwQJTWD8J4RQKU",
  authDomain: "online-clipboard-demo-12345.firebaseapp.com",
  projectId: "online-clipboard-demo-12345",
  storageBucket: "online-clipboard-demo-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;