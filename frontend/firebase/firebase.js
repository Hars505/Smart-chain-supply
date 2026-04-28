import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBIE5baXcdi56EreObZp4CSSD2Ncwnaac8",
  authDomain: "smart-supply-chain-47e4d.firebaseapp.com",
  databaseURL: "https://smart-supply-chain-47e4d-default-rtdb.firebaseio.com",
  projectId: "smart-supply-chain-47e4d",
  storageBucket: "smart-supply-chain-47e4d.firebasestorage.app",
  messagingSenderId: "411646176496",
  appId: "1:411646176496:web:c07c01f4519a6421daa635",
  measurementId: "G-45YZ68ZLH2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
