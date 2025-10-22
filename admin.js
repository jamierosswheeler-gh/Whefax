document.addEventListener("DOMContentLoaded",()=>{
  const path=location.pathname;
  if(path.includes("admin.html"))initStatus();
  if(path.includes("admin-add.html"))initAddDeal();
  if(path.includes("admin-deals.html"))initDealList();
  if(path.includes("admin-settings.html"))initSettings();
  if(path.includes("admin-blog.html"))initAddBlog();
});

async function initStatus(){
  const out=document.getElementById("status-output");
  try{
    const stats=await whefaxBackend.fetchStats();
    out.innerHTML=`
      <div>Live Deals: ${stats.live}</div>
      <div>Expired Deals: ${stats.expired}</div>
      <div>Total Heat: ${stats.totalHeat}</div>`;
  }catch(e){out.textContent="Error loading stats";}
}

function val(id){return document.getElementById(id).value.trim();}

async function initAddDeal(){
  document.getElementById("save_deal").onclick=async()=>{
    try{
      const f=await whefaxBackend.githubGetFile("data/deals.json");
      const j=JSON.parse(atob(f.content));
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
        hot:0,featured:false,expired:false
      };
      j.deals.push(deal);
      await whefaxBackend.githubUpdateFile("data/deals.json",JSON.stringify(j,null,2),"add deal");
      alert("✅ Deal added!");
    }catch(e){alert("Error adding deal");}
  };
}

async function initDealList(){
  const wrap=document.getElementById("deal_list_admin");
  try{
    const f=await whefaxBackend.githubGetFile("data/deals.json");
    const j=JSON.parse(atob(f.content));
    wrap.innerHTML=j.deals.map(renderAdminDeal).join("");
    wrap.onclick=handleDealAction;
  }catch(e){wrap.textContent="Error loading deals";}
}

function renderAdminDeal(d){
  return `<div class="card" id="a_${d.id}">
    <b>${d.title}</b> (£${d.price})<br>${d.dates}
    <div>Heat: ${d.hot||0}</div>
    <button class="btn yellow" data-act="edit" data-id="${d.id}">Edit</button>
    <button class="btn blue" data-act="reset" data-id="${d.id}">Reset</button>
    <button class="btn green" data-act="feature" data-id="${d.id}">${d.featured?"Unfeature":"Feature"}</button>
    <button class="btn red" data-act="expire" data-id="${d.id}">${d.expired?"Unexpire":"Expire"}</button>
    <button class="btn" style="background:#444;color:#fff" data-act="delete" data-id="${d.id}">Delete</button>
  </div>`;
}

async function handleDealAction(e){
  const b=e.target.closest("button"); if(!b)return;
  const id=b.dataset.id,act=b.dataset.act;
  const f=await whefaxBackend.githubGetFile("data/deals.json");
  const j=JSON.parse(atob(f.content));
  const d=j.deals.find(x=>x.id===id);
  if(!d)return;
  if(act==="reset")d.hot=0;
  if(act==="feature")d.featured=!d.featured;
  if(act==="expire")d.expired=!d.expired;
  if(act==="delete"){ j.deals=j.deals.filter(x=>x.id!==id); }
  if(act==="edit"){ return editDeal(d,j,f); }
  await whefaxBackend.githubUpdateFile("data/deals.json",JSON.stringify(j,null,2),"update deal");
  initDealList();
}

async function editDeal(d,j,f){
  const title=prompt("Edit title",d.title);
  if(title===null)return;
  d.title=title;
  const desc=prompt("Edit description",d.description);
  if(desc!==null)d.description=desc;
  await whefaxBackend.githubUpdateFile("data/deals.json",JSON.stringify(j,null,2),"edit deal");
  initDealList();
}

async function initAddBlog(){
  document.getElementById("save_blog").onclick=async()=>{
    try{
      const f=await whefaxBackend.githubGetFile("data/blog.json");
      const j=JSON.parse(atob(f.content));
      const post={
        id:"b"+Date.now(),
        title:val("blog_title"),
        content:val("blog_content"),
        author:val("blog_author"),
        date:new Date().toISOString().split("T")[0]
      };
      j.posts.push(post);
      await whefaxBackend.githubUpdateFile("data/blog.json",JSON.stringify(j,null,2),"add blog");
      alert("✅ Blog added!");
    }catch(e){alert("Error adding blog");}
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
    localStorage.setItem("github.repo",repo.value);
    localStorage.setItem("github.token",token.value);
    localStorage.setItem("admin.email",email.value);
    alert("✅ Saved");
      document.getElementById("force_refresh").onclick = async () => {
    if (confirm("Force reload for all users? This will clear cached files and reload.")) {
      try {
        // Update version.txt automatically
        const repo = localStorage.getItem("github.repo");
        const token = localStorage.getItem("github.token");
        if (!repo || !token) { alert("Missing repo or token!"); return; }

        const path = "version.txt";
        const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
          headers: { Authorization: `token ${token}` }
        });
        const data = await res.json();
        const newVersion = (parseFloat((await (await fetch(whefaxBackend.raw(path))).text()) || "0") + 0.1).toFixed(1);
        const body = {
          message: `Force refresh ${newVersion}`,
          content: btoa(newVersion),
          sha: data.sha,
          branch: "main"
        };
        await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
        alert(`✅ Cache-busting update triggered (v${newVersion}).`);
      } catch (err) {
        console.error(err);
        alert("❌ Could not update version file. Check token/repo permissions.");
      }
    }
  };

  };
  document.getElementById("backup_settings").onclick=()=>{
    const data=`Repo:${repo.value}\nToken:${token.value}\nEmail:${email.value}`;
    const blob=new Blob([data],{type:"text/plain"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="whefax_settings.txt";
    a.click();
  };
  document.getElementById("reset_install_prompt").onclick=()=>{
    localStorage.removeItem("whefax.pwaPrompted");
    alert("✅ Reset prompt");
  };
}
