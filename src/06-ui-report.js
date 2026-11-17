
/* ===== UI ===== */
const UI={tab:"report",rep:null,filter:"all",sel:null,confirmNew:false,open:{}};
const $=s=>document.querySelector(s);
const short=i=>G.players[i].name.split(" ")[0];
function hLabel(id){const h=G.hordes.find(x=>x.id===+id);return h?`Horde ${hno(h)} · ${h.gen}`:"Horde"}
function ref(t){return t.replace(/\[\[([PHX]):([^\]]+)\]\]/g,(m,k,v)=>{
 if(k==="P")return`<a class="ref" role="button" tabindex="0" data-act="plane" data-id="${v}">${v}</a>`;
 if(k==="H")return`<a class="ref" role="button" tabindex="0" data-act="horde" data-id="${v}">${hLabel(v)}</a>`;
 return`<span class="who" style="color:var(--c${v})">${short(+v)}</span>`})}
const dl=(n,f=fmt0)=>n===0?'<span class="d eq">no change</span>':`<span class="d ${n>0?"up":"dn"}">${n>0?"▲":"▼"} ${f(Math.abs(n))}</span>`;
const PILL={good:"Success",warn:"Partial",bad:"Setback",info:"Info"};
const line=(sev,txt,lab)=>`<div class="line"><span class="pill s-${sev}">${lab||PILL[sev]}</span><div>${ref(txt)}</div></div>`;
let MODE="solo";const SK=()=>({solo:"kod1",player:"kodP",gm:"kodGM"})[MODE]||"kod1";
const savedTxt=t=>{const d=new Date(t),n=new Date(),tm=d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});return d.toDateString()===n.toDateString()?tm:d.toLocaleDateString([],{month:"short",day:"numeric"})+" "+tm};let SAVE_ERR=null;function save(){try{if(G){G.savedAt=Date.now();localStorage.setItem(SK(),JSON.stringify(G));SAVE_ERR=null}}catch(e){SAVE_ERR=String((e&&e.name)||e)}}
function ageLabel(t){return t<0?"unexplored":t===G.turn?"live":`${G.turn-t} turn${G.turn-t>1?"s":""} old`}

function renderHeader(){
 const P=G.players[0];
 if(!G.no)G.no=gameNo();$("#gameno").innerHTML=`Game No. ${G.no}<span class="ver">v${GAME_VERSION}</span>${G.savedAt?` <span class="ver" title="When this game was last saved in this browser">saved ${savedTxt(G.savedAt)}</span>`:""}${(SAVE_ERR||(window.DIAG&&window.DIAG.store==="blocked"))?` <span class="ver" style="color:#e8604c" title="This browser is not letting the page keep your game. Reloading or closing this tab will lose it.">⚠ not saving</span>`:""}`;
 $("#prince").innerHTML=`<b>${P.name}</b> · ${RK[P.rank].n}`;
 $("#meters").innerHTML=`<div><span>Turn</span> <b>${G.turn}</b></div><div title="${TIP_WELL}"><span>Well</span> <b>${fmt0(P.well)}</b></div><div title="${TIP_INC}"><span>Total Yield</span> <b>${fmt0(income(0))}</b></div><div><span>Planes</span> <b>${ownedPlanes(0).length}</b></div>`;
 const att=G.reports[G.reports.length-1].attention.filter(a=>a.sev==="bad"||a.sev==="warn").length;
 const tabs=[["report","Report",att],["orders","Orders",0],["realm","Realm",0],["standing","Standing",0]];
 if(!G.seenTabs){G.seenTabs={};if(G.turn>1)for(const k of["orders","realm","standing"])G.seenTabs[k]=true}
 $("#tabs").innerHTML=tabs.map(([k,l,n])=>`<button class="tab${["orders","realm","standing"].includes(k)&&!G.seenTabs[k]?" pulse":""}" role="tab" data-act="tab" data-id="${k}" aria-selected="${UI.tab===k}">${l}${n?`<span class="n">${n}</span>`:""}</button>`).join("")+(DL?`<button class="btn sm pdfb" id="pdfbtn" data-act="pdf" title="Save the Report, Realm and Standing tabs as a PDF">Export PDF</button>`:"")}

const isAI=i=>{const p=G.players[i];return p.ai!==undefined?p.ai:!p.human};
function aiOpenTag(i){if(i===0||!isAI(i))return"";const p=G.players[i];return p.open?` <span class="pill s-info" title="Order a Blood Pact with this prince now and it will answer">Open to a Blood Pact</span>`:` <span class="pill" title="This prince will not answer a Blood Pact offer this turn">Closed to a Blood Pact</span>`}
function bondTag(i){if(i===0)return"";const k=(G.bonds||[]).find(k=>((k.a===0&&k.b===i)||(k.a===i&&k.b===0))&&k.from<=G.turn&&k.until>=G.turn);if(!k)return"";const left=k.until-G.turn+1;return` <span class="pill s-good" title="Blood Pact: no fighting between you, no taking each other's planes, +${fmt0(k.inc)} souls a turn each">Blood Pact · ${left} turn${left===1?"":"s"} left · +${fmt0(k.inc)} souls/turn</span>`}
function princesCard(){return`<div class="sec card"><h3>The princes of the Abyss</h3><p class="note" style="margin-top:0">These are the demon princes who contend for the throne. Their colors match the map. A Blood Pact shows beside the prince you share it with. A prince run by the game says each turn whether it is open to a Blood Pact; an open one always answers the first prince who offers.</p><div style="display:grid;gap:6px">${G.players.map((p,i)=>{const dd=G.over&&i!==0,op=dd&&UI.open["vp"+i];return`<div><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--c${i});margin-right:8px"></i><b style="color:var(--c${i})">${esc(p.name)}</b>${i===0?` <span class="note">(you)</span>`:""} <span class="note">· ${RK[p.rank].n}</span>${bondTag(i)?"&ensp;&ensp;"+bondTag(i):""}${aiOpenTag(i)?"&ensp;&ensp;"+aiOpenTag(i):""}${dd?`&ensp;<button class="pill s-info" data-act="pvp" data-id="${i}" aria-expanded="${!!op}" title="Show this prince's victory points">Points ${fmt0(vp(i).total)} ${op?"▴":"▾"}</button>`:""}${op?vpTable(i):""}</div>`}).join("")}</div></div>`}
function vpTable(i){const v=(G.fv&&G.fv[i])||vp(i);return`<div class="card" style="margin:8px 0 4px"><h3 style="margin-top:0">${esc(G.players[i].name)}'s victory points</h3><div class="scroll"><table>${v.parts.map(p=>`<tr><td>${p[0]}<div class="note">${VPH[p[0]]||"15% on top of everything else."}</div></td><td class="r">${fmt0(p[1])}</td></tr>`).join("")}<tr><td><b>Total</b></td><td class="r"><b>${fmt0(v.total)}</b></td></tr></table></div></div>`}
function renderReport(){
 const R=G.reports,idx=UI.rep==null?R.length-1:UI.rep,r=R[idx],latest=idx===R.length-1;
 const opts=R.map((x,i)=>`<option value="${i}" ${i===idx?"selected":""}>${x.turn?`Turn ${x.turn} report`:"Opening briefing"}</option>`).reverse().join("");
 const f=UI.filter,F=(k,l)=>`<button class="chip" data-act="filter" data-id="${k}" aria-pressed="${f===k}">${l}</button>`;
 let h=`<div class="tools"><select id="repSel" data-k="rep" aria-label="Choose report">${opts}</select>${F("all","All")}${F("orders","My orders")}${F("events","Battles &amp; events")}${F("intel","Intel")}</div>`;
 if(G.end)h+=`<div class="cd"><b>End game under way.</b> ${G.end.reason}. The game ends after turn ${G.end.at}.</div>`;
 h+=`<h2>${r.turn?`Turn ${r.turn} report`:"Opening briefing"}</h2><p class="sub">${latest?"What happened, what you know now, and what needs you next.":"An archived report."}</p>`;
 h+=`<div class="head">${ref(r.headline)}</div>`;if(r.intro&&r.intro.length)h+=r.intro.map(t=>`<p class="note" style="max-width:70ch;margin:8px 0 8px 17px;font-size:14px;line-height:1.5">${ref(t)}</p>`).join("");
 if(!r.turn)h+=princesCard();
 if(r.stats){const s=r.stats;
  h+=`<div class="stats sec">
  <div class="stat" title="${TIP_WELL}"><div class="k">Well of Souls</div><div class="v">${fmt0(s.well[0])}</div>${dl(s.well[1])}</div>
  <div class="stat" title="${TIP_INC}"><div class="k">Total Yield / turn</div><div class="v">${fmt0(s.income[0])}</div>${dl(s.income[1])}</div>
  <div class="stat"><div class="k">Planes held</div><div class="v">${s.planes[0]}</div>${dl(s.planes[1])}</div>
  <div class="stat"><div class="k">Demons</div><div class="v">${fmt0(s.demons[0])}</div>${dl(s.demons[1])}</div>
  <div class="stat"><div class="k">Chaos rank</div><div class="v">${s.rank[0]} / 10</div>${dl(s.rank[1])}</div>
  <div class="stat"><div class="k">Standing</div><div class="v">#${s.vpr[0]} of ${G.players.length}</div>${dl(s.vpr[1],x=>x+" place"+(x>1?"s":""))}</div></div>
  <p class="note">Deltas compare with the start of the turn.</p>`}
 if(f==="all"){
  h+=`<div class="sec"><h3>${latest?"Needs your attention":"Needed attention then"}</h3><div class="card">`;
  h+=r.attention.length?r.attention.map(a=>`<div class="att"><span class="bar2 bg-${a.sev==="good"?"good":a.sev==="bad"?"bad":a.sev==="warn"?"warn":"info"}"></span><div class="t">${ref(a.text)}</div>${latest?`<button class="btn sm" data-act="tab" data-id="${a.tab}" ${a.plane?`data-plane="${a.plane}"`:""}>${a.tab==="orders"?"Give orders":a.tab==="realm"?"View map":"See standing"}</button>`:""}</div>`).join(""):`<div class="note">Nothing urgent. Plan your next move.</div>`;
  h+=`</div></div>`}
 if(f==="all"||f==="events"){
  h+=`<div class="sec"><h3>Battles and events</h3><div class="card">${r.events.some(e=>e.battle)?`<div class="note" style="margin-bottom:6px">Select an outcome to see the fight round by round.</div>`:""}`;
  h+=r.events.length?r.events.map((e,i)=>e.big?`<div class="card" style="font-size:20px;line-height:1.4;padding:14px;margin:8px 0;border-left:4px solid var(--bad)">${ref(e.text)}</div>`:e.battle?lineB(e,i,r.turn):line(e.sev,e.text,e.combat?"Battle":e.sev==="good"?"Gain":e.sev==="bad"?"Loss":"Note")).join(""):`<div class="note">No battles or changes of ownership.</div>`;
  if(r.rumors.length)h+=`<div class="note" style="margin-top:8px">Rumors from your Shadow Horde (not confirmed):</div>`+r.rumors.map(e=>line("info",e.text,"Rumor")).join("");
  h+=`</div></div>`}
 if(f==="all"||f==="orders"){
  h+=`<div class="sec"><h3>Your orders and what came of them</h3><div class="card">`;
  h+=r.echo.length?r.echo.map(e=>line(e.sev,e.text,e.tag==="Princely"?"Prince":e.tag==="Shadow"?"Shadow":null)).join(""):`<div class="note">No orders have been carried out yet. Open Orders to begin.</div>`;
  h+=`</div></div>`}
 if(f==="all"||f==="intel"){
  h+=`<div class="sec"><h3>New intelligence</h3><div class="card">`;
  h+=r.intel.length?`<div class="scroll"><table><tr><th>Plane</th><th>Name</th><th>Holder</th><th class="r">Dom</th><th class="r">Value</th></tr>${r.intel.map(id=>{const k=G.players[0].known[id];return`<tr class="click" data-act="plane" data-id="${id}"><td>${id}</td><td>${G.planes[id].name}</td><td>${k.np||(k.o!=null&&k.o>=0?short(k.o):"No one")}</td><td class="r">${k.d}</td><td class="r">${k.q}/7 ${QN[k.q]}</td></tr>`}).join("")}</table></div>`:`<div class="note">Nothing newly discovered. Move hordes into unknown planes, or SCRY, to learn more.</div>`;
  h+=`</div></div>`}
 $("#main").innerHTML=h}

/* ===== BATTLE DETAIL (the record is built in 056-battle-record.js; no dice, ratios or modifiers are ever shown) ===== */
const btList=bt=>{const k=Object.keys(bt||{});return k.length?k.map(x=>`${fmt0(bt[x])} ${DT[x].n}`).join(", "):"none"};
function renderBattle(b){
 if(!b.rounds)return`<div class="battle"><div class="note">This fight was reported under the old rules, so there is no round-by-round record.</div></div>`;
 const cas=(c,lab)=>c.planar&&!c.n?`${lab}: none to the plane itself.`:`${lab}: ${btList(c.bt)} (${fmt0(c.v)} souls).`;
 const sideH=s=>`<div><h3>${ref(s.who)} · ${s.role}</h3>${s.lines.map(l=>`<div class="bt-box"><b class="${s.mine?"you":"foe"}">Before:</b> ${ref(l)}</div>`).join("")}</div>`;
 return`<div class="battle"><div class="bt-h">${ref(`Battle at [[P:${b.pl}]] · ${b.pname}`)}</div><div class="note">${ref(b.intro)} ${ref(b.strength)} The fight lasted ${b.rounds.length} round${b.rounds.length===1?"":"s"}.</div>
 <div class="bt-cols">${b.sides.map(sideH).join("")}</div>
 <div class="rtw"><table class="rt"><thead><tr><th>Round</th><th>What happened</th><th>Result</th><th>Your losses</th><th>Enemy losses</th></tr></thead><tbody>${b.rounds.map(r=>`<tr><td>${r.r}</td><td>${r.tact?`<span class="fl">${ref(r.tact)}</span>`:""}${ref(r.happened)}${r.mm?`<span class="mm">${ref(r.mm)}</span>`:""}${(r.pur||[]).map(x=>`<span class="mm">${ref(x)}</span>`).join("")}</td><td class="r-${r.cls}">${r.label}</td><td>${r.mine}</td><td>${r.foe}</td></tr>`).join("")}</tbody></table></div>
 <div class="aft"><b>Afterward.</b><div>${ref(b.aft.ended)}</div><div>${cas(b.aft.mine,"Your casualties")}</div><div>${cas(b.aft.foe,"Enemy casualties")}</div>${b.aft.purge.map(p=>`<div>${ref(p)}</div>`).join("")}${b.aft.rets.map(r=>`<div>${ref(r)}</div>`).join("")}<div>${ref(b.aft.plane)}</div>${b.aft.notes.map(n=>`<div>${ref(n)}</div>`).join("")}<div class="note">Added to demons killed and lost.</div></div></div>`}
function lineB(e,i,turn){
 const key=turn+":"+i,open=!!UI.open[key],lab=(e.battle&&e.battle.pill&&e.battle.pill.label)||"Battle";
 return`<div class="line"><button class="pill s-${e.sev}" data-act="battle" data-k="${key}" aria-expanded="${open}" title="Show the blow by blow">${lab} ${open?"▴":"▾"}</button><div>${ref(e.text)}${open?renderBattle(e.battle):""}</div></div>`}
