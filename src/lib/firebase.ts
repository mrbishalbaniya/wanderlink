
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhWbzwst4YiLFl5v_WWai3l8lMFBM_V7M",
  authDomain: "wandermap-c0794.firebaseapp.com",
  projectId: "wandermap-c0794",
  storageBucket: "wandermap-c0794.firebasestorage.app", // Reverted to user-provided value
  messagingSenderId: "724032457230",
  appId: "1:724032457230:web:b7f6668b17d5b4720f0a5f",
  measurementId: "G-HQEHS2R999"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
