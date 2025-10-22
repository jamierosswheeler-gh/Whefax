// clock + deals
document.addEventListener("DOMContentLoaded", ()=>{
  setInterval(()=>{
    const d=new Date();
    const opt={weekday:'short',day:'numeric',month:'short'};
    const t=d.toLocaleDateString('en-GB',opt)+" "+
      d.toLocaleTimeString('en-GB',{hour12:false});
    document.querySelectorAll(".ticker-time").forEach(el=>el.textContent=t);
  },1000);
  if(document.getElementById("deal_list")) loadDeals();
  const btn=document.getElementById("installAppLink");
  if(btn) btn.addEventListener("click",triggerInstall);
});

// app install prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault(); deferredPrompt=e;
});
async function triggerInstall(){
  if(deferredPrompt){deferredPrompt.prompt();}
  else alert("Add to Home Screen from your browser menu.");
}

// load deals
async function loadDeals(){
  const out=document.getElementById("deal_list");
  try{
    const f=await whefaxBackend.githubGetFile("data/deals.json");
    const j=JSON.parse(atob(f.content));
    const deals=j.deals.filter(d=>!d.expired);
    out.innerHTML=deals.map(renderDeal).join("");
    out.querySelectorAll(".vote").forEach(v=>{
      v.onclick=()=>vote(v.dataset.id,v.dataset.dir);
    });
  }catch(e){out.innerHTML="⚠️ Unable to load deals";}
}

function renderDeal(d){
  return `<div class="card" id="${d.id}">
    <h3>${d.title}</h3>
    <p>${d.description}</p>
    <p><b>£${d.price}</b> — ${d.dates}</p>
    <div>
      <button class="vote btn green" data-dir="up" data-id="${d.id}">▲</button>
      <button class="vote btn red" data-dir="down" data-id="${d.id}">▼</button>
      <span>${d.hot||0} HOT</span>
    </div>
  </div>`;
}

async function vote(id,dir){
  const f=await whefaxBackend.githubGetFile("data/deals.json");
  const j=JSON.parse(atob(f.content));
  const deal=j.deals.find(x=>x.id===id);
  if(!deal) return;
  deal.hot=(deal.hot||0)+(dir==="up"?3:-3);
  await whefaxBackend.githubUpdateFile("data/deals.json",JSON.stringify(j,null,2),"vote");
  document.querySelector(`#${id} span`).textContent=deal.hot+" HOT";
}
