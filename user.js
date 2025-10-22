// === WHEFAX v10.2 USER ===
document.addEventListener("DOMContentLoaded",()=>{

  // Clock
  const clock=document.querySelector(".ticker-time");
  if(clock){
    setInterval(()=>{
      const d=new Date();
      const day=d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
      const t=d.toLocaleTimeString("en-GB",{hour12:false});
      clock.textContent=`${day} ${t}`;
    },1000);
  }

  // Auto-refresh check
  setInterval(async()=>{
    try{
      const r=await fetch("version.txt?nocache="+Date.now());
      const v=await r.text();
      if(v.trim()!==localStorage.getItem("whefax.version")){
        localStorage.setItem("whefax.version",v.trim());
        location.reload(true);
      }
    }catch{}
  },30000);

  // Install prompt
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt",(e)=>{
    e.preventDefault();
    deferredPrompt=e;
  });
  const installLink=document.getElementById("installAppLink");
  if(installLink){
    installLink.addEventListener("click",async()=>{
      if(deferredPrompt){
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(()=>{deferredPrompt=null;});
      }else{
        alert("To install, tap Share → Add to Home Screen.");
      }
    });
  }
});
