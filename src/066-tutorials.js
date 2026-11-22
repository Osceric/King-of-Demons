
/* ===== TUTORIALS: short animated slide shows that run on the REAL screens, using a sandboxed demo game =====
   The demo game never touches the player's game: withDemo() swaps G (and map size, seat, UI.open) in and out,
   and save() refuses to write while DEMO_ON is true. Each slide re-renders a real tab (renderOrders, ...) into the stage,
   then a spotlight ring, a moving cursor and a one-line caption explain it. No sound. */
let DEMO=null,DEMO_ON=false;
const T={show:null,i:0,playing:true,done:false,tok:0,timers:[],adv:null,open:{},hid:null};
function demoBuild(){/* a throwaway game with a fixed seed; the real G and map size are put back afterwards */
 const rg=G,nx=NX,ny=NY,rme=ME;
 try{newGame({seed:20260});DEMO=G;DEMO.askName=false}finally{G=rg;ME=rme;setDims(nx,ny)}
 return DEMO}
function withDemo(fn){
 if(!DEMO)demoBuild();
 const rg=G,nx=NX,ny=NY,rme=ME,ro=UI.open,rs=UI.sel,rt=UI.tab,rf=UI.filter;
 G=DEMO;DEMO_ON=true;setDims(DEMO.cfg.nx,DEMO.cfg.ny);ME=0;UI.open=T.open;
 try{return fn(G)}finally{G=rg;DEMO_ON=false;setDims(nx,ny);ME=rme;UI.open=ro;UI.sel=rs;UI.tab=rt;UI.filter=rf}}
function demoReset(show){
 DEMO=null;T.open={};T.sel=null;demoBuild();
 withDemo(g=>{T.hid=hordesOf(0)[0].id;if(show&&show.init)show.init(g,hordesOf(0)[0])})}
function demoRun(fn){withDemo(g=>fn(g,hordesOf(0)[0]))}
function demoPage(tab){/* draw a real tab into the stage: the stage borrows the id "main" for the moment the renderer runs */
 const real=$("#main"),pg=$("#tpage");if(!real||!pg)return;
 real.id="main_real";pg.id="main";
 try{withDemo(()=>{UI.tab=tab;UI.sel=T.sel||null;({orders:renderOrders,realm:renderRealm,standing:renderStanding,report:renderReport})[tab]()})}
 finally{pg.id="tpage";real.id="main"}
 pg.inert=true}

/* ---------- the slide shows ---------- */
const tutPortal=(a,b)=>pg=>{/* the portal marker drawn between two neighbouring planes */
 const A=pg.querySelector(`g[data-act=plane][data-id=${a}]`).getBoundingClientRect(),B=pg.querySelector(`g[data-act=plane][data-id=${b}]`).getBoundingClientRect(),cy=(A.top+A.bottom)/2;
 return[...pg.querySelectorAll('g[data-tip="Portal"]')].find(g=>{const r=g.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;return x>A.right-4&&x<B.left+4&&Math.abs(y-cy)<A.height/2})};
const tutChasm=near=>pg=>{/* the dark gap where two planes have no portal, nearest to a given plane */
 const c=pg.querySelector(`g[data-act=plane][data-id=${near}]`).getBoundingClientRect(),cx=(c.left+c.right)/2,cy=(c.top+c.bottom)/2;
 return[...pg.querySelectorAll('rect[fill="#080408"]')].sort((p,q)=>{const d=r=>{const b=r.getBoundingClientRect();return Math.hypot((b.left+b.right)/2-cx,(b.top+b.bottom)/2-cy)};return d(p)-d(q)})[0]};
const TUTS=[
 {id:"souls",title:"Souls and your Well",blurb:"Where souls come from, where they are kept, and what happens to the ones you do not spend.",tab:"realm",
  steps:[
   {sel:"table.kp tr:nth-child(3)",cap:"Every plane you hold pays you <b>souls</b> each turn. This row is your home plane."},
   {sel:"table.kp tr:nth-child(4)",cap:"Add them up and that is your <b>total yield</b>: the souls you earn a turn."},
   {tab:"orders",sel:".sums > div:nth-child(1)",cap:"Your souls sit in your <b>Well of Souls</b>, or Well."},
   {tab:"orders",sel:".sums",cap:"Commands spend souls from the Well. This bar adds up what your orders cost.",dur:4400},
   {tab:"orders",sel:".card > h3 + .note",dur:5200,cap:"Souls you do not spend are not wasted. Every three you keep return four next round."}
  ]},
 {id:"map",title:"The Realm map",blurb:"How to read the Abyss: your planes, Minor Powers, unexplored planes and the portals between them.",tab:"realm",
  steps:[
   {sel:".mapbox",dur:5400,cap:"This is the Abyss: 60 planes in a grid. The map wraps at every edge."},
   {sel:tutPortal("B01","C01"),dur:8000,cap:"A red <b>portal marker</b> joins two planes. Hordes can travel only along portals.",
    then:{at:4000,sel:tutChasm("B01"),cap:"No portal between two planes? Then hordes <b>cannot move</b> between them."}},
   {sel:"g[data-act=plane][data-id=B01]",dur:5400,cap:"Your home plane glows green. The <b>sword</b> is its Domination Level and the <b>gem</b> is its Value."},
   {sel:"g[data-act=plane][data-id=C01]",dur:5400,cap:"Grey planes belong to Minor Powers. The <b>!</b> marks a Minor Horde defending it."},
   {sel:"g[data-act=plane][data-id=D01]",dur:5400,cap:"A dashed outline is a plane you have not explored yet."},
   {sel:".legend",cap:"The legend decodes the colors and icons. Red lines are the portals hordes travel through.",dur:6200},
   {sel:"g[data-act=plane][data-id=C01]",act:()=>{T.sel="C01"},look:"#pdetail",dur:10000,cap:"Click any plane to read about it below and send a horde there.",
    then:{at:4600,sel:pg=>[...pg.querySelectorAll("#pdetail button")],cap:"Use these two buttons to send a horde: <b>Move and Dominate</b> or <b>Forced March</b>."}},
   {sel:"#pdetail .kv > span:last-child",dur:11000,cap:"Plane information can be out of date and potentially wrong. <b>Live</b> means the information is current. A number represents how old the data is in number of turns."}
  ]},
 {id:"horde",title:"Hordes: reading the card",blurb:"What every line on a horde card means, from the general's name to rage and the demon tables.",tab:"orders",
  init:(g,h)=>{h.loc=g.planes[g.players[0].home].links[0];h.demons={[DK[1]]:30,[DK[5]]:12,[DK[7]]:6};h.rage=7;h.tr=0;h.tp=0;h.lv=[2,0,0,0];h.rc="a crowd of demons far from home"},
  steps:[
   {sel:"#hc-$H",dur:2500,cap:"This is a <b>horde card</b>: one general and the demons who follow him."},
   {sel:"#hc-$H .gen",dur:3000,cap:"The horde's number and its <b>general's name</b>."},
   {sel:"#hc-$H [data-act=gdet]",act:()=>{T.open["gd"+T.hid]=true},look:"#hc-$H .gdet",cap:"<b>Details</b> shows the general's age, experience, resurrections and abilities."},
   {sel:"#hc-$H > .kv > span:nth-child(1)",dur:4400,cap:"The <b>horde type</b>. Heavy demons move 1 plane a turn. Fast demons move 3."},
   {sel:["#hc-$H > .kv > span:nth-child(2)","#hc-$H > .kv > span:nth-child(3)"],dur:5400,cap:"<b>Strength</b> is how hard the horde hits. <b>Purge</b> destroys enemy demons of that tier and lower."},
   {sel:["#hc-$H > .kv > span:nth-child(4)","#hc-$H > .note"],dur:6200,cap:"<b>Mindless Rage</b>: crowded demons far from home turn unruly. The status shows how bad it is, the note says why."},
   {sel:"#hc-$H > .kv > span:nth-child(5)",dur:4400,cap:"<b>Move</b> is how many planes the horde travels a turn, at the pace of its slowest demon."},
   {sel:"[data-act=dtab]",act:()=>{T.open.dtab=true},look:".sec .grid",dur:9000,cap:"<b>Show the demon tables</b> to compare cost and strength before you summon.",
    then:{at:4200,sel:"[data-act=dtab]",click:1,act:()=>{T.open.dtab=false},cap:"Click the same button again (it now says <b>Hide the demon tables</b>) to tuck them away."}},
   {sel:"[data-act=abil]",act:()=>{T.open.abil=true},look:"table.dtt",dur:8000,cap:"<b>Show general abilities</b> lists what a general can earn at Age 10 and at Experience 10.",
    then:{at:4200,sel:"[data-act=abil]",click:1,act:()=>{T.open.abil=false},cap:"Click again to hide the list."}}
  ]},
 {id:"cmds",title:"Orders: horde commands",blurb:"Give a horde its command and read what the card tells you about it.",tab:"orders",
  steps:[
   {sel:"#hc-$H",dur:2500,cap:"Each horde gets <b>one command</b> a turn."},
   {sel:"#hc-$H .cmdrow",act:(g,h)=>{h.cmd={type:"MARCH"}},keep:1,dur:8200,cap:"Pick a command from this list: Hold, Dominate, Forced March, Raid, Summon or Disband.",
    then:{at:3200,sel:["#hc-$H .cmdrow","#hc-$H > :last-child"],cap:"Details about the command you pick appear <b>just below the list</b>."}},
   {sel:"#hc-$H .cmdrow",act:(g,h)=>{const K=g.players[0].known,d=distMap(h.loc),far=Object.keys(K).filter(id=>id!==h.loc).sort((a,b)=>d[b]-d[a])[0];h.cmd={type:"DOMINATE",target:far}},look:["select[data-k=tgt]","#hc-$H > :last-child"],dur:7500,cap:"Move and Dominate need a <b>target plane</b>. The card then estimates how long the trip takes."}
  ]}
];

/* ---------- player ---------- */
/* Rule: a highlight never moves or resizes until it has been showing for at least 2 seconds (the first move after a click is at 2.0 s; later moves are 'then' steps, each at least 2 s after the one before). */
const tutMs=sh=>sh.steps.reduce((a,x)=>a+(x.dur||(x.act?5400:4400)),0),tutClock=ms=>{const t=Math.round(ms/1000);return Math.floor(t/60)+":"+String(t%60).padStart(2,"0")};
function tutClear(){T.timers.forEach(clearTimeout);T.timers=[];if(T.adv&&T.adv.t)clearTimeout(T.adv.t);T.adv=null}
function tutLater(fn,ms,tok){T.timers.push(setTimeout(()=>{if(tok===T.tok&&$("#tstage"))fn()},ms))}
function tutSel(s){return s?String(s).replace(/\$H/g,T.hid):null}
function tutGeom(sel){/* box of the target (or the union of several targets) in page coordinates, independent of any scroll in progress */
 const pg=$("#tpage"),p=pg.getBoundingClientRect(),list=[].concat(sel||[]).flatMap(x=>typeof x==="function"?[].concat(x(pg)||[]):[pg.querySelector(tutSel(x))]).filter(Boolean);if(!list.length)return null;
 let t=1e9,l=1e9,r=-1e9,b=-1e9;for(const el of list){const e=el.getBoundingClientRect();t=Math.min(t,e.top);l=Math.min(l,e.left);r=Math.max(r,e.right);b=Math.max(b,e.bottom)}
 return{top:t-p.top,left:l-p.left,w:r-l,h:b-t}}
function tutPlace(sel,click,first,keep,moveCur){
 const st=$("#tstage"),pg=$("#tpage"),ring=$("#tring"),cur=$("#tcur"),g=tutGeom(sel);if(!g)return;
 const sh=st.clientHeight,sw=st.clientWidth,ph=pg.offsetHeight;
 let y=g.h+30>=sh?g.top-16:g.top-(sh-g.h)/2;y=Math.max(0,Math.min(Math.max(0,ph-sh),y));if(keep&&T.y!=null)y=T.y;T.y=y;
 if(first){[pg,ring,cur].forEach(e=>e.classList.add("nt"))}
 pg.style.transform=`translateY(${-y}px)`;
 ring.style.cssText+=`;left:${g.left-6}px;top:${g.top-y-6}px;width:${g.w+12}px;height:${g.h+12}px;opacity:1`;
 /* the arrow's tip goes at the lower right corner of the highlight; if that would cover text, slide it a little outward until it covers none */
 const rx=g.left+g.w+6,ry=g.top-y+g.h+6,pr=pg.getBoundingClientRect(),boxes=[],tw=document.createTreeWalker(pg,NodeFilter.SHOW_TEXT);
 for(let n;n=tw.nextNode();){if(!n.textContent.trim())continue;const rg=document.createRange();rg.selectNodeContents(n);for(const q of rg.getClientRects())boxes.push([q.left-pr.left+2,q.top-pr.top-y+2,q.right-pr.left-2,q.bottom-pr.top-y-2])}
 const free=(x,yy)=>boxes.every(b=>x+22<=b[0]||x>=b[2]||yy+26<=b[1]||yy>=b[3]);
 let cx=rx-8,cy=ry-8;
 for(const [dx,dy] of[[0,0],[6,6],[14,4],[4,14],[22,8],[8,22],[30,0],[0,30],[40,12],[12,40],[50,0],[0,50]]){const x=rx+dx,yy=ry+dy;if(x+24>sw||yy+28>sh)continue;if(free(x,yy)){cx=x;cy=yy;break}}
 if(!keep||moveCur){cur.style.left=Math.max(4,Math.min(sw-26,cx))+"px";cur.style.top=Math.max(4,Math.min(sh-30,cy))+"px"}
 if(first){void st.offsetWidth;[pg,ring,cur].forEach(e=>e.classList.remove("nt"))}}
function tutBar(ms){const b=$("#tbar");if(!b)return;b.style.transition="none";b.style.width="0";void b.offsetWidth;b.style.transition=`width ${ms}ms linear`;b.style.width="100%"}
function tutAdvance(ms,tok){
 T.adv={start:Date.now(),left:ms};
 if(!T.playing)return;
 T.adv.t=setTimeout(()=>{if(tok!==T.tok)return;const sh=T.show;if(!sh)return;if(T.i<sh.steps.length-1)tutGo(T.i+1);else{const k=TUTS.indexOf(T.show);if(T.all&&k<TUTS.length-1)tutOpen(TUTS[k+1].id,true);else{T.playing=false;T.done=true;tutCtl()}}},ms)}
function tutCtl(){
 const sh=T.show;if(!sh||!$("#tctl"))return;
 const last=T.i>=sh.steps.length-1;
 $("#tplay").textContent=T.done?"↻ Replay":T.playing?"❚❚ Pause":"▶ Play";
 $("#tprev").disabled=T.i===0;$("#tnext").disabled=last;$("#tnext").textContent=T.playing?"Next ›":"Advance One Slide ›";
 const q=sh.steps[T.i];$("#trun").textContent="Section runtime "+tutClock(q.dur||(q.act?5400:4400));
 document.querySelectorAll("#tdots button").forEach((b,k)=>{b.classList.toggle("on",k===T.i);b.classList.toggle("seen",k<T.i)})}
function tutGo(i){
 const sh=T.show;if(!sh||!$("#tstage"))return;
 tutClear();const tok=++T.tok;T.i=i;T.done=false;
 demoReset(sh);
 for(let j=0;j<i;j++){const q=sh.steps[j];if(q.act)demoRun(q.act);if(q.then&&q.then.act)demoRun(q.then.act)}/* replay earlier clicks silently so Back and the dots show the right state */
 const s=sh.steps[i],tab=s.tab||sh.tab,first=!T.shown;T.shown=true;
 demoPage(tab);
 $("#tcap").innerHTML=`<div class="tcapin"><span class="tn">${i+1} / ${sh.steps.length}</span><span>${s.cap}</span></div>`;
 tutCtl();
 const ms=s.dur||(s.act?5400:4400);
 tutPlace(s.sel,!!s.act,first);
 if(T.playing)tutBar(ms);else{const b=$("#tbar");if(b){b.style.transition="none";b.style.width="0"}}/* paused: advancing one slide never restarts playback */
 if(s.act){
  tutLater(()=>$("#tcur").classList.add("tap"),1800,tok);
  tutLater(()=>{demoRun(s.act);demoPage(tab);tutPlace(s.look||s.sel,false,false,!!s.keep);$("#tcur").classList.remove("tap")},2000,tok)}
 if(s.then)tutLater(()=>{$("#tcap").innerHTML=`<div class="tcapin"><span class="tn">${i+1} / ${sh.steps.length}</span><span>${s.then.cap}</span></div>`;tutPlace(s.then.sel,!!s.then.click,false,!s.then.click,true)},s.then.at,tok);
 if(s.then&&s.then.act){tutLater(()=>$("#tcur").classList.add("tap"),s.then.at+1800,tok);tutLater(()=>{demoRun(s.then.act);demoPage(tab);tutPlace(s.then.sel,false,false,true,true);$("#tcur").classList.remove("tap")},s.then.at+2000,tok)}
 tutAdvance(ms,tok)}
function tutPause(){
 if(!T.playing)return;T.playing=false;
 if(T.adv){clearTimeout(T.adv.t);T.adv.left=Math.max(300,T.adv.left-(Date.now()-T.adv.start))}
 const b=$("#tbar");if(b){b.style.transition="none";b.style.width=getComputedStyle(b).width}
 tutCtl()}
function tutResume(){
 if(T.playing)return;
 if(T.done){tutGo(0);T.playing=true;tutCtl();return}
 T.playing=true;const tok=T.tok,left=T.adv?T.adv.left:1500;
 const b=$("#tbar");if(b){b.style.transition=`width ${left}ms linear`;b.style.width="100%"}
 tutAdvance(left,tok);tutCtl()}
function tutOpen(id,all){
 const sh=TUTS.find(x=>x.id===id);if(!sh)return;
 T.all=!!all;T.show=sh;T.shown=false;T.playing=true;T.done=false;T.i=0;tutClear();T.tok++;
 $("#main").innerHTML=`<div class="tutbar"><button class="btn sm" data-tut="menu">‹ All tutorials</button><b>${sh.title}</b>${T.all?`<span class="note">Play all: ${TUTS.indexOf(sh)+1} of ${TUTS.length}</span>`:""}</div>
 <div class="tstage" id="tstage" role="img" aria-label="Animated walkthrough: ${sh.title}"><div class="tpage" id="tpage"></div><div class="tring" id="tring"></div><div class="tcur" id="tcur"><svg viewBox="0 0 24 28" width="26" height="30" aria-hidden="true"><path d="M3 2l17 11-7.5 1.6L9 22z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg><i></i></div></div>
 <div class="tcap" id="tcap" aria-live="polite"></div>
 <div class="tctl" id="tctl"><button class="btn" id="tprev" data-tut="prev">‹ Back</button><button class="btn" id="tplay" data-tut="play"></button><button class="btn" id="tnext" data-tut="next">Next ›</button><span class="tdots" id="tdots">${sh.steps.map((_,k)=>`<button data-tut="dot" data-i="${k}" aria-label="Slide ${k+1}"></button>`).join("")}</span><span class="note truntime" id="trun"></span></div>
 <div class="tprog"><i id="tbar"></i></div>`;
 window.scrollTo(0,0);tutGo(0)}
function renderTutorials(){
 tutClear();T.tok++;T.show=null;T.shown=false;
 $("#main").innerHTML=`<h2>Tutorials</h2><p class="sub">Short animated walkthroughs of the real game screens. No sound, and almost no reading. Pick one to watch, and pause or step through it whenever you like.</p>
 <p><button class="btn playall" data-tut="all">▶ Play all tutorials</button></p>
 <div class="grid cols2">${TUTS.map(s=>`<button class="card tutcard" data-tut="open" data-id="${s.id}"><h3>${s.title}</h3><div class="note">${s.blurb}</div><div class="playhint">▶ Click to play</div><div class="note"><b>${s.steps.length} slides</b> · topic runtime ${tutClock(tutMs(s))}</div></button>`).join("")}</div>
 <p class="note" style="margin-top:14px">Nothing here touches your game: the screens come from a practice game that is thrown away afterwards.</p>`}
document.addEventListener("click",e=>{
 const b=e.target.closest&&e.target.closest("[data-tut]");if(!b||!$("#main"))return;
 const a=b.dataset.tut;
 if(a==="open")tutOpen(b.dataset.id);
 else if(a==="all")tutOpen(TUTS[0].id,true);
 else if(a==="menu")renderTutorials();
 else if(a==="play"){T.playing?tutPause():tutResume()}
 else if(a==="prev"&&T.i>0){const p=T.playing;tutGo(T.i-1);if(!p){tutPause()}}
 else if(a==="next"&&T.show&&T.i<T.show.steps.length-1){const p=T.playing;tutGo(T.i+1);if(!p){tutPause()}}
 else if(a==="dot"){const p=T.playing;tutGo(+b.dataset.i);if(!p){tutPause()}}});
let tutRz=null;window.addEventListener("resize",()=>{if(!T.show||!$("#tstage"))return;clearTimeout(tutRz);tutRz=setTimeout(()=>{const p=T.playing;T.shown=false;tutGo(T.i);if(!p)tutPause()},300)});
