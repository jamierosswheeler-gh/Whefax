// Service worker
if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js?v=8.7'); } catch(e) {} }

/* ============ TAB SYSTEM ============ */
function setTab(tab){
  ['deals','request','blog','about'].forEach(id=>{
    var el=document.getElementById('tab-'+id); if(el) el.style.display=(id===tab?'block':'none');
  });
  try{ localStorage.setItem('whefax.tab',tab); history.replaceState(null,'','#'+tab);}catch(_){}
}
function initTabs(){
  var tab=(location.hash.replace('#','')||'').toLowerCase();
  if(!tab) try{ tab=localStorage.getItem('whefax.tab')||'deals'; }catch(_){ tab='deals'; }
  if(['deals','request','blog','about'].indexOf(tab)<0) tab='deals';
  setTab(tab);
  document.body.addEventListener('click',function(e){
    var a=e.target.closest('[data-gotab]'); if(!a) return;
    e.preventDefault(); setTab(a.getAttribute('data-gotab'));
  });
}

/* ============ DEALS / FILTERS / VOTING ============ */
var __DEALS_CACHE__=[], __FILTER__='ALL';
function buildFilters(){
  var el=document.getElementById('deal_filters'); if(!el)return;
  var set=new Set(); (__DEALS_CACHE__||[]).forEach(d=>(d.tags||[]).forEach(t=>set.add(t)));
  var tags=Array.from(set).sort();
  var html='<span class="filter-chip'+(__FILTER__==='ALL'?' active':'')+'" data-tag="ALL">ALL DEALS</span>';
  html+=tags.map(t=>'<span class="filter-chip'+(__FILTER__===t?' active':'')+'" data-tag="'+t+'">'+(t||'')+'</span>').join('');
  el.innerHTML=html;
  el.onclick=function(e){var c=e.target.closest('.filter-chip'); if(!c)return; __FILTER__=c.dataset.tag; buildFilters(); renderDeals();};
}

function voteStore(){ try{ return JSON.parse(sessionStorage.getItem('whefax.votes')||'{}'); }catch(_){ return {}; } }
function voteSave(obj){ try{ sessionStorage.setItem('whefax.votes', JSON.stringify(obj)); }catch(_){ } }
function canVote(id){ return !voteStore()[id]; }
function registerVote(id, delta){
  var s=voteStore(); if(s[id]) return false; s[id]={delta:delta, ts:Date.now()}; voteSave(s); return true;
}
function deltaFor(id){ var s=voteStore()[id]; return s ? (s.delta||0) : 0; }
function scoreFor(d){ return (Number(d.hot||0) + (d.featured? 100000 : 0) + deltaFor(d.id||'')); } // featured pinned

function renderDeals(){
  var wrap=document.getElementById('deal_list'); if(!wrap)return;
  var list=(__DEALS_CACHE__||[]).slice();
  if(__FILTER__!=='ALL') list=list.filter(d=>(d.tags||[]).includes(__FILTER__));

  // Sort: featured first (huge bonus), then by heat score
  list.sort((a,b)=> scoreFor(b) - scoreFor(a));

  wrap.innerHTML=list.map(d=>{
    var s = Number(d.hot||0) + deltaFor(d.id||'');
    var id=d.id||'';
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
            <!-- Down arrow fills circle -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 10l8 8 8-8H4z"/></svg>
          </div>
          <div class="vote-score">${s}°</div>
          <div class="vote-circle up" data-vote="up" title="Hot deal">
            <!-- Up arrow fills circle -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 14l8-8 8 8H4z"/></svg>
          </div>
        </div>
      </div>`;
  }).join('');

  // Handle clicks (vote or open details)
  wrap.onclick=function(e){
    var circle=e.target.closest('.vote-circle');
    var card=e.target.closest('.deal');
    if(circle && card){
      var id=card.getAttribute('data-id')||'';
      if(!canVote(id)) return; // silently ignore second vote
      var delta=(circle.getAttribute('data-vote')==='up')? 3 : -3;
      registerVote(id, delta);
      renderDeals(); // re-render to update score/sort
      return;
    }
    if(card){
      location.href='details.html?id='+encodeURIComponent(card.getAttribute('data-id')||'');
    }
  };
}

async function loadDeals(){
  const wrap=document.getElementById('deal_list');
  try{
    const r=await fetch('data/deals.json?v='+Date.now(),{cache:'no-store'});
    const j=await r.json();
    (__DEALS_CACHE__=(j.deals||[])).forEach(d=>{
      if(typeof d.hot==='undefined') d.hot=0;
      if(typeof d.featured==='undefined') d.featured=false;
    });
    buildFilters(); renderDeals();
  }catch(e){
    if(wrap) wrap.innerHTML='<p class="notice">Failed to load deals.</p>';
  }
}
setInterval(()=>{ try{ loadDeals(); }catch(e){} },30000);

/* ============ REQUEST: WhatsApp / Email / Voice note ============ */
(function(){
  const ADMIN_EMAIL="jamierosswheeler@gmail.com";
  const WA_NUMBER = localStorage.getItem('whatsapp.number') || '+447824338196';

  function el(id){return document.getElementById(id);}
  var free=el('rq_free'), waBtn=el('rq_btn_wa'), emailToggle=el('rq_btn_email_toggle'),
      emailWrap=el('rq_email_wrap'), emailInput=el('rq_email'), emailSend=el('rq_btn_email_send'),
      status=el('rq_status');

  // WhatsApp text format exactly: "Holiday request:%0A[message]"
  if(waBtn){
    waBtn.addEventListener('click', function(e){
      e.preventDefault();
      var txt=(free&&free.value||'').trim(); if(!txt){alert('Tell us what you want 😄');return;}
      var msg="Holiday request:%0A"+encodeURIComponent(txt).replace(/%20/g,'+');
      location.href="https://wa.me/"+encodeURIComponent(WA_NUMBER)+"?text="+msg;
    });
  }
  if(emailToggle){
    emailToggle.addEventListener('click', function(e){
      e.preventDefault();
      emailWrap.style.display=(emailWrap.style.display==='block'?'none':'block');
    });
  }
  if(emailSend){
    emailSend.addEventListener('click', function(e){
      e.preventDefault();
      var txt=(free&&free.value||'').trim();
      var userEmail=(emailInput&&emailInput.value||'').trim();
      if(!txt){alert('Please tell us what you want 😄');return;}
      if(!userEmail){alert('Please enter your email address');return;}
      var subject=encodeURIComponent('New WHEFAX holiday request');
      var body=encodeURIComponent("Holiday request:\n\n"+txt+"\n\nUser contact email: "+userEmail+"\n\n---\nSent from WHEFAX mobile site");
      window.location.href="mailto:"+ADMIN_EMAIL+"?subject="+subject+"&body="+body;
      if(status){status.textContent="Opening your email app…"; setTimeout(()=>status.textContent='',2500);}
    });
  }

  // ---- Voice note recorder + Share Sheet (best on iPhone/Android) ----
  var recBtn=el('vn_btn'), timerEl=el('vn_timer'), audioEl=el('vn_audio'),
      actionsEl=el('vn_actions'), shareWA=el('vn_share_wa'), shareEM=el('vn_share_email'), dl=el('vn_download');

  let mediaRecorder, chunks=[], recTimer, startMs=0, blob=null;

  function fmt(ms){var s=Math.floor(ms/1000); var m=Math.floor(s/60); s=s%60; return (m+':' + ('0'+s).slice(-2));}

  async function startRec(){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      chunks=[]; mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => { if(e.data && e.data.size>0) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        blob = new Blob(chunks, {type:'audio/webm'});
        const url = URL.createObjectURL(blob);
        audioEl.src = url; audioEl.style.display='block';
        actionsEl.style.display='flex';
        dl.href = url;
      };
      mediaRecorder.start();
      startMs=Date.now();
      recTimer=setInterval(()=>{ timerEl.textContent='Recording '+fmt(Date.now()-startMs); }, 250);
      recBtn.textContent='Stop recording';
    }catch(e){
      timerEl.textContent='Microphone permission denied.';
    }
  }
  function stopRec(){
    if(mediaRecorder && mediaRecorder.state!=='inactive'){ mediaRecorder.stop(); }
    clearInterval(recTimer); timerEl.textContent='Recorded '+fmt(Date.now()-startMs);
    recBtn.textContent='Start recording';
  }

  if(recBtn){
    recBtn.addEventListener('click', function(){
      if(mediaRecorder && mediaRecorder.state==='recording'){ stopRec(); } else { startRec(); }
    });
  }

  async function shareBlob(mimetype){
    if(!blob){ alert('Record a voice note first.'); return; }
    const file = new File([blob], 'whefax-voice-note.webm', {type:mimetype||'audio/webm'});
    if(navigator.share && navigator.canShare && navigator.canShare({ files:[file] })){
      try{
        await navigator.share({
          title: 'WHEFAX voice note',
          text: 'Holiday request voice note',
          files: [file]
        });
      }catch(e){}
    }else{
      // Fallback: just opens WhatsApp chat / email without attachment (user can attach manually)
      alert('Sharing attachments is not supported on this browser. We will open the app; please attach the file manually.');
    }
  }

  if(shareWA){ shareWA.addEventListener('click', async function(e){
    e.preventDefault();
    await shareBlob('audio/webm'); // uses OS share sheet; pick WhatsApp
  });}
  if(shareEM){ shareEM.addEventListener('click', async function(e){
    e.preventDefault();
    await shareBlob('audio/webm'); // pick Mail app from share sheet
  });}
})();

/* ============ BLOG ============ */
async function loadBlog(){
  try{
    const r=await fetch('data/blog.json?v='+Date.now(),{cache:'no-store'});
    const j=await r.json();
    const wrap=document.getElementById('blog_list'); if(!wrap) return;
    if(!j.posts||!j.posts.length){ wrap.innerHTML='<p>No posts yet.</p>'; return; }
    wrap.innerHTML=j.posts.map(p=>(
      '<div class="post">'+
      '<div class="ptitle">'+(p.title||'Untitled')+'</div>'+
      (p.excerpt?'<div class="pexcerpt">'+p.excerpt+'</div>':'')+
      (p.url?'<div class="purl"><a target="_blank" rel="noopener nofollow" href="'+p.url+'">Read more</a></div>':'')+
      '</div>'
    )).join('');
  }catch(e){
    const wrap=document.getElementById('blog_list'); if(wrap) wrap.innerHTML='<p class="notice">Failed to load blog.</p>';
  }
}

/* ============ INIT ============ */
document.addEventListener('DOMContentLoaded', function(){
  initTabs();
  loadDeals();
  loadBlog();
});
