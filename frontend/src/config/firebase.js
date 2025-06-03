// Firebase configuration for Nutrivault
// Replace these with your actual Firebase project credentials

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB4a-gqWIP3Zu9I9XhIZ4Xo1n-sih3WuLo",
  authDomain: "nutrivault-4dee9.firebaseapp.com",
  projectId: "nutrivault-4dee9",
  storageBucket: "nutrivault-4dee9.firebasestorage.app",
  messagingSenderId: "314768679883",
  appId: "1:314768679883:web:908eb066bf19e520eccc4e",
  measurementId: "G-JMEK4JX3W7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
