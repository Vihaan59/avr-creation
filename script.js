const SERVICES=[
{id:1,icon:"📄",name:"Ration Card PDF - OTP",price:20,info:"Ration card related assistance"},
{id:2,icon:"📄",name:"Ration Card PDF - Without OTP",price:25,info:"Ration card PDF assistance"},
{id:3,icon:"🌾",name:"Gruha Lakshmi Apply",price:30,info:"Government service assistance"},
{id:4,icon:"🪪",name:"Caste Certificate Application",price:30,info:"Certificate application assistance"},
{id:5,icon:"💰",name:"Income Certificate Application",price:30,info:"Certificate application assistance"},
{id:6,icon:"🪪",name:"Aadhaar / e-KYC Assistance",price:30,info:"Aadhaar/e-KYC assistance"},
{id:7,icon:"🏦",name:"Banking Form Assistance",price:30,info:"Online banking form assistance"},
{id:8,icon:"🖨️",name:"Print / Download Service",price:10,info:"Print/download assistance"},
{id:9,icon:"🔎",name:"QR Scanner Service",price:10,info:"QR assistance"},
{id:10,icon:"📑",name:"Other Online Service",price:40,info:"Other cyber centre service"}
];

const ADMIN_MOBILE="8310049524", ADMIN_PASSWORD="1234";
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
 if(!currentUser&&!["login","register"].includes(id))id="login";
 document.querySelectorAll("main section").forEach(s=>s.classList.add("hidden"));
 document.getElementById(id).classList.remove("hidden");
 if(id==="services")renderServices();
 if(id==="history")renderHistory();
 if(id==="admin")renderAdmin();
 updateUI();
}
function updateUI(){
 const logged=!!currentUser;
 document.getElementById("adminNav").classList.toggle("hidden",!(logged&&currentUser.admin));
 document.getElementById("userBox").textContent=logged?(currentUser.admin?"⚙️ Admin":"👤 "+currentUser.name):"Login ಮಾಡಿ";
 const u=logged&&!currentUser.admin?users.find(x=>x.mobile===currentUser.mobile):null;
 const bal=u?Number(u.wallet||0):0;
 document.getElementById("homeWallet").textContent="₹"+bal;
 document.getElementById("walletBalance").textContent="₹"+bal;
 document.getElementById("serviceCount").textContent=SERVICES.length;
 const mine=u?requests.filter(r=>r.mobile===u.mobile):[];
 document.getElementById("requestCount").textContent=mine.length;
 document.getElementById("completeCount").textContent=mine.filter(r=>r.status==="Completed").length;
 document.getElementById("welcomeText").textContent=u?("Hi "+u.name+"! Services use ಮಾಡಬಹುದು."):currentUser?.admin?"Admin mode":"Login ಮಾಡಿ.";
}
function registerCustomer(){
 const name=document.getElementById("regName").value.trim(),mobile=document.getElementById("regMobile").value.trim(),pass=document.getElementById("regPass").value;
 if(!name||!/^\d{10}$/.test(mobile)||!pass)return alert("Name, 10 digit mobile ಮತ್ತು password ತುಂಬಿ.");
 if(users.some(u=>u.mobile===mobile))return alert("ಈ mobile already registered.");
 users.push({name,mobile,password:pass,wallet:0,active:true});save();alert("Registration successful.");setLoginType("customer");showPage("login");
}
function customerLogin(){
 const mobile=document.getElementById("customerMobile").value.trim(),pass=document.getElementById("customerPassword").value,u=users.find(x=>x.mobile===mobile&&x.password===pass);
 if(!u)return alert("Mobile ಅಥವಾ password ತಪ್ಪಾಗಿದೆ.");
 if(u.active===false)return alert("Customer account deactivated. Admin contact ಮಾಡಿ.");
 currentUser={mobile:u.mobile,name:u.name,admin:false};save();showPage("home");
}
function adminLogin(){
 const mobile=document.getElementById("adminMobile").value.trim(),pass=document.getElementById("adminPassword").value;
 if(mobile===ADMIN_MOBILE&&pass===ADMIN_PASSWORD){currentUser={mobile,name:"Admin",admin:true};save();setLoginType("admin");showPage("admin");return}
 alert("Admin mobile ಅಥವಾ password ತಪ್ಪಾಗಿದೆ.");
}
function logout(){currentUser=null;localStorage.removeItem("rcc_current");showPage("login");}
function renderServices(){
 const q=(document.getElementById("serviceSearch").value||"").toLowerCase();
 document.getElementById("serviceGrid").innerHTML=SERVICES.filter(s=>(s.name+" "+s.info).toLowerCase().includes(q)).map(s=>`<div class="card service"><div><div class="icon">${s.icon}</div><h3>${s.name}</h3><div class="small">${s.info}</div><p class="price">Service Fee: ₹${s.price}</p></div><button class="primary" onclick="openService(${s.id})">Open / Apply</button></div>`).join("");
}
function openService(id){
 if(!currentUser||currentUser.admin)return alert("Customer login ಬೇಕು.");
 const u=users.find(x=>x.mobile===currentUser.mobile),s=SERVICES.find(x=>x.id===id);
 if(!u||u.active===false)return alert("Customer account inactive.");
 if(Number(u.wallet||0)<s.price)return alert("Wallet balance ಸಾಕಾಗುವುದಿಲ್ಲ. Recharge ಮಾಡಿ.");
 currentService=s;document.getElementById("modalTitle").textContent=s.icon+" "+s.name;
 document.getElementById("modalInfo").innerHTML=s.info+"<br><b>Fee: ₹"+s.price+"</b>";
 document.getElementById("serviceNote").value="";document.getElementById("serviceModal").classList.add("show");
}
function closeModal(){document.getElementById("serviceModal").classList.remove("show")}
function submitRequest(){
 const u=users.find(x=>x.mobile===currentUser?.mobile);if(!u||!currentService)return;
 requests.push({id:Date.now(),mobile:u.mobile,name:u.name,serviceId:currentService.id,service:currentService.name,fee:currentService.price,note:document.getElementById("serviceNote").value.trim(),status:"Pending",charged:false,created:new Date().toLocaleString()});
 save();closeModal();alert("Request submitted.");showPage("history");
}
function renderHistory(){
 const u=users.find(x=>x.mobile===currentUser?.mobile),mine=u?requests.filter(r=>r.mobile===u.mobile).reverse():[];
 document.getElementById("historyBox").innerHTML=mine.length?mine.map(r=>`<div class="item"><b>${r.service}</b> — ₹${r.fee}<br>Status: <span class="status">${r.status}${r.charged?" • Charged":""}</span><br><span class="small">${r.created}</span></div>`).join(""):"No requests yet.";
}
function renderAdmin(){
 if(!currentUser?.admin)return;
 document.getElementById("adminRecharge").innerHTML=recharge.slice().reverse().map(r=>`<div class="item"><b>${r.name}</b> • ${r.mobile}<br>Recharge ₹${r.amount}<br>Status: ${r.status}${r.status==="Pending"?`<br><button class="green" onclick="approveRecharge(${r.id})">Approve & Add</button><button class="gray" onclick="rejectRecharge(${r.id})">Reject</button>`:""}</div>`).join("")||"No recharge requests.";
 document.getElementById("adminRequests").innerHTML=requests.slice().reverse().map(r=>`<div class="item"><b>${r.name}</b> • ${r.mobile}<br>${r.service} — ₹${r.fee}<br>${r.note||"No note"}<br>Status: ${r.status}${r.status==="Pending"?`<br><button class="green" onclick="completeRequest(${r.id})">Complete & Charge</button><button class="gray" onclick="rejectRequest(${r.id})">Reject</button>`:""}</div>`).join("")||"No service requests.";
 document.getElementById("adminCustomers").innerHTML=users.map(u=>`<div class="item"><b>${u.name}</b> • ${u.mobile}<br>Wallet: ₹${Number(u.wallet||0)}<br>Status: <span class="${u.active===false?"disabledStatus":"activeStatus"}">${u.active===false?"Deactivated":"Active"}</span><br><button class="orange" onclick="refundCustomer('${u.mobile}')">Return Wallet Balance</button><button class="${u.active===false?"green":"danger"}" onclick="toggleCustomer('${u.mobile}')">${u.active===false?"Activate":"Deactivate"}</button></div>`).join("")||"No customers.";
}
function approveRecharge(id){const r=recharge.find(x=>x.id===id);if(!r||r.status!=="Pending")return;const u=users.find(x=>x.mobile===r.mobile);if(!u)return;u.wallet=Number(u.wallet||0)+Number(r.amount);r.status="Approved";save();renderAdmin();}
function rejectRecharge(id){const r=recharge.find(x=>x.id===id);if(r){r.status="Rejected";save();renderAdmin();}}
function completeRequest(id){const r=requests.find(x=>x.id===id);if(!r||r.status!=="Pending")return;const u=users.find(x=>x.mobile===r.mobile);if(!u||Number(u.wallet||0)<r.fee)return alert("Customer wallet balance insufficient.");u.wallet=Number(u.wallet)-Number(r.fee);r.status="Completed";r.charged=true;save();renderAdmin();}
function rejectRequest(id){const r=requests.find(x=>x.id===id);if(r){r.status="Rejected";save();renderAdmin();}}
function refundCustomer(mobile){
 const u=users.find(x=>x.mobile===mobile);if(!u)return;
 const amount=Number(u.wallet||0);if(amount<=0)return alert("Wallet balance ₹0.");
 if(!confirm("₹"+amount+" customer ge return/reset madbekaa?"))return;
 u.wallet=0;u.lastRefund={amount,date:new Date().toLocaleString()};save();renderAdmin();alert("₹"+amount+" balance return/reset recorded.");
}
function toggleCustomer(mobile){
 const u=users.find(x=>x.mobile===mobile);if(!u)return;
 u.active=u.active===false;save();renderAdmin();
}
function openRecharge(){document.getElementById("rechargeAmount").value="";document.getElementById("rechargeModal").classList.add("show")}
function closeRecharge(){document.getElementById("rechargeModal").classList.remove("show")}
function requestRecharge(){
 const u=users.find(x=>x.mobile===currentUser?.mobile),amount=Number(document.getElementById("rechargeAmount").value);
 if(!u)return alert("Customer login ಮಾಡಿ.");if(!amount||amount<=0)return alert("Valid amount ಹಾಕಿ.");
 recharge.push({id:Date.now(),mobile:u.mobile,name:u.name,amount,status:"Pending",created:new Date().toLocaleString()});save();closeRecharge();alert("Recharge request sent.");showPage("wallet");
}

/* IMPORTANT: do NOT clear currentUser on refresh. */
setLoginType(currentUser?.admin?"admin":"customer");
showPage(currentUser?"home":"login");
