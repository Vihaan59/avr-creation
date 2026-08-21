const S=[["📄","A4 B/W Print",5],["🖨️","A4 Colour Print",10],["📑","PDF Print",10],["🪪","Aadhaar Print",15],["💳","PAN Card Print",20],["🗳️","Voter ID Print",20],["🚗","RC Print",20],["🚘","Driving Licence Print",20],["📸","Passport Photo",30],["📚","Document Print / Scan",15]];
let wallet=Number(localStorage.getItem("rp_wallet")||0),orders=JSON.parse(localStorage.getItem("rp_orders")||"[]"),sel=null;
function save(){localStorage.setItem("rp_wallet",wallet);localStorage.setItem("rp_orders",JSON.stringify(orders));update()}
function update(){w1.textContent=w2.textContent="₹"+wallet;o1.textContent=orders.length}
function page(id){document.querySelectorAll("main section").forEach(x=>x.classList.add("hidden"));document.getElementById(id).classList.remove("hidden");if(id=="print")render();if(id=="orders")renderOrders();update()}
function render(){let q=(search.value||"").toLowerCase();services.innerHTML=S.filter(x=>x[1].toLowerCase().includes(q)).map((x,i)=>'<div class="service"><div class="icon">'+x[0]+'</div><h3>'+x[1]+'</h3><div class="price">₹'+x[2]+'</div><button class="primary" onclick="openM('+i+')">Apply</button></div>').join("")}
function openM(i){sel=S[i];if(wallet<sel[2])return alert("Wallet balance ಸಾಕಾಗುವುದಿಲ್ಲ.");mt.textContent=sel[0]+" "+sel[1];mi.textContent="Service fee ₹"+sel[2];details.value="";modal.classList.add("show")}
function closeM(){modal.classList.remove("show")}
function submitOrder(){orders.push({service:sel[1],fee:sel[2],details:details.value,status:"Pending",date:new Date().toLocaleString()});save();closeM();alert("Order submitted.");page("orders")}
function renderOrders(){ordersBox.innerHTML=orders.slice().reverse().map(x=>'<div class="service"><b>'+x.service+'</b> — ₹'+x.fee+'<br>'+x.status+'<br><small>'+x.date+'</small></div>').join("")||"No orders yet."}
function recharge(){let a=Number(amount.value);if(!a||a<1)return alert("Valid amount ಹಾಕಿ.");wallet+=a;save();amount.value="";alert("Demo wallet recharge added.")}
update();page("dashboard");