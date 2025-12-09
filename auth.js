// auth.js
import { auth } from "./firebaseInit.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

export function setupAuthUI() {
  const emailInput = document.getElementById("email");
  const pwInput = document.getElementById("password");
  const signinBtn = document.getElementById("signin-btn");
  const signupBtn = document.getElementById("signup-btn");
  const googleBtn = document.getElementById("google-signin");

  const authArea = document.getElementById("auth-area");
  const authView = document.getElementById("auth-view");
  const appView = document.getElementById("app-view");

  signinBtn.addEventListener("click", async () => {
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, pwInput.value);
    } catch (err) {
      alert("Sign-in failed: " + err.message);
    }
  });

  signupBtn.addEventListener("click", async () => {
    try {
      await createUserWithEmailAndPassword(
        auth,
        emailInput.value,
        pwInput.value
      );
      alert("Account created. You are signed in.");
    } catch (err) {
      alert("Sign-up failed: " + err.message);
    }
  });

  googleBtn.addEventListener("click", async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      alert("Google sign-in failed: " + err.message);
    }
  });

  // sign out button rendered in authArea when signed in
  function renderSignedInArea(user) {
    authArea.innerHTML = `
      <div style="display:flex; gap:8px; align-items:center">
        <div class="small">Hello, ${user.email}</div>
        <button id="signout-btn" class="btn ghost">Sign out</button>
      </div>
    `;
    document
      .getElementById("signout-btn")
      .addEventListener("click", async () => {
        await signOut(auth);
      });
  }

  function renderSignedOutArea() {
    authArea.innerHTML = "";
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // show app
      renderSignedInArea(user);
      authView.classList.add("hidden");
      appView.classList.remove("hidden");

      // set date to today by default
      const datePicker = document.getElementById("date-picker");
      const today = new Date().toISOString().slice(0, 10);
      if (!datePicker.value) datePicker.value = today;
    } else {
      // show login
      renderSignedOutArea();
      authView.classList.remove("hidden");
      appView.classList.add("hidden");
    }
  });
}
