// GitHub sync & heat tracking
function getConfig(){
  return{
    githubRepo:localStorage.getItem("github.repo")||"",
    githubToken:localStorage.getItem("github.token")||""
  };
}
async function githubGetFile(path){
  const {githubRepo,githubToken}=getConfig();
  if(!githubRepo||!githubToken)return null;
  const r=await fetch(`https://api.github.com/repos/${githubRepo}/contents/${path}`,{
    headers:{Authorization:`token ${githubToken}`,Accept:"application/vnd.github+json"}
  });
  if(!r.ok)throw new Error("fetch fail "+path);
  return await r.json();
}
async function githubUpdateFile(path,content,message){
  const {githubRepo,githubToken}=getConfig();
  if(!githubRepo||!githubToken)return false;
  const existing=await githubGetFile(path);
  const sha=existing?.sha;
  const body={
    message:message||"update "+path,
    content:btoa(unescape(encodeURIComponent(content))),
    sha
  };
  const r=await fetch(`https://api.github.com/repos/${githubRepo}/contents/${path}`,{
    method:"PUT",
    headers:{Authorization:`token ${githubToken}`,"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  return r.ok;
}
async function updateHeat(dealId,delta){
  try{
    const file=await githubGetFile("data/deals.json");
    const json=JSON.parse(atob(file.content));
    const deals=json.deals||[];
    const deal=deals.find(d=>d.id===dealId);
    if(deal){
      deal.hot=(deal.hot||0)+delta;
      if(deal.hot<0)deal.hot=0;
      await githubUpdateFile("data/deals.json",JSON.stringify(json,null,2),"update heat");
    }
  }catch(e){console.error("updateHeat err",e);}
}
async function fetchStats(){
  try{
    const r=await fetch("data/deals.json?v="+Date.now());
    const j=await r.json();
    const deals=j.deals||[];
    const live=deals.filter(d=>!d.expired).length;
    const expired=deals.filter(d=>d.expired).length;
    let totalHeat=0;deals.forEach(d=>totalHeat+=(d.hot||0));
    return{live,expired,totalHeat};
  }catch{return{live:0,expired:0,totalHeat:0};}
}
window.whefaxBackend={updateHeat,fetchStats,githubGetFile,githubUpdateFile};
