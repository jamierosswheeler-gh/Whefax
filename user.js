// Register SW (keeps site fast/offline; JSON stays live)
if ('serviceWorker' in navigator) {
  try { navigator.serviceWorker.register('sw.js?v=8.4'); } catch(e) {}
}

// ----- Tabs -----
function setTab(tab){
  ['deals','request','blog','about'].forEach(id=>{
    var el = document.getElementById('tab-'+id);
    if(!el) return;
    el.style.display = (id===tab?'block':'none');
  });
  try{ localStorage.setItem('whefax.tab', tab); }catch(_){}
}

document.addEventListener('DOMContentLoaded', function(){
  var tab = (location.hash.replace('#','')||'').toLowerCase();
  if(!tab) try{ tab = localStorage.getItem('whefax.tab') || 'deals'; }catch(_){ tab='deals'; }
  if(['deals','request','blog','about'].indexOf(tab)<0) tab='deals';
  setTab(tab);

  // Finder → WhatsApp
  var form = document.getElementById('finder_form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var where   = document.getElementById('rq_where').value;
      var len     = document.getElementById('rq_length').value;
      var when    = document.getElementById('rq_when').value;
      var who     = document.getElementById('rq_who').value;
      var bud     = document.getElementById('rq_budget').value;
      var other   = document.getElementById('rq_other').value;
      var contact = document.getElementById('rq_contact').value;

      var msg = [
        "I'm interested in a custom holiday:",
        where?   ("WHERE: "+where) : "",
        len?     ("HOW LONG: "+len) : "",
        when?    ("WHEN: "+when) : "",
        who?     ("WHO: "+who) : "",
        bud?     ("BUDGET: "+bud) : "",
        other?   ("OTHER: "+other) : "",
        contact? ("CONTACT: "+contact) : ""
      ].filter(Boolean).join("%0A");

      var phone = (localStorage.getItem('whatsapp.number')||'+447824338196');
      var url = "https://wa.me/"+encodeURIComponent(phone)+"?text="+msg;
      location.href = url;
    });
  }

  loadDeals();
  loadBlog();
});

// ----- Deals + Filters -----
var __DEALS_CACHE__ = [];
var __FILTER__ = 'ALL';

function buildFilters(){
  var el = document.getElementById('deal_filters'); if(!el) return;
  var set = new Set();
  (__DEALS_CACHE__||[]).forEach(d => (d.tags||[]).forEach(t => set.add(t)));
  var tags = Array.from(set).sort();
  var html = '<span class="filter-chip all'+(__FILTER__==='ALL'?' active':'')+'" data-tag="ALL">ALL DEALS</span>';
  html += tags.map(t => '<span class="filter-chip purple'+(__FILTER__===t?' active':'')+'" data-tag="'+t+'">'+t+'</span>').join('');
  el.innerHTML = html;
  el.onclick = function(e){
    var chip = e.target.closest('.filter-chip'); if(!chip) return;
    __FILTER__ = chip.getAttribute('data-tag');
    buildFilters();
    renderDeals();
  };
}

function renderDeals(){
  var wrap = document.getElementById('deal_list'); if(!wrap) return;
  var list = __DEALS_CACHE__;
  if(__FILTER__ && __FILTER__!=='ALL'){
    list = list.filter(d => (d.tags||[]).includes(__FILTER__));
  }
  if(!list.length){ wrap.innerHTML = '<p>No deals match.</p>'; return; }
  wrap.innerHTML = list.map(d => (
    '<div class="deal">'+
      '<div class="dtitle">'+(d.title||'Untitled')+'</div>'+
      (d.price ? '<div>'+d.price+'</div>' : '')+
      (d.destination ? '<div>Destination: '+d.destination+'</div>' : '')+
      (d.dates ? '<div>Dates: '+d.dates+'</div>' : '')+
      '<div class="tags">'+ (d.tags ? d.tags.map(t => '<span class="tag"><span class="dot"></span>'+t+'</span>').join('') : '') + '</div>'+
      '<div style="margin-top:8px"><a class="btn details" href="details.html?id='+(encodeURIComponent(d.id||''))+ '">View details</a></div>'+
    '</div>'
  )).join('');
}

async function loadDeals(){
  const wrap = document.getElementById('deal_list');
  try{
    const r = await fetch('data/deals.json?v='+Date.now(), {cache:'no-store'});
    const j = await r.json();
    __DEALS_CACHE__ = (j.deals||[]);
    buildFilters();
    renderDeals();
  }catch(e){
    if(wrap) wrap.innerHTML = '<p class="notice">Failed to load deals.</p>';
  }
}

// Auto-refresh deals every 30s
if (typeof window !== 'undefined') {
  setInterval(function(){ try{ loadDeals(); }catch(e){} }, 30000);
}

// ----- Blog -----
async function loadBlog(){
  try{
    const r = await fetch('data/blog.json?v='+Date.now(), {cache:'no-store'});
    const j = await r.json();
    const wrap = document.getElementById('blog_list');
    if(!wrap) return;
    if(!j.posts || !j.posts.length){ wrap.innerHTML = '<p>No posts yet.</p>'; return; }
    wrap.innerHTML = j.posts.map(p => (
      '<div class="post">'+
        '<div class="ptitle">'+(p.title||'Untitled')+'</div>'+
        (p.excerpt ? '<div class="pexcerpt">'+p.excerpt+'</div>' : '')+
        (p.url ? '<div class="purl"><a target="_blank" rel="noopener nofollow" href="'+p.url+'">Read more</a></div>' : '')+
      '</div>'
    )).join('');
  }catch(e){
    const wrap = document.getElementById('blog_list');
    if(wrap) wrap.innerHTML = '<p class="notice">Failed to load blog.</p>';
  }
}
