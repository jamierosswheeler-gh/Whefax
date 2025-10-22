// Basic GitHub backend handler for WHEFAX
window.whefaxBackend = {
  async githubGetFile(path){
    const repo=localStorage.getItem("github.repo");
    const token=localStorage.getItem("github.token");
    const res=await fetch(`https://api.github.com/repos/${repo}/contents/${path}`,{
      headers:{Authorization:`Bearer ${token}`}
    });
    if(!res.ok) throw new Error("Get failed");
    return await res.json();
  },
  async githubUpdateFile(path,content,message){
    const repo=localStorage.getItem("github.repo");
    const token=localStorage.getItem("github.token");
    const current=await this.githubGetFile(path);
    const res=await fetch(`https://api.github.com/repos/${repo}/contents/${path}`,{
      method:"PUT",
      headers:{
        Authorization:`Bearer ${token}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        message,
        content:btoa(unescape(encodeURIComponent(content))),
        sha:current.sha
      })
    });
    return await res.json();
  },
  async fetchStats(){
    const f=await this.githubGetFile("data/deals.json");
    const j=JSON.parse(atob(f.content));
    const all=j.deals||[];
    return {
      live:all.filter(d=>!d.expired).length,
      expired:all.filter(d=>d.expired).length,
      totalHeat:all.reduce((a,b)=>a+(b.hot||0),0)
    };
  }
};
