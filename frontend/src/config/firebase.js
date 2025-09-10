import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBESxiYBuyIR9g7vmW4tFByc3q8QkCgsJk",
  authDomain: "safetex-749f9.firebaseapp.com",
  projectId: "safetex-749f9",
  storageBucket: "safetex-749f9.appspot.com",
  messagingSenderId: "811178603279",
  appId: "1:811178603279:web:27fbfb2e0d23a8b7ac847a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 