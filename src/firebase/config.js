import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB3uYwUSXeuCkdAa3PZHqF7wy6XuNv25Rk",
    authDomain: "interview-98574.firebaseapp.com",
    projectId: "interview-98574",
    storageBucket: "interview-98574.firebasestorage.app",
    messagingSenderId: "415470259040",
    appId: "1:415470259040:web:43d216231d0a8d74e72c05"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
