
const S='whefax.pin'; const D='whefax.deals'; const SGH='whefax.gh';
// PIN
const pinInput=document.getElementById('pin'); const panel=document.getElementById('panel');
document.getElementById('setPin').addEventListener('click',()=>{const p=pinInput.value.trim(); if(!p) return alert('Enter a PIN'); localStorage.setItem(S,p); alert('PIN saved.');});
document.getElementById('unlock').addEventListener('click',()=>{const p=pinInput.value.trim(); if(!p) return alert('Enter PIN'); const saved=localStorage.getItem(S); if(saved&&saved===p){panel.style.display='block';} else {alert('Wrong PIN');}});
// Tag toggles
document.getElementById('quickTags').addEventListener('click',(e)=>{if(e.target.classList.contains('tag')) e.target.classList.toggle('selected');});
document.getElementById('quickTags').addEventListener('touchstart',(e)=>{const t=e.target; if(t.classList&&t.classList.contains('tag')){e.preventDefault(); t.classList.toggle('selected');}}, {passive:false});
document.getElementById('quickTags').addEventListener('keypress',(e)=>{if((e.key===' '||e.key==='Enter')&&e.target.classList.contains('tag')){e.preventDefault(); e.target.classList.toggle('selected');}});
// Deals store
let deals=JSON.parse(localStorage.getItem(D)||'[]'); function persist(){localStorage.setItem(D, JSON.stringify(deals));}
// Heuristic condense
function cityFallback(text){
  const cities=['Paris','Barcelona','Rome','Milan','Venice','Naples','Madrid','Lisbon','Porto','Seville','Valencia','Berlin','Munich','Hamburg','Amsterdam','Rotterdam','Brussels','Antwerp','Vienna','Prague','Budapest','Krakow','Warsaw','Copenhagen','Stockholm','Oslo','Helsinki','Reykjavik','Zurich','Geneva','Nice','Lyon','Marseille','Athens','Istanbul','Dubrovnik','Split','Tenerife','Lanzarote','Gran Canaria','Palma','Ibiza','Malaga','Alicante','Faro','Dubai','Doha','New York','Miami','Orlando','Toronto','Vancouver','Tokyo','Seoul','Bangkok','Bali','Sydney','Melbourne'];
  for(const c of cities){ const re=new RegExp('\\b'+c+'\\b','i'); if(re.test(text)) return c; } return '';
}
function heuristic(raw){
  const o={id:Date.now(),title:'',price:'',dates:'',origin:'',destination:'',image:'',flightLink:'',hotelLink:'',links:[],flights:'',hotel:'',board:'',transfers:'',other:'',summary:'',tags:[]};
  const text=raw.replace(/\s+/g,' ').trim();
  o.links=Array.from(new Set((text.match(/https?:\/\/\S+/g)||[])));
  const mPrice=text.match(/(?:£|\$|€)\s?\d+(?:[.,]\d{2})?/); if(mPrice) o.price=mPrice[0];
  const mDate=text.match(/\b(?:\d{1,2}\s?[A-Za-z]{3,9}|[A-Za-z]{3,9}\s?\d{1,2})(?:\s?[-–]\s?(?:\d{1,2}\s?[A-Za-z]{3,9}|[A-Za-z]{3,9}\s?\d{1,2}))?(?:\s?\d{2,4})?\b/); if(mDate) o.dates=mDate[0];
  const mFrom=text.match(/\bfrom\s+([A-Za-z\s]+?)(?=\s+to\b|,|;|\.|\s|$)/i); if(mFrom) o.origin=mFrom[1].trim();
  const mTo=text.match(/\bto\s+([A-Za-z\s]+?)(?=,|;|\.|\s|$)/i); if(mTo) o.destination=mTo[1].trim();
  if(!o.destination){ const m1=text.match(/→\s*([A-Za-z\s]+)/); if(m1) o.destination=m1[1].trim(); }
  if(!o.destination){ const m2=text.match(/\b(?:in|at|for)\s+([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)?)/); if(m2) o.destination=m2[1].trim(); }
  if(!o.destination){ const cf=cityFallback(text); if(cf) o.destination=cf; }
  const sect=(name)=>{const re=new RegExp(name+':\\s*([^]+?)(?=\\b(Flights|Hotel|Board|Transfers|Other|Price|Dates|From|To)\\b:|$)','i'); const m=raw.match(re); return m?m[1].trim():'';};
  o.flights=sect('Flights'); o.hotel=sect('Hotel'); o.board=sect('Board'); o.transfers=sect('Transfers'); o.other=sect('Other');
  const mFromField=raw.match(/\bFrom:\s*([^\n\r]+)/i); if(mFromField) o.origin=mFromField[1].trim();
  const mToField=raw.match(/\bTo:\s*([^\n\r]+)/i); if(mToField) o.destination=mToField[1].trim()||o.destination;
  const mDatesField=raw.match(/\bDates?:\s*([^\n\r]+)/i); if(mDatesField) o.dates=mDatesField[1].trim()||o.dates;
  const mPriceField=raw.match(/\bPrice:\s*([^\n\r]+)/i); if(mPriceField) o.price=mPriceField[1].trim()||o.price;
  o.title=[o.destination||'Getaway', o.price].filter(Boolean).join(' • ');
  o.summary=[o.dates, o.origin&&o.destination?(o.origin+' → '+o.destination):'', o.board].filter(Boolean).join(' • ');
  return o;
}
function gatherTags(){ const typed=(document.getElementById('tagsInput').value||'').split(',').map(s=>s.trim()).filter(Boolean); const quick=[...document.querySelectorAll('#quickTags .tag.selected')].map(e=>e.textContent.trim()); return Array.from(new Set([...typed,...quick])); }
async function condenseRaw(){ const raw=document.getElementById('raw').value.trim(); const flightLink=(document.getElementById('flightLink').value||'').trim(); const hotelLink=(document.getElementById('hotelLink').value||'').trim(); const image=document.getElementById('image').value.trim(); if(!raw) return alert('Paste deal text');
  let o=heuristic(raw); o.flightLink=flightLink||o.flightLink; o.hotelLink=hotelLink||o.hotelLink; o.links=[...new Set([...(o.links||[]), ...(flightLink?[flightLink]:[]), ...(hotelLink?[hotelLink]:[])])]; if(image) o.image=image; o.tags=gatherTags();
  document.getElementById('preview').textContent=JSON.stringify(o,null,2); return o;}
document.getElementById('condense').addEventListener('click',condenseRaw);
document.getElementById('save').addEventListener('click',async()=>{const o=await condenseRaw(); if(!o) return; deals.unshift(o); persist(); alert('Saved locally. Export or Publish.');});
document.getElementById('export').addEventListener('click',()=>{const payload={updated:new Date().toISOString().slice(0,10),deals}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='deals.json'; a.click(); URL.revokeObjectURL(url);});
// Settings + GitHub
function loadSettings(){ document.getElementById('siteBase').value=localStorage.getItem('whefax.site')||''; document.getElementById('whats').value=localStorage.getItem('whefax.whats')||'+447824338196';
  const s=JSON.parse(localStorage.getItem(SGH)||'{}'); if(!s.user) s.user='jamierosswheeler-gh'; if(!s.repo) s.repo='WHEFAX'; document.getElementById('ghUser').value=s.user; document.getElementById('ghRepo').value=s.repo; document.getElementById('ghToken').value=s.token||''; }
loadSettings();
document.getElementById('saveSettings').addEventListener('click',()=>{ const s={user:document.getElementById('ghUser').value.trim(), repo:document.getElementById('ghRepo').value.trim(), token:document.getElementById('ghToken').value.trim()}; localStorage.setItem(SGH, JSON.stringify(s)); localStorage.setItem('whefax.site', (document.getElementById('siteBase').value||'').trim()); localStorage.setItem('whefax.whats', (document.getElementById('whats').value||'').trim()); alert('Settings saved.');});
async function publishGitHub(){ const s=JSON.parse(localStorage.getItem(SGH)||'{}'); if(!s.user||!s.repo||!s.token) return alert('Set GitHub settings first.');
  const path='data/deals.json'; const api='https://api.github.com/repos/'+encodeURIComponent(s.user)+'/'+encodeURIComponent(s.repo)+'/contents/'+path;
  const payload={updated:new Date().toISOString().slice(0,10), deals}; const content=btoa(unescape(encodeURIComponent(JSON.stringify(payload,null,2))));
  let sha=null; try{const r=await fetch(api,{headers:{'Authorization':'Bearer '+s.token,'Accept':'application/vnd.github+json'}}); if(r.ok){const j=await r.json(); sha=j.sha||null;}}catch(e){}
  const body={message:'Update deals.json via WHEFAX admin', content, sha}; const r2=await fetch(api,{method:'PUT',headers:{'Authorization':'Bearer '+s.token,'Accept':'application/vnd.github+json'},body:JSON.stringify(body)});
  if(r2.ok){ alert('Published to GitHub. Live in ~30–60s.'); } else { const err=await r2.text(); alert('Publish failed: '+err); }}
document.getElementById('publish').addEventListener('click', publishGitHub);
