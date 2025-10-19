

// --- Personal Holiday Finder -> WhatsApp ---
(function setupFinder(){
  const btn = document.getElementById('finderSend');
  if(!btn) return;
  function val(id){ const el=document.getElementById(id); return el?el.value.trim():''; }
  btn.addEventListener('click', ()=>{
    const phone = (localStorage.getItem('whefax.whats')||'').replace(/[^\d]/g,'');
    if(!phone){ alert('WhatsApp number not set. Ask admin to set it in Admin → Settings.'); return; }
    const parts = [
      'New holiday request:',
      'WHERE: ' + val('f_where'),
      'HOW LONG: ' + val('f_length'),
      'WHEN: ' + val('f_when'),
      'WHO: ' + val('f_who'),
      'BUDGET: ' + val('f_budget'),
      'OTHER INFO: ' + val('f_other')
    ];
    const msg = parts.join('\\n');
    const wa = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg);
    window.open(wa, '_blank');
  });
})();



// --- Teletext Tabs ---
document.addEventListener('DOMContentLoaded', function(){
  const keys = Array.from(document.querySelectorAll('.tabkey'));
  const panes = {
    deals: document.getElementById('tab-deals'),
    finder: document.getElementById('tab-finder'),
    request: document.getElementById('tab-request'),
    about: document.getElementById('tab-about'),
  };
  function show(name){
    Object.values(panes).forEach(p=>p&&p.classList.remove('active'));
    keys.forEach(k=>{k.classList.remove('active'); k.setAttribute('aria-selected','false');});
    if(panes[name]) panes[name].classList.add('active');
    const key = keys.find(k=>k.dataset.tab===name);
    if(key){ key.classList.add('active'); key.setAttribute('aria-selected','true'); }
    localStorage.setItem('whefax.tab', name);
  }
  function bind(k){
    const go=()=>show(k.dataset.tab);
    k.addEventListener('click', go);
    k.addEventListener('touchstart', function(e){ e.preventDefault(); go(); }, {passive:false});
    k.addEventListener('keydown', function(e){ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); go(); }});
  }
  keys.forEach(bind);
  // restore last tab (fallback to deals)
  const last = localStorage.getItem('whefax.tab') || 'deals';
  show(last);
});

// --- Request -> WhatsApp ---
(function setupRequest(){
  const btn=document.getElementById('reqSend');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const phone=(localStorage.getItem('whefax.whats')||'').replace(/[^\d]/g,'');
    if(!phone){ alert('WhatsApp number not set. Ask admin to set it in Admin → Settings.'); return; }
    const msg = (document.getElementById('r_msg')?.value||'').trim();
    const contact = (document.getElementById('r_contact')?.value||'').trim();
    const parts = ['General request:', msg || '(no message)', contact ? ('CONTACT: '+contact) : ''];
    const wa = 'https://wa.me/'+phone+'?text='+encodeURIComponent(parts.filter(Boolean).join('\n'));
    window.open(wa, '_blank');
  });
})();

// --- About content ---
(function setupAbout(){
  const site = localStorage.getItem('whefax.site')||'';
  const phone=(localStorage.getItem('whefax.whats')||'').trim();
  const siteEl=document.getElementById('about_site');
  const whatsEl=document.getElementById('about_whats');
  if(siteEl) siteEl.textContent = site || '(set in Admin → Settings)';
  if(whatsEl) whatsEl.textContent = phone || '(set in Admin → Settings)';
})();
