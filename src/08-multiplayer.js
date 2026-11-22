/* ===== MULTIPLAYER (MPG): game master (GM) and player modes ===== */
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const b64u=u=>{let s="";for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const unb64u=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
async function pack(o){const raw=new TextEncoder().encode(JSON.stringify(o));
 if(typeof CompressionStream==="function"){const cs=new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"));return"KZ1."+b64u(new Uint8Array(await new Response(cs).arrayBuffer()))}
 return"KJ1."+b64u(raw)}
async function unpack(s){s=String(s||"");const m=s.match(/-----BEGIN KOD (?:TURN |ORDERS |RESULT |SAVE )?CODE-----([\s\S]*?)-----END KOD (?:TURN |ORDERS |RESULT |SAVE )?CODE-----/);if(m)s=m[1];s=s.replace(/\s+/g,"");const i=s.indexOf(".");if(i<0)throw new Error("That does not look like a King of Demons code.");
 const tag=s.slice(0,i),u=unb64u(s.slice(i+1));
 if(tag==="KZ1"){const ds=new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"));return JSON.parse(await new Response(ds).text())}
 if(tag==="KJ1")return JSON.parse(new TextDecoder().decode(u));throw new Error("Unknown code format.")}
const wrapCode=(c,k="TURN")=>`-----BEGIN KOD ${k} CODE-----\n${c.replace(/(.{72})/g,"$1\n")}\n-----END KOD ${k} CODE-----`;
const plain=t=>String(t||"").replace(/\[\[P:([^\]]+)\]\]/g,"$1").replace(/\[\[H:([^\]]+)\]\]/g,"a horde").replace(/\[\[X:(\d+)\]\]/g,(m,n)=>G.players[+n]?G.players[+n].name.split(" ")[0]:"a rival");
const clone2=o=>o===undefined?null:JSON.parse(JSON.stringify(o));

/* ---- GM side: the fogged per-seat view (seat s is swapped with seat 0) ---- */
function viewFor(s){
 const sw=n=>n===s?0:n===0?s:n;
 const walk=o=>{if(Array.isArray(o))return o.map(walk);
  if(o&&typeof o==="object"){const r={};for(const k in o){const v=o[k];r[k]=(k==="owner"||k==="o"||k==="seat")&&typeof v==="number"?sw(v):walk(v)}return r}
  return typeof o==="string"?o.replace(/\[\[X:(\d+)\]\]/g,(m,n)=>`[[X:${sw(+n)}]]`):o};
 const real=G.players[s],known=real.known||{};
 const planes={};
 for(const id in G.planes){const p=G.planes[id];
  if(p.owner===s){planes[id]=walk(clone2(p));continue}
  const o={id:p.id,x:p.x,y:p.y,links:p.links,name:p.name,short:p.short};
  if(known[id]&&known[id].q!=null)o.q=p.q;planes[id]=o}
 const players=G.players.map((_,i)=>{const r=G.players[sw(i)],o=clone2(r);o.id=i;o.ai=!r.human;o.color=`var(--c${i})`;o.human=i===0;delete o.email;delete o.reports;delete o.echoP;o.met=(r.met||[]).map(sw);
  if(i!==0){o.shs=Math.round(shadowStr(sw(i)));for(const k of["princely","shadowCmd","known","prev","pendS","scryR","lastP","shadow","unleash","shadowRes","noOrders","pk","strat"])delete o[k];if(!(real.pk&&real.pk[sw(i)]))delete o.pers}
  else{if(r.pk){o.pk={};for(const q in r.pk)o.pk[sw(+q)]=r.pk[q]}o.known=walk(clone2(r.known||{}));delete o.prev;if(r.sh){o.sh={};for(const q in r.sh)o.sh[sw(+q)]=r.sh[q]}}
  return o});
 const reps=repsOf(s),last=reps[reps.length-1];
 return{seed:0,ver:G.ver,pal:G.players.map((_,i)=>i===0?0:(G.pal?G.pal[sw(i)===0?s:sw(i)]:i)),fv:G.over?G.players.map((_,i)=>vp(sw(i))):null,no:G.no,turn:G.turn,planes,hordes:hordesOf(s).map(h=>{const o=clone2(h);o.owner=0;return o}),nextH:G.nextH,usedGen:G.usedGen,players,
  bonds:(G.bonds||[]).filter(k=>k.a===s||k.b===s).map(k=>({a:sw(k.a),b:sw(k.b),from:k.from,until:k.until,inc:k.inc})),reports:[walk(clone2(last))],prev:walk(clone2(s===0?G.prev:real.prev||null)),log:[],everDom:G.everDom,end:G.end?walk(clone2(G.end)):null,over:G.over,usedNpcN:[],ev:[],
  mpg:{seat:s,gm:G.no},cfg:G.cfg||{nx:10,ny:6},vpr:vpRank(s),due:G.ol&&G.ol.due||null}}

/* ---- GM side: orders in ---- */
const PCH_OK=t=>t===""||(typeof PCH==="object"&&PCH[t]!==undefined)||t==="UNLEASH";
function applyOrders(o){
 if(!o||o.k!=="ord")throw new Error("This is not an orders code.");
 if(o.g!==G.no)throw new Error(`This orders code is for game ${o.g}, not game ${G.no}.`);
 if(o.t!==G.turn)throw new Error(`This orders code is for turn ${o.t}; the game is on turn ${G.turn}.`);
 const s=o.s;if(!HUM(s))throw new Error("That seat is not a human prince.");
 const P=G.players[s];if(P.elim){(G.got||(G.got={}))[s]=Date.now();return P.name}
 for(const h of hordesOf(s)){const c=o.h&&o.h[h.id];if(c&&typeof c==="object"&&typeof c.type==="string")h.cmd=c}
 const sw=n=>n===s?0:n===0?s:n;
 const pl=(Array.isArray(o.p)?o.p:[]).slice(0,4).map(c=>{const r={type:PCH_OK(c&&c.type)?c.type:"",souls:Math.max(0,Math.floor(+(c&&c.souls)||0))};if(r.type==="UNLEASH"){r.cls=c&&c.cls==="F"?"F":"H";r.name=cleanName(c&&c.name)}if(r.type==="FORGE"){r.target=Number.isInteger(c.target)?sw(c.target):null;r.souls=forgeCost(G.turn)}return r});
 while(pl.length<4)pl.push({type:"",souls:0});
 P.princely=pl;P.shadowCmd=o.sc&&typeof o.sc.type==="string"?o.sc:null;if(P.shadowCmd&&P.shadowCmd.type==="SUMMON")P.shadowCmd.type="SSUMMON";
 (G.got||(G.got={}))[s]=Date.now();return P.name}

/* ---- Mail (copyable; Gmail drafts when the connector is available) ---- */
async function mailFor(s,link){
 link=String(link||"").split("#")[0]+"#play";
 const P=G.players[s],reps=repsOf(s),r=reps[reps.length-1],code=await pack({k:"turn",v:viewFor(s)});
 const body=`Hail, ${P.name}.

Turn ${G.turn} of King of Demons (game ${G.no}) is ready for your orders.

${plain(r.headline)}

HOW TO PLAY YOUR TURN
1. Open the game: ${link}
2. Paste the KOD Turn Code below into the box and press Load.  You can include the begin and end lines.
3. Read your Report, select your Orders, then press "Finalize Orders and Make KOD Orders Code".
4. Reply to this email, in the body of the reply email paste the KOD Orders Code created in the previous step.

${wrapCode(code)}
`;
 return{s,to:P.email,subject:`King of Demons - Game ${G.no} - Turn ${G.turn} - ${P.name}`,body,size:code.length}}

/* ---- Player side ---- */
async function loadTurn(text){
 const d=await unpack(text);if(!d||d.k!=="turn"||!d.v)throw new Error("This is not a turn code.");
 const V=d.v;if(!verOK(V.ver))throw new Error("This game was started in version 1.81 or earlier of King of Demons, which this version can no longer play. Ask your Game Master to start a new game.");let old=null;try{old=JSON.parse(localStorage.getItem("kodP")||"null")}catch(e){}
 if(old&&old.no===V.no&&old.reports){ if(old.turn>=V.turn)throw new Error(`You already loaded turn ${old.turn}. This code is for turn ${V.turn}.`);
  V.reports=old.reports.concat(V.reports)}
 closeModal();setDims(V.cfg&&V.cfg.nx,V.cfg&&V.cfg.ny);oldKey(V);G=V;UI.rep=null;UI.tab="report";UI.filter="all";save();renderAll();window.scrollTo(0,0)}
async function makeOrders(){const P=G.players[0];
 return pack({k:"ord",g:G.no,t:G.turn,s:G.mpg.seat,h:Object.fromEntries(hordesOf(0).map(h=>[h.id,h.cmd])),p:P.princely,sc:P.shadowCmd||null})}

/* ---- UI plumbing ---- */
/* ---- result codes: a record of a game that a player can send back ---- */
const resObj=()=>({k:"res",v:G.ver,g:G.no,sd:G.seed0,cfg:G.cfg,mode:MODE,turn:G.turn,over:!!G.over,end:G.end?G.end.reason:null,at:Date.now(),
 pl:G.players.map((p,i)=>{let v=null,pn=null;try{if(MODE!=="player"||i===0||G.fv)v=(G.fv&&G.fv[i])||vp(i)}catch(e){}try{if(MODE!=="player"||i===0)pn=ownedPlanes(i).length}catch(e){}return{n:p.name,h:p.human?1:0,rk:p.rank,vp:v?v.total:null,pa:v?v.parts.map(x=>[x[0],x[1]]):[],pn}}),hist:G.hist||[]});
function resHTML(o){const f=n=>n==null?"–":fmt0(n),pl=o.pl||[],sc=pl.map((p,i)=>({p,i})).sort((a,b)=>(b.p.vp||0)-(a.p.vp||0));
 const ord=t=>[...(t.p||[]).map(c=>`${c[0]} ${f(c[1])}${c[2]!=null?" → "+c[2]:""}${c[3]?" ("+c[3]+")":""}`),...(t.h||[]).map(h=>`H${h[0]} ${h[1]}${h[2]?" "+h[2]:""}`),...(t.s?[`${t.s[0]} ${f(t.s[1])}`]:[])].join("; ");
 return`<div class="card"><h3 style="margin-top:0">${esc(pl[0]?pl[0].n:"Player")}'s game</h3><p class="note">Game No. ${esc(o.g)}, version ${esc(o.v)}, seed ${esc(o.sd)}, map ${esc(o.cfg&&o.cfg.nx)}×${esc(o.cfg&&o.cfg.ny)}, mode ${esc(o.mode)}. ${o.over?"Finished":"In progress"} after ${Math.max(0,(o.turn||1)-(o.over?1:0))} turns${o.end?`. Ending trigger: ${esc(o.end)}`:""}. Recorded ${esc(new Date(o.at||0).toLocaleString())}.</p>
 <table><tr><th>#</th><th>Prince</th><th class="r">Points</th><th class="r">Chaos</th><th class="r">Planes</th></tr>${sc.map((x,k)=>`<tr><td>${k+1}</td><td>${esc(x.p.n)}${x.p.h?"":" (NPC)"}</td><td class="r">${f(x.p.vp)}</td><td class="r">${f(x.p.rk)}</td><td class="r">${f(x.p.pn)}</td></tr>`).join("")}</table>
 ${sc.map(x=>x.p.pa&&x.p.pa.length?`<details><summary>${esc(x.p.n)}: points breakdown</summary><p class="note">${x.p.pa.map(r=>`${esc(r[0])} ${f(r[1])}`).join("; ")}</p></details>`:"").join("")}</div>
 <div class="card"><h3 style="margin-top:0">Turn by turn</h3>${(o.hist||[]).length?`<div class="rtw"><table class="rt"><tr><th>Turn</th><th>Orders given</th>${pl.map(p=>`<th class="r">${esc(p.n)}</th>`).join("")}</tr>${o.hist.map(t=>`<tr><td>${t.t}</td><td>${esc(ord(t))||"No orders"}</td>${pl.map((_,i)=>`<td class="r">${t.v?f(t.v[i]):"–"}</td>`).join("")}</tr>`).join("")}</table></div>`:`<p class="note">No turn history was recorded for this game.</p>`}</div>`}
const copyText=async(txt,btn)=>{let ok=false;try{await navigator.clipboard.writeText(txt);ok=true}catch(e){const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();try{ok=document.execCommand("copy")}catch(e2){}ta.remove()}
 if(btn){const o=btn.textContent;btn.textContent=ok?"Copied":"Select and copy by hand";setTimeout(()=>btn.textContent=o,1600)}};
const st=document.createElement("style");st.textContent=`body.pl [data-act=newgame],body.pl [data-act=playagain]{display:none}
.mp{max-width:880px;margin:0 auto;padding:0 0 60px}.mp h2{margin:.2em 0}.mp textarea{width:100%;min-height:90px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:8px;font:12px/1.35 ui-monospace,Menlo,Consolas,monospace}
.mp input[type=text],.mp input[type=email],.mp select{background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:6px 8px;font:13px var(--body);width:100%;box-sizing:border-box}
.opt{margin:12px 0;padding:12px 14px;border:1px solid var(--line);border-left-width:8px;border-radius:6px;background:var(--panel2)}.opt .btn{display:block;width:100%;white-space:normal;box-sizing:border-box;text-align:left;font-size:15px;font-weight:600;padding:10px 12px;color:#1a0f12;border:0}.opt .od{margin-top:8px;font-size:13px;line-height:1.4;color:var(--ink)}.opt input{margin-top:8px}
.o-go{border-left-color:#80c47b;background:rgba(128,196,123,.10)}.o-go .btn{background:#80c47b}.o-solo{border-left-color:#e8782e;background:rgba(232,120,46,.12)}.o-solo .btn{background:#e8782e}.o-join{border-left-color:#4fb3bf;background:rgba(79,179,191,.12)}.o-join .btn{background:#4fb3bf}.o-gm{border-left-color:#dcae52;background:rgba(220,174,82,.12)}.o-gm .btn{background:#dcae52}.o-cloud{border-left-color:#a78bd6;background:rgba(167,139,214,.12)}.o-cloud .btn{background:#a78bd6}
.opt .btn:hover{filter:brightness(1.12)}
.mp .seat{display:grid;grid-template-columns:70px 1.3fr 1.2fr 100px;gap:8px;align-items:center;margin:6px 0}@media(max-width:640px){.mp .seat{grid-template-columns:1fr 1fr}}
.mp .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.mp .ok{color:var(--good,#7bc47f)}.mp .wait{color:var(--gold)}.mp .msg{margin:8px 0;padding:8px;border-radius:4px;background:var(--panel2)}.mp .bad{color:var(--bad,#e5675b)}
.mp pre{white-space:pre-wrap;word-break:break-all;max-height:160px;overflow:auto;background:var(--panel2);padding:8px;border-radius:4px;font-size:11px}
.mpmodal{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:50;display:flex;align-items:flex-start;justify-content:center;padding:6vh 12px;overflow:auto}.mpmodal>div{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:16px;max-width:640px;width:100%}`;
document.head.appendChild(st);

function setMode(m){MODE=m;try{localStorage.setItem("kodMode",m)}catch(e){}document.body.classList.toggle("pl",m==="player");loadG();renderAll();window.scrollTo(0,0)}
/* games saved before v56 used the old demon table (Pazu, no classes): carry them over so they still open */
const oldKey=o=>{const k="le"+"ague";if(o&&o[k]&&!o.mpg){o.mpg=o[k];delete o[k]}};/* turn codes and saves made before the multiplayer flag was renamed */
function loadG(){G=null;try{const s=localStorage.getItem(SK());if(s){G=JSON.parse(s);if(!G||!G.planes||!G.reports)throw 0;oldKey(G)}}catch(e){G=null}
 window.DIAG={store:"ok",had:!!G,boots:0,last:null};try{const k="kodBoot",l=JSON.parse(localStorage.getItem(k)||"[]");DIAG.boots=l.length;DIAG.last=l.length?l[l.length-1].t:null;l.push({t:Date.now(),had:!!G,v:GAME_VERSION});localStorage.setItem(k,JSON.stringify(l.slice(-8)));if(localStorage.getItem(k)==null)throw 0}catch(e){DIAG.store="blocked"}
 window.OLDGAME=false;if(G&&!verOK(G.ver)){G=null;window.OLDGAME=true;try{localStorage.removeItem(SK())}catch(e){}}
 if(G)for(const h of G.hordes||[]){if(h.abA&&!ABIL[h.abA])h.abA=null;if(h.abE&&!ABIL[h.abE])h.abE=null}/* removed abilities (Pathfinder) vanish from old saves *//* 1.82–1.87 saves */
 if(G&&G.cfg)setDims(G.cfg.nx,G.cfg.ny);else setDims();
 if(!G&&MODE==="solo"){newGame();save()}else if(G&&MODE==="solo")updateKnow()}
const _ra=renderAll;
renderAll=function(){
 try{applyPal(G&&G.pal)}catch(e){}
 if(MODE==="gm"){renderGMHeader();return renderGM()}
 if(MODE==="player"&&!G){renderJoinHeader();return renderJoin()}
 _ra();if(MODE==='solo'&&G&&G.askName&&!G.mpg&&!$('#mpmodal'))modal(`<h2>Name your demon prince</h2><p class="sub">${window.OLDGAME?"Your saved game came from version 1.81 or earlier, which can no longer be played, so a new game has begun. ":""}Choose the name you will rule under, or keep the one the Abyss gave you, then choose your rivals.</p>${window.DIAG&&window.DIAG.store==="blocked"?`<p class="note" style="color:#e8604c">This browser is not letting the page save your game, so reloading or closing the tab will start a new one.</p>`:(window.DIAG&&window.DIAG.boots>0&&!window.OLDGAME?`<p class="note">No saved game was found, although this browser last opened King of Demons on ${new Date(window.DIAG.last).toLocaleString()}.</p>`:"")}<input type="text" id="pname" maxlength="40" value="${esc(G.players[0].name)}" aria-label="Prince name"><h2 style="margin-top:18px">Your rivals</h2><p class="note" style="margin:0 0 8px">Choose how dangerous each rival prince will be. The details of its strategy remain a secret.</p><p class="note" style="margin:0 0 8px">NOTE: A small minority of princes may also have Craven and Spiteful or Vengeful personalities, which are separate from their danger level. A personality is revealed when you can see one of their planes, either by being adjacent or by using the SCRY command.</p>${G.players.slice(1).map((p,i)=>`<div style="margin:8px 0"><div style="color:var(--c${i+1});margin-bottom:3px">${esc(p.name)}</div><select id="dg${i}" style="width:100%;max-width:100%" aria-label="Danger level of ${esc(p.name)}">${DANGER.map((d,k)=>`<option value="${k}"${k===DANGER_DEF?" selected":""}>Danger Level: ${d.n}</option>`).join("")}</select></div>`).join("")}<div class="row"><button class="btn pri" data-mp="pname">Begin</button></div>`)};
const _rh=renderHeader;
/* The Multiplayer button shows only in the Test build, or where it was switched on by opening the game with #mp (remembered in this browser), or when this browser is already in Game Master or player mode. */
const MPOK=(typeof TEST_BUILD!=="undefined"&&TEST_BUILD)||(()=>{try{if(location.hash==="#mp")localStorage.setItem("kodMP","1");return localStorage.getItem("kodMP")==="1"}catch(e){return location.hash==="#mp"}})();
const mtBtn=()=>typeof TEST_BUILD!=="undefined"&&TEST_BUILD?`<button class="btn sm" data-mp="maint">Maintenance</button>`:"";
const mpBtn0=st=>MPOK||OL.on||MODE!=="solo"?`<button class="btn sm" data-mp="menu"${st||""}>Multiplayer</button>`:"";
const mpBtn=st=>mpBtn0(st)+mtBtn();
renderHeader=function(){_rh();const t=$("#tabs");if(t)t.insertAdjacentHTML("beforeend",MODE==="player"?`<button class="btn sm" data-mp="turnbox" style="margin-left:auto">Load turn code</button>${olHdr()}${mtBtn()}`:mpBtn(` style="margin-left:auto"`))};
function bareHeader(sub){$("#gameno").textContent=G&&G.no?`Game No. ${G.no}v${GAME_VERSION}`:`King of Demons v${GAME_VERSION}`;$("#prince").innerHTML=sub;$("#meters").innerHTML="";$("#tabs").innerHTML=MODE==="player"?"":mpBtn();$("#over").hidden=true}
function renderGMHeader(){bareHeader(`<b>Game Master</b>${G&&G.mpg?` · turn ${G.turn}`:""}`)}
function renderJoinHeader(){bareHeader("<b>Play in a friend's game</b>")}
function renderJoin(){$("#main").innerHTML=`<div class="mp"><h2>Join a game</h2>${olPl()&&OL.on?`<p class="note">Looking for your game on the server…</p>`:""}<p class="sub">Paste the KOD Turn Code from your Game Master's email, then press Load.</p><textarea id="tcode" placeholder="-----BEGIN KOD TURN CODE-----"></textarea><div class="row"><button class="btn pri" data-mp="load">Load turn code</button></div><div id="mpmsg"></div></div>`}
const mpMsg=(t,bad)=>{const e=$("#mpmodal #mpmsg")||$("#mpmsg");if(e)e.innerHTML=t?`<div class="msg ${bad?"bad":""}">${t}</div>`:""};
const _dr=doResolve;
doResolve=function(){if(MODE==="player"&&G&&G.mpg)return showOrders();_dr()};
const _rs=renderSums;
renderSums=function(){_rs();if(MODE==="player"&&G.mpg){const b=$("#go");if(b){b.textContent=OL.on&&olPl()?`Submit Orders to Server`:`Finalize Orders and Make KOD Orders Code`}}};
const _vr=vpRank;
vpRank=function(p){return MODE==="player"&&G&&G.mpg&&p===0&&G.vpr!=null?G.vpr:_vr(p)};
function modal(html){let m=$("#mpmodal");if(m)m.remove();m=document.createElement("div");m.id="mpmodal";m.className="mpmodal";m.innerHTML=`<div class="mp">${html}</div>`;document.body.appendChild(m);m.addEventListener("click",e=>{if(e.target===m)m.remove()})}
const closeModal=()=>{const m=$("#mpmodal");if(m)m.remove()};
async function showOrders(){const c=wrapCode(await makeOrders(),"ORDERS");
 modal(`<h2>Your KOD Orders Code for turn ${G.turn}</h2><p class="sub">Copy this code and reply to your Game Master's email with it pasted into the body. You can change your orders and make a new code any time before the turn resolves.</p><textarea id="ocode" readonly>${esc(c)}</textarea><div class="row"><button class="btn pri" data-mp="copyo">Copy KOD Orders Code</button><button class="btn" data-mp="close">Close</button></div>`)}
function showMenu(){
 modal(`<h2>Multiplayer</h2><p class="sub">Choose how you want to play. Each choice keeps its own saved game, so switching never loses anything.</p>
 <div class="row"><button class="btn${MODE==="solo"?" pri":""}" data-mp="mode" data-m="solo">Solo game</button><button class="btn${MODE==="player"?" pri":""}" data-mp="mode" data-m="player">Join a multiplayer game</button><button class="btn${MODE==="gm"?" pri":""}" data-mp="mode" data-m="gm">Run a multiplayer game (Game Master)</button></div>
 ${MODE==="player"?`<div class="row"><button class="btn" data-mp="newturn">Load a new turn code</button></div>`:""}<div class="row">${olBtns()}</div><div class="row"><button class="btn" data-mp="close">Close</button></div>`)}

/* ===== ONLINE (Cloudflare): games without emailed codes, and cloud saves. Works only when this page is served by the King of Demons server; anywhere else (a Claude artifact, a file) it stays hidden and the code-passing game is unchanged. ===== */
const OL={on:false,chk:false,busy:0};
const olId=(n,a)=>{a=a||"abcdefghjkmnpqrstuvwxyz23456789";let s="";for(const x of crypto.getRandomValues(new Uint8Array(n)))s+=a[x%a.length];return s};
async function olApi(room,op,o){o=o||{};const q=new URLSearchParams();if(o.k)q.set("k",o.k);if(o.s!=null)q.set("s",o.s);if(o.id)q.set("id",o.id);let j;
 try{const r=await fetch(`${location.origin}/api/room/${encodeURIComponent(room)}/${op}?${q}`,{method:o.method||"GET",headers:o.body?{"content-type":"application/json"}:{},body:o.body?JSON.stringify(o.body):undefined});j=await r.json()}catch(e){throw new Error("Could not reach the game server.")}
 if(!j||typeof j!=="object"||!("ok" in j))throw new Error("Could not reach the game server.");
 if(!j.ok){const e=new Error(j.error||"Server error.");e.srv=true;throw e}return j}
async function olProbe(){if(OL.chk)return;OL.chk=true;if(!/^https?:$/.test(location.protocol))return;
 try{await olApi("probe","status")}catch(e){if(e.srv&&/No such game/.test(e.message))OL.on=true}}
function olToast(t){let e=document.getElementById("oltoast");if(!e){e=document.createElement("div");e.id="oltoast";e.style.cssText="position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:10px 14px;z-index:60;max-width:90vw;font-size:13px";document.body.appendChild(e)}e.textContent=t;e.hidden=false;clearTimeout(e._t);e._t=setTimeout(()=>e.hidden=true,7000)}
const olErr=err=>{if($("#mpmodal"))mpMsg(esc(err.message),1);else if(MODE==="gm"){GMX.msgs=[{t:err.message,bad:1}];renderGM()}else olToast(err.message)};
const olLink=i=>`${location.origin}${location.pathname}#o=${G.ol.room}.${G.ol.keys[i]}`;
const olBtns=()=>OL.on?`<button class="btn" data-ol="cloud">Save or load online…</button>`:"";
const olHdr=()=>OL.on&&olPl()?`<button class="btn sm" data-ol="check">Check for new turn</button>`:"";

/* GM side */
const DLD={on:true,h12:9,m:0,ap:"PM",n:2};
const dlObj=v=>{v=v||DLD;return v.on?{h:(v.h12%12)+(v.ap==="PM"?12:0),m:v.m|0,n:Math.max(1,v.n|0),h12:v.h12,ap:v.ap}:null};
/* next deadline: this time of day, at least n days (less 12 hours of slack) from now, so an early or late turn still lands on the same clock time */
function olNextDue(dl,from){from=from||Date.now();const t=from+dl.n*864e5-432e5,d=new Date(t);d.setHours(dl.h,dl.m,0,0);if(d.getTime()<t)d.setDate(d.getDate()+1);return d.getTime()}
const fdue=t=>new Date(t).toLocaleString([],{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
async function olCreate(v){const hs=humanSeats(),room="g"+olId(9);
 const j=await olApi(room,"init",{method:"POST",body:{seats:hs.length,names:hs.map(x=>G.players[x].name),no:String(G.no)}});
 G.ol={room,gm:j.gm,keys:j.seats.map(x=>x.key),at:{},auto:true,dl:dlObj(v),due:null};if(G.ol.dl)G.ol.due=olNextDue(G.ol.dl);save();await olPublish()}
async function olPublish(){const views=[];for(const x of humanSeats())views.push(await pack({k:"turn",v:viewFor(x)}));
 await olApi(G.ol.room,"publish",{k:G.ol.gm,method:"POST",body:{turn:G.turn,views}});G.ol.pub=G.turn;save()}
async function olCollect(){if(!G||!G.ol)return 0;const j=await olApi(G.ol.room,"orders",{k:G.ol.gm}),hs=humanSeats();let n=0;G.ol.at=G.ol.at||{};
 for(let i=0;i<hs.length;i++){const o=j.orders[i];if(!o||G.ol.at[hs[i]]===o.at)continue;
  try{applyOrders(await unpack(o.code));G.ol.at[hs[i]]=o.at;n++}catch(e){GMX.msgs=[{t:`${G.players[hs[i]].name}: ${e.message}`,bad:1}]}}
 if(n)save();return n}
function olCard(){const hs=humanSeats(),got=G.got||{};
 const dl=G.ol.dl;return`<div class="card"><h3>Online game</h3><div class="msg bad"><b>Keep this page open.</b> This page collects the orders and resolves every turn. If you close it, orders wait on the server and no turn resolves, not even at the deadline, until you open this page again. Then any overdue turn resolves at once. Use a computer that stays awake, and leave this tab open.</div><p class="note">Send each prince their own link. Opening it shows their turn and sends their orders here automatically (this page checks every 20 seconds). Each link is private to its prince.</p>${hs.map((x,i)=>`<div class="row"><b style="color:var(--c${x})">${esc(G.players[x].name)}</b>${got[x]?`<span class="ok">orders received</span>`:`<span class="wait">waiting for orders</span>`}<button class="btn sm" data-ol="cplink" data-i="${i}">Copy link</button></div>`).join("")}<div class="row"><button class="btn sm" data-ol="collect">Check for orders now</button><button class="btn sm" data-ol="pub">Publish this turn again</button><span class="note">Turn ${G.turn}${G.ol.pub===G.turn?" is published":" is NOT published yet"}.</span></div><div class="row"><label><input type="checkbox" data-ol="autotoggle"${G.ol.auto!==false?" checked":""}> Resolve the turn as soon as every prince has sent orders</label></div><div class="row"><b>Deadline:</b> ${G.ol.due?`${esc(fdue(G.ol.due))} (${esc(tzName())})`:"none"}${dl?"":" · turns wait for the Game Master"}</div><div class="row"><span class="note">Schedule</span><label><input type="checkbox" id="edon"${dl?" checked":""}> use a deadline</label>${dlSel("ed",dl||DLD)}<button class="btn sm" data-ol="dlsave">Save schedule</button><button class="btn sm" data-ol="dlplus">Extend this deadline 1 day</button></div><p class="note">A prince who has not sent orders by the deadline has an NPC commander play the turn. Players see the deadline when the turn is published; a schedule change shows to them from the next turn.</p>${GMX.msgs.map(m=>`<div class="msg ${m.bad?"bad":""}">${esc(m.t)}</div>`).join("")}</div>`}

/* player side */
const olPl=()=>{try{return JSON.parse(localStorage.getItem("kodOL")||"null")}catch(e){return null}};
async function olSync(manual){const c=olPl();if(!c||!OL.on||OL.busy)return;OL.busy=1;
 try{const st=await olApi(c.room,"status",{k:c.key});
  if(st.turn<1){if(manual)olToast("The Game Master has not started the game yet.");return}
  if(!G||!G.mpg||String(G.no)!==String(st.no)||G.turn<st.turn){const v=await olApi(c.room,"view",{k:c.key});await loadTurn(v.code);olToast(`Turn ${v.turn} is ready. Your orders have not been sent yet.${G.due?" Orders are due by "+fdue(G.due)+".":""}`)}
  else if(manual){const me=st.seats[st.seat],w=st.seats.filter(x=>!x.submitted).map(x=>x.name);olToast(`${me&&me.submitted?`Your orders for turn ${st.turn} are in.`:`Turn ${st.turn}: your orders are not sent yet.`}${G.due?" Orders are due by "+fdue(G.due)+".":""} ${w.length?"Waiting for: "+w.join(", ")+".":"Everyone has sent orders."}`)}
 }catch(e){if(manual)olToast(e.message)}finally{OL.busy=0}}
const _dr2=doResolve;
doResolve=async function(){const c=olPl();
 if(MODE==="player"&&G&&G.mpg&&OL.on&&c){try{await olApi(c.room,"orders",{k:c.key,method:"POST",body:{turn:G.turn,code:await makeOrders()}});
   modal(`<h2>Orders sent</h2><p class="sub">Your orders for turn ${G.turn} are with the Game Master. You can change them and press "Submit Orders to Server" again any time before the turn resolves. Come back to this link later (or press "Check for new turn") to see the result.</p><div class="row"><button class="btn pri" data-mp="close">Close</button></div>`)}
  catch(e){modal(`<h2>Orders not sent</h2><p class="sub">${esc(e.message)} You can still send your orders by email: use the code below.</p><div id="mpmsg"></div><div class="row"><button class="btn pri" data-mp="close">Close</button></div>`);setTimeout(()=>showOrders(),0)}return}
 return _dr2()};

/* cloud saves */
const ckeyGet=()=>{try{return localStorage.getItem("kodCK")||""}catch(e){return""}};
const ckeyFmt=k=>(String(k).match(/.{1,4}/g)||[]).join("-");
function ckeyParse(v){const r=String(v||"").replace(/[^A-Za-z0-9]/g,"").toUpperCase();if(r.length<16)throw new Error("The key needs 20 letters and digits. Press \"Make a key\" for a new one.");return{room:"c"+MODE[0]+r.slice(0,8).toLowerCase(),k:r.slice(8)}}
function cloudModal(){modal(`<h2>Save or load your game online</h2><p class="sub">Store a copy of your game on the server, then pick it up on any other device. You protect it with a secret key, like a password: press "Make a key", write it down, and use the same key on every device. Anyone with the key can read or replace the save, and a lost key cannot be recovered.</p><div class="row"><input type="text" id="ckey" value="${esc(ckeyFmt(ckeyGet()))}" placeholder="Your secret key" aria-label="Secret key"><button class="btn sm" data-ol="newkey">Make a key</button></div><div class="row"><button class="btn pri" data-ol="csave">Save this game online</button><button class="btn" data-ol="cload">Load my saved game</button><button class="btn" data-mp="close">Close</button></div><div id="mpmsg"></div><div id="cres"></div>`)}
function olRestore(o){if(!o||o.k!=="sav"||!o.g||!o.g.planes)throw new Error("That save is not readable.");if(!verOK(o.v))throw new Error("This save comes from a version that can no longer be played.");
 if(o.mode!==MODE)throw new Error("This save belongs to a different mode of the game. Switch mode in the Multiplayer menu first.");
 localStorage.setItem(SK(),JSON.stringify(o.g));loadG();UI.tab="report";UI.rep=null;closeModal();renderAll();window.scrollTo(0,0)}

/* the start screen of the Cloudflare site */
const lsGame=k=>{try{const g=JSON.parse(localStorage.getItem(k)||"null");return g&&g.planes&&!g.askName?g:null}catch(e){return null}};
function olLanding(msg,confirmSolo){
 const so=lsGame("kod1"),pl=lsGame("kodP"),gm=lsGame("kodGM");
 const opt=(cls,btn,desc)=>`<div class="opt ${cls}">${btn}<div class="od">${desc}</div></div>`;
 const cont=[];
 if(so)cont.push(opt("o-go",`<button class="btn" data-ol="go" data-m="solo">Continue your solo game (turn ${so.turn})</button>`,"Pick up your game against the computer princes where you left it."));
 if(pl)cont.push(opt("o-go",`<button class="btn" data-ol="go" data-m="player">Continue your multiplayer game (turn ${pl.turn})</button>`,"Go back to the multiplayer game you are playing in."));
 if(gm)cont.push(opt("o-go",`<button class="btn" data-ol="go" data-m="gm">Continue running your game as Game Master${gm.mpg?` (turn ${gm.turn})`:""}</button>`,"Go back to the game you are running."));
 modal(`<h2>King of Demons</h2>${cont.join("")}
 ${opt("o-solo",`<button class="btn" data-ol="solo">${confirmSolo?"Click again to replace your solo game":"New solo game"}</button>`,confirmSolo?"This deletes your current solo game from this browser.":"Play alone against computer princes.")}
 <div class="opt o-join"><button class="btn" data-ol="join">Join a multiplayer game</button><div class="od">Paste the game link your Game Master sent you (or an email turn code), then press the button above.</div><input type="text" id="lcode" placeholder="Paste the link or code here" aria-label="Game link or code"></div>
 ${opt("o-gm",`<button class="btn" data-ol="gm">Create a new multiplayer game as the Game Master</button>`,"You set up the game and send each player a private link.")}
 ${opt("o-cloud",`<button class="btn" data-ol="cloud">Save or load your game online</button>`,"Keep a copy of your game on the server so you can continue it on another device.")}
 <div id="mpmsg">${msg?`<div class="msg bad">${esc(msg)}</div>`:""}</div><p class="note">You can come back to these choices any time with the Multiplayer button.</p><p class="note">Game results, including your prince name, are collected in order to improve the quality of the game.</p>`)}
async function olLandAct(a,d){
 if(a==="go"){closeModal();if(MODE!==d.m)setMode(d.m)}
 else if(a==="solo"){const had=lsGame("kod1");if(had&&!OL.csolo){OL.csolo=1;return olLanding("",true)}OL.csolo=0;closeModal();try{localStorage.removeItem("kod1")}catch(e){}if(MODE!=="solo")setMode("solo");else{loadG();renderAll()}}
 else if(a==="gm"){closeModal();if(MODE!=="gm")setMode("gm")}
 else if(a==="join"){const v=($("#lcode").value||"").trim();if(!v)return mpMsg("Paste the link or code first.",1);
  const m=v.match(/#o=([A-Za-z0-9_-]{4,64})\.([A-Za-z0-9]{6,32})/)||v.match(/^([A-Za-z0-9_-]{4,64})\.([A-Za-z0-9]{6,32})$/);
  if(m){try{localStorage.setItem("kodOL",JSON.stringify({room:m[1],key:m[2]}))}catch(e){}closeModal();if(MODE!=="player")setMode("player");else renderAll();return olSync(true)}
  closeModal();if(MODE!=="player")setMode("player");try{await loadTurn(v)}catch(err){olLanding(err.message)}}}
document.addEventListener("click",async e=>{const t=e.target.closest("[data-ol]");if(!t)return;const d=t.dataset,a=d.ol;
 try{
  if(["go","solo","gm","join"].includes(a))await olLandAct(a,d);
  else if(a==="cplink")copyText(olLink(+d.i),t);
  else if(a==="collect"){const n=await olCollect();GMX.msgs=[{t:n?`${n} set${n>1?"s":""} of orders received.`:"No new orders yet."}];renderGM()}
  else if(a==="pub"){await olPublish();GMX.msgs=[{t:`Turn ${G.turn} published.`}];renderGM()}
  else if(a==="check")await olSync(true);
  else if(a==="cloud")cloudModal();
  else if(a==="newkey"){$("#ckey").value=ckeyFmt(olId(20,"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"))}
  else if(a==="csave"){if(!G)throw new Error("There is no game to save.");const c=ckeyParse($("#ckey").value);try{localStorage.setItem("kodCK",$("#ckey").value.replace(/[^A-Za-z0-9]/g,"").toUpperCase())}catch(e2){}
   const blob=await pack({k:"sav",v:G.ver,mode:MODE,g:G});await olApi(c.room,"save",{k:c.k,method:"PUT",body:{blob,info:{turn:G.turn,no:G.no}}});mpMsg(`Saved: game ${esc(G.no)}, turn ${G.turn}, at ${new Date().toLocaleTimeString()}.`)}
  else if(a==="cload"){const c=ckeyParse($("#ckey").value);try{localStorage.setItem("kodCK",$("#ckey").value.replace(/[^A-Za-z0-9]/g,"").toUpperCase())}catch(e2){}
   let j;try{j=await olApi(c.room,"save",{k:c.k})}catch(er){throw new Error(er.message==="No save here."?"No save was found under that key for this kind of game.":er.message)}
   OL.pend=await unpack(j.blob);const i=j.info||{};mpMsg(`Found a save: game ${esc(i.no)}, turn ${esc(i.turn)}, saved ${esc(new Date(j.at).toLocaleString())}.`);$("#cres").innerHTML=`<div class="row"><button class="btn pri" data-ol="crestore">Replace the game on this device with the saved one</button></div>`}
  else if(a==="crestore")olRestore(OL.pend);
  else if(a==="autotoggle"){G.ol.auto=t.checked;save();renderGM()}
  else if(a==="dlsave"){const on=$("#edon").checked,v=on?dlRead("ed"):null;G.ol.dl=on?dlObj(v):null;G.ol.due=G.ol.dl?olNextDue(G.ol.dl):null;save();renderGM()}
  else if(a==="dlplus"){if(!G.ol.due)throw new Error("There is no deadline to extend.");G.ol.due+=864e5;save();renderGM()}
  else if(a==="rlist"){const k=$("#akey").value.trim();try{localStorage.setItem("kodAK",k)}catch(e2){}const j=await olApi("results","list",{k});OL.rl=j.items;
   $("#rlist").innerHTML=`<p class="note">${j.total} game${j.total===1?"":"s"} on file${j.total>j.items.length?`, newest ${j.items.length} shown`:""}.</p><div class="rtw"><table class="rt"><tr><th>Received</th><th>Game</th><th>Mode</th><th>Ver</th><th>Turn</th><th>State</th><th>Princes (points)</th><th></th></tr>${j.items.map(x=>`<tr><td>${esc(fdate(x.at))}</td><td>${esc(x.no)}</td><td>${esc(x.mode)}</td><td>${esc(x.v)}</td><td>${x.turn}</td><td>${x.over?"finished":"unfinished"}</td><td>${x.n.map(p=>esc(p[0])+(p[1]?"":" (NPC)")+" "+(p[2]==null?"":p[2])).join("; ")}</td><td><button class="btn sm" data-ol="ropen" data-id="${esc(x.id)}">Open</button></td></tr>`).join("")}</table></div>`}
  else if(a==="rtest"){const id=olId(6,"0123456789");await olApi("results","submit",{method:"POST",body:{rec:{k:"res",v:GAME_VERSION,g:"TEST"+id,sd:id,cfg:{nx:10,ny:6},mode:"test",turn:1,over:true,end:"test record",at:Date.now(),pl:[{n:"TEST RESULT (not a real game)",h:1,rk:1,vp:1,pa:[],pn:1},{n:"Test NPC",h:0,rk:1,vp:0,pa:[],pn:1}],hist:[]}}});
   mpMsg("A test result was sent. Press Load results to see it.")}
  else if(a==="ropen"){const j=await olApi("results","rec",{k:$("#akey").value.trim(),id:d.id});$("#rout").innerHTML=resHTML(j.rec)}
 }catch(err){olErr(err)}});
async function olStart(){await olProbe();if(!OL.on)return;olResult();
 const m=location.hash.match(/^#o=([A-Za-z0-9_-]{4,64})\.([A-Za-z0-9]{6,32})$/);
 if(m){try{localStorage.setItem("kodOL",JSON.stringify({room:m[1],key:m[2]}))}catch(e){}try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}if(MODE!=="player"){setMode("player")}}
 if(MODE==="gm"&&(!G||!G.mpg))renderAll();else if(MODE==="solo"&&G)renderHeader();
 if(!m)olLanding();
 if(MODE==="player"&&olPl())olSync();if(MODE==="gm")olTick()}
setInterval(()=>{if(!OL.on)return;if(MODE==="gm")olTick();else if(MODE==="player"&&!document.hidden)olSync()},20000);


/* finished games send a copy of their result to the server (Cloudflare site only); the start screen says so */
async function olResult(){if(!OL.on||!G||!G.over||G.rsent||OL.rbusy||MODE==="player")return;OL.rbusy=1;
 try{await olApi("results","submit",{method:"POST",body:{rec:resObj()}});G.rsent=true;save()}catch(e){}finally{OL.rbusy=0}}
const _ra3=renderAll;renderAll=function(){const r=_ra3.apply(this,arguments);olResult();return r};
const akeyGet=()=>{try{return localStorage.getItem("kodAK")||""}catch(e){return""}};
function resultsHTML(){return`<h3 style="margin-top:22px">Game results</h3><p class="note">Finished games sent in by players. Enter the admin key you set in Cloudflare (the ADMIN_KEY secret).</p><div class="row"><input type="password" id="akey" value="${esc(akeyGet())}" placeholder="Admin key" aria-label="Admin key"><button class="btn sm" data-ol="rlist">Load results</button><button class="btn sm" data-ol="rtest">Send a test result</button></div><div id="rlist"></div><div id="rout"></div>`}
const fdate=t=>{const d=new Date(t);return isNaN(d)?"":d.toLocaleString()};

/* resolving on its own: when every human prince has sent orders, or the deadline passes (an NPC commander plays for anyone who has not sent orders) */
const dlSel=(p,v)=>{v=v||DLD;const o=(a,b,x,st=1,f=i=>i)=>{let r="";for(let i=a;i<=b;i+=st)r+=`<option value="${i}"${i===x?" selected":""}>${f(i)}</option>`;return r};
 return`<select id="${p}h" aria-label="Hour" style="width:auto">${o(1,12,v.h12)}</select> : <select id="${p}m" aria-label="Minute" style="width:auto">${o(0,55,v.m,5,i=>String(i).padStart(2,"0"))}</select> <select id="${p}ap" aria-label="AM or PM" style="width:auto"><option${v.ap==="AM"?" selected":""}>AM</option><option${v.ap==="PM"?" selected":""}>PM</option></select> every <select id="${p}n" aria-label="Days" style="width:auto">${o(1,14,v.n)}</select> day(s)`};
const dlRead=p=>{const g=i=>document.getElementById(p+i);return g("h")?{on:true,h12:+g("h").value,m:+g("m").value,ap:g("ap").value,n:+g("n").value}:null};
const tzName=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){return"your local time"}};
async function olResolve(why){if(OL.arun||!G||!G.ol||!G.mpg||G.over)return;OL.arun=1;
 try{const missing=humanSeats().filter(x=>!G.players[x].elim&&!(G.got||{})[x]);
  for(const x of missing){aiPlan(x);G.players[x].autoNote=true}
  resolveTurn();G.got={};G.sent={};G.ol.at={};GMX.mail=null;if(G.ol.dl)G.ol.due=olNextDue(G.ol.dl);else G.ol.due=null;save();
  let msg=`Turn ${G.turn-1} resolved (${why}).${missing.length?` An NPC played for ${missing.map(x=>G.players[x].name).join(", ")}.`:""}`;
  try{await olPublish();msg+=` Turn ${G.turn} is published.`}catch(er){GMX.msgs=[{t:msg+` But publishing failed: ${er.message} Press "Publish this turn again".`,bad:1}];if(MODE==="gm"&&!$("#mpmodal"))renderGM();return}
  GMX.msgs=[{t:msg}];olResult();if(MODE==="gm"&&!$("#mpmodal"))renderGM()}
 catch(er){GMX.msgs=[{t:"Could not resolve the turn: "+er.message,bad:1}]}finally{OL.arun=0}}
async function olTick(){if(MODE!=="gm"||!G||!G.ol||!G.mpg||G.over||!OL.on)return;
 let n=0;try{n=await olCollect()}catch(e){}
 const hs=humanSeats().filter(x=>!G.players[x].elim),all=hs.length&&hs.every(x=>(G.got||{})[x]);
 if(all&&G.ol.auto!==false)return olResolve("everyone sent orders");
 if(G.ol.due&&Date.now()>=G.ol.due)return olResolve("the deadline passed");
 if(n&&!$("#mpmodal"))renderGM()}
/* ---- GM screen ---- */
const GMX={msgs:[],mail:null,link:""};
try{GMX.link=localStorage.getItem("kodLink")||"https://claude.ai/artifact/5rD6MYEJpYzjyntTiJfWzD"}catch(e){}
function renderGM(){renderGMHeader();
 if(!G||!G.mpg)return renderGMSetup();
 const T=G.turn,hs=humanSeats(),got=G.got||{};
 let h=`<div class="mp"><h2>Game Master · Game ${G.no} · Turn ${T}</h2>`;
 h+=`<div class="card"><h3>Princes</h3>${G.players.map(p=>`<div class="row"><b style="color:var(--c${p.id})">${esc(p.name)}</b><span class="note">${p.human?esc(p.email||"no email"):"NPC prince"}</span>${p.human?(got[p.id]?`<span class="ok">orders received</span>`:`<span class="wait">waiting for orders</span>`):""}</div>`).join("")}</div>`;
 if(G.ol)h+=olCard();else{h+=`<div class="card"><h3>1 · Send this turn's mail</h3><p class="note">Builds one email per human prince with a private turn code.</p><div class="row"><label class="note">Game link in the mail</label><input type="text" id="glink" value="${esc(GMX.link)}"></div><div class="row"><button class="btn pri" data-mp="mail">Prepare mail for turn ${T}</button></div><div id="mailbox">${mailHTML()}</div></div>`;
 h+=`<div class="card"><h3>2 · Collect orders</h3><p class="note">Paste each reply's orders code here. Missing princes keep their standing horde orders and harvest all their souls.</p><textarea id="ocodes" placeholder="Paste an orders code"></textarea><div class="row"><button class="btn" data-mp="gotorders">Add orders</button></div>${GMX.msgs.map(m=>`<div class="msg ${m.bad?"bad":""}">${esc(m.t)}</div>`).join("")}</div>`}
 const miss=hs.filter(s=>!got[s]&&!G.players[s].elim);
 h+=`<div class="card"><h3>3 · Resolve</h3><p class="note">${miss.length?`Still missing: ${miss.map(s=>esc(G.players[s].name)).join(", ")}${G.ol?"; an NPC will play for them":""}.`:"All human princes have sent orders."}</p><div class="row"><button class="btn pri" data-mp="resolve"${G.over?" disabled":""}>${GMX.confirm?"Click again to resolve":`Resolve turn ${T}`}</button></div>${G.over?`<div class="msg">The game is over.</div>`:""}</div>`;
 h+=`<div class="card"><h3>Backup</h3><div class="row"><button class="btn sm" data-mp="end">End multiplayer game and return to setup</button></div></div></div>`;
 $("#main").innerHTML=h}
function mailHTML(){if(!GMX.mail)return"";const sent=G.sent||{},n=GMX.mail.filter(m=>sent[m.s]).length;
 return`<div class="row"><button class="btn sm" data-mp="cpall">Copy all messages</button><span class="note">${n} of ${GMX.mail.length} marked sent</span></div>`+GMX.mail.map((m,i)=>`<div class="msg"><b>${esc(G.players[m.s].name)}</b> · <span class="note">${esc(m.to||"no email entered")} · code ${Math.round(m.size/1000*10)/10} KB</span> ${sent[m.s]?`<span class="ok">sent</span>`:""}<div class="row"><button class="btn sm" data-mp="cp" data-i="${i}" data-w="to">Copy address</button><button class="btn sm" data-mp="cp" data-i="${i}" data-w="subject">Copy subject</button><button class="btn sm" data-mp="cp" data-i="${i}" data-w="body">Copy message</button><button class="btn sm" data-mp="sent" data-i="${i}">${sent[m.s]?"Unmark sent":"Mark sent"}</button></div></div>`).join("")+`<p class="note">Paste each message into a new email or chat. Gmail drafts are not connected.</p>`}
function suLoad(){let r={};try{r=JSON.parse(localStorage.getItem("kodRoster2")||"{}")}catch(e){}
 return Object.assign({nh:2,na:2,nx:10,ny:6,rows:[]},r)}
function suRead(){const s=GMX.su||suLoad(),g=id=>document.getElementById(id);
 if(g("nh")){s.nh=+g("nh").value;s.na=+g("na").value;s.nx=+g("nx").value;s.ny=+g("ny").value;if(g("online"))s.online=g("online").checked;if(g("dlh")){const d=dlRead("dl");d.on=g("dlon").checked;s.dl=d}s.rows=[];for(let i=0;i<s.nh;i++)s.rows.push({name:g("sn"+i)?g("sn"+i).value:"",email:g("se"+i)?g("se"+i).value:""})}
 GMX.su=s;return s}
function renderGMSetup(){
 const s=GMX.su||(GMX.su=suLoad());s.nh=Math.max(1,Math.min(8,s.nh));s.na=Math.max(0,Math.min(8-s.nh,s.na));if(s.nh+s.na<2)s.na=1;
 const opt=(a,b,v,st=1)=>{let o="";for(let i=a;i<=b;i+=st)o+=`<option value="${i}"${i===v?" selected":""}>${i}</option>`;return o};
 const rows=[];for(let i=0;i<s.nh;i++){const r=s.rows[i]||{};rows.push(`<div class="seat"><b style="color:var(--c${i})">Prince ${i+1}</b><input type="text" id="sn${i}" value="${esc(r.name)}" placeholder="Prince name (blank = drawn from the name table)" aria-label="Prince name ${i+1}"><input type="email" id="se${i}" value="${esc(r.email)}" placeholder="email" aria-label="Email ${i+1}"></div>`)}
 $("#main").innerHTML=`<div class="mp"><h2>Set up a game</h2><p class="sub">Choose the number of human and NPC princes (2 to 8 in all) and the size of the map. Human princes get a name and the email address their turns go to. NPC princes get names from the name table.</p>
 <div class="card"><div class="row"><label>Human princes <select id="nh" data-su="1" style="width:auto">${opt(1,8,s.nh)}</select></label><label>NPC princes <select id="na" data-su="1" style="width:auto">${opt(s.nh===1?1:0,8-s.nh,s.na)}</select></label><span class="note">${s.nh+s.na} princes in all</span></div>
 <div class="row"><label>Map width <select id="nx" data-su="1" style="width:auto">${opt(6,16,s.nx)}</select></label><label>Map height <select id="ny" data-su="1" style="width:auto">${opt(4,10,s.ny,2)}</select></label><span class="note">${s.nx * s.ny} planes. Height is even.</span></div></div>
 ${OL.on?`<div class="card"><label><input type="checkbox" id="online" data-su="1"${s.online!==false?" checked":""}> Online game: each human prince gets a private link, and orders arrive without emailing codes. Email addresses are then not needed.</label></div>`:""}${OL.on&&s.online!==false?`<div class="card"><label><input type="checkbox" id="dlon" data-su="1"${(s.dl||DLD).on?" checked":""}> Turn deadline</label><div class="row">${dlSel("dl",s.dl||DLD)}<span class="note">${esc(tzName())}</span></div><p class="note">A prince who has not sent orders by the deadline has an NPC commander play the turn. Turns also resolve as soon as every prince has sent orders. Leave the deadline off to resolve only when everyone is in.</p></div>`:""}${rows.join("")}<div class="row"><button class="btn pri" data-mp="start">Start the game</button></div><div id="mpmsg"></div></div>`}
document.addEventListener("input",e=>{const t=e.target;if(t&&(t.id==="pname"||(t.id||"").match(/^sn\d+$/))){const v=t.value.replace(/[^A-Za-z ]/g,"").replace(/ {2,}/g," ").replace(/^ /,"");if(v!==t.value)t.value=v}});
document.addEventListener("change",e=>{if(MODE==="gm"&&e.target.dataset&&e.target.dataset.su){suRead();renderGMSetup()}});
async function gmAct(d,t){
 const a=d.mp;
 if(a==="start"){const s=suRead();
  const seats=[];for(let i=0;i<s.nh;i++)seats.push({human:true,name:s.rows[i].name.trim(),email:s.rows[i].email.trim()});for(let i=0;i<s.na;i++)seats.push({human:false});
  if(seats.length<2||seats.length>8)return mpMsg("Choose 2 to 8 princes in all.",1);
  try{localStorage.setItem("kodRoster2",JSON.stringify(s))}catch(e){}GMX.su=null;newGame({seats,nx:s.nx,ny:s.ny});G.got={};GMX.mail=null;GMX.msgs=[];save();if(s.online!==false&&OL.on){try{await olCreate(s.dl)}catch(er){GMX.msgs=[{t:"The online game could not be set up: "+er.message+" The game will run by email instead.",bad:1}]}}renderAll()}
 else if(a==="mail"){GMX.link=$("#glink").value.trim()||GMX.link;try{localStorage.setItem("kodLink",GMX.link)}catch(e){}
  t.textContent="Building…";G.sent={};GMX.mail=await Promise.all(humanSeats().map(s=>mailFor(s,GMX.link)));renderGM()}
 else if(a==="cpall"){copyText(GMX.mail.map(m=>`===== To: ${m.to||"(no email)"} =====\nSubject: ${m.subject}\n\n${m.body}`).join("\n\n"),t)}
 else if(a==="sent"){const m=GMX.mail[+d.i];G.sent=G.sent||{};G.sent[m.s]=!G.sent[m.s];save();renderGM()}
 else if(a==="cp"){const m=GMX.mail[+d.i];copyText(m[d.w],t)}
 else if(a==="gotorders"){const ta=$("#ocodes");let msg;try{const o=await unpack(ta.value);const n=applyOrders(o);msg={t:`Orders received from ${n} for turn ${o.t}.`};save();ta.value=""}catch(e){msg={t:e.message,bad:1}}
  GMX.msgs=[msg];renderGM()}
 else if(a==="resolve"){const miss=humanSeats().filter(s=>!(G.got||{})[s]&&!G.players[s].elim);
  if(miss.length&&!GMX.confirm){GMX.confirm=true;return renderGM()}
  GMX.confirm=false;if(G.ol){await olResolve("the Game Master resolved it");return}resolveTurn();G.got={};G.sent={};GMX.mail=null;GMX.msgs=[{t:`Turn ${G.turn-1} resolved. Prepare the mail for turn ${G.turn}.`}];if(G.ol){G.ol.at={};try{await olPublish();GMX.msgs=[{t:`Turn ${G.turn-1} resolved. Turn ${G.turn} is published; players see it when they open their links.`}]}catch(er){GMX.msgs=[{t:`Turn resolved, but publishing failed: ${er.message} Press "Publish this turn again".`,bad:1}]}}save();renderGM()}
 else if(a==="end"){if(GMX.endc){G=null;try{localStorage.removeItem("kodGM")}catch(e){}GMX.endc=false;renderAll()}else{GMX.endc=true;t.textContent="Click again to delete this multiplayer game"}}}
document.addEventListener("click",async e=>{const t=e.target.closest("[data-mp]");if(!t)return;const d=t.dataset,a=d.mp;
 try{
  if(a==="menu")showMenu();
  else if(a==="close")closeModal();
  else if(a==="mode"){closeModal();setMode(d.m)}
  else if(a==="pname"){const v=cleanName($("#pname").value,40);const sd=G.seed0!=null?G.seed0:G.seed;const dg=G.players.slice(1).map((_,i)=>{const e=$("#dg"+i);return e?+e.value:DANGER_DEF});if((v&&v!==G.players[0].name)||dg.some(x=>x!==DANGER_DEF)){newGame({name:v||G.players[0].name,seed:sd,danger:dg})}else delete G.askName;UI.tab="report";UI.rep=null;save();closeModal();renderAll()}
  else if(a==="maint"||a==="names"){modal(`<h2>Maintenance</h2><h3>NPC prince names</h3><p class="sub">One name per line. Each new game gives its NPC seats names drawn from this list, without repeats. Needs at least 3 names; add more for variety. Games already under way keep their names.</p><p class="note">The list built into the game's code is the one every address uses. Changes saved here apply only on this Test page. To make a new list official, press Copy list and send it to Claude.</p><textarea id="nlist" style="min-height:260px">${esc(nameList().join("\n"))}</textarea><div class="row"><button class="btn pri" data-mp="nsave">Save names</button><button class="btn" data-mp="ncopy">Copy list</button><button class="btn" data-mp="nreset">Restore the code's list</button><button class="btn" data-mp="close">Close</button></div><div id="mpmsg"></div>${OL.on?resultsHTML():""}`)}
  else if(a==="ncopy")copyText($("#nlist").value.split("\n").map(x=>x.trim()).filter(Boolean).join("\n"),t);
  else if(a==="nsave"){const l=[...new Set($("#nlist").value.split("\n").map(s=>s.trim()).filter(Boolean))];
   if(l.length<3)mpMsg("Enter at least 3 different names.",1);else{try{localStorage.setItem("kodAIN",JSON.stringify(l))}catch(e){}mpMsg(`Saved ${l.length} names. They apply to the next game you start.`)}}
  else if(a==="nreset"){try{localStorage.removeItem("kodAIN")}catch(e){}$("#nlist").value=DPN.join("\n");mpMsg("The list from the game's code is restored.")}
  else if(a==="turnbox"){modal(`<h2>Load a turn code</h2><p class="sub">Paste the turn code from your Game Master's email.</p><textarea id="tcode" placeholder="-----BEGIN KOD TURN CODE-----"></textarea><div class="row"><button class="btn pri" data-mp="load">Load</button><button class="btn" data-mp="close">Cancel</button></div><div id="mpmsg"></div>`)}
  else if(a==="load"){try{await loadTurn($("#tcode").value)}catch(err){mpMsg(esc(err.message),1)}}
  else if(a==="copyo")copyText($("#ocode").value,t);
  else if(a==="copyr")copyText($("#rcode").value,t);
  else if(a==="rescode"){const c=wrapCode(await pack(resObj()),"RESULT");modal(`<h2>Your result code</h2><p class="sub">Copy this block and send it to whoever asked for your game.</p><textarea id="rcode" readonly>${c}</textarea><div class="row"><button class="btn pri" data-mp="copyr">Copy</button><button class="btn" data-mp="close">Close</button></div>`)}
  else if(a==="savecode"){const c=wrapCode(await pack({k:"sav",v:G.ver,mode:MODE,g:G}),"SAVE");modal(`<h2>Your save code</h2><p class="sub">Copy this block and keep it somewhere safe (a note to yourself works). If this browser ever loses your game, choose "Restore a saved game" and paste it back in to carry on from this moment.</p><textarea id="rcode" readonly>${c}</textarea><div class="row"><button class="btn pri" data-mp="copyr">Copy</button><button class="btn" data-mp="close">Close</button></div>`)}
  else if(a==="savebox"){modal(`<h2>Restore a saved game</h2><p class="sub">Paste a save code. It will replace the game in this browser.</p><textarea id="sin" placeholder="-----BEGIN KOD SAVE CODE-----"></textarea><div class="row"><button class="btn pri" data-mp="saveread">Restore</button><button class="btn" data-mp="close">Close</button></div><div id="mpmsg"></div>`)}
  else if(a==="saveread"){try{const o=await unpack($("#sin").value);if(!o||o.k!=="sav"||!o.g||!o.g.planes)throw new Error("This is not a save code.");if(!verOK(o.v))throw new Error("This save comes from a version that can no longer be played.");if(o.mode!==MODE)throw new Error("This save belongs to a different mode of the game.");localStorage.setItem(SK(),JSON.stringify(o.g));loadG();UI.tab="report";UI.rep=null;closeModal();renderAll();window.scrollTo(0,0)}catch(err){mpMsg(esc(err.message),1)}}
  else if(a==="resbox"){modal(`<h2>Read a result code</h2><p class="sub">Paste a result code to see the game it records.</p><textarea id="rin" placeholder="-----BEGIN KOD RESULT CODE-----"></textarea><div class="row"><button class="btn pri" data-mp="resread">Read</button><button class="btn" data-mp="close">Close</button></div><div id="mpmsg"></div><div id="rout"></div>`)}
  else if(a==="resread"){try{const o=await unpack($("#rin").value);if(!o||o.k!=="res")throw new Error("This is not a result code.");mpMsg("");$("#rout").innerHTML=resHTML(o)}catch(err){mpMsg(esc(err.message),1)}}
  else if(MODE==="gm")await gmAct(d,t)}catch(err){console.error(err)}});
(function(){let m="solo";try{m=localStorage.getItem("kodMode")||"solo"}catch(e){}if(location.hash==="#play")m="player";if(!["solo","player","gm"].includes(m))m="solo";MODE=m;document.body.classList.toggle("pl",m==="player");loadG();renderAll()})();
window.addEventListener("hashchange",()=>{if(location.hash==="#play"&&MODE!=="player")setMode("player")});
initPdf();
olStart();
if(window.KOD_MOVED){const b=document.createElement("div");b.style.cssText="background:#dcae52;color:#1a0f12;padding:10px 14px;font:600 14px var(--body,sans-serif);text-align:center";b.innerHTML=`King of Demons has moved. <a href="${esc(window.KOD_MOVED)}" style="color:#1a0f12">Play at the new address</a>. Your saved game stays in this browser: use "Make my save code" on the Standing tab, then "Restore a saved game" at the new address (or "Save or load your game online").`;document.body.prepend(b)}
</script>
