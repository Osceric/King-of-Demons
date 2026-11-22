import {handle} from "./logic.js";
const CORS={"access-control-allow-origin":"*","access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS","access-control-allow-headers":"content-type","access-control-max-age":"86400"};
const json=(s,o)=>new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json","cache-control":"no-store",...CORS}});

/* one Durable Object per room (an online game, or one person's cloud save) */
export class Room{
 constructor(state){this.state=state}
 async fetch(request){
  const u=new URL(request.url),op=u.pathname.split("/").pop();
  let body={};if(request.method==="POST"||request.method==="PUT"){try{body=await request.json()}catch(e){return json(400,{ok:false,error:"The request body is not valid JSON."})}}
  const st=this.state.storage;
  const [status,out]=await this.state.blockConcurrencyWhile(()=>handle({get:k=>st.get(k),put:(k,v)=>st.put(k,v),delete:k=>st.delete(k)},{method:request.method,op,q:u.searchParams,body}));
  return json(status,out)}}

/* /api/room/<name>/<op> goes to that room; everything else is the game page itself */
export default{
 async fetch(request,env){
  const u=new URL(request.url);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
  const m=u.pathname.match(/^\/api\/room\/([A-Za-z0-9_-]{4,64})\/([a-z]+)$/);
  if(m){
   const len=+request.headers.get("content-length")||0;if(len>2000000)return json(413,{ok:false,error:"Too large."});
   return env.ROOM.get(env.ROOM.idFromName(m[1])).fetch(request)}
  if(u.pathname.startsWith("/api/"))return json(404,{ok:false,error:"Unknown request."});
  return env.ASSETS.fetch(request)}};
