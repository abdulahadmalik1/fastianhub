import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARvrR-awLlbacaU60xSs_3tqEIy1osC1w",
  authDomain: "fastiflex.firebaseapp.com",
  projectId: "fastiflex",
  storageBucket: "fastiflex.firebasestorage.app",
  messagingSenderId: "666925120755",
  appId: "1:666925120755:web:776daec3bab1fb3744cb86",
  measurementId: "G-MXKF98RN6N"
};

// Initialize Firebase (Singleton pattern to prevent re-initializing in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
