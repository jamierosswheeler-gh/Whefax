if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js?v=8.3'); } catch(e) {} }
async function getDeals(){ const r=await fetch('data/deals.json?v='+Date.now(), {cache:'no-store'}); return r.json(); }
function q(k){ return new URLSearchParams(location.search).get(k); }
document.addEventListener('DOMContentLoaded', async function(){
  const id=q('id'); const data=await getDeals(); const deal=(data.deals||[]).find(d => String(d.id||'')===String(id||'')) || (data.deals||[])[0];
  document.getElementById('d_title').textContent=(deal&&deal.title)?deal.title:'Deal';
  function row(label,val){ if(!val) return ''; return '<div class="section"><div class="section-title">'+label+'</div><div>'+val+'</div></div>'; }
  const body=document.getElementById('d_body'); body.innerHTML=[ row('FLIGHTS',deal.flight_info||''), row('HOTEL',deal.hotel_info||''), row('BOARD',deal.board||''), row('TRANSFERS',deal.transfers||''), row('OTHER',deal.other||'') ].join('');
  const links=document.getElementById('links'); links.innerHTML='';
  if(deal.flight_link){ var a=document.createElement('a'); a.href=deal.flight_link; a.target='_blank'; a.rel='noopener'; a.className='btn flight'; a.textContent='Book flights'; links.appendChild(a); }
  if(deal.hotel_link){ var a2=document.createElement('a'); a2.href=deal.hotel_link; a2.target='_blank'; a2.rel='noopener'; a2.className='btn hotel'; a2.textContent='Book hotel'; links.appendChild(a2); }
  var talk=document.createElement('a'); talk.href='#'; talk.className='btn talk'; talk.textContent="I'm interested — let's talk";
  talk.addEventListener('click', function(e){ e.preventDefault(); var phone=(localStorage.getItem('whatsapp.number')||'+447824338196'); var msg="I'm interested in this deal: "+(deal.title||'')+"%0A"+location.href; location.href='https://wa.me/'+encodeURIComponent(phone)+'?text='+msg; });
  links.appendChild(talk);
});