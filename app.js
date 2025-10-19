// WheelerFax Teletext App
const SKEY = 'wheelerfax.settings';
const DKEY = 'wheelerfax.deals';

const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));

// Tabs
$$('.tab-btn').forEach(b => b.addEventListener('click', () => {
  $$('.tab').forEach(t => t.classList.remove('active'));
  $('#' + b.dataset.tab).classList.add('active');
}));

// Settings
const settings = JSON.parse(localStorage.getItem(SKEY) || '{}');
function saveSettings() {
  settings.brand = $('#brandColor').value;
  settings.apiKey = $('#openAiKey').value.trim();
  settings.model = $('#openAiModel').value;
  localStorage.setItem(SKEY, JSON.stringify(settings));
  document.documentElement.style.setProperty('--brand', settings.brand || '#0ff');
  alert('Settings saved.');
}
$('#saveSettings').addEventListener('click', saveSettings);
(function loadSettings(){
  if (settings.brand) document.documentElement.style.setProperty('--brand', settings.brand);
  $('#brandColor').value = settings.brand || '#00ffff';
  $('#openAiKey').value = settings.apiKey || '';
  $('#openAiModel').value = settings.model || 'gpt-4o-mini';
})();

// Deals store
let deals = JSON.parse(localStorage.getItem(DKEY) || '[]');
function persist() { localStorage.setItem(DKEY, JSON.stringify(deals)); }

// Render deals
function renderDeals(filter='') {
  const list = $('#dealList');
  list.innerHTML = '';
  const f = filter.toLowerCase();
  deals.filter(d => JSON.stringify(d).toLowerCase().includes(f)).forEach(d => {
    const tpl = document.getElementById('dealCardTmpl').content.cloneNode(true);
    tpl.querySelector('.title').textContent = d.title || 'Untitled deal';
    tpl.querySelector('.meta').textContent = [d.origin, '→', d.destination, d.dates].filter(Boolean).join('  ');
    tpl.querySelector('.desc').textContent = d.summary || '';
    tpl.querySelector('.price').textContent = d.price || '';
    const img = tpl.querySelector('.cover');
    if (d.image) { img.src = d.image; } else { img.remove(); }
    const links = tpl.querySelector('.links');
    (d.links||[]).forEach((u,i) => {
      const a = document.createElement('a');
      a.href = u; a.target = '_blank'; a.rel = 'nofollow noopener sponsored';
      a.textContent = 'Book ' + (i+1);
      links.appendChild(a);
    });
    list.appendChild(tpl);
  });
}
renderDeals();
$('#searchInput').addEventListener('input', (e)=>renderDeals(e.target.value));

// Export/Import JSON
$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(deals, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'wheelerfax-deals.json';
  a.click();
  URL.revokeObjectURL(url);
});
$('#importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try { deals = JSON.parse(text); persist(); renderDeals(); alert('Imported.'); }
  catch { alert('Invalid JSON.'); }
});

// Parse & condense
function heuristicCondense(raw) {
  const out = { title:'', summary:'', price:'', dates:'', origin:'', destination:'', links:[], image:'' };
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const text = lines.join(' ');

  // Extract URLs
  const urlRe = /(https?:\/\/[^\s]+)/g;
  out.links = Array.from(new Set((text.match(urlRe) || [])));

  // Price (GBP/EUR/USD)
  const priceRe = /(?:£|\$|€)\s?\d+(?:[.,]\d{2})?/;
  const price = text.match(priceRe);
  if (price) out.price = price[0];

  // Dates (simple patterns)
  const dateRe = /\b(?:\d{1,2}\s?[A-Za-z]{3,9}|\b[A-Za-z]{3,9}\s?\d{1,2})(?:\s?[-–]\s?(?:\d{1,2}\s?[A-Za-z]{3,9}|\b[A-Za-z]{3,9}\s?\d{1,2}))?(?:\s?\d{2,4})?\b/;
  const dates = text.match(dateRe);
  if (dates) out.dates = dates[0];

  // Flights: From/To
  const fromRe = /\bfrom\s+([A-Za-z\s]+?)(?=\s+to\b|,|;|\.|\s|$)/i;
  const toRe = /\bto\s+([A-Za-z\s]+?)(?=,|;|\.|\s|$)/i;
  const mFrom = text.match(fromRe); const mTo = text.match(toRe);
  if (mFrom) out.origin = mFrom[1].trim();
  if (mTo) out.destination = mTo[1].trim();

  // Hotel name
  const hotelRe = /\b(hotel|resort|inn|apart(?:ment|hotel)|hostel)\s+([A-Za-z0-9&\-\s]+)\b/i;
  const mHotel = text.match(hotelRe);
  const hotel = mHotel ? mHotel[0] : '';

  // Title
  out.title = [out.destination || hotel || 'Getaway', out.price].filter(Boolean).join(' • ');

  // Summary
  const nightsRe = /(\d+)\s*nights?/i;
  const boardRe = /\b(B&B|BB|HB|FB|AI|All[-\s]?inclusive|Self[-\s]?catering)\b/i;
  const airlineRe = /\b(Ryanair|easyJet|British Airways|Jet2|Wizz Air|Lufthansa|KLM|Air France|Emirates|Qatar|United|Delta|American)\b/i;
  const bits = [];
  if (mHotel) bits.push(hotel.title ? hotel.title : hotel);
  const nights = text.match(nightsRe); if (nights) bits.push(nights[0]);
  const board = text.match(boardRe); if (board) bits.push(board[0]);
  const airline = text.match(airlineRe); if (airline) bits.push(airline[0]);
  out.summary = bits.join(' • ') || lines.slice(0,2).join(' ');

  return out;
}

async function aiCondense(raw) {
  const key = (settings.apiKey||'').trim();
  if (!key) return null;
  const model = settings.model || 'gpt-4o-mini';
  const sys = "You condense unstructured travel deal text into a JSON with keys: title, summary, price, dates, origin, destination, links (array), image (string). Keep title compact and teletext-friendly.";
  const user = raw;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer ' + key
      },
      body: JSON.stringify({
        model,
        messages: [
          {role:'system', content: sys},
          {role:'user', content: user}
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });
    const j = await r.json();
    const content = j.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    if (typeof parsed.links === 'string') parsed.links = [parsed.links];
    return parsed;
  } catch (e) {
    console.log(e);
    return null;
  }
}

let currentDraft = null;

$('#parseBtn').addEventListener('click', async () => {
  const raw = $('#rawBox').value.trim();
  const aff = $('#linkBox').value.trim();
  const img = $('#imgBox').value.trim();
  if (!raw) { alert('Paste some deal text first.'); return; }

  // Try AI first if key is present; fallback to heuristic
  let condensed = await aiCondense(raw);
  if (!condensed) condensed = heuristicCondense(raw);

  // Merge affiliate links
  const extra = aff ? aff.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const set = new Set([...(condensed.links||[]), ...extra]);
  condensed.links = Array.from(set);
  if (img) condensed.image = img;

  currentDraft = condensed;
  $('#preview').textContent = JSON.stringify(condensed, null, 2);
  $('#saveBtn').disabled = false;
});

$('#saveBtn').addEventListener('click', () => {
  if (!currentDraft) return;
  deals.unshift({ ...currentDraft, id: Date.now() });
  persist();
  renderDeals();
  $('#preview').textContent = '';
  $('#saveBtn').disabled = true;
  $('#rawBox').value=''; $('#linkBox').value=''; $('#imgBox').value='';
  alert('Deal saved.');
});
