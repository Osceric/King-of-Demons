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
  league:{seat:s,gm:G.no},cfg:G.cfg||{nx:10,ny:6},vpr:vpRank(s)}}

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
 closeModal();setDims(V.cfg&&V.cfg.nx,V.cfg&&V.cfg.ny);G=V;UI.rep=null;UI.tab="report";UI.filter="all";save();renderAll();window.scrollTo(0,0)}
async function makeOrders(){const P=G.players[0];
 return pack({k:"ord",g:G.no,t:G.turn,s:G.league.seat,h:Object.fromEntries(hordesOf(0).map(h=>[h.id,h.cmd])),p:P.princely,sc:P.shadowCmd||null})}

/* ---- UI plumbing ---- */
/* ---- result codes: a record of a game that a player can send back ---- */
const resObj=()=>({k:"res",v:G.ver,g:G.no,sd:G.seed0,cfg:G.cfg,mode:MODE,turn:G.turn,over:!!G.over,end:G.end?G.end.reason:null,at:Date.now(),
 pl:G.players.map((p,i)=>{let v=null,pn=null;try{if(MODE!=="player"||i===0||G.fv)v=(G.fv&&G.fv[i])||vp(i)}catch(e){}try{if(MODE!=="player"||i===0)pn=ownedPlanes(i).length}catch(e){}return{n:p.name,h:p.human?1:0,rk:p.rank,vp:v?v.total:null,pa:v?v.parts.map(x=>[x[0],x[1]]):[],pn}}),hist:G.hist||[]});
function resHTML(o){const f=n=>n==null?"–":fmt0(n),pl=o.pl||[],sc=pl.map((p,i)=>({p,i})).sort((a,b)=>(b.p.vp||0)-(a.p.vp||0));
 const ord=t=>[...(t.p||[]).map(c=>`${c[0]} ${f(c[1])}${c[2]!=null?" → "+c[2]:""}${c[3]?" ("+c[3]+")":""}`),...(t.h||[]).map(h=>`H${h[0]} ${h[1]}${h[2]?" "+h[2]:""}`),...(t.s?[`${t.s[0]} ${f(t.s[1])}`]:[])].join("; ");
 return`<div class="card"><h3 style="margin-top:0">${esc(pl[0]?pl[0].n:"Player")}'s game</h3><p class="note">Game No. ${esc(o.g)}, version ${esc(o.v)}, seed ${esc(o.sd)}, map ${esc(o.cfg&&o.cfg.nx)}×${esc(o.cfg&&o.cfg.ny)}, mode ${esc(o.mode)}. ${o.over?"Finished":"In progress"} after ${Math.max(0,(o.turn||1)-(o.over?1:0))} turns${o.end?`. Ending trigger: ${esc(o.end)}`:""}. Recorded ${esc(new Date(o.at||0).toLocaleString())}.</p>
 <table><tr><th>#</th><th>Prince</th><th class="r">Points</th><th class="r">Chaos</th><th class="r">Planes</th></tr>${sc.map((x,k)=>`<tr><td>${k+1}</td><td>${esc(x.p.n)}${x.p.h?"":" (AI)"}</td><td class="r">${f(x.p.vp)}</td><td class="r">${f(x.p.rk)}</td><td class="r">${f(x.p.pn)}</td></tr>`).join("")}</table>
 ${sc.map(x=>x.p.pa&&x.p.pa.length?`<details><summary>${esc(x.p.n)}: points breakdown</summary><p class="note">${x.p.pa.map(r=>`${esc(r[0])} ${f(r[1])}`).join("; ")}</p></details>`:"").join("")}</div>
 <div class="card"><h3 style="margin-top:0">Turn by turn</h3>${(o.hist||[]).length?`<div class="rtw"><table class="rt"><tr><th>Turn</th><th>Orders given</th>${pl.map(p=>`<th class="r">${esc(p.n)}</th>`).join("")}</tr>${o.hist.map(t=>`<tr><td>${t.t}</td><td>${esc(ord(t))||"No orders"}</td>${pl.map((_,i)=>`<td class="r">${t.v?f(t.v[i]):"–"}</td>`).join("")}</tr>`).join("")}</table></div>`:`<p class="note">No turn history was recorded for this game.</p>`}</div>`}
const copyText=async(txt,btn)=>{let ok=false;try{await navigator.clipboard.writeText(txt);ok=true}catch(e){const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();try{ok=document.execCommand("copy")}catch(e2){}ta.remove()}
 if(btn){const o=btn.textContent;btn.textContent=ok?"Copied":"Select and copy by hand";setTimeout(()=>btn.textContent=o,1600)}};
const st=document.createElement("style");st.textContent=`body.pl [data-act=newgame],body.pl [data-act=playagain]{display:none}
.mp{max-width:880px;margin:0 auto;padding:0 0 60px}.mp h2{margin:.2em 0}.mp textarea{width:100%;min-height:90px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:8px;font:12px/1.35 ui-monospace,Menlo,Consolas,monospace}
.mp input[type=text],.mp input[type=email],.mp select{background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:6px 8px;font:13px var(--body);width:100%;box-sizing:border-box}
.mp .seat{display:grid;grid-template-columns:70px 1.3fr 1.2fr 100px;gap:8px;align-items:center;margin:6px 0}@media(max-width:640px){.mp .seat{grid-template-columns:1fr 1fr}}
.mp .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.mp .ok{color:var(--good,#7bc47f)}.mp .wait{color:var(--gold)}.mp .msg{margin:8px 0;padding:8px;border-radius:4px;background:var(--panel2)}.mp .bad{color:var(--bad,#e5675b)}
.mp pre{white-space:pre-wrap;word-break:break-all;max-height:160px;overflow:auto;background:var(--panel2);padding:8px;border-radius:4px;font-size:11px}
.mpmodal{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:50;display:flex;align-items:flex-start;justify-content:center;padding:6vh 12px;overflow:auto}.mpmodal>div{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:16px;max-width:640px;width:100%}`;
document.head.appendChild(st);

function setMode(m){MODE=m;try{localStorage.setItem("kodMode",m)}catch(e){}document.body.classList.toggle("pl",m==="player");loadG();renderAll();window.scrollTo(0,0)}
/* games saved before v56 used the old demon table (Pazu, no classes): carry them over so they still open */
function loadG(){G=null;try{const s=localStorage.getItem(SK());if(s){G=JSON.parse(s);if(!G||!G.planes||!G.reports)throw 0}}catch(e){G=null}
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
 _ra();if(MODE==='solo'&&G&&G.askName&&!G.league&&!$('#mpmodal'))modal(`<h2>Name your demon prince</h2><p class="sub">${window.OLDGAME?"Your saved game came from version 1.81 or earlier, which can no longer be played, so a new game has begun. ":""}Choose the name you will rule under, or keep the one the Abyss gave you.</p>${window.DIAG&&window.DIAG.store==="blocked"?`<p class="note" style="color:#e8604c">This browser is not letting the page save your game, so reloading or closing the tab will start a new one.</p>`:(window.DIAG&&window.DIAG.boots>0&&!window.OLDGAME?`<p class="note">No saved game was found, although this browser last opened King of Demons on ${new Date(window.DIAG.last).toLocaleString()}.</p>`:"")}<input type="text" id="pname" maxlength="40" value="${esc(G.players[0].name)}" aria-label="Prince name"><h2 style="margin-top:18px">Your rivals</h2><p class="note" style="margin:0 0 8px">Choose how dangerous each rival prince will be. The details of its strategy remain a secret.</p><p class="note" style="margin:0 0 8px">NOTE: A small minority of princes may also have Peaceful or Grudge personalities, which are separate from their danger level. A personality is revealed when you can see one of their planes, either by being adjacent or by using the SCRY command.</p>${G.players.slice(1).map((p,i)=>`<div style="margin:8px 0"><div style="color:var(--c${i+1});margin-bottom:3px">${esc(p.name)}</div><select id="dg${i}" style="width:100%;max-width:100%" aria-label="Danger level of ${esc(p.name)}">${DANGER.map((d,k)=>`<option value="${k}"${k===DANGER_DEF?" selected":""}>Danger Level: ${d.n}</option>`).join("")}</select></div>`).join("")}<div class="row"><button class="btn pri" data-mp="pname">Begin</button><button class="btn" data-mp="pkeep">Keep this name</button></div>`)};
const _rh=renderHeader;
renderHeader=function(){_rh();const t=$("#tabs");if(t)t.insertAdjacentHTML("beforeend",MODE==="player"?`<button class="btn sm" data-mp="turnbox" style="margin-left:auto">Load turn code</button>`:`<button class="btn sm" data-mp="menu" style="margin-left:auto">Multiplayer</button>`)};
function bareHeader(sub){$("#gameno").textContent=G&&G.no?`Game No. ${G.no}v${GAME_VERSION}`:`King of Demons v${GAME_VERSION}`;$("#prince").innerHTML=sub;$("#meters").innerHTML="";$("#tabs").innerHTML=MODE==="player"?"":`<button class="btn sm" data-mp="menu">Multiplayer</button>`;$("#over").hidden=true}
function renderGMHeader(){bareHeader(`<b>Game Master</b>${G&&G.league?` · turn ${G.turn}`:""}`)}
function renderJoinHeader(){bareHeader("<b>Play in a friend's game</b>")}
function renderJoin(){$("#main").innerHTML=`<div class="mp"><h2>Join a game</h2><p class="sub">Paste the KOD Turn Code from your Game Master's email, then press Load.</p><textarea id="tcode" placeholder="-----BEGIN KOD TURN CODE-----"></textarea><div class="row"><button class="btn pri" data-mp="load">Load turn code</button></div><div id="mpmsg"></div></div>`}
const mpMsg=(t,bad)=>{const e=$("#mpmsg");if(e)e.innerHTML=t?`<div class="msg ${bad?"bad":""}">${t}</div>`:""};
const _dr=doResolve;
doResolve=function(){if(MODE==="player"&&G&&G.league)return showOrders();_dr()};
const _rs=renderSums;
renderSums=function(){_rs();if(MODE==="player"&&G.league){const b=$("#go");if(b){b.textContent=`Finalize Orders and Make KOD Orders Code`}}};
const _vr=vpRank;
vpRank=function(p){return MODE==="player"&&G&&G.league&&p===0&&G.vpr!=null?G.vpr:_vr(p)};
function modal(html){let m=$("#mpmodal");if(m)m.remove();m=document.createElement("div");m.id="mpmodal";m.className="mpmodal";m.innerHTML=`<div class="mp">${html}</div>`;document.body.appendChild(m);m.addEventListener("click",e=>{if(e.target===m)m.remove()})}
const closeModal=()=>{const m=$("#mpmodal");if(m)m.remove()};
async function showOrders(){const c=wrapCode(await makeOrders(),"ORDERS");
 modal(`<h2>Your KOD Orders Code for turn ${G.turn}</h2><p class="sub">Copy this code and reply to your Game Master's email with it pasted into the body. You can change your orders and make a new code any time before the turn resolves.</p><textarea id="ocode" readonly>${esc(c)}</textarea><div class="row"><button class="btn pri" data-mp="copyo">Copy KOD Orders Code</button><button class="btn" data-mp="close">Close</button></div>`)}
function showMenu(){
 modal(`<h2>Multiplayer</h2><p class="sub">Choose how you want to play. Each choice keeps its own saved game, so switching never loses anything.</p>
 <div class="row"><button class="btn${MODE==="solo"?" pri":""}" data-mp="mode" data-m="solo">Solo game</button><button class="btn${MODE==="player"?" pri":""}" data-mp="mode" data-m="player">Play in a friend's game</button><button class="btn${MODE==="gm"?" pri":""}" data-mp="mode" data-m="gm">Run a game (Game Master)</button></div>
 ${MODE==="player"?`<div class="row"><button class="btn" data-mp="newturn">Load a new turn code</button></div>`:""}<div class="row"><button class="btn" data-mp="names">Edit AI prince names</button></div><div class="row"><button class="btn" data-mp="close">Close</button></div>`)}

/* ---- GM screen ---- */
const GMX={msgs:[],mail:null,link:""};
try{GMX.link=localStorage.getItem("kodLink")||"https://claude.ai/artifact/5rD6MYEJpYzjyntTiJfWzD"}catch(e){}
function renderGM(){renderGMHeader();
 if(!G||!G.league)return renderGMSetup();
 const T=G.turn,hs=humanSeats(),got=G.got||{};
 let h=`<div class="mp"><h2>Game Master · Game ${G.no} · Turn ${T}</h2>`;
 h+=`<div class="card"><h3>Princes</h3>${G.players.map(p=>`<div class="row"><b style="color:var(--c${p.id})">${esc(p.name)}</b><span class="note">${p.human?esc(p.email||"no email"):"AI prince"}</span>${p.human?(got[p.id]?`<span class="ok">orders received</span>`:`<span class="wait">waiting for orders</span>`):""}</div>`).join("")}</div>`;
 h+=`<div class="card"><h3>1 · Send this turn's mail</h3><p class="note">Builds one email per human prince with a private turn code.</p><div class="row"><label class="note">Game link in the mail</label><input type="text" id="glink" value="${esc(GMX.link)}"></div><div class="row"><button class="btn pri" data-mp="mail">Prepare mail for turn ${T}</button></div><div id="mailbox">${mailHTML()}</div></div>`;
 h+=`<div class="card"><h3>2 · Collect orders</h3><p class="note">Paste each reply's orders code here. Missing princes keep their standing horde orders and harvest all their souls.</p><textarea id="ocodes" placeholder="Paste an orders code"></textarea><div class="row"><button class="btn" data-mp="gotorders">Add orders</button></div>${GMX.msgs.map(m=>`<div class="msg ${m.bad?"bad":""}">${esc(m.t)}</div>`).join("")}</div>`;
 const miss=hs.filter(s=>!got[s]&&!G.players[s].elim);
 h+=`<div class="card"><h3>3 · Resolve</h3><p class="note">${miss.length?`Still missing: ${miss.map(s=>esc(G.players[s].name)).join(", ")}.`:"All human princes have sent orders."}</p><div class="row"><button class="btn pri" data-mp="resolve"${G.over?" disabled":""}>${GMX.confirm?"Click again to resolve":`Resolve turn ${T}`}</button></div>${G.over?`<div class="msg">The game is over.</div>`:""}</div>`;
 h+=`<div class="card"><h3>Backup</h3><div class="row"><button class="btn sm" data-mp="end">End multiplayer game and return to setup</button></div></div></div>`;
 $("#main").innerHTML=h}
function mailHTML(){if(!GMX.mail)return"";const sent=G.sent||{},n=GMX.mail.filter(m=>sent[m.s]).length;
 return`<div class="row"><button class="btn sm" data-mp="cpall">Copy all messages</button><span class="note">${n} of ${GMX.mail.length} marked sent</span></div>`+GMX.mail.map((m,i)=>`<div class="msg"><b>${esc(G.players[m.s].name)}</b> · <span class="note">${esc(m.to||"no email entered")} · code ${Math.round(m.size/1000*10)/10} KB</span> ${sent[m.s]?`<span class="ok">sent</span>`:""}<div class="row"><button class="btn sm" data-mp="cp" data-i="${i}" data-w="to">Copy address</button><button class="btn sm" data-mp="cp" data-i="${i}" data-w="subject">Copy subject</button><button class="btn sm" data-mp="cp" data-i="${i}" data-w="body">Copy message</button><button class="btn sm" data-mp="sent" data-i="${i}">${sent[m.s]?"Unmark sent":"Mark sent"}</button></div></div>`).join("")+`<p class="note">Paste each message into a new email or chat. Gmail drafts are not connected.</p>`}
function suLoad(){let r={};try{r=JSON.parse(localStorage.getItem("kodRoster2")||"{}")}catch(e){}
 return Object.assign({nh:2,na:2,nx:10,ny:6,rows:[]},r)}
function suRead(){const s=GMX.su||suLoad(),g=id=>document.getElementById(id);
 if(g("nh")){s.nh=+g("nh").value;s.na=+g("na").value;s.nx=+g("nx").value;s.ny=+g("ny").value;s.rows=[];for(let i=0;i<s.nh;i++)s.rows.push({name:g("sn"+i)?g("sn"+i).value:"",email:g("se"+i)?g("se"+i).value:""})}
 GMX.su=s;return s}
function renderGMSetup(){
 const s=GMX.su||(GMX.su=suLoad());s.nh=Math.max(1,Math.min(8,s.nh));s.na=Math.max(0,Math.min(8-s.nh,s.na));if(s.nh+s.na<2)s.na=1;
 const opt=(a,b,v,st=1)=>{let o="";for(let i=a;i<=b;i+=st)o+=`<option value="${i}"${i===v?" selected":""}>${i}</option>`;return o};
 const rows=[];for(let i=0;i<s.nh;i++){const r=s.rows[i]||{};rows.push(`<div class="seat"><b style="color:var(--c${i})">Prince ${i+1}</b><input type="text" id="sn${i}" value="${esc(r.name)}" placeholder="Prince name (blank = drawn from the name table)" aria-label="Prince name ${i+1}"><input type="email" id="se${i}" value="${esc(r.email)}" placeholder="email" aria-label="Email ${i+1}"></div>`)}
 $("#main").innerHTML=`<div class="mp"><h2>Set up a game</h2><p class="sub">Choose the number of human and AI princes (2 to 8 in all) and the size of the map. Human princes get a name and the email address their turns go to. AI princes get names from the name table.</p>
 <div class="card"><div class="row"><label>Human princes <select id="nh" data-su="1" style="width:auto">${opt(1,8,s.nh)}</select></label><label>AI princes <select id="na" data-su="1" style="width:auto">${opt(s.nh===1?1:0,8-s.nh,s.na)}</select></label><span class="note">${s.nh+s.na} princes in all</span></div>
 <div class="row"><label>Map width <select id="nx" data-su="1" style="width:auto">${opt(6,16,s.nx)}</select></label><label>Map height <select id="ny" data-su="1" style="width:auto">${opt(4,10,s.ny,2)}</select></label><span class="note">${s.nx * s.ny} planes. Height is even.</span></div></div>
 ${rows.join("")}<div class="row"><button class="btn pri" data-mp="start">Start the game</button></div><div id="mpmsg"></div></div>`}
document.addEventListener("input",e=>{const t=e.target;if(t&&(t.id==="pname"||(t.id||"").match(/^sn\d+$/))){const v=t.value.replace(/[^A-Za-z ]/g,"").replace(/ {2,}/g," ").replace(/^ /,"");if(v!==t.value)t.value=v}});
document.addEventListener("change",e=>{if(MODE==="gm"&&e.target.dataset&&e.target.dataset.su){suRead();renderGMSetup()}});
async function gmAct(d,t){
 const a=d.mp;
 if(a==="start"){const s=suRead();
  const seats=[];for(let i=0;i<s.nh;i++)seats.push({human:true,name:s.rows[i].name.trim(),email:s.rows[i].email.trim()});for(let i=0;i<s.na;i++)seats.push({human:false});
  if(seats.length<2||seats.length>8)return mpMsg("Choose 2 to 8 princes in all.",1);
  try{localStorage.setItem("kodRoster2",JSON.stringify(s))}catch(e){}GMX.su=null;newGame({seats,nx:s.nx,ny:s.ny});G.got={};GMX.mail=null;GMX.msgs=[];save();renderAll()}
 else if(a==="mail"){GMX.link=$("#glink").value.trim()||GMX.link;try{localStorage.setItem("kodLink",GMX.link)}catch(e){}
  t.textContent="Building…";G.sent={};GMX.mail=await Promise.all(humanSeats().map(s=>mailFor(s,GMX.link)));renderGM()}
 else if(a==="cpall"){copyText(GMX.mail.map(m=>`===== To: ${m.to||"(no email)"} =====\nSubject: ${m.subject}\n\n${m.body}`).join("\n\n"),t)}
 else if(a==="sent"){const m=GMX.mail[+d.i];G.sent=G.sent||{};G.sent[m.s]=!G.sent[m.s];save();renderGM()}
 else if(a==="cp"){const m=GMX.mail[+d.i];copyText(m[d.w],t)}
 else if(a==="gotorders"){const ta=$("#ocodes");let msg;try{const o=await unpack(ta.value);const n=applyOrders(o);msg={t:`Orders received from ${n} for turn ${o.t}.`};save();ta.value=""}catch(e){msg={t:e.message,bad:1}}
  GMX.msgs=[msg];renderGM()}
 else if(a==="resolve"){const miss=humanSeats().filter(s=>!(G.got||{})[s]&&!G.players[s].elim);
  if(miss.length&&!GMX.confirm){GMX.confirm=true;return renderGM()}
  GMX.confirm=false;resolveTurn();G.got={};G.sent={};GMX.mail=null;GMX.msgs=[{t:`Turn ${G.turn-1} resolved. Prepare the mail for turn ${G.turn}.`}];save();renderGM()}
 else if(a==="end"){if(GMX.endc){G=null;try{localStorage.removeItem("kodGM")}catch(e){}GMX.endc=false;renderAll()}else{GMX.endc=true;t.textContent="Click again to delete this multiplayer game"}}}
document.addEventListener("click",async e=>{const t=e.target.closest("[data-mp]");if(!t)return;const d=t.dataset,a=d.mp;
 try{
  if(a==="menu")showMenu();
  else if(a==="close")closeModal();
  else if(a==="mode"){closeModal();setMode(d.m)}
  else if(a==="pkeep"){delete G.askName;save();closeModal()}
  else if(a==="pname"){const v=cleanName($("#pname").value,40);const sd=G.seed0!=null?G.seed0:G.seed;const dg=G.players.slice(1).map((_,i)=>{const e=$("#dg"+i);return e?+e.value:DANGER_DEF});if((v&&v!==G.players[0].name)||dg.some(x=>x!==DANGER_DEF)){newGame({name:v||G.players[0].name,seed:sd,danger:dg})}else delete G.askName;UI.tab="report";UI.rep=null;save();closeModal();renderAll()}
  else if(a==="names"){modal(`<h2>AI prince names</h2><p class="sub">One name per line. Each new game gives its AI-controlled seats names drawn from this list, without repeats. Needs at least 3 names; add more for variety. Games already under way keep their names.</p><textarea id="nlist" style="min-height:260px">${esc(nameList().join("\n"))}</textarea><div class="row"><button class="btn pri" data-mp="nsave">Save names</button><button class="btn" data-mp="nreset">Restore the standard list</button><button class="btn" data-mp="close">Close</button></div><div id="mpmsg"></div>`)}
  else if(a==="nsave"){const l=[...new Set($("#nlist").value.split("\n").map(s=>s.trim()).filter(Boolean))];
   if(l.length<3)mpMsg("Enter at least 3 different names.",1);else{try{localStorage.setItem("kodAIN",JSON.stringify(l))}catch(e){}mpMsg(`Saved ${l.length} names. They apply to the next game you start.`)}}
  else if(a==="nreset"){try{localStorage.removeItem("kodAIN")}catch(e){}$("#nlist").value=DPN.join("\n");mpMsg("Standard list restored.")}
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
</script>
