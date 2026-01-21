// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB7iu5C9Nex-UHITXTWwfPDzVldwFbByGU",
    authDomain: "sparkslearn-fb52b.firebaseapp.com",
    projectId: "sparkslearn-fb52b",
    storageBucket: "sparkslearn-fb52b.firebasestorage.app",
    messagingSenderId: "909605716998",
    appId: "1:909605716998:web:6ba58edcfbcab878c2ef87",
    measurementId: "G-NFVTGRNYM5"
};

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db, firebaseConfig };
