// Common admin functions
document.addEventListener("DOMContentLoaded", ()=>{
  const path=location.pathname;
  if(path.includes("admin.html"))initStatus();
  if(path.includes("admin-add.html"))initAddDeal();
  if(path.includes("admin-deals.html"))initDealList();
  if(path.includes("admin-settings.html"))initSettings();
});

async function initStatus(){
  const out=document.getElementById("status-output");
  const stats=await whefaxBackend.fetchStats();
  out.innerHTML=`
    <div>Live Deals: ${stats.live}</div>
    <div>Expired Deals: ${stats.expired}</div>
    <div>Total Heat: ${stats.totalHeat}</div>
  `;
}

async function initAddDeal(){
  document.getElementById("save_deal").onclick=async()=>{
    const deal={
      id:"d"+Date.now(),
      title:val("deal_title"),
      description:val("deal_desc"),
      destination:val("deal_dest"),
      price:val("deal_price"),
      dates:val("deal_dates"),
      tags:val("deal_tags").split(",").map(t=>t.trim()).filter(Boolean),
      flight:val("deal_flight"),
      hotel:val("deal_hotel"),
      hot:0, featured:false, expired:false
    };
    const f=await whefaxBackend.githubGetFile("data/deals.json");
    const j=JSON.parse(atob(f.content));
    j.deals.push(deal);
    await whefaxBackend.githubUpdateFile("data/deals.json",JSON.stringify(j,null,2),"add deal");
    alert("✅ Deal added");
  };
}
function val(id){return document.getElementById(id).value.trim();}

async function initDealList(){
  const wrap=document.getElementById("deal_list_admin");
  const f=await whefaxBackend.githubGetFile("data/deals.json");
  const j=JSON.parse(atob(f.content));
  const deals=j.deals||[];
  wrap.innerHTML=deals.map(d=>`
    <div class="card">
      <b>${d.title}</b><br>
      Heat: ${d.hot||0}
      <div>
        <button class="btn yellow" data-act="reset" data-id="${d.id}">Reset</button>
        <button class="btn green" data-act="feature" data-id="${d.id}">${d.featured?"Unfeature":"Feature"}</button>
        <button class="btn red" data-act="expire" data-id="${d.id}">${d.expired?"Unexpire":"Expire"}</button>
      </div>
    </div>`).join("");

  wrap.onclick=async e=>{
    const b=e.target.closest("button"); if(!b)return;
    const id=b.dataset.id,act=b.dataset.act;
    const f=await whefaxBackend.githubGetFile("data/deals.json");
    const j=JSON.parse(atob(f.content));
    const deals=j.deals||[];
    const deal=deals.find(x=>x.id===id);
    if(!deal)return;
    if(act==="reset")deal.hot=0;
    if(act==="feature")deal.featured=!deal.featured;
    if(act==="expire")deal.expired=!deal.expired;
    await whefaxBackend.githubUpdateFile("data/deals.json",JSON.stringify(j,null,2),"update deal");
    initDealList();
  };
}

function initSettings(){
  const repo=document.getElementById("set_repo");
  const token=document.getElementById("set_token");
  const email=document.getElementById("set_email");
  repo.value=localStorage.getItem("github.repo")||"";
  token.value=localStorage.getItem("github.token")||"";
  email.value=localStorage.getItem("admin.email")||"";

  document.getElementById("save_settings").onclick=()=>{
    localStorage.setItem("github.repo",repo.value.trim());
    localStorage.setItem("github.token",token.value.trim());
    localStorage.setItem("admin.email",email.value.trim());
    alert("✅ Settings saved");
  };

  document.getElementById("backup_settings").onclick=()=>{
    const data=`Repo: ${repo.value}\nToken: ${token.value}\nEmail: ${email.value}`;
    const blob=new Blob([data],{type:"text/plain"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="whefax_settings.txt";
    a.click();
  };

  document.getElementById("reset_install_prompt").onclick=()=>{
    localStorage.removeItem("whefax.pwaPrompted");
    alert("✅ PWA install prompt reset");
  };
}
