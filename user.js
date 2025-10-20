if ('serviceWorker' in navigator) { try { navigator.serviceWorker.register('sw.js?v=8.3'); } catch(e) {} }
function setTab(tab){ ['deals','request','blog','about'].forEach(id=>{ var el=document.getElementById('tab-'+id); if(!el)return; el.style.display=(id===tab?'block':'none'); }); try{ localStorage.setItem('whefax.tab', tab); }catch(_){} }
document.addEventListener('DOMContentLoaded', function(){
  var tab=(location.hash.replace('#','')||'').toLowerCase(); if(!tab) try{ tab=localStorage.getItem('whefax.tab')||'deals'; }catch(_){ tab='deals'; }
  if(['deals','request','blog','about'].indexOf(tab)<0) tab='deals'; setTab(tab);
  var form=document.getElementById('finder_form'); if(form){ form.addEventListener('submit', function(e){ e.preventDefault();
    var where=rq_where.value,len=rq_length.value,when=rq_when.value,who=rq_who.value,bud=rq_budget.value,other=rq_other.value,contact=rq_contact.value;
    var msg=["I'm interested in a custom holiday:", where?('WHERE: '+where):'', len?('HOW LONG: '+len):'', when?('WHEN: '+when):'', who?('WHO: '+who):'', bud?('BUDGET: '+bud):'', other?('OTHER: '+other):'', contact?('CONTACT: '+contact):''].filter(Boolean).join('%0A');
    var phone=(localStorage.getItem('whatsapp.number')||'+447824338196');
    location.href='https://wa.me/'+encodeURIComponent(phone)+'?text='+msg;
  });}
  loadDeals(); loadBlog();
});
async function loadDeals(){ const wrap=document.getElementById('deal_list'); try{ const r=await fetch('data/deals.json?v='+Date.now(), {cache:'no-store'}); const j=await r.json();
  if(!j.deals||!j.deals.length){ wrap.innerHTML='<p>No deals yet.</p>'; return; }
  wrap.innerHTML=j.deals.map(d => ('<div class="deal">'+
    '<div class="dtitle">'+(d.title||'Untitled')+'</div>'+
    (d.price?'<div>'+d.price+'</div>':'')+
    (d.destination?'<div>Destination: '+d.destination+'</div>':'')+
    (d.dates?'<div>Dates: '+d.dates+'</div>':'')+
    '<div class="tags">'+(d.tags?d.tags.map(t => '<span class="tag"><span class="dot"></span>'+t+'</span>').join(''):'')+'</div>'+
    '<div style="margin-top:8px"><a href="details.html?id='+(encodeURIComponent(d.id||''))+'">View details</a></div>'+
  '</div>')).join('');
}catch(e){ if(wrap) wrap.innerHTML='<p class="notice">Failed to load deals.</p>'; } }
setInterval(function(){ try{ loadDeals(); }catch(e){} }, 30000);
async function loadBlog(){ try{ const r=await fetch('data/blog.json?v='+Date.now(), {cache:'no-store'}); const j=await r.json(); const wrap=document.getElementById('blog_list'); if(!wrap) return;
  if(!j.posts||!j.posts.length){ wrap.innerHTML='<p>No posts yet.</p>'; return; }
  wrap.innerHTML=j.posts.map(p => ('<div class="post">'+
    '<div class="ptitle">'+(p.title||'Untitled')+'</div>'+
    (p.excerpt?'<div class="pexcerpt">'+p.excerpt+'</div>':'')+
    (p.url?'<div class="purl"><a target="_blank" rel="noopener nofollow" href="'+p.url+'">Read more</a></div>':'')+
  '</div>')).join('');
}catch(e){ const wrap=document.getElementById('blog_list'); if(wrap) wrap.innerHTML='<p class="notice">Failed to load blog.</p>'; } }