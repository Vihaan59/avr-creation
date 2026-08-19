async function adminLogin(){
  let email=document.getElementById("adminEmail").value.trim().toLowerCase();
  let pass=document.getElementById("adminPassword").value;

  const ADMIN_EMAIL="raghunaikskp9686@gmail.com";

  if(!email || !pass){
    alert("Admin email ಮತ್ತು password ಹಾಕಿ.");
    return;
  }

  if(email !== ADMIN_EMAIL){
    alert("ಈ email ಗೆ Admin access ಇಲ್ಲ.");
    return;
  }

  try{
    const credential =
      await firebaseAuth.signInWithEmailAndPassword(email,pass);

    currentUser={
      email:credential.user.email,
      name:"Admin",
      admin:true
    };

    save();
    document.getElementById("adminPassword").value="";
    showPage("admin");

    alert("Admin login successful.");
  }catch(error){
    console.error(error);
    alert("Firebase Error: "+error.code+"\n"+error.message);
  }
}
