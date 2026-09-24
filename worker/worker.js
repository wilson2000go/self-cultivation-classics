const API_KEY = "AIzaSyBzSFHu6cukLTYhGcCgBf5OFltNwDrDLHc";
const PROJECT = "audio-podcast-reading";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function getDoc(path){
  try{
    const r = await fetch(`${BASE}/${path}?key=${API_KEY}`, {cf:{cacheTtl:0}});
    if(!r.ok) return {};
    const j = await r.json();
    const out = {};
    if(j.fields){ for(const k in j.fields){ const v=j.fields[k]; out[k]= v.integerValue!==undefined?Number(v.integerValue):(v.doubleValue!==undefined?Number(v.doubleValue):(v.stringValue!==undefined?v.stringValue:v.booleanValue)); } }
    return out;
  }catch(e){ return {}; }
}
async function incDoc(path, field){
  const name = `${BASE}/${path}`;
  try{
    await fetch(`${BASE}:commit?key=${API_KEY}`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ writes:[{ transform:{ document:name, fieldTransforms:[{ fieldPath:field, increment:{ integerValue:"1" } }] } }] })
    });
  }catch(e){}
}
const CORS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};

export default {
  async fetch(request){
    const url = new URL(request.url);
    const seg = url.pathname.split('/').filter(Boolean);
    if(request.method==="OPTIONS") return new Response(null,{headers:CORS});
    if(seg.length < 1) return new Response("missing path",{status:400,headers:CORS});
    const path = seg.join('/');
    if(request.method==="GET"){
      const data = await getDoc(path);
      return new Response(JSON.stringify(data),{headers:{...CORS,"Content-Type":"application/json","Cache-Control":"no-store"}});
    }
    if(request.method==="POST"){
      const body = await request.json().catch(()=>({}));
      const field = body.field || "plays";
      await incDoc(path, field);
      const data = await getDoc(path);
      return new Response(JSON.stringify(data),{headers:{...CORS,"Content-Type":"application/json","Cache-Control":"no-store"}});
    }
    return new Response("Method not allowed",{status:405,headers:CORS});
  }
};
