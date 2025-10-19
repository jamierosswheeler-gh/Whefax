
async function loadAll(){try{const r=await fetch('data/deals.json',{cache:'no-store'});return await r.json();}catch(e){return {deals:[]};}}
const wrap=document.getElementById('wrap'), q=document.getElementById('q'), tagWrap=document.getElementById('tagFilter'); let deals=[], activeTags=new Set();
function renderList(filter=''){ if(!wrap) return; wrap.innerHTML=''; const f=(filter||'').toLowerCase(); let list=(deals||[]).filter(d=>JSON.stringify(d).toLowerCase().includes(f));
  if(activeTags.size){list=list.filter(d=>(d.tags||[]).some(t=>activeTags.has(t)));}
  list.forEach(d=>{const tpl=document.getElementById('dealCard').content.cloneNode(true); tpl.querySelector('.title').textContent=d.title||'Deal';
    tpl.querySelector('.meta').textContent=[d.origin,'→',d.destination,d.dates].filter(Boolean).join('  '); tpl.querySelector('.price').textContent=d.price||'';
    const img=tpl.querySelector('.img'); if(d.image){img.src=d.image;} else {img.remove();} const card=tpl.children[0];
    card.addEventListener('click',()=>{const url=new URL('details.html',location.href); url.searchParams.set('id', d.id||''+Math.random()); sessionStorage.setItem('whefax.detail', JSON.stringify(d)); location.href=url.toString();});
    wrap.appendChild(tpl);});}
function buildTags(){ if(!tagWrap) return; tagWrap.innerHTML=''; const set=new Set(); (deals||[]).forEach(d=>(d.tags||[]).forEach(t=>set.add(t)));
  Array.from(set).sort().forEach(t=>{const s=document.createElement('span'); s.textContent=t; s.className='tag'; s.tabIndex=0; s.role='button';
    const toggle=()=>{ if(activeTags.has(t)) activeTags.delete(t); else activeTags.add(t); s.classList.toggle('selected'); renderList(q?q.value:'');};
    s.addEventListener('click',toggle); s.addEventListener('touchstart',(e)=>{e.preventDefault();toggle();},{passive:false}); s.addEventListener('keydown',(e)=>{ if(e.key===' '||e.key==='Enter'){e.preventDefault();toggle();}});
    tagWrap.appendChild(s);});}
document.addEventListener('DOMContentLoaded',()=>{loadAll().then(j=>{deals=j.deals||[]; buildTags(); renderList();}); if(q){ q.addEventListener('input',e=>renderList(e.target.value)); }});
// Tabs
document.addEventListener('DOMContentLoaded', function(){ const keys=[...document.querySelectorAll('.tabkey')];
  const panes={deals:document.getElementById('tab-deals'),finder:document.getElementById('tab-finder'),request:document.getElementById('tab-request'),about:document.getElementById('tab-about')};
  function show(name){ Object.values(panes).forEach(p=>p&&p.classList.remove('active')); keys.forEach(k=>{k.classList.remove('active'); k.setAttribute('aria-selected','false');});
    if(panes[name]) panes[name].classList.add('active'); const key=keys.find(k=>k.dataset.tab===name); if(key){key.classList.add('active'); key.setAttribute('aria-selected','true');} localStorage.setItem('whefax.tab', name); }
  const bind=(k)=>{ const go=()=>show(k.dataset.tab); k.addEventListener('click', go); k.addEventListener('touchstart',(e)=>{e.preventDefault();go();},{passive:false}); k.addEventListener('keydown',(e)=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}}); };
  keys.forEach(bind); show(localStorage.getItem('whefax.tab')||'deals');});
// Finder -> WhatsApp
(function(){ const btn=document.getElementById('finderSend'); if(!btn) return; const v=id=>{const el=document.getElementById(id); return el?el.value.trim():'';};
  btn.addEventListener('click', ()=>{ const phone=(localStorage.getItem('whefax.whats')||'').replace(/[^\d]/g,''); if(!phone) return alert('WhatsApp number not set. Admin → Settings.');
    const parts=['New holiday request:', v('f_contact')&&('CONTACT: '+v('f_contact')), v('f_where')&&('WHERE: '+v('f_where')), v('f_airport')&&('DEPARTURE AIRPORT: '+v('f_airport')), v('f_length')&&('HOW LONG: '+v('f_length')), v('f_when')&&('WHEN: '+v('f_when')), v('f_who')&&('WHO: '+v('f_who')), v('f_budget')&&('BUDGET: '+v('f_budget')), v('f_board')&&('BOARD BASIS: '+v('f_board')), v('f_travel')&&('MAX TRAVEL TIME: '+v('f_travel')), v('f_other')&&('OTHER INFO: '+v('f_other'))].filter(Boolean);
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(parts.join('\\n')),'_blank'); }); })();
// Request -> WhatsApp
(function(){ const btn=document.getElementById('reqSend'); if(!btn) return;
  btn.addEventListener('click', ()=>{ const phone=(localStorage.getItem('whefax.whats')||'').replace(/[^\d]/g,''); if(!phone) return alert('WhatsApp number not set. Admin → Settings.');
    const msg=(document.getElementById('r_msg')?.value||'').trim(); const contact=(document.getElementById('r_contact')?.value||'').trim();
    const parts=['General request:', msg||'(no message)', contact?('CONTACT: '+contact):'']; window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(parts.filter(Boolean).join('\\n')),'_blank');}); })();
// About
(function(){ const s=localStorage.getItem('whefax.site')||''; const w=localStorage.getItem('whefax.whats')||''; const a=document.getElementById('about_site'); const b=document.getElementById('about_whats'); if(a) a.textContent=s||'(set in Admin → Settings)'; if(b) b.textContent=w||'(set in Admin → Settings)'; })();
