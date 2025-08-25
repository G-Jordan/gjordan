// js/firebase/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwAjZWU_j85EbJYk8jE1IVpdOXkIMfG5Q",
  authDomain: "gj-music-stats.firebaseapp.com",
  projectId: "gj-music-stats",
  storageBucket: "gj-music-stats.appspot.com",
  messagingSenderId: "582857417308",
  appId: "1:582857417308:web:067e047b07739ab81dbc99",
  measurementId: "G-L48EX09QBQ"
};

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);
const auth = getAuth(appFirebase);

// Expose globals so non-module files can use them
window.db = db;
window.auth = auth;