const S='whefax.pin'; const D='whefax.deals';
const pinInput=document.getElementById('pin'); const panel=document.getElementById('panel');
document.getElementById('setPin').addEventListener('click',()=>{const p=pinInput.value.trim(); if(!p) return alert('Enter a PIN'); localStorage.setItem(S,p); alert('PIN saved.');});
document.getElementById('unlock').addEventListener('click',()=>{const p=pinInput.value.trim(); if(!p) return alert('Enter PIN'); const saved=localStorage.getItem(S); if(saved&&saved===p){panel.style.display='block';} else {alert('Wrong PIN');}});
let deals=JSON.parse(localStorage.getItem(D)||'[]'); function persist(){localStorage.setItem(D, JSON.stringify(deals));}
function heuristic(raw){
  const o={id:Date.now(),title:'',price:'',dates:'',origin:'',destination:'',image:'',links:[],flights:'',hotel:'',board:'',transfers:'',other:'',summary:'',tags:[]};
  const text=raw.replace(/\s+/g,' ').trim();
  o.links=Array.from(new Set((text.match(/https?:\/\/\S+/g)||[])));
  const mPrice=text.match(/(?:£|\$|€)\s?\d+(?:[.,]\d{2})?/); if(mPrice) o.price=mPrice[0];
  const mDate=text.match(/\b(?:\d{1,2}\s?[A-Za-z]{3,9}|[A-Za-z]{3,9}\s?\d{1,2})(?:\s?[-–]\s?(?:\d{1,2}\s?[A-Za-z]{3,9}|[A-Za-z]{3,9}\s?\d{1,2}))?(?:\s?\d{2,4})?\b/); if(mDate) o.dates=mDate[0];
  const mFrom=text.match(/\bfrom\s+([A-Za-z\s]+?)(?=\s+to\b|,|;|\.|\s|$)/i); if(mFrom) o.origin=mFrom[1].trim();
  const mTo=text.match(/\bto\s+([A-Za-z\s]+?)(?=,|;|\.|\s|$)/i); if(mTo) o.destination=mTo[1].trim();
  const sect=(name)=>{const re=new RegExp(name+':\\s*([^]+?)(?=\\b(Flights|Hotel|Board|Transfers|Other)\\b:|$)','i'); const m=raw.match(re); return m?m[1].trim():'';};
  o.flights=sect('Flights'); o.hotel=sect('Hotel'); o.board=sect('Board'); o.transfers=sect('Transfers'); o.other=sect('Other');
  o.title=[o.destination||'Getaway', o.price].filter(Boolean).join(' • ');
  o.summary=[o.dates, o.origin&&o.destination?(o.origin+' → '+o.destination):'', o.board].filter(Boolean).join(' • ');
  return o;
}
function gatherTags(){const typed=(document.getElementById('tagsInput').value||'').split(',').map(s=>s.trim()).filter(Boolean); const quick=[...document.querySelectorAll('#quickTags .tag.selected')].map(e=>e.textContent.trim()); return Array.from(new Set([...typed,...quick]));}
document.getElementById('quickTags').addEventListener('click',(e)=>{if(e.target.classList.contains('tag')) e.target.classList.toggle('selected');});
async function condenseRaw(){
  const raw=document.getElementById('raw').value.trim();
  const links=(document.getElementById('links').value||'').split(',').map(s=>s.trim()).filter(Boolean);
  const image=document.getElementById('image').value.trim();
  if(!raw) return alert('Paste deal text'); let o=heuristic(raw); o.links=Array.from(new Set([...(o.links||[]),...links])); if(image) o.image=image; o.tags=gatherTags();
  document.getElementById('preview').textContent=JSON.stringify(o,null,2); return o;
}
document.getElementById('condense').addEventListener('click',condenseRaw);
document.getElementById('save').addEventListener('click',async()=>{const o=await condenseRaw(); if(!o) return; deals.unshift(o); persist(); alert('Saved locally. Export to publish.');});
document.getElementById('export').addEventListener('click',()=>{const payload={updated:new Date().toISOString().slice(0,10),deals}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='deals.json'; a.click(); URL.revokeObjectURL(url);});
document.getElementById('import').addEventListener('change',async(e)=>{const file=e.target.files[0]; if(!file) return; try{const text=await file.text(); const j=JSON.parse(text); deals=Array.isArray(j.deals)?j.deals:j; persist(); alert('Imported.');}catch{alert('Invalid JSON');}});