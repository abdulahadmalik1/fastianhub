import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Public web-app identifiers. Firestore rules, not this configuration, control access.
const app = getApps().find(app => app.name === 'fastianhub-public-stats') ?? initializeApp({
  apiKey: 'AIzaSyARvrR-awLlbacaU60xSs_3tqEIy1osC1w',
  authDomain: 'fastiflex.firebaseapp.com',
  projectId: 'fastiflex',
  storageBucket: 'fastiflex.firebasestorage.app',
  messagingSenderId: '666925120755',
  appId: '1:666925120755:web:776daec3bab1fb3744cb86',
}, 'fastianhub-public-stats');

export const db = getFirestore(app);
