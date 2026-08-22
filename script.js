// Raghu Cyber Centre Pro - Firebase version
// Works with the current index.html IDs.
// Customer: Firebase Email/Password login (mobile is converted to an internal email)
// Admin: separate Admin login mode, using Firebase Auth.
// Firestore collections: users, requests, recharge

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCocbMxKktSscHD5oZU3nxKveciZ1yVH8g",
  authDomain: "raghu-cyber-centre.firebaseapp.com",
  projectId: "raghu-cyber-centre",
  storageBucket: "raghu-cyber-centre.firebasestorage.app",
  messagingSenderId: "275180323748",
  appId: "1:275180323748:web:a25d9584d5e1d1ec233731",
  measurementId: "G-0GS7PRTZLG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = "raghunaikskp9686@gmail.com";

const SERVICES = [
  {id:1, icon:"📄", name:"Ration Card PDF - OTP", price:20, info:"Ration card related online service"},
  {id:2, icon:"📄", name:"Ration Card PDF - Without OTP", price:25, info:"Ration card PDF service"},
  {id:3, icon:"🪪", name:"Aadhaar / e-KYC Assistance", price:30, info:"Online assistance service"},
  {id:4, icon:"🧾", name:"Certificate / Document Service", price:30, info:"Document application assistance"},
  {id:5, icon:"🏦", name:"Banking Form Assistance", price:30, info:"Online form assistance"},
  {id:6, icon:"🖨️", name:"Print / Download Service", price:10, info:"Document print/download assistance"},
  {id:7, icon:"🔎", name:"QR Scanner Service", price:10, info:"QR related assistance"},
  {id:8, icon:"📑", name:"Other Online Service", price:40, info:"Other cyber centre service"}
];

let current = null;
let currentUser = null;
let currentRole = null;

// ---------- Helpers ----------
const $ = id => document.getElementById(id);
const customerEmail = mobile => `${mobile}@rcc.local`;

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function formatDate(ts) {
  if (!ts) return new Date().toLocaleString();
  if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
  return String(ts);
}

async function getUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

function hideDemoLogin() {
  document.querySelectorAll(".notice").forEach(el => {
    if ((el.textContent || "").toLowerCase().includes("demo admin")) {
      el.remove();
    }
  });
}

function addLoginModeButtons() {
  const loginSection = $("login");
  if (!loginSection || $("customerLoginMode")) return;

  const pass = $("loginPass");
  const label = pass?.previousElementSibling;

  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;gap:8px;margin:8px 0 12px;flex-wrap:wrap";

  const customerBtn = document.createElement("button");
  customerBtn.id = "customerLoginMode";
  customerBtn.className = "blue";
  customerBtn.textContent = "👤 Customer Login";
  customerBtn.onclick = () => setLoginMode("customer");

  const adminBtn = document.createElement("button");
  adminBtn.id = "adminLoginMode";
  adminBtn.textContent = "⚙️ Admin Login";
  adminBtn.onclick = () => setLoginMode("admin");

  if (label) label.before(wrap);
  else loginSection.querySelector("h2")?.after(wrap);

  wrap.append(customerBtn, adminBtn);
  setLoginMode("customer");
}

function setLoginMode(mode) {
  currentRole = mode;
  const input = $("loginUser");
  const title = document.querySelector("#login h2");
  const btn = document.querySelector("#login button.blue");

  if (mode === "admin") {
    if (title) title.textContent = "⚙️ Admin Login";
    if (input) input.placeholder = "Admin email";
    if (btn) btn.textContent = "Admin Login";
    $("customerLoginMode")?.classList.remove("blue");
    $("adminLoginMode")?.classList.add("blue");
  } else {
    if (title) title.textContent = "👤 Customer Login";
    if (input) input.placeholder = "10 digit mobile";
    if (btn) btn.textContent = "Customer Login";
    $("adminLoginMode")?.classList.remove("blue");
    $("customerLoginMode")?.classList.add("blue");
  }
}

// ---------- Page/UI ----------
window.showPage = function(id) {
  const protectedPages = ["home","services","wallet","history","admin"];
  if (!auth.currentUser && protectedPages.includes(id)) {
    id = "login";
  }
  if (id === "admin" && currentRole !== "admin") {
    id = "home";
  }

  document.querySelectorAll("main section").forEach(s => s.classList.add("hidden"));
  const page = $(id);
  if (page) page.classList.remove("hidden");

  if (id === "services") renderServices();
  if (id === "history") renderHistory();
  if (id === "admin") renderAdmin();
  updateUI();
};

async function updateUI() {
  const u = currentUser;
  const isAdmin = currentRole === "admin";

  setText("userBox", u ? (isAdmin ? "⚙️ Admin" : `👤 ${u.name || "Customer"}`) : "Login ಮಾಡಿ");
  $("adminNav")?.classList.toggle("hidden", !isAdmin);
  $("logoutBtn")?.classList.toggle("hidden", !u);

  let balance = 0;
  let mine = [];

  if (u && !isAdmin) {
    balance = Number(u.wallet || 0);
    mine = await getMyRequests();
  }

  setText("homeWallet", `₹${balance}`);
  setText("walletBalance", `₹${balance}`);
  setText("serviceCount", SERVICES.length);
  setText("requestCount", mine.length);
  setText("completeCount", mine.filter(r => r.status === "Completed").length);

  const welcome = isAdmin
    ? "Admin panel ಮೂಲಕ customer requests ಮತ್ತು wallet recharge manage ಮಾಡಬಹುದು."
    : u ? `Hi ${u.name || "Customer"}! Services use ಮಾಡಬಹುದು.` : "Login ಮಾಡಿದ ನಂತರ services ಬಳಸಬಹುದು.";

  setText("welcomeText", welcome);
}

// ---------- Login ----------
window.login = async function() {
  const value = $("loginUser")?.value.trim();
  const pass = $("loginPass")?.value || "";

  if (!value || !pass) {
    alert("Login details ತುಂಬಿ.");
    return;
  }

  try {
    if (currentRole === "admin") {
      if (value.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        alert("Admin email ಸರಿಯಿಲ್ಲ.");
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, value, pass);
      const data = await getUserData(cred.user.uid);

      if (!data || data.role !== "admin") {
        await signOut(auth);
        alert("ಈ account Admin account ಅಲ್ಲ.");
        return;
      }

      currentUser = {uid: cred.user.uid, ...data, admin:true};
      showPage("admin");
      return;
    }

    if (!/^\d{10}$/.test(value)) {
      alert("10 digit mobile number ಹಾಕಿ.");
      return;
    }

    const cred = await signInWithEmailAndPassword(auth, customerEmail(value), pass);
    const data = await getUserData(cred.user.uid);

    if (!data || data.role !== "customer") {
      await signOut(auth);
      alert("Customer account data ಸಿಗಲಿಲ್ಲ.");
      return;
    }

    currentUser = {uid: cred.user.uid, ...data, admin:false};
    showPage("home");
  } catch (err) {
    console.error(err);
    alert("Login failed: " + firebaseError(err));
  }
};

function firebaseError(err) {
  const code = err?.code || "";
  const map = {
    "auth/invalid-credential":"Mobile/email ಅಥವಾ password ತಪ್ಪಾಗಿದೆ.",
    "auth/user-not-found":"Account ಸಿಗಲಿಲ್ಲ. ಮೊದಲು register ಮಾಡಿ.",
    "auth/wrong-password":"Password ತಪ್ಪಾಗಿದೆ.",
    "auth/invalid-email":"Login details ತಪ್ಪಾಗಿದೆ.",
    "auth/email-already-in-use":"ಈ mobile already registered.",
    "auth/weak-password":"Password ಕನಿಷ್ಠ 6 characters ಇರಲಿ.",
    "auth/operation-not-allowed":"Firebase Authentication ನಲ್ಲಿ Email/Password enable ಮಾಡಿ.",
    "permission-denied":"Firebase Firestore permission denied. Firestore Rules check ಮಾಡಿ."
  };
  return map[code] || (err?.message || "Unknown error");
}

// ---------- Registration ----------
window.register = async function() {
  const name = $("regName")?.value.trim();
  const mobile = $("regMobile")?.value.trim();
  const pass = $("regPass")?.value || "";

  if (!name || !/^\d{10}$/.test(mobile) || !pass) {
    alert("Name, 10 digit mobile ಮತ್ತು password ತುಂಬಿ.");
    return;
  }

  if (pass.length < 6) {
    alert("Password ಕನಿಷ್ಠ 6 characters ಇರಬೇಕು.");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, customerEmail(mobile), pass);

    await updateProfile(cred.user, {displayName:name});

    const data = {
      uid: cred.user.uid,
      name,
      mobile,
      wallet: 0,
      role: "customer",
      createdAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", cred.user.uid), data);

    await signOut(auth);
    alert("Registration successful. ಈಗ Customer Login ಮಾಡಿ.");
    showPage("login");
  } catch (err) {
    console.error(err);
    alert("Registration failed: " + firebaseError(err));
  }
};

// ---------- Logout ----------
window.logout = async function() {
  try { await signOut(auth); } catch(e) {}
  currentUser = null;
  currentRole = null;
  setLoginMode("customer");
  showPage("login");
};

// ---------- Services ----------
window.renderServices = function() {
  const box = $("serviceGrid");
  if (!box) return;

  const q = ($("serviceSearch")?.value || "").toLowerCase().trim();
  const list = SERVICES.filter(s => s.name.toLowerCase().includes(q));

  box.innerHTML = list.map(s => `
    <div class="card service">
      <div class="icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <div class="price">Service Fee: ₹${s.price}</div>
      <div class="small">Wallet balance required</div>
      <button class="blue" onclick="openService(${s.id})">Open / Apply</button>
    </div>
  `).join("");
};

window.openService = async function(id) {
  if (!auth.currentUser || currentRole !== "customer") {
    alert("Customer login ಬೇಕು.");
    return;
  }

  const data = await getUserData(auth.currentUser.uid);
  if (!data) {
    alert("Customer data ಸಿಗಲಿಲ್ಲ.");
    return;
  }

  currentUser = {uid: auth.currentUser.uid, ...data, admin:false};
  current = SERVICES.find(s => s.id === id);
  if (!current) return;

  const balance = Number(data.wallet || 0);

  if (balance < current.price) {
    alert(`ಈ service fee ₹${current.price}. ನಿಮ್ಮ wallet balance ₹${balance}. ಮೊದಲು wallet recharge ಮಾಡಿ.`);
    openRecharge();
    return;
  }

  setText("modalTitle", `${current.icon} ${current.name}`);
  $("modalInfo").innerHTML = `${current.info}<br><br><b>Fee: ₹${current.price}</b><br><span class="small">Request submit ಮಾಡುವಾಗ payment cut ಆಗುವುದಿಲ್ಲ. Work complete ಆದಾಗ admin charge ಮಾಡುತ್ತಾರೆ.</span>`;
  $("serviceNote").value = "";
  $("serviceModal").classList.add("show");
};

window.closeModal = function() {
  $("serviceModal")?.classList.remove("show");
};

window.submitRequest = async function() {
  if (!current || !auth.currentUser || currentRole !== "customer") return;

  const note = $("serviceNote")?.value.trim() || "";

  try {
    await addDoc(collection(db, "requests"), {
      uid: auth.currentUser.uid,
      mobile: currentUser.mobile,
      name: currentUser.name,
      serviceId: current.id,
      service: current.name,
      fee: current.price,
      note,
      status: "Pending",
      charged: false,
      createdAt: serverTimestamp()
    });

    closeModal();
    alert("Request submitted successfully. Work complete ಆದ ನಂತರ wallet ನಿಂದ charge ಆಗುತ್ತದೆ.");
    showPage("history");
  } catch (err) {
    console.error(err);
    alert("Request submit failed: " + firebaseError(err));
  }
};

// ---------- Customer history ----------
async function getMyRequests() {
  if (!auth.currentUser) return [];

  const q = query(
    collection(db, "requests"),
    where("uid", "==", auth.currentUser.uid)
  );

  const snap = await getDocs(q);
  const rows = [];
  snap.forEach(d => rows.push({id:d.id, ...d.data()}));

  rows.sort((a,b) => {
    const aa = a.createdAt?.seconds || 0;
    const bb = b.createdAt?.seconds || 0;
    return bb - aa;
  });

  return rows;
}

window.renderHistory = async function() {
  const box = $("historyBox");
  if (!box || currentRole !== "customer") {
    if (box) box.innerHTML = "<p>Customer login ಮಾಡಿ.</p>";
    return;
  }

  box.innerHTML = "<p>Loading...</p>";

  try {
    const rows = await getMyRequests();

    if (!rows.length) {
      box.innerHTML = "<p>No requests yet.</p>";
      return;
    }

    box.innerHTML = `
      <table>
        <tr><th>Service</th><th>Fee</th><th>Status</th><th>Date</th></tr>
        ${rows.map(r => `
          <tr>
            <td>${escapeHtml(r.service || "")}</td>
            <td>₹${Number(r.fee || 0)}</td>
            <td><span class="status">${escapeHtml(r.status || "Pending")}${r.charged ? " • Charged" : ""}</span></td>
            <td>${escapeHtml(formatDate(r.createdAt))}</td>
          </tr>
        `).join("")}
      </table>`;
  } catch (err) {
    console.error(err);
    box.innerHTML = "<p>History load ಆಗಲಿಲ್ಲ.</p>";
  }
};

// ---------- Recharge ----------
window.openRecharge = function() {
  $("rechargeAmount").value = "";
  $("rechargeModal")?.classList.add("show");
};

window.closeRecharge = function() {
  $("rechargeModal")?.classList.remove("show");
};

window.requestRecharge = async function() {
  if (!auth.currentUser || currentRole !== "customer") {
    alert("Customer login ಮಾಡಿ.");
    return;
  }

  const amount = Number($("rechargeAmount")?.value);

  if (!amount || amount <= 0) {
    alert("Valid amount ಹಾಕಿ.");
    return;
  }

  try {
    await addDoc(collection(db, "recharge"), {
      uid: auth.currentUser.uid,
      mobile: currentUser.mobile,
      name: currentUser.name,
      amount,
      status: "Pending",
      createdAt: serverTimestamp()
    });

    closeRecharge();
    alert("Recharge request submitted. Admin payment verify ಮಾಡಿ wallet credit ಮಾಡುತ್ತಾರೆ.");
  } catch (err) {
    console.error(err);
    alert("Recharge request failed: " + firebaseError(err));
  }
};

// ---------- Admin ----------
window.renderAdmin = async function() {
  if (currentRole !== "admin") return;

  const box = $("adminRequests");
  if (!box) return;

  box.innerHTML = "<p>Loading requests...</p>";

  try {
    const snap = await getDocs(collection(db, "requests"));
    const rows = [];
    snap.forEach(d => rows.push({id:d.id, ...d.data()}));

    rows.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    let html = `<h3>📋 Customer Requests</h3>`;

    if (!rows.length) html += "<p>No customer requests.</p>";

    for (const r of rows) {
      html += `
        <div class="card">
          <b>${escapeHtml(r.name || "")}</b> • ${escapeHtml(r.mobile || "")}<br>
          <strong>${escapeHtml(r.service || "")}</strong> — ₹${Number(r.fee || 0)}<br>
          <div class="small">${escapeHtml(formatDate(r.createdAt))}</div>
          <p>${escapeHtml(r.note || "No note")}</p>
          <p>Status: <span class="status">${escapeHtml(r.status || "Pending")}${r.charged ? " • Wallet charged" : ""}</span></p>
          ${r.status === "Pending" ? `
            <button class="green" onclick="completeRequest('${r.id}')">✅ Complete & Charge</button>
            <button onclick="rejectRequest('${r.id}')">Reject</button>
          ` : ""}
        </div>`;
    }

    html += `<hr><h3>💳 Recharge Requests</h3>`;
    const rechargeSnap = await getDocs(collection(db, "recharge"));
    const rr = [];
    rechargeSnap.forEach(d => rr.push({id:d.id, ...d.data()}));
    rr.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    if (!rr.length) html += "<p>No recharge requests.</p>";

    for (const r of rr) {
      html += `
        <div class="card">
          <b>${escapeHtml(r.name || "")}</b> • ${escapeHtml(r.mobile || "")}<br>
          Recharge: <strong>₹${Number(r.amount || 0)}</strong><br>
          Status: <span class="status">${escapeHtml(r.status || "Pending")}</span><br>
          <div class="small">${escapeHtml(formatDate(r.createdAt))}</div>
          ${r.status === "Pending" ? `
            <button class="green" onclick="approveRecharge('${r.id}','${r.uid}',${Number(r.amount || 0)})">✅ Approve & Add Wallet</button>
            <button onclick="rejectRecharge('${r.id}')">Reject</button>
          ` : ""}
        </div>`;
    }

    box.innerHTML = html;
  } catch (err) {
    console.error(err);
    box.innerHTML = `<p>Admin data load ಆಗಲಿಲ್ಲ: ${escapeHtml(err?.message || "")}</p>`;
  }
};

window.completeRequest = async function(id) {
  if (currentRole !== "admin") return;

  try {
    const requestRef = doc(db, "requests", id);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) return alert("Request ಸಿಗಲಿಲ್ಲ.");

    const r = requestSnap.data();

    if (r.status !== "Pending") {
      alert("ಈ request already processed.");
      return;
    }

    const userRef = doc(db, "users", r.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("Customer account ಸಿಗಲಿಲ್ಲ.");
      return;
    }

    const u = userSnap.data();
    const balance = Number(u.wallet || 0);
    const fee = Number(r.fee || 0);

    if (balance < fee) {
      alert(`Customer wallet ₹${balance}. Service fee ₹${fee}. ಮೊದಲು wallet recharge ಮಾಡಬೇಕು.`);
      return;
    }

    await updateDoc(userRef, {
      wallet: balance - fee,
      updatedAt: serverTimestamp()
    });

    await updateDoc(requestRef, {
      status: "Completed",
      charged: true,
      completedAt: serverTimestamp()
    });

    alert(`Work completed. ₹${fee} wallet ನಿಂದ deduct ಆಗಿದೆ.`);
    renderAdmin();
  } catch (err) {
    console.error(err);
    alert("Complete failed: " + firebaseError(err));
  }
};

window.rejectRequest = async function(id) {
  if (currentRole !== "admin") return;

  try {
    await updateDoc(doc(db, "requests", id), {
      status: "Rejected",
      rejectedAt: serverTimestamp()
    });
    renderAdmin();
  } catch (err) {
    alert("Reject failed: " + firebaseError(err));
  }
};

window.approveRecharge = async function(rechargeId, uid, amount) {
  if (currentRole !== "admin") return;

  try {
    const rechargeRef = doc(db, "recharge", rechargeId);
    const rechargeSnap = await getDoc(rechargeRef);

    if (!rechargeSnap.exists()) return alert("Recharge request ಸಿಗಲಿಲ್ಲ.");

    const r = rechargeSnap.data();

    if (r.status !== "Pending") {
      alert("ಈ recharge already processed.");
      return;
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("Customer account ಸಿಗಲಿಲ್ಲ.");
      return;
    }

    const oldBalance = Number(userSnap.data().wallet || 0);

    await updateDoc(userRef, {
      wallet: oldBalance + Number(amount),
      updatedAt: serverTimestamp()
    });

    await updateDoc(rechargeRef, {
      status: "Approved",
      approvedAt: serverTimestamp()
    });

    alert(`₹${amount} customer wallet ಗೆ add ಆಗಿದೆ.`);
    renderAdmin();
  } catch (err) {
    console.error(err);
    alert("Wallet credit failed: " + firebaseError(err));
  }
};

window.rejectRecharge = async function(id) {
  if (currentRole !== "admin") return;

  try {
    await updateDoc(doc(db, "recharge", id), {
      status: "Rejected",
      rejectedAt: serverTimestamp()
    });
    renderAdmin();
  } catch (err) {
    alert("Reject failed: " + firebaseError(err));
  }
};

// ---------- Security/display cleanup ----------
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ---------- Auth state ----------
onAuthStateChanged(auth, async user => {
  hideDemoLogin();
  addLoginModeButtons();

  if (!user) {
    currentUser = null;
    if (document.querySelector("#login")?.classList.contains("hidden")) showPage("login");
    updateUI();
    return;
  }

  try {
    const data = await getUserData(user.uid);

    if (!data) {
      await signOut(auth);
      return;
    }

    currentRole = data.role === "admin" ? "admin" : "customer";
    currentUser = {uid:user.uid, ...data, admin:currentRole === "admin"};

    showPage(currentRole === "admin" ? "admin" : "home");
  } catch (err) {
    console.error(err);
    alert("Account load ಆಗಲಿಲ್ಲ.");
  }
});

// Initial cleanup
hideDemoLogin();
addLoginModeButtons();
