// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDCAkzw9ATiH7rrOUbEqKnU4aW-o7tlFaQ",
  authDomain: "standoff-ce32e.firebaseapp.com",
  projectId: "standoff-ce32e",
  storageBucket: "standoff-ce32e.appspot.com",
  messagingSenderId: "354340751088",
  appId: "1:354340751088:web:302fe95a8665fb6d3ce435",
  measurementId: "G-G7GJG5TFRD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
