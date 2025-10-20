// Shared GitHub settings
function getGh(){ return { repo:(localStorage.getItem('gh.repo')||'').trim(), token:(localStorage.getItem('gh.token')||'').trim() }; }
function setGh(repo, token){ if(typeof repo==='string') localStorage.setItem('gh.repo', repo.trim()); if(typeof token==='string' && token.trim()) localStorage.setItem('gh.token', token.trim()); }

document.addEventListener('DOMContentLoaded', function(){
  var repoEl=document.getElementById('gh_repo'), tokenEl=document.getElementById('gh_token'), msgEl=document.getElementById('gh_msg');
  var togEl=document.getElementById('gh_toggle'), saveEl=document.getElementById('gh_save');
  try{ if(repoEl) repoEl.value=localStorage.getItem('gh.repo')||''; if(tokenEl) tokenEl.value=localStorage.getItem('gh.token')||''; }catch(_){}
  if(togEl && tokenEl){ togEl.addEventListener('click', function(){ tokenEl.type = tokenEl.type==='password' ? 'text' : 'password'; togEl.textContent = tokenEl.type==='password' ? 'Show' : 'Hide'; }); }
  if(saveEl){ saveEl.addEventListener('click', function(){ try{ setGh(repoEl.value||'', tokenEl.value||''); if(msgEl) msgEl.textContent='Saved ✓'; setTimeout(function(){ if(msgEl) msgEl.textContent=''; },2000);}catch(e){ if(msgEl) msgEl.textContent='Failed: '+e.message; } }); }
});

// Robust GitHub updater with 409 retry
async function ghUpdateJson(path, mutateFn, statusEl){
  const { repo, token } = getGh();
  if (!repo || !token) throw new Error('GitHub repo/token missing');
  const base = 'https://api.github.com/repos/' + repo + '/contents/' + path;

  async function readLatest(){
    const r = await fetch(base, { headers:{ 'Authorization':'token '+token, 'Accept':'application/vnd.github+json' }});
    if (r.status === 404) return { json: null, sha: null }; // new file
    if (!r.ok) throw new Error('Read failed: '+r.status);
    const meta = await r.json();
    // meta.content is base64; decode safely
    const decoded = decodeURIComponent(escape(atob((meta.content||'').replace(/\n/g,''))));
    const content = decoded ? JSON.parse(decoded) : null;
    return { json: content, sha: meta.sha };
  }
  async function writeWithSha(json, sha){
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(json,null,2))));
    const body = JSON.stringify({ message:'Update '+path, content, sha });
    const r = await fetch(base, {
      method:'PUT',
      headers:{ 'Authorization':'token '+token, 'Accept':'application/vnd.github+json' },
      body
    });
    return r;
  }

  // first attempt
  let { json, sha } = await readLatest();
  json = mutateFn(json || null);
  let resp = await writeWithSha(json, sha);
  if (resp.status === 409) {
    if (statusEl) statusEl.textContent = 'Syncing… (retrying)';
    ({ json, sha } = await readLatest());
    json = mutateFn(json || null);
    resp = await writeWithSha(json, sha);
  }
  if (!resp.ok) throw new Error('Update failed: '+resp.status);
}

// Deals form
document.addEventListener('DOMContentLoaded', function(){
  var form=document.getElementById('deal_form'); if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var status=document.getElementById('deal_status');
    var title=document.getElementById('dl_title').value.trim();
    var destination=document.getElementById('dl_dest').value.trim();
    var dates=document.getElementById('dl_dates').value.trim();
    var price=document.getElementById('dl_price').value.trim();
    var flight_link=document.getElementById('dl_flight').value.trim();
    var hotel_link=document.getElementById('dl_hotel').value.trim();
    var other=document.getElementById('dl_other').value.trim();
    if(!title){ status.textContent='Please add a title'; return; }
    try{
      await ghUpdateJson('data/deals.json', (current) => {
        const j = current || { deals: [] };
        j.deals = j.deals || [];
        const id = Date.now().toString(36);
        j.deals.unshift({
          id, title, destination, dates, price,
          flight_link, hotel_link,
          flight_info: '', hotel_info: '',
          board: '', transfers: '', other,
          tags: destination? [destination] : []
        });
        return j;
      }, status);
      status.textContent='Deal saved ✓';
    }catch(err){
      status.textContent='Error: '+err.message;
    }
  });
});

// Blog form
document.addEventListener('DOMContentLoaded', function(){
  var form = document.getElementById('blog_form'); if(!form) return;
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var title = document.getElementById('b_title').value.trim();
    var url = document.getElementById('b_url').value.trim();
    var excerpt = document.getElementById('b_excerpt').value.trim();
    var status = document.getElementById('blog_status');
    if(!title){ status.textContent='Please add a title'; return; }
    try{
      await ghUpdateJson('data/blog.json', (current) => {
        const j = current || { posts: [] };
        j.posts = j.posts || [];
        j.posts.unshift({ title, url, excerpt, date: new Date().toISOString() });
        return j;
      }, status);
      status.textContent='Blog post added ✓';
    }catch(err){
      status.textContent='Error: '+err.message;
    }
  });
});
