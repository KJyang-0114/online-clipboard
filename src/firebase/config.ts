import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// 注意：這些是公開的配置，不包含敏感資訊
const firebaseConfig = {
  apiKey: "AIzaSyBqnJ8x_example_key_replace_with_real_key",
  authDomain: "online-clipboard-demo.firebaseapp.com",
  projectId: "online-clipboard-demo",
  storageBucket: "online-clipboard-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:example_app_id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;