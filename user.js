// Front-end logic: load deals + voting + filters
document.addEventListener("DOMContentLoaded", () => loadDeals());

async function loadDeals(){
  const wrap=document.getElementById("deals_list");
  const fwrap=document.getElementById("filter_wrap");
  try{
    const res=await fetch("data/deals.json?v="+Date.now());
    const json=await res.json();
    let deals=json.deals||[];
    const tags=[...new Set(deals.flatMap(d=>d.tags||[]))].sort();
    fwrap.innerHTML=`<div class='filter-chip active' data-filter='ALL'>ALL DEALS</div>`+
      tags.map(t=>`<div class='filter-chip' data-filter='${t.toUpperCase()}'>${t.toUpperCase()}</div>`).join("");
    fwrap.onclick=e=>{
      const f=e.target.closest(".filter-chip"); if(!f)return;
      document.querySelectorAll(".filter-chip").forEach(c=>c.classList.remove("active"));
      f.classList.add("active");
      const filter=f.dataset.filter;
      renderDeals(filter==="ALL"?deals:deals.filter(d=>(d.tags||[]).map(x=>x.toUpperCase()).includes(filter)));
    };
    renderDeals(deals);
  }catch{wrap.textContent="Error loading deals.";}
}

function renderDeals(deals){
  const wrap=document.getElementById("deals_list");
  deals=deals.filter(d=>!d.expired);
  deals.sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)||(b.hot||0)-(a.hot||0));
  if(!deals.length){wrap.textContent="No deals yet.";return;}
  wrap.innerHTML=deals.map(d=>`
    <div class="deal" data-id="${d.id}">
      <div class="dtitle">${d.title}</div>
      <div>${d.destination||""} — ${d.price||""}</div>
      <div>${d.dates||""}</div>
      <div class="vote-panel">
        <div class="vote-circle up" data-act="up">⬆️</div>
        <div class="vote-score">${d.hot||0}</div>
        <div class="vote-circle down" data-act="down">⬇️</div>
      </div>
    </div>`).join("");
  wrap.onclick=async e=>{
    const circle=e.target.closest(".vote-circle");
    const deal=e.target.closest(".deal");
    if(circle&&deal){
      const id=deal.dataset.id;
      const delta=circle.dataset.act==="up"?3:-3;
      await whefaxBackend.updateHeat(id,delta);
      const score=deal.querySelector(".vote-score");
      score.textContent=parseInt(score.textContent)+delta;
    }
  };
}
