import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";


/* ================= FIREBASE CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyCocbMxKktSscHD5oZU3nxKveciZ1yVH8g",
  authDomain: "raghu-cyber-centre.firebaseapp.com",
  projectId: "raghu-cyber-centre",
  storageBucket: "raghu-cyber-centre.firebasestorage.app",
  messagingSenderId: "275180323748",
  appId: "1:275180323748:web:a25d9584d5e1d1ec233731",
  measurementId: "G-0GS7PRTZLG"
};


/* ================= INITIALIZE ================= */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* ================= ADMIN ================= */

const ADMIN_EMAIL = "raghunaikskp9686@gmail.com";


/* ================= VARIABLES ================= */

let registering = false;
let currentUser = null;


/* ================= ELEMENT HELPER ================= */

const $ = id => document.getElementById(id);


/* ================= VIEWS ================= */

const authView = $("authView");
const customerView = $("customerView");
const adminView = $("adminView");


/* ================= AUTH ELEMENTS ================= */

const authForm = $("authForm");
const authTitle = $("authTitle");
const authIntro = $("authIntro");
const authSubmit = $("authSubmit");
const authSwitch = $("authSwitch");
const authError = $("authError");

const authMobile = $("authMobile");
const authPassword = $("authPassword");


/* ================= CUSTOMER ELEMENTS ================= */

const customerGreeting = $("customerGreeting");
const requestForm = $("requestForm");
const serviceSelect = $("serviceSelect");
const requestNote = $("requestNote");
const requestResult = $("requestResult");
const requestHistory = $("requestHistory");

const logoutButton = $("logoutButton");


/* ================= ADMIN ELEMENTS ================= */

const adminRequestList = $("adminRequestList");
const adminLogoutButton = $("adminLogoutButton");


/* ================= LOGIN / REGISTER MODE ================= */

function setMode(register) {

  registering = register;

  authTitle.textContent =
    register ? "ಗ್ರಾಹಕ ನೋಂದಣಿ" : "ಗ್ರಾಹಕ ಲಾಗಿನ್";

  authIntro.textContent =
    register
      ? "ಮೊಬೈಲ್ ನಂಬರ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ ಖಾತೆ ತೆರೆಯಿರಿ."
      : "ಮೊಬೈಲ್ ನಂಬರ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಬಳಸಿ ಲಾಗಿನ್ ಮಾಡಿ.";

  authSubmit.textContent =
    register ? "ಖಾತೆ ತೆರೆಯಿರಿ" : "ಲಾಗಿನ್";

  authSwitch.textContent =
    register
      ? "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಲಾಗಿನ್ ಮಾಡಿ"
      : "ಹೊಸ ಗ್ರಾಹಕರೇ? ನೋಂದಣಿ ಮಾಡಿ";

  authError.hidden = true;
}


/* ================= SWITCH LOGIN / REGISTER ================= */

authSwitch.onclick = () => {
  setMode(!registering);
};


/* ================= AUTH FORM ================= */

authForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  authError.hidden = true;

  try {

    const mobile = authMobile.value.trim();
    const password = authPassword.value;

    if (!/^\d{10}$/.test(mobile)) {
      throw new Error("ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ನಂಬರ್ ಬರೆಯಿರಿ.");
    }

    if (password.length < 6) {
      throw new Error("ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಂಕಿ/ಅಕ್ಷರ ಇರಬೇಕು.");
    }

    /*
      Mobile number ಅನ್ನು internal email ಆಗಿ convert ಮಾಡಲಾಗುತ್ತದೆ.
      Customerಗೆ email ಬೇಕಾಗುವುದಿಲ್ಲ.
    */

    const internalEmail =
      `m${mobile}@avrcreation.firebaseapp.com`;


    if (registering) {

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          internalEmail,
          password
        );


      await setDoc(
        doc(db, "customers", credential.user.uid),
        {
          mobile: mobile,
          createdAt: new Date().toISOString()
        }
      );

    } else {

      await signInWithEmailAndPassword(
        auth,
        internalEmail,
        password
      );

    }

  } catch (err) {

    authError.textContent =
      err.message.replace("Firebase: ", "");

    authError.hidden = false;
  }

});


/* ================= AUTH STATE ================= */

onAuthStateChanged(auth, async (user) => {

  currentUser = user;

  if (!user) {

    authView.hidden = false;
    customerView.hidden = true;
    adminView.hidden = true;

    setMode(false);

    return;
  }


  /*
    Admin login
  */

  if (user.email === ADMIN_EMAIL) {

    authView.hidden = true;
    customerView.hidden = true;
    adminView.hidden = false;

    await loadAdminRequests();

    return;
  }


  /*
    Normal customer login
  */

  authView.hidden = true;
  customerView.hidden = false;
  adminView.hidden = true;

  customerGreeting.textContent =
    `ನಮಸ್ಕಾರ, ${user.displayName || "ಗ್ರಾಹಕರೇ"}`;

  await loadRequests();

});


/* ================= CUSTOMER REQUEST ================= */

requestForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  requestResult.hidden = true;

  try {

    if (!currentUser) {
      throw new Error("ದಯವಿಟ್ಟು ಮೊದಲು login ಮಾಡಿ.");
    }


    await addDoc(
      collection(db, "requests"),
      {
        uid: currentUser.uid,
        service: serviceSelect.value,
        note: requestNote.value.trim(),
        status: "ಹೊಸ ವಿನಂತಿ",
        createdAt: new Date().toISOString()
      }
    );


    requestNote.value = "";

    requestResult.textContent =
      "ನಿಮ್ಮ ವಿನಂತಿ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ.";

    requestResult.hidden = false;

    await loadRequests();

  } catch (err) {

    requestResult.textContent =
      "ವಿನಂತಿ ಕಳುಹಿಸಲು ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.";

    requestResult.hidden = false;
  }

});


/* ================= LOAD CUSTOMER REQUESTS ================= */

async function loadRequests() {

  if (!currentUser) return;

  try {

    const records = await getDocs(
      query(
        collection(db, "requests"),
        where("uid", "==", currentUser.uid)
      )
    );


    const items = records.docs
      .map(doc => doc.data())
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt)
      );


    if (!items.length) {

      requestHistory.innerHTML =
        '<p class="empty">ಇನ್ನೂ ಯಾವುದೇ ವಿನಂತಿ ಇಲ್ಲ.</p>';

      return;
    }


    requestHistory.innerHTML =
      items.map(r => `

        <article class="request">

          <strong>${r.service || ""}</strong>

          <span>${r.status || ""}</span>

          <small>${r.note || ""}</small>

          <time>${r.createdAt || ""}</time>

        </article>

      `).join("");

  } catch (err) {

    requestHistory.innerHTML =
      '<p class="empty">ವಿನಂತಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಆಗಲಿಲ್ಲ.</p>';

  }

}


/* ================= CUSTOMER LOGOUT ================= */

logoutButton.onclick = async () => {

  await signOut(auth);

};


/* ================= ADMIN OPEN ================= */

window.openAdmin = async () => {

  try {

    if (!currentUser) {

      const email =
        prompt("Admin email ID ಬರೆಯಿರಿ:");

      const password =
        prompt("Admin password ಬರೆಯಿರಿ:");

      if (!email || !password) return;


      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      return;
    }


    if (currentUser.email !== ADMIN_EMAIL) {

      await signOut(auth);

      alert(
        "ಈ emailಗೆ admin access ಇಲ್ಲ."
      );

      return;
    }


    authView.hidden = true;
    customerView.hidden = true;
    adminView.hidden = false;

    await loadAdminRequests();

  } catch (err) {

    alert(
      "Admin email ಅಥವಾ password ಸರಿಯಿಲ್ಲ."
    );

  }

};


/* ================= LOAD ADMIN REQUESTS ================= */

async function loadAdminRequests() {

  if (!currentUser) return;

  if (currentUser.email !== ADMIN_EMAIL) return;


  try {

    const records =
      await getDocs(
        collection(db, "requests")
      );


    const items = records.docs
      .map(doc => doc.data())
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt)
      );


    if (!items.length) {

      adminRequestList.innerHTML =
        '<p class="empty">ಇನ್ನೂ customer requests ಬಂದಿಲ್ಲ.</p>';

      return;
    }


    adminRequestList.innerHTML =
      items.map(r => `

        <article class="request">

          <strong>${r.service || ""}</strong>

          <span>${r.status || ""}</span>

          <small>
            ${r.note || "ಯಾವುದೇ ವಿವರ ಇಲ್ಲ"}
          </small>

          <time>
            ${r.createdAt || ""}
          </time>

        </article>

      `).join("");

  } catch (err) {

    adminRequestList.innerHTML =
      '<p class="empty">Requests load ಆಗಲಿಲ್ಲ.</p>';

  }

}


/* ================= ADMIN LOGOUT ================= */

adminLogoutButton.onclick = async () => {

  await signOut(auth);

};


/* ================= START ================= */

setMode(false);
