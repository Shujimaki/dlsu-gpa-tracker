import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  // TODO: Replace with your Firebase config
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const analytics: Analytics = getAnalytics(app);

// DISABLED: Offline persistence can cause 400 errors if initiated before auth
// We're seeing auth/unauthorized-domain errors, indicating auth setup issues
// Once auth domain issues are resolved, you can re-enable this by uncommenting 
// and replacing the import

// Offline persistence code (currently disabled):
// import { enableIndexedDbPersistence, type FirestoreError } from 'firebase/firestore'; 
// enableIndexedDbPersistence(db).catch((err: FirestoreError) => {
//   if (err.code === 'failed-precondition') {
//     console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
//   } else if (err.code === 'unimplemented') {
//     console.warn('The current browser does not support persistence.');
//   }
// }); 