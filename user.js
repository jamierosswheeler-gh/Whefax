// Service worker (cache version bump if needed)
if ('serviceWorker' in navigator) {
  try { navigator.serviceWorker.register('sw.js?v=8.6'); } catch(e) {}
}

/* ===================== TAB SYSTEM ===================== */
function setTab(tab){
  ['deals','request','blog','about'].forEach(id=>{
    var el = document.getElementById('tab-'+id);
    if(el) el.style.display = (id===tab?'block':'none');
  });
  try{
    localStorage.setItem('whefax.tab', tab);
    history.replaceState(null, '', '#'+tab);
  }catch(_){}
}
function initTabs(){
  // default tab from hash or memory
  var tab = (location.hash.replace('#','')||'').toLowerCase();
  if(!tab) try{ tab = localStorage.getItem('whefax.tab') || 'deals'; }catch(_){ tab='deals'; }
  if(['deals','request','blog','about'].indexOf(tab)<0) tab='deals';
  setTab(tab);

  // click handlers (top + bottom nav)
  document.body.addEventListener('click', function(e){
    var a = e.target.closest('[data-gotab]');
    if(!a) return;
    e.preventDefault();
    var t = a.getAttribute('data-gotab');
    if(!t) return;
    setTab(t);
  });
}

/* ===================== FILTERS & DEALS ===================== */
var __DEALS_CACHE__ = [];
var __FILTER__ = 'ALL';

function buildFilters(){
  var el = document.getElementById('deal_filters'); if(!el) return;
  var set = new Set();
  (__DEALS_CACHE__||[]).forEach(d => (d.tags||[]).forEach(t => set.add(t)));
  var tags = Array.from(set).sort();
  var html = '<span class="filter-chip'+(__FILTER__==='ALL'?' active':'')+'" data-tag="ALL">ALL DEALS</span>';
  html += tags.map(t => '<span class="filter-chip'+(__FILTER__===t?' active':'')+'" data-tag="'+t+'">'+t+'</span>').join('');
  el.innerHTML = html;
  el.onclick = function(e){
    var chip = e.target.closest('.filter-chip'); if(!chip) return;
    __FILTER__ = chip.getAttribute('data-tag');
    buildFilters();
    renderDeals();
  };
}

/* ===================== VOTING (one per session) ===================== */
function voteStore(){ try{ return JSON.parse(sessionStorage.getItem('whefax.votes')||'{}'); }catch(_){ return {}; } }
function voteSave(obj){ try{ sessionStorage.setItem('whefax.votes', JSON.stringify(obj)); }catch(_){ } }
function canVote(id){ return !voteStore()[id]; }
function registerVote(id, delta){
  var s = voteStore(); if(s[id]) return false; s[id] = { delta: delta, ts: Date.now() }; voteSave(s); return true;
}
function deltaFor(id){ var s = voteStore()[id]; return s ? (s.delta||0) : 0; }
function scoreFor(d){ return (Number(d.hot||0) + deltaFor(d.id||'')); }

function renderDeals(){
  var wrap = document.getElementById('deal_list'); if(!wrap) return;
  var list = (__DEALS_CACHE__||[]).slice();
  if(__FILTER__!=='ALL') list = list.filter(d => (d.tags||[]).includes(__FILTER__));
  list.sort((a,b)=> scoreFor(b) - scoreFor(a));
  wrap.innerHTML = list.map(d=>{
    var s = scoreFor(d);
    var id = d.id || '';
    return `
      <div class="deal" data-id="${id}">
        <div>
          <div class="dtitle">${d.title||'Untitled'}</div>
          ${d.price?`<div>${d.price}</div>`:''}
          ${d.destination?`<div>Destination: ${d.destination}</div>`:''}
          ${d.dates?`<div>Dates: ${d.dates}</div>`:''}
        </div>
        <div class="vote-panel" data-id="${id}">
          <div class="vote-circle down" data-vote="down" title="Cool deal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>
          </div>
          <div class="vote-score">${s}°</div>
          <div class="vote-circle up" data-vote="up" title="Hot deal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5H7z"/></svg>
          </div>
        </div>
      </div>`;
  }).join('');

  // clicks (vote or open)
  wrap.onclick = function(e){
    var circle = e.target.closest('.vote-circle');
    var card = e.target.closest('.deal');
    if(circle && card){
      var id = card.getAttribute('data-id')||'';
      if(!canVote(id)){ alert('You’ve already voted this visit!'); return; }
      var delta = (circle.getAttribute('data-vote')==='up') ? 3 : -3;
      registerVote(id, delta);
      renderDeals(); // resort + refresh score
      return;
    }
    if(card){
      location.href = 'details.html?id=' + encodeURIComponent(card.getAttribute('data-id')||'');
    }
  };
}

async function loadDeals(){
  const wrap = document.getElementById('deal_list');
  try{
    const r = await fetch('data/deals.json?v='+Date.now(), {cache:'no-store'});
    const j = await r.json();
    (__DEALS_CACHE__=(j.deals||[])).forEach(d=>{ if(typeof d.hot==='undefined') d.hot=0; });
    buildFilters(); renderDeals();
  }catch(e){
    if(wrap) wrap.innerHTML = '<p class="notice">Failed to load deals.</p>';
  }
}

// Auto-refresh every 30s
setInterval(()=>{ try{ loadDeals(); }catch(e){} }, 30000);

/* ===================== REQUEST (WhatsApp / Email) ===================== */
(function(){
  const ADMIN_EMAIL = "jamierosswheeler@gmail.com";
  const WA_NUMBER   = localStorage.getItem('whatsapp.number') || '+447824338196';

  function el(id){return document.getElementById(id);}
  var free=el('rq_free'), waBtn=el('rq_btn_wa'), emailToggle=el('rq_btn_email_toggle'),
      emailWrap=el('rq_email_wrap'), emailInput=el('rq_email'), emailSend=el('rq_btn_email_send'),
      status=el('rq_status');

  if(waBtn){
    waBtn.addEventListener('click', function(e){
      e.preventDefault();
      var txt=(free&&free.value||'').trim(); if(!txt){alert('Tell us what you want 😄');return;}
      var msg=encodeURIComponent("Holiday request:%0A"+txt);
      location.href = "https://wa.me/"+encodeURIComponent(WA_NUMBER)+"?text="+msg;
    });
  }
  if(emailToggle){
    emailToggle.addEventListener('click', function(e){
      e.preventDefault();
      emailWrap.style.display = (emailWrap.style.display==='block'?'none':'block');
    });
  }
  if(emailSend){
    emailSend.addEventListener('click', function(e){
      e.preventDefault();
      var txt=(free&&free.value||'').trim(); var userEmail=(emailInput&&emailInput.value||'').trim();
      if(!txt){alert('Please tell us what you want 😄');return;}
      if(!userEmail){alert('Please enter your email address');return;}
      var subject=encodeURIComponent('New WHEFAX holiday request');
      var body=encodeURIComponent("Holiday request:\n\n"+txt+"\n\nUser contact email: "+userEmail+"\n\n---\nSent from WHEFAX mobile site");
      window.location.href="mailto:"+ADMIN_EMAIL+"?subject="+subject+"&body="+body;
      if(status){status.textContent="Opening your email app…"; setTimeout(()=>status.textContent='',2500);}
    });
  }
})();

/* ===================== BLOG ===================== */
async function loadBlog(){
  try{
    const r = await fetch('data/blog.json?v='+Date.now(), {cache:'no-store'});
    const j = await r.json();
    const wrap = document.getElementById('blog_list'); if(!wrap) return;
    if(!j.posts || !j.posts.length){ wrap.innerHTML = '<p>No posts yet.</p>'; return; }
    wrap.innerHTML = j.posts.map(p => (
      '<div class="post">'+
        '<div class="ptitle">'+(p.title||'Untitled')+'</div>'+
        (p.excerpt ? '<div class="pexcerpt">'+p.excerpt+'</div>' : '')+
        (p.url ? '<div class="purl"><a target="_blank" rel="noopener nofollow" href="'+p.url+'">Read more</a></div>' : '')+
      '</div>'
    )).join('');
  }catch(e){
    const wrap = document.getElementById('blog_list'); if(wrap) wrap.innerHTML = '<p class="notice">Failed to load blog.</p>';
  }
}

/* ===================== INIT ===================== */
document.addEventListener('DOMContentLoaded', function(){
  initTabs();
  loadDeals();
  loadBlog();
});
