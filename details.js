
function h(el, html){el.innerHTML=html||'';}
function qs(k){const u=new URL(location.href); return u.searchParams.get(k);}
async function getDealById(id){ try{const r=await fetch('data/deals.json',{cache:'no-store'}); const j=await r.json(); return (j.deals||[]).find(x=>String(x.id)===String(id)); } catch(e){return null;} }
async function init(){
  let d = JSON.parse(sessionStorage.getItem('whefax.detail')||'null');
  const id = qs('id'); if((!d||!d.id) && id){ d = await getDealById(id); }
  if(!d){ document.body.innerHTML='<div class="container"><p class="card">Deal not found.</p></div>'; return; }
  document.getElementById('title').textContent=d.title||'Deal';
  h(document.getElementById('dates'), d.dates||''); h(document.getElementById('route'), [d.origin,'→',d.destination].filter(Boolean).join(' ')); h(document.getElementById('price'), d.price||'');
  h(document.getElementById('flights'), (d.flights||'').replace(/\n/g,'<br>')); h(document.getElementById('hotel'), (d.hotel||'').replace(/\n/g,'<br>')); h(document.getElementById('board'), (d.board||'').replace(/\n/g,'<br>')); h(document.getElementById('transfers'), (d.transfers||'').replace(/\n/g,'<br>')); h(document.getElementById('other'), (d.other||'').replace(/\n/g,'<br>'));
  const links=document.getElementById('links'); if(d.flightLink){const a=document.createElement('a'); a.href=d.flightLink; a.target='_blank'; a.rel='nofollow noopener sponsored'; a.textContent='Book Flights'; a.className='btn'; links.appendChild(a);} if(d.hotelLink){const a=document.createElement('a'); a.href=d.hotelLink; a.target='_blank'; a.rel='nofollow noopener sponsored'; a.textContent='Book Hotel'; a.className='btn'; links.appendChild(a);} (d.links||[]).forEach((u,i)=>{if(u===d.flightLink||u===d.hotelLink) return; const a=document.createElement('a'); a.href=u; a.target='_blank'; a.rel='nofollow noopener sponsored'; a.textContent='Book '+(i+1); a.className='btn blue'; links.appendChild(a);});
  const tags=document.getElementById('tags'); (d.tags||[]).forEach(t=>{const s=document.createElement('span'); s.className='tag selected'; s.textContent=t; tags.appendChild(s);});
  const whats=document.getElementById('whats'); const base=(localStorage.getItem('whefax.site')||'').replace(/\/+$/,''); const share = base? (base+'/details.html?id='+encodeURIComponent(d.id)): location.href; const phone=(localStorage.getItem('whefax.whats')||'').replace(/[^\d]/g,'');
  const msg = "I'm interested in this deal: "+(d.title||'Deal')+" — "+share;
  if(phone){ const a=document.createElement('a'); a.href='https://wa.me/'+phone+'?text='+encodeURIComponent(msg); a.className='btn'; a.textContent="I'm interested — let's talk"; whats.appendChild(a);} else { whats.innerHTML='<span class="notice">WhatsApp number not set.</span>'; }
}
init();
