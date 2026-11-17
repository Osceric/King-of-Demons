
/* ===== PDF EXPORT (Report, Realm, Standing) ===== */
let DL=null;
const pAsc=s=>String(s).replace(/[–—−]/g,"-").replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[·•]/g,"|").replace(/…/g,"...").replace(/×/g,"x").replace(/→/g,"->").replace(/▲\s*/g,"up ").replace(/▼\s*/g,"down ").replace(/[▴▾]/g,"").replace(/[^\x20-\x7e]/g,"?");
const pEsc=s=>pAsc(s).replace(/[\\()]/g,"\\$&");
function pdfText(root){
 const out=[],SKIP=/^(SVG|STYLE|SCRIPT|SELECT|INPUT|TEXTAREA|BUTTON)$/,INL=/^(SPAN|A|B|I|EM|STRONG|CODE|SMALL|BR)$/;
 const clean=s=>s.replace(/\s+/g," ").trim(),push=(s,o)=>{s=clean(s);if(s)out.push(Object.assign({s},o))};
 function table(t,ind){
  const rows=[...t.rows].map(r=>[...r.cells].map(c=>({s:clean([...c.childNodes].map(x=>x.textContent).join(" ")),r:c.classList.contains("r")})));if(!rows.length)return;
  const n=Math.max(...rows.map(r=>r.length)),w=Array(n).fill(0);
  rows.forEach(r=>r.forEach((c,i)=>w[i]=Math.max(w[i],c.s.length)));
  const cap=Math.max(8,Math.floor((150-ind-3*(n-1))/n));
  for(let i=0;i<n;i++)w[i]=Math.min(w[i],i<2?Math.max(cap,26):cap);
  const fit=(c,i)=>{let s=c.s.length>w[i]?c.s.slice(0,w[i]-2)+"..":c.s;return c.r?s.padStart(w[i]):s.padEnd(w[i])};
  rows.forEach((r,ri)=>{const l=r.map((c,i)=>fit(c,i)).join(" | ").replace(/\s+$/,"");out.push({s:l,ind,b:ri===0,mono:1});if(ri===0)out.push({s:"-".repeat(Math.min(150,l.length)),ind,mono:1})});out.push({s:"",gap:1})}
 function kids(n,ind){let buf="",pe=false;const fl=()=>{push(buf,{ind});buf="";pe=false};
  for(const c of n.childNodes){
   if(c.nodeType===3){buf+=c.textContent;pe=false}
   else if(c.nodeType===1&&INL.test(c.tagName)&&!SKIP.test(c.tagName.toUpperCase())){buf+=(pe?" ":"")+c.textContent;pe=true}
   else{fl();walk(c,ind)}}
  fl()}
 function walk(n,ind){
  if(n.nodeType!==1||n.hidden)return;const tag=n.tagName.toUpperCase();if(SKIP.test(tag))return;
  if(tag==="TABLE"){table(n,ind);return}
  if(/^H[1-3]$/.test(tag)){out.push({s:"",gap:1});push(n.textContent,{h:tag==="H2"||tag==="H1"?1:2,ind});return}
  const cl=n.classList;
  if(cl.contains("line")){const pill=n.querySelector(".pill"),d=n.children[1];if(!d)return;const c=d.cloneNode(true);c.querySelectorAll(".battle").forEach(x=>x.remove());
   push("["+clean((pill?pill.textContent:"").replace(/[▴▾]/g,""))+"] "+c.textContent,{ind});const b=d.querySelector(".battle");if(b){out.push({s:"",gap:1});walk(b,ind+4);out.push({s:"",gap:1})}return}
  if(cl.contains("att")){const t=n.querySelector(".t");push("* "+(t?t.textContent:n.textContent),{ind});return}
  if(cl.contains("stat")){push([...n.children].map(c=>c.textContent).join(" "),{ind});return}
  if(cl.contains("bt-h")){push(n.textContent,{h:2,ind});return}
  kids(n,ind)}
 kids(root,0);return out}
function pdfWrap(lines,max){const o=[];
 for(const L of lines){const ind=L.ind||0,w=max-ind;
  if(L.mono||L.s.length<=w){o.push(Object.assign({},L,{s:L.s.slice(0,max)}));continue}
  let rest=L.s,first=true;while(rest.length>w){let k=rest.lastIndexOf(" ",w);if(k<w*.4)k=w;o.push(Object.assign({},L,{s:rest.slice(0,k).trimEnd(),ind:ind+(first?0:2),h:first?L.h:0}));rest=rest.slice(k).trimStart();first=false}
  o.push(Object.assign({},L,{s:rest,ind:ind+(first?0:2),h:first?L.h:0}))}
 return o}
function buildPdf(sections,head){
 const W=841.89,H=595.28,ML=36,CW=4.8,SZ=8,pages=[];
 let cur=null,y=0;const np=()=>{cur=[];pages.push(cur);y=H-52},lh=l=>l.gap?5:l.h===1?17:l.h===2?13:10.5;
 for(const sec of sections){np();
  cur.push({s:sec.title.toUpperCase(),x:ML,y,b:1,sz:14});y-=20;
  for(const l of pdfWrap(sec.lines,Math.floor((W-2*ML)/CW))){const h=lh(l);if(y-h<40){np()}
   if(l.gap&&y>H-52-1)continue;y-=h;if(l.gap)continue;
   cur.push({s:l.s,x:ML+(l.ind||0)*CW,y:y+2,b:l.b||l.h,sz:l.h===1?11:l.h===2?9:SZ})}}
 const N=pages.length,objs=[];
 objs[1]="<< /Type /Catalog /Pages 2 0 R >>";
 objs[2]=`<< /Type /Pages /Kids [${pages.map((p,i)=>`${6+2*i} 0 R`).join(" ")}] /Count ${N} >>`;
 objs[3]="<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>";
 objs[4]="<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>";
 pages.forEach((p,i)=>{
  let c=`0.45 g BT /F1 7 Tf 1 0 0 1 ${ML} ${H-26} Tm (${pEsc(head)}) Tj ET BT /F1 7 Tf 1 0 0 1 ${W-ML-60} 22 Tm (Page ${i+1} of ${N}) Tj ET 0 g\n`;
  for(const t of p)c+=`BT /F${t.b?2:1} ${t.sz} Tf 1 0 0 1 ${t.x.toFixed(1)} ${t.y.toFixed(1)} Tm (${pEsc(t.s)}) Tj ET\n`;
  objs[5+2*i]=`<< /Length ${c.length} >>\nstream\n${c}endstream`;
  objs[6+2*i]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${5+2*i} 0 R >>`});
 let s="%PDF-1.4\n";const off=[];
 for(let i=1;i<objs.length;i++){off[i]=s.length;s+=`${i} 0 obj\n${objs[i]}\nendobj\n`}
 const x=s.length;s+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`+off.slice(1).map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("")+`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
 const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;return new Blob([u],{type:"application/pdf"})}
async function exportPdf(){
 const btn=$("#pdfbtn");if(!DL||!btn)return;const sv={tab:UI.tab,rep:UI.rep,filter:UI.filter,sel:UI.sel,open:Object.assign({},UI.open)};
 const secs=[];
 try{
  UI.sel=null;
  for(const [t,title] of [["report","Report"],["realm","Realm"],["standing","Standing"]]){
   UI.tab=t;
   if(t==="report"){UI.filter="all";const R=G.reports,r=R[UI.rep==null?R.length-1:UI.rep];r.events.forEach((e,i)=>{if(e.battle)UI.open[r.turn+":"+i]=true})}
   ({report:renderReport,realm:renderRealm,standing:renderStanding})[t]();
   secs.push({title,lines:pdfText($("#main"))})}
 }finally{Object.assign(UI,sv);renderAll()}
 const R=G.reports,r=R[sv.rep==null?R.length-1:sv.rep],head=`King of Demons - Game No. ${G.no}v${GAME_VERSION} - ${G.players[0].name} - Turn ${G.turn} - Report shown: ${r.turn?"Turn "+r.turn:"Opening briefing"}`;
 const blob=buildPdf(secs,head),b2=$("#pdfbtn");
 try{await DL.save({filename:`KoD-game-${G.no}-turn-${G.turn}.pdf`,data:blob});if(b2){b2.textContent="PDF saved";setTimeout(()=>{const b=$("#pdfbtn");if(b)b.textContent="Export PDF"},2500)}}
 catch(e){if(b2&&e&&e.code!=="declined"){b2.textContent="PDF not saved";setTimeout(()=>{const b=$("#pdfbtn");if(b)b.textContent="Export PDF"},3000)}}}
function plainSave({filename,data}){return new Promise((ok,no)=>{try{const u=URL.createObjectURL(data),a=document.createElement("a");a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);ok({status:"saved"})}catch(e){no({code:"unavailable"})}})}
/* Inside claude.ai the page gets a sandboxed save step. On any other host (own site, local file) a normal browser download is used. */
function initPdf(){try{
 if(window.claude&&claude.use){claude.use("downloads").then(d=>{if(d){DL=d;renderHeader()}}).catch(()=>{})}
 else{DL={save:plainSave};renderHeader()}}catch(e){}}
