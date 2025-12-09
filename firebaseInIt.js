// firebaseInit.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDK18VQ1CG8CNiCBLnft20DUdFcNWbDQbE",
  authDomain: "time-tracking-app-f8b16.firebaseapp.com",
  databaseURL:
    "https://time-tracking-app-f8b16-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "time-tracking-app-f8b16",
  storageBucket: "time-tracking-app-f8b16.firebasestorage.app",
  messagingSenderId: "242011862048",
  appId: "1:242011862048:web:655750f8366094843af845",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// useful for window debugging in browser devtools
window.app = app;
window.auth = auth;
window.db = db;
console.log("Firebase initialized");
