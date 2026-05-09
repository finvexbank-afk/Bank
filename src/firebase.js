// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwgDTBZOw7Nwz4CcH-bhHlWqWI-vsk1Bs",
  authDomain: "finvexbank-c86bb.firebaseapp.com",
  projectId: "finvexbank-c86bb",
  storageBucket: "finvexbank-c86bb.firebasestorage.app",
  messagingSenderId: "1006017340196",
  appId: "1:1006017340196:web:3d840ce1d303890e8449b1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
