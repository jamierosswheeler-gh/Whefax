// Register service worker
if ('serviceWorker' in navigator) {
  try { navigator.serviceWorker.register('sw.js?v=8.5'); } catch(e) {}
}

// --- Voting (client-side only) ---
function getVotes(){ try{ return JSON.parse(localStorage.getItem('whefax.votes')||'{}'); }catch(_){ return {}; } }
function setVotes(v){ try{ localStorage.setItem('whefax.votes', JSON.stringify(v)); }catch(_){ } }
function voteDeltaFor(id){ var v=getVotes()[id]||{up:0,down:0}; return (v.up|0)-(v.down|0); }
function addVote(id,type){ var a=getVotes(); a[id]=a[id]||{up:0,down:0}; if(type==='hot') a[id].up++; else a[id].down++; setVotes(a); }

var __DEALS_CACHE__=[]; var __FILTER__='ALL';

function buildFilters(){
  var el=document.getElementById('deal_filters'); if(!el)return;
  var set=new Set(); (__DEALS_CACHE__||[]).forEach(d=>(d.tags||[]).forEach(t=>set.add(t)));
  var tags=Array.from(set).sort();
  var html='<span class="filter-chip all'+(__FILTER__==='ALL'?' active':'')+'" data-tag="ALL">ALL DEALS</span>';
  html+=tags.map(t=>'<span class="filter-chip purple'+(__FILTER__===t?' active':'')+'" data-tag="'+t+'">'+t+'</span>').join('');
  el.innerHTML=html;
  el.onclick=function(e){var c=e.target.closest('.filter-chip');if(!c)return;__FILTER__=c.dataset.tag;buildFilters();renderDeals();};
}

function dealScore(d){return Number(d.hot||0)+voteDeltaFor(d.id||'');}

function renderDeals(){
  var wrap=document.getElementById('deal_list'); if(!wrap)return;
  var list=(__DEALS_CACHE__||[]).slice();
  if(__FILTER__!=='ALL') list=list.filter(d=>(d.tags||[]).includes(__FILTER__));
  list.sort((a,b)=>dealScore(b)-dealScore(a));
  wrap.innerHTML=list.map(d=>{
    var s=dealScore(d);
    return `<div class="deal" data-id="${d.id||''}">
      <div class="vote-panel">
        <span class="vote-btn vote-hot" data-vote="hot">🔥</span>
        <span class="vote-btn vote-cold" data-vote="cold">❄️</span>
        <span class="vote-score">${s>=0?'+':''}${s}</span>
      </div>
      <div class="dtitle">${d.title||'Untitled'}</div>
      ${d.price?`<div>${d.price}</div>`:''}
      ${d.destination?`<div>Destination: ${d.destination}</div>`:''}
      ${d.dates?`<div>Dates: ${d.dates}</div>`:''}
    </div>`;
  }).join('');
  wrap.onclick=function(e){
    var v=e.target.closest('.vote-btn');
    if(v){e.stopPropagation();var c=e.target.closest('.deal');if(!c)return;addVote(c.dataset.id,v.dataset.vote==='hot'?'hot':'cold');renderDeals();return;}
    var c=e.target.closest('.deal');if(c)location.href='details.html?id='+encodeURIComponent(c.dataset.id||'');
  };
}

async function loadDeals(){
  try{
    const r=await fetch('data/deals.json?v='+Date.now(),{cache:'no-store'});
    const j=await r.json(); (__DEALS_CACHE__=(j.deals||[])).forEach(d=>{if(typeof d.hot==='undefined')d.hot=0;});
    buildFilters(); renderDeals();
  }catch(e){document.getElementById('deal_list').innerHTML='<p class="notice">Failed to load deals.</p>';}
}

// Refresh every 30s
setInterval(()=>{try{loadDeals();}catch(e){}},30000);
document.addEventListener('DOMContentLoaded',loadDeals);

// --- Request Tab ---
(function(){
  const ADMIN_EMAIL="jamierosswheeler@gmail.com";
  const WA_NUMBER=localStorage.getItem('whatsapp.number')||'+447824338196';
  var free=document.getElementById('rq_free'),
      waBtn=document.getElementById('rq_btn_wa'),
      emailToggle=document.getElementById('rq_btn_email_toggle'),
      emailWrap=document.getElementById('rq_email_wrap'),
      emailInput=document.getElementById('rq_email'),
      emailSend=document.getElementById('rq_btn_email_send'),
      status=document.getElementById('rq_status');

  if(waBtn)waBtn.addEventListener('click',e=>{
    e.preventDefault();var txt=(free&&free.value||'').trim();
    if(!txt){alert('Tell us what you want 😄');return;}
    var msg=encodeURIComponent("Holiday request:%0A"+txt);
    location.href="https://wa.me/"+encodeURIComponent(WA_NUMBER)+"?text="+msg;
  });

  if(emailToggle)emailToggle.addEventListener('click',e=>{
    e.preventDefault();
    emailWrap.style.display=emailWrap.style.display==='block'?'none':'block';
  });

  if(emailSend)emailSend.addEventListener('click',e=>{
    e.preventDefault();
    var txt=(free&&free.value||'').trim();
    var userEmail=(emailInput&&emailInput.value||'').trim();
    if(!txt){alert('Please tell us what you want 😄');return;}
    if(!userEmail){alert('Please enter your email address');return;}
    var subject=encodeURIComponent('New WHEFAX holiday request');
    var body=encodeURIComponent("Holiday request:\n\n"+txt+"\n\nUser contact email: "+userEmail+"\n\n---\nSent from WHEFAX mobile site");
    window.location.href="mailto:"+ADMIN_EMAIL+"?subject="+subject+"&body="+body;
    if(status){status.textContent="Opening your email app…";setTimeout(()=>status.textContent="",2500);}
  });
})();
