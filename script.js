const SERVICES=[
{id:1,icon:"📄",name:"Ration Card PDF - OTP",price:20,info:"Ration card related online service"},
{id:2,icon:"📄",name:"Ration Card PDF - Without OTP",price:25,info:"Ration card PDF service"},
{id:3,icon:"🪪",name:"Aadhaar / e-KYC Assistance",price:30,info:"Online assistance service"},
{id:4,icon:"🧾",name:"Certificate / Document Service",price:30,info:"Document application assistance"},
{id:5,icon:"🏦",name:"Banking Form Assistance",price:30,info:"Online form assistance"},
{id:6,icon:"🖨️",name:"Print / Download Service",price:10,info:"Document print/download assistance"},
{id:7,icon:"🔎",name:"QR Scanner Service",price:10,info:"QR related assistance"},
{id:8,icon:"📑",name:"Other Online Service",price:40,info:"Other cyber centre service"}
];

let loginType="customer";
let currentUser=JSON.parse(localStorage.getItem("rcc_current")||"null");
let users=JSON.parse(localStorage.getItem("rcc_users")||"[]");
let requests=JSON.parse(localStorage.getItem("rcc_requests")||"[]");
let recharge=JSON.parse(localStorage.getItem("rcc_recharge")||"[]");
let currentService=null;

function save(){
localStorage.setItem("rcc_users",JSON.stringify(users));
localStorage.setItem("rcc_requests",JSON.stringify(requests));
localStorage.setItem("rcc_recharge",JSON.stringify(recharge));
if(currentUser)localStorage.setItem("rcc_current",JSON.stringify(currentUser));
}

function setLoginType(type){
loginType=type;
document.getElementById("customerLoginBox").classList.toggle("hidden",type!=="customer");
document.getElementById("adminLoginBox").classList.toggle("hidden",type!=="admin");
document.getElementById("customerTab").classList.toggle("active",type==="customer");
document.getElementById("adminTab").classList.toggle("active",type==="admin");
}

function showPage(id){
if(!currentUser && !["login","register"].includes(id)) id="login";
document.querySelectorAll("main section").forEach(s=>s.classList.add("hidden"));
document.getElementById(id).classList.remove("hidden");
if(id==="services")renderServices();
if(id==="history")renderHistory();
if(id==="admin")renderAdmin();
updateUI();
}

function updateUI(){
let logged=!!currentUser;
document.getElementById("mainNav").classList.toggle("hidden",!logged);
document.getElementById("adminNav").classList.toggle("hidden",!(logged&&currentUser.admin));
document.getElementById("userBox").textContent=logged?(currentUser.admin?"⚙️ Admin":"👤 "+currentUser.name):"Login ಮಾಡಿ";
let u=!currentUser?.admin&&currentUser?users.find(x=>x.mobile===currentUser.mobile):null;
let bal=u?Number(u.wallet||0):0;
document.getElementById("homeWallet").textContent="₹"+bal;
document.getElementById("walletBalance").textContent="₹"+bal;
document.getElementById("serviceCount").textContent=SERVICES.length;
let mine=u?requests.filter(r=>r.mobile===u.mobile):[];
document.getElementById("requestCount").textContent=mine.length;
document.getElementById("completeCount").textContent=mine.filter(r=>r.status==="Completed").length;
document.getElementById("welcomeText").textContent=u?("Hi "+u.name+"! Services use ಮಾಡಬಹುದು."):currentUser?.admin?"Admin mode":"Login ಮಾಡಿ.";
}

function registerCustomer(){
let name=document.getElementById("regName").value.trim();
let mobile=document.getElementById("regMobile").value.trim();
let pass=document.getElementById("regPass").value;
if(!name||!/^\d{10}$/.test(mobile)||!pass){alert("Name, 10 digit mobile ಮತ್ತು password ತುಂಬಿ.");return}
if(users.some(u=>u.mobile===mobile)){alert("ಈ mobile already registered.");return}
users.push({name,mobile,password:pass,wallet:0});
save();
alert("Registration successful. ಈಗ Customer Login ಮಾಡಿ.");
showPage("login");
}

function customerLogin(){
let mobile=document.getElementById("customerMobile").value.trim();
let pass=document.getElementById("customerPassword").value;
let u=users.find(x=>x.mobile===mobile&&x.password===pass);
if(!u){alert("Mobile ಅಥವಾ password ತಪ್ಪಾಗಿದೆ.");return}
currentUser={mobile:u.mobile,name:u.name,admin:false};
save();showPage("home");
}

function adminLogin(){
let email=document.getElementById("adminEmail").value.trim().toLowerCase();
let pass=document.getElementById("adminPassword").value;
if(!email||!pass){alert("Admin email ಮತ್ತು password ಹಾಕಿ.");return}
alert("Admin loginಗೆ ನಿಮ್ಮ Firebase Admin account credentials ಬಳಸಬೇಕು. ಈ page local demo storage ಬಳಸುತ್ತಿದೆ; production admin securityಗಾಗಿ Firebase Auth setup ಮಾಡಬೇಕು.");
}

function logout(){
currentUser=null;localStorage.removeItem("rcc_current");showPage("login");
}

function renderServices(){
let q=(document.getElementById("serviceSearch")?.value||"").toLowerCase();
let list=SERVICES.filter(s=>s.name.toLowerCase().includes(q));
document.getElementById("serviceGrid").innerHTML=list.map(s=>`
<div class="card service"><div class="icon">${s.icon}</div><h3>${s.name}</h3>
<div class="price">Service Fee: ₹${s.price}</div><div class="small">Wallet balance check</div>
<button class="blue" onclick="openService(${s.id})">Open / Apply</button></div>`).join("");
}

function openService(id){
if(!currentUser||currentUser.admin){alert("Customer login ಬೇಕು.");return}
let u=users.find(x=>x.mobile===currentUser.mobile);
let s=SERVICES.find(x=>x.id===id);
if(!u||Number(u.wallet||0)<Number(s.price)){
alert("Wallet balance ಸಾಕಾಗುವುದಿಲ್ಲ. ಮೊದಲು Wallet Recharge ಮಾಡಿ.");
return;
}
currentService=s;
document.getElementById("modalTitle").textContent=s.icon+" "+s.name;
document.getElementById("modalInfo").innerHTML=`${s.info}<br><br><b>Fee: ₹${s.price}</b><br>Request submit ಸಮಯದಲ್ಲಿ amount cut ಆಗುವುದಿಲ್ಲ.`;
document.getElementById("serviceNote").value="";
document.getElementById("serviceModal").classList.add("show");
}

function closeModal(){document.getElementById("serviceModal").classList.remove("show")}

function submitRequest(){
let u=users.find(x=>x.mobile===currentUser.mobile);
if(!u||!currentService)return;
if(Number(u.wallet||0)<Number(currentService.price)){alert("Wallet balance ಸಾಕಾಗುವುದಿಲ್ಲ.");closeModal();return}
requests.push({id:Date.now(),mobile:u.mobile,name:u.name,serviceId:currentService.id,service:currentService.name,fee:currentService.price,note:document.getElementById("serviceNote").value.trim(),status:"Pending",charged:false,created:new Date().toLocaleString()});
save();closeModal();alert("Request submitted. Admin work complete ಮಾಡಿದ ನಂತರ charge ಆಗುತ್ತದೆ.");showPage("history");
}

function renderHistory(){
let u=users.find(x=>x.mobile===currentUser?.mobile);
let mine=u?requests.filter(r=>r.mobile===u.mobile).reverse():[];
document.getElementById("historyBox").innerHTML=mine.length?`<table><tr><th>Service</th><th>Fee</th><th>Status</th><th>Date</th></tr>${mine.map(r=>`<tr><td>${r.service}</td><td>₹${r.fee}</td><td><span class="status">${r.status}${r.charged?" • Charged":""}</span></td><td>${r.created}</td></tr>`).join("")}</table>`:"<p>No requests yet.</p>";
}

function renderAdmin(){
if(!currentUser?.admin){document.getElementById("adminRequests").innerHTML="";return}
document.getElementById("adminRecharge").innerHTML=recharge.slice().reverse().map(r=>`
<div class="card"><b>${r.name}</b> • ${r.mobile}<br>Recharge: <strong>₹${r.amount}</strong><br>
Status: <span class="status">${r.status}</span><br>${r.status==="Pending"?`<button class="green" onclick="approveRecharge(${r.id})">✅ Approve & Add</button><button class="gray" onclick="rejectRecharge(${r.id})">Reject</button>`:""}</div>`).join("")||"<p>No recharge requests.</p>";

document.getElementById("adminRequests").innerHTML=requests.slice().reverse().map(r=>`
<div class="card"><b>${r.name}</b> • ${r.mobile}<br><strong>${r.service}</strong> — ₹${r.fee}<br>
<div class="small">${r.created}</div><p>${r.note||"No note"}</p>
<p>Status: <span class="status">${r.status}${r.charged?" • Wallet charged":""}</span></p>
${r.status==="Pending"?`<button class="green" onclick="completeRequest(${r.id})">✅ Complete & Charge</button><button class="gray" onclick="rejectRequest(${r.id})">Reject</button>`:""}</div>`).join("")||"<p>No customer requests.</p>";
}

function approveRecharge(id){
let r=recharge.find(x=>x.id===id);if(!r||r.status!=="Pending")return;
let u=users.find(x=>x.mobile===r.mobile);if(!u)return;
u.wallet=Number(u.wallet||0)+Number(r.amount);
r.status="Approved";r.approved=new Date().toLocaleString();
save();alert("₹"+r.amount+" customer walletಗೆ add ಆಗಿದೆ.");renderAdmin();
}

function rejectRecharge(id){let r=recharge.find(x=>x.id===id);if(r){r.status="Rejected";save();renderAdmin()}}

function completeRequest(id){
let r=requests.find(x=>x.id===id);if(!r||r.status!=="Pending")return;
let u=users.find(x=>x.mobile===r.mobile);if(!u)return;
if(Number(u.wallet||0)<Number(r.fee)){alert("Customer wallet balance ₹"+Number(u.wallet||0)+" ಇದೆ. Fee ₹"+r.fee+" ಇದೆ. ಮೊದಲು recharge approve ಮಾಡಿ.");return}
u.wallet=Number(u.wallet)-Number(r.fee);
r.status="Completed";r.charged=true;r.completed=new Date().toLocaleString();
save();alert("Work completed. ₹"+r.fee+" wallet ನಿಂದ deduct ಆಗಿದೆ.");renderAdmin();
}

function rejectRequest(id){let r=requests.find(x=>x.id===id);if(r){r.status="Rejected";save();renderAdmin()}}

function openRecharge(){document.getElementById("rechargeAmount").value="";document.getElementById("rechargeModal").classList.add("show")}
function closeRecharge(){document.getElementById("rechargeModal").classList.remove("show")}
function requestRecharge(){
let u=users.find(x=>x.mobile===currentUser?.mobile),amount=Number(document.getElementById("rechargeAmount").value);
if(!u){alert("Customer login ಮಾಡಿ.");return}
if(!amount||amount<=0){alert("Valid amount ಹಾಕಿ.");return}
recharge.push({id:Date.now(),mobile:u.mobile,name:u.name,amount,status:"Pending",created:new Date().toLocaleString()});
save();closeRecharge();alert("Recharge request submitted. Admin verify ಮಾಡಿ walletಗೆ amount add ಮಾಡುತ್ತಾರೆ.");
}

showPage(currentUser?"home":"login");
