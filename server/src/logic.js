/* King of Demons online relay: the rules of the server, kept free of any Cloudflare API so they can be tested in plain Node.
   One "room" is either an online game or a cloud save. Storage is anything with async get/put/delete (a Durable Object's storage, or a Map in the tests).
   The server never runs the game. The Game Master's browser still resolves turns; the server only holds what is passed between the people:
   each seat's latest turn view, the orders each seat has sent, and who has sent them. */

const ALPHA="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const newKey=(n=12)=>{const b=new Uint8Array(n);crypto.getRandomValues(b);let s="";for(const x of b)s+=ALPHA[x%ALPHA.length];return s};
const same=(a,b)=>{a=String(a||"");b=String(b||"");if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0};
const CHUNK=100000,MAXBLOB=1500000,MAXCODE=250000,MAXSEATS=8;
const ok=(o)=>[200,Object.assign({ok:true},o||{})],bad=(c,m,x)=>[c,Object.assign({ok:false,error:m},x||{})];

async function putBig(st,name,str){const n=Math.ceil(str.length/CHUNK)||1,was=(await st.get(`${name}:n`))||0;for(let i=n;i<was;i++)await st.delete(`${name}:${i}`);/* a smaller value leaves no old chunks behind */
 for(let i=0;i<n;i++)await st.put(`${name}:${i}`,str.slice(i*CHUNK,(i+1)*CHUNK));await st.put(`${name}:n`,n)}
async function getBig(st,name){const n=await st.get(`${name}:n`);if(!n)return null;let s="";for(let i=0;i<n;i++)s+=(await st.get(`${name}:${i}`))||"";return s}

/* who is calling: "gm", a seat number, or null */
function who(meta,k,seatParam){
 if(!meta||!k)return null;
 if(same(meta.gm,k))return{role:"gm",seat:seatParam==null||seatParam===""?null:+seatParam};
 const i=meta.seats.findIndex(s=>same(s.key,k));return i>=0?{role:"seat",seat:i}:null}

export async function handle(st,{method,op,q,body}){
 const meta=await st.get("meta"),now=Date.now();
 q=q||new URLSearchParams();body=body||{};
 /* ---- cloud saves: one secret key per save, set by the first PUT ---- */
 if(op==="save"){
  const k=q.get("k")||"";if(k.length<8)return bad(400,"A save key of at least 8 characters is needed.");
  const own=await st.get("savekey");
  if(method==="GET"){if(!own)return bad(404,"No save here.");if(!same(own,k))return bad(403,"Wrong key.");const blob=await getBig(st,"blob");return ok({blob,at:await st.get("saveat"),info:await st.get("saveinfo")})}
  if(method==="PUT"||method==="POST"){
   if(typeof body.blob!=="string"||!body.blob.length)return bad(400,"Nothing to save.");
   if(body.blob.length>MAXBLOB)return bad(413,"That save is too large.");
   if(own&&!same(own,k))return bad(403,"Wrong key.");
   if(!own)await st.put("savekey",k);
   await putBig(st,"blob",body.blob);await st.put("saveat",now);await st.put("saveinfo",typeof body.info==="object"&&body.info?{turn:body.info.turn|0,no:String(body.info.no||"").slice(0,40)}:null);
   return ok({at:now})}
  if(method==="DELETE"){if(!own)return ok();if(!same(own,k))return bad(403,"Wrong key.");await st.delete("savekey");await st.delete("saveat");await st.delete("saveinfo");const n=await st.get("blob:n")||0;for(let i=0;i<n;i++)await st.delete(`blob:${i}`);await st.delete("blob:n");return ok()}
  return bad(405,"Method not allowed.")}
 /* ---- online games ---- */
 if(op==="init"){
  if(method!=="POST")return bad(405,"Use POST.");
  if(meta)return bad(409,"That game already exists.");
  const n=body.seats|0;if(n<2||n>MAXSEATS)return bad(400,`A game needs 2 to ${MAXSEATS} human seats.`);
  const names=Array.isArray(body.names)?body.names:[];
  const m={gm:newKey(14),seats:Array.from({length:n},(_,i)=>({key:newKey(10),name:String(names[i]||`Seat ${i+1}`).slice(0,40)})),turn:0,made:now,no:String(body.no||"").slice(0,40)};
  await st.put("meta",m);
  return ok({gm:m.gm,seats:m.seats.map(s=>({key:s.key,name:s.name}))})}
 if(!meta)return bad(404,"No such game.");
 const me=who(meta,q.get("k"),q.get("s"));if(!me)return bad(403,"Wrong key.");
 const seatNo=me.role==="seat"?me.seat:me.seat;
 const orders=(await st.get("orders"))||{};
 if(op==="status"){
  return ok({turn:meta.turn,no:meta.no,at:meta.pubat||null,seats:meta.seats.map((s,i)=>({name:s.name,submitted:!!orders[i]&&orders[i].turn===meta.turn})),role:me.role,seat:me.role==="seat"?me.seat:null})}
 if(op==="publish"){/* the Game Master posts the new turn: one view code per seat */
  if(method!=="POST")return bad(405,"Use POST.");if(me.role!=="gm")return bad(403,"Only the Game Master can publish a turn.");
  const t=body.turn|0,v=body.views;if(!Array.isArray(v)||v.length!==meta.seats.length)return bad(400,"One view per seat is needed.");
  if(t<meta.turn)return bad(409,"That turn is older than the one on the server.",{turn:meta.turn});
  for(const c of v)if(typeof c!=="string"||c.length>MAXCODE)return bad(413,"A view is missing or too large.");
  for(let i=0;i<v.length;i++)await putBig(st,`view${i}`,v[i]);
  meta.turn=t;meta.pubat=now;await st.put("meta",meta);await st.put("orders",{});
  return ok({turn:t})}
 if(op==="view"){
  const s=me.role==="seat"?me.seat:me.seat;if(s==null||s<0||s>=meta.seats.length)return bad(400,"Which seat?");
  const code=await getBig(st,`view${s}`);if(code==null)return bad(404,"No turn has been published yet.",{turn:meta.turn});
  return ok({turn:meta.turn,at:meta.pubat,code})}
 if(op==="orders"){
  if(method==="POST"||method==="PUT"){
   const s=me.role==="seat"?me.seat:me.seat;if(s==null||s<0||s>=meta.seats.length)return bad(400,"Which seat?");
   const t=body.turn|0;if(t!==meta.turn)return bad(409,"These orders are for another turn.",{turn:meta.turn});
   if(typeof body.code!=="string"||!body.code.length||body.code.length>MAXCODE)return bad(400,"The orders are missing or too large.");
   orders[s]={turn:t,code:body.code,at:now};await st.put("orders",orders);return ok({turn:meta.turn})}
  if(method==="GET"){if(me.role!=="gm")return bad(403,"Only the Game Master can collect orders.");
   return ok({turn:meta.turn,orders:meta.seats.map((_,i)=>orders[i]&&orders[i].turn===meta.turn?{code:orders[i].code,at:orders[i].at}:null)})}
  return bad(405,"Method not allowed.")}
 return bad(404,"Unknown request.")}
