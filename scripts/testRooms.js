const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyARvrR-awLlbacaU60xSs_3tqEIy1osC1w",
  authDomain: "fastiflex.firebaseapp.com",
  projectId: "fastiflex",
  storageBucket: "fastiflex.firebasestorage.app",
  messagingSenderId: "666925120755",
  appId: "1:666925120755:web:776daec3bab1fb3744cb86",
  measurementId: "G-MXKF98RN6N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    const metaRef = doc(db, 'sections', '_metadata');
    const metaSnap = await getDoc(metaRef);
    console.log('Metadata exists:', metaSnap.exists());
    if (metaSnap.exists()) {
      console.log('Metadata:', metaSnap.data());
    }

    const testSection = doc(db, 'sections', '2026-CS-A');
    const snap = await getDoc(testSection);
    console.log('2026-CS-A exists:', snap.exists());
    if (snap.exists()) {
      const schedule = snap.data().schedule || [];
      console.log('2026-CS-A Entries count:', schedule.length);
      console.log('Sample entry:', schedule[0]);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
