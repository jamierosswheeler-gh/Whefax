// === WHEFAX v10.2 BACKEND ===
const whefaxBackend = {
  repo: localStorage.getItem("github.repo") || "",
  token: localStorage.getItem("github.token") || "",

  raw(url) {
    return `https://raw.githubusercontent.com/${this.repo}/main/${url}?v=${Date.now()}`;
  },

  async fetchJSON(url) {
    const r = await fetch(this.raw(url));
    if (!r.ok) throw new Error("Load failed " + url);
    return await r.json();
  },

  async fetchDeals() {
    try { return await this.fetchJSON("data/deals.json"); }
    catch(e){ console.warn(e); return {deals:[]}; }
  },

  async fetchBlogs() {
    try { return await this.fetchJSON("data/blog.json"); }
    catch(e){ console.warn(e); return {posts:[]}; }
  },

  async fetchStats() {
    const d = await this.fetchDeals();
    const live = d.deals.filter(x=>!x.expired).length;
    const expired = d.deals.filter(x=>x.expired).length;
    const totalHeat = d.deals.reduce((a,b)=>a+(b.hot||0),0);
    return {live, expired, totalHeat};
  },

  async githubGetFile(path){
    const r = await fetch(`https://api.github.com/repos/${this.repo}/contents/${path}`,{
      headers:{Authorization:`token ${this.token}`}
    });
    if(!r.ok) throw new Error("GitHub get failed");
    return await r.json();
  },

  async githubUpdateFile(path,content,msg){
    const f = await this.githubGetFile(path);
    const body={
      message:msg,
      content:btoa(content),
      sha:f.sha,
      branch:"main"
    };
    const r = await fetch(`https://api.github.com/repos/${this.repo}/contents/${path}`,{
      method:"PUT",
      headers:{
        Authorization:`token ${this.token}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify(body)
    });
    if(!r.ok) throw new Error("GitHub update failed");
  }
};
