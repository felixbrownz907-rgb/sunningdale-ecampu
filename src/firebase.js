import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBfo1ac7lygc3Ddkh2QjJEDoCXFfv7p_mk",
  authDomain: "sunningdale-7da30.firebaseapp.com",
  projectId: "sunningdale-7da30",
  storageBucket: "sunningdale-7da30.firebasestorage.app",
  messagingSenderId: "217096247602",
  appId: "1:217096247602:web:799de4baacaeb0564cdf2b",
  measurementId: "G-6GNRP2KG7Y"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { firebaseConfig };
