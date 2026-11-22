
/* ===== ECONOMY & SCORE ===== */
const shadowBonus=p=>Math.min(.5,shadowVal(p)/100000);
function income(p){let s=0;for(const id in G.planes){const pl=G.planes[id];if(pl.owner===p)s+=QV(pl.q)*DOM[pl.dom].p}return Math.round(s*(1+RK[G.players[p].rank].b)*(1+shadowBonus(p)))+activeBonds(p).reduce((s,k)=>s+(k.inc||0),0)}
const SCRYU=2500,SCRYMAX=7500,scrySnap=s=>Math.min(SCRYMAX,Math.floor((s||0)/SCRYU)*SCRYU); /* SCRY costs 2,500 souls per extra hop, in multiples of 2,500, from 2,500 up to 7,500 */
const yieldNow=pl=>pl.owner==null||pl.owner<0?0:Math.round(QV(pl.q)*DOM[pl.dom].p*(1+RK[G.players[pl.owner].rank].b)*(1+shadowBonus(pl.owner)));
const maxNow=pl=>pl.owner==null||pl.owner<0?0:Math.round(QV(pl.q)*(1+RK[G.players[pl.owner].rank].b)*(1+shadowBonus(pl.owner)));
function defNum(id,k){const pl=G.planes[id];if(pl.owner===ME){const s=pdStats(pl);return Math.round(s.s)}
 {const g=(k.h||[]).find(x=>x.o===-1);if(g)return g.p;if(k.np)return null}
 if(k.o!=null&&k.o>=0&&k.d>0)return pubDef(id,k);return 0}
/* Values the Known Planes table shows for one plane; owned planes are read live. */
function rowVals(id){const pl=G.planes[id];let k=G.players[ME].known[id];if(!k||!k.full)return null;if(pl.owner===ME)k=Object.assign({},k,{o:ME,d:pl.dom,q:pl.q,np:null});
 const hz=hordeInfo(id,k);return{d:k.d,q:k.q,y:pl.owner===ME?yieldNow(pl):QV(k.q),f:defNum(id,k),hz:hz.n,sh:shNum(id,k),pd:pdNum(id,k)}}
/* The Known Planes defense columns. Horde: strength of the hordes known to be on the plane (u = some horde there could not be read). Shadow: the holder's public Shadow Horde strength that defends the plane (all at a home plane, a third elsewhere). Planar: the domination-based planar defense. A Minor Power's plane has only its horde. */
function hordeInfo(id,k){const pl=G.planes[id];if(pl.owner===ME){let n=0;for(const h of hordesOf(ME))if(h.loc===id&&total(h))n+=hstats(h).str;return{n:Math.round(n),u:false}}
 let n=0,u=false;for(const x of(k.h||[])){if(x.p==null)u=true;else n+=x.p}return{n:Math.round(n),u}}
function shNum(id,k){return k.o!=null&&k.o>=0?Math.round(pubSh(k.o)*(id===G.players[k.o].home?1:.33)):null}
function pdNum(id,k){return k.o!=null&&k.o>=0&&k.d>0?DOM[k.d].o+DOM[k.d].d:null}
const ownedPlanes=p=>Object.values(G.planes).filter(x=>x.owner===p);
function demonCount(p){let n=0;for(const h of hordesOf(p))n+=total(h);for(const k in G.players[p].shadow)n+=G.players[p].shadow[k];return n}
function vp(p){
 const P=G.players[p];let hs=0;
 for(const h of hordesOf(p))hs+=hstats(h).val;for(const k in P.shadow)hs+=P.shadow[k]*DT[k].cost; /* horde strength counts the soul cost of the demons you still have */
 let ctl=0;for(const pl of ownedPlanes(p))ctl+=pl.dom*Math.max(1,pl.q)*1000;
 const parts=[["Carnage",P.carnage],["Planes dominated",P.domVal*3000],["Demons lost",Math.round((P.lostSouls||0)*.75)],["Horde strength",hs],["Chaos Power",P.rank*50000],["Planes held",ctl],["Souls consumed",Math.round(P.consumed*.1)]];
 let t=parts.reduce((a,b)=>a+b[1],0);
 if(P.rank>=10){parts.push(["True Prince bonus (15%)",Math.round(t*.15)]);t=Math.round(t*1.15)}
 return{parts,total:Math.round(t)}}
let vpRank=p=>{const s=G.players.map((_,i)=>vp(i).total);return 1+s.filter(x=>x>s[p]).length};
const allMet=()=>G.players.every(P=>P.met.length>=G.players.length-1);
const effTier=p=>RK[G.players[p].rank].t;

/* ===== AI ===== */
function aiTarget(h,P){
 const s=hstats(h),d=costMap(h.loc,h.owner),dh=distMap(h.loc);let best=null,bs=0;
 for(const id in G.planes){const pl=G.planes[id];if(pl.owner===h.owner||dh[id]>9)continue;
  let hunt=false;if(pl.owner!=null&&pl.owner>=0&&G.turn<=PEACE_T){const me=G.players[h.owner],tg=G.players[pl.owner];
   if(tg.pers)continue;/* NPC princes leave Craven and Spiteful and Vengeful princes alone */
   if(me.pers){if(!(G.hit&&G.hit[h.owner]&&G.hit[h.owner][pl.owner]))continue;hunt=me.pers==="GRUDGE"}}/* they attack only a prince who has attacked them */
  let tS=0;
  const g=G.hordes.find(x=>x.owner===-1&&x.loc===id&&total(x));
  if(g){tS=hstats(g).str}else if(pl.npc)continue;
  if(pl.owner!=null){tS+=pdStats(pl).s}
  for(const e of G.hordes)if(e.loc===id&&e.owner>=0&&e.owner!==h.owner&&total(e)){tS+=hstats(e).str}
  const r=tS>0?s.str/tS:9;
  if(r<(hunt?1.0:1.6/P.agg))continue;
  const sc=(hunt?3:1)*(pl.q+2)*(pl.owner==null?1.2:1)/(d[id]+1.5)/(1+(h.cls==="H"?.25*d[id]:0));if(sc>bs){bs=sc;best=id}}
 return best}
function aiPlan(p){
 const P=G.players[p],rk=RK[P.rank],hs=hordesOf(p),prof=STRAT[P.strat]||{fom:true};let w=P.well;if(prof.save)w=w>=HARV_CAP?Math.max(0,w-(HARV_CAP-1000)):Math.floor(w*(1-prof.save));/* a saver plans with only part of the Well; the rest is harvested */
 P.princely=[];P.shadowCmd=null;
 const allowed=DK.filter(k=>DT[k].t<=rk.t),eff=k=>DT[k].st/DT[k].cost;
 const choose=cls=>{const s=allowed.filter(k=>DT[k].c===cls).sort((a,b)=>eff(b)-eff(a));return rnd()<.65?s[0]:pick(s.slice(0,Math.min(3,s.length)))};
 if(ownsHome(P.id)&&hs.length<capOf(P.id)&&w>=UNLEASH+3000&&G.turn>2){P.princely.push({type:"UNLEASH",souls:UNLEASH,cls:rnd()<.5?"F":"H"});w-=UNLEASH}
 const fo=Math.floor(w*.2);if(fo>0&&P.rank<10){if(prof.fom)P.princely.push({type:"FOMENT",souls:fo});w-=fo}
 let budget=Math.floor(w*.85);
 const want=4000+1300*G.turn*P.agg;
 const sb=Math.floor(budget*.1);if(sb>=100){const k=allowed.includes("Dre")?"Dre":allowed[0];P.shadowCmd={type:"SSUMMON",n:{[k]:Math.floor(sb/DT[k].cost)}};budget-=sb}
 for(const h of hs){
  {const sg=stageIdx(rageNow(h));if(RAGE.npcDisc&&rnd()<RAGE.npcP[sg]){h.cmd={type:"DISCIPLINE"};continue}}/* NPC princes know the exact rage and discipline a horde at Rioting or worse */
  const s=hstats(h);let done=false;
  const hunting=P.pers==="GRUDGE"&&G.turn<=PEACE_T&&G.hit&&G.hit[p]&&Object.keys(G.hit[p]).length>0,ready=s.val>=(2200+350*G.turn)*(hunting?.5:1);
  if(ready){const t=aiTarget(h,P);if(t){h.cmd={type:"DOMINATE",target:t};continue}}
  if(budget>=300&&s.val<want&&!enemyHere(h.loc,P.id)){
   const spend=Math.min(budget,Math.max(600,want-s.val)),n={};let rem=spend;
   for(let i=0;i<3&&rem>0;i++){const k=choose(h.cls||"F"),c=Math.floor((i<2?rem*.6:rem)/DT[k].cost);if(c>0){n[k]=(n[k]||0)+c;rem-=c*DT[k].cost}}
   const cost=Object.keys(n).reduce((a,k)=>a+n[k]*DT[k].cost,0);
   if(cost>0){h.cmd={type:"SUMMON",n};budget-=cost;done=true}
  }
  if(!done)h.cmd={type:"HOLD"}
 }
 /* END GAME DUMP: the AIs know the exact chance the game ends after this turn. From 25% up, unspent souls are worth more as points now than as harvest later, so they buy any chaos rank that costs less than 50,000 souls per rank and put the rest into the Shadow Horde. */
 if(G.end&&endChance(G.turn)>=.25){
  for(const h of hs)if(h.cmd&&h.cmd.type==="SUMMON")h.cmd={type:"HOLD"};
  P.princely=[];const k=allowed.filter(x=>DT[x].c==="F")[0],W=P.well;let fo=0;
  if(P.rank<10){let best=0;for(let R=P.rank+1;R<=10;R++){const C=RK[R].c-P.foment;if(C>0&&C<=W){const g=50000*(R-P.rank)-C;if(g>best){best=g;fo=C}}}}
  if(fo>0)P.princely=[{type:"FOMENT",souls:fo}];
  P.shadowCmd=k&&W-fo>=DT[k].cost?{type:"SSUMMON",n:{[k]:Math.floor((W-fo)/DT[k].cost)}}:null}
}

/* ===== TURN ===== */
const clone=o=>JSON.parse(JSON.stringify(o));
const sumN=n=>Object.keys(n).reduce((a,k)=>a+(n[k]||0)*DT[k].cost,0);
function cleanN(n,tier,cls){const o={};for(const k in n||{}){const c=Math.floor(+n[k]||0);if(c>0&&DT[k]&&DT[k].t<=tier&&(!cls||DT[k].c===cls))o[k]=c}return o}
const nText=n=>Object.keys(n).map(k=>fmt0(n[k])+" "+DT[k].n).join(", ");
function moveHorde(h){
 const c=h.cmd;if(!total(h)||!G.planes[c.target])return;
 const path=route(h.loc,c.target,h.owner),B=mvBudget(h);let steps=0,stop=null,left=B;
 for(const nx of path){if(h.t&&h.t.mut1&&steps>=1)break;const cost=stepCost(h.owner,nx);if(cost>left+1e-9)break;left-=cost;const pl=G.planes[nx],hos=hostile(pl,h.owner);
  h.from=h.loc;h.loc=nx;steps++;if(hos){stop={kind:"hostile",pl:nx};break}}
 h.t.mv={steps,stop,arrived:h.loc===c.target,hops:B}}
function resolveTurn(){
 const T=G.turn;G.ev=[];G.fq={};
 for(const h of G.hordes)if(h.owner>=0)h.pd=Object.assign({},h.demons);/* demons before this turn, for the change shown on the horde card */
 const HS=humanSeats(),BS={};
 if(G.players[0].human){const P0=G.players[0];(G.hist=G.hist||[]).push({t:T,p:P0.princely.filter(c=>c.type).map(c=>[c.type,c.souls|0,c.target==null?null:c.target,c.name||null]),h:G.hordes.filter(h=>h.owner===0).map(h=>[h.id,h.cmd.type,h.cmd.target||null]),s:(P0.shadowCmd&&(P0.shadowCmd.type==="SSUMMON"||P0.shadowCmd.type==="SUMMON")?["SHADOW SUMMON",Object.keys(P0.shadowCmd.n||{}).reduce((a,k)=>a+(DT[k]?Math.max(0,Math.floor(+P0.shadowCmd.n[k]||0))*DT[k].cost:0),0)]:null)})}/* what the human prince ordered this turn, for the result code */
 for(const s of HS)as(s,()=>{const me=G.players[s]; /* the start-of-turn picture each human prince's report compares against */
  BS[s]={well:me.well,income:income(s),planes:ownedPlanes(s).length,demons:demonCount(s),rank:me.rank,vpr:vpRank(s),vp:vp(s).total};
  const pv={};for(const id in me.known){const v=rowVals(id);if(v)pv[id]=v}setPrev(s,pv)})
 for(const h of G.hordes){h.t={fights:[]};h.t.cmd=clone(h.cmd)}
 for(const p of G.players){p.rank0=p.rank;p.pendS=null;p.scryR=0;if(p.human)p.echoP=[];if(p.elim){p.princely=[];p.shadowCmd=null}}
 for(const p of G.players)if(!p.human&&!p.elim)aiPlan(p.id);
 /* 1. summon spending */
 for(const P of G.players){
  const tier=effTier(P.id);if(P.shadowCmd&&P.shadowCmd.type==="SUMMON")P.shadowCmd.type="SSUMMON";/* SHADOW SUMMON (older orders called it SUMMON) */
  const items=hordesOf(P.id).map(h=>({h,c:h.cmd,shadow:false}));
  if(P.shadowCmd&&P.shadowCmd.type)items.push({h:null,c:P.shadowCmd,shadow:true});
  for(const it of items){const c=it.c,h=it.h;
   if(!it.shadow&&c.type==="DISBAND"&&rageOn(h,3)&&rnd()<Math.min(1,RAGE.refuse*h.lv[2])){h.t.refused="DISBAND";it.res={fail:"the horde refused"};h.cmd={type:"HOLD"}}
   else if(!it.shadow&&c.type==="DISCIPLINE"){const ok=rageNow(h)>=RAGE.stages[0]&&total(h)>0;
    if(ok){const sg=stageIdx(rageNow(h)),r=applyFrac({hordes:[h]},RAGE.disc.cost[sg-1]);let kn=r.kn,kv=r.kv;
     if(!kn){const ks=Object.keys(h.demons).sort((x,y)=>DT[x].t-DT[y].t);if(ks.length){const k=ks[0];h.demons[k]--;if(!h.demons[k])delete h.demons[k];kn=1;kv=DT[k].cost}}
     lostSouls(h.owner,kv);
     if(sg>=3&&rnd()<Math.min(RAGE.disc.resistCap,RAGE.disc.resist*(h.lv[2]||1)))h.t.disc={ok:true,n:kn,defied:true};/* a Mutinous horde may defy even this */
     else{h.rage=Math.max(0,(h.rage||0)-RAGE.disc.drop);h.tr=h.tp=0;h.purgeF=(h.purgeF||0)+RAGE.disc.fist;for(let k=1;k<=4;k++)if(stageIdx(h.rage)<k)h.lv[k-1]=0;h.t.disc={ok:true,n:kn}}}
    else h.t.disc={ok:false};h.cmd={type:"HOLD"}}
   else if(c.type==="DISBAND"&&!it.shadow){let val=0,nn=0;for(const k in h.demons){val+=h.demons[k]*DT[k].cost;nn+=h.demons[k]}
    const back=Math.floor(val*.1);P.well+=back;it.res={disband:true,back,n:nn};h.demons={};h.pend=null;h.gone=true;h.t.disbanded=true;h.cmd={type:"HOLD"}}
   else if(!it.shadow&&c.type==="SUMMON"&&enemyHere(h.loc,P.id)){it.res={fail:"summoning is not allowed while an enemy horde is on the plane at the start of the turn"}}/* no reinforcing in the middle of a fight; the souls are not spent */
   else if(c.type==="SUMMON"||c.type==="SSUMMON"){const n=cleanN(c.n,tier,it.shadow?"F":h.cls),cost=sumH(n,it.shadow?null:h);
    if(cost>0&&cost<=P.well){P.well-=cost;P.consumed+=cost;it.res={summon:n,cost};{const dst=it.shadow?P.shadow:h.demons;for(const k in n)dst[k]=(dst[k]||0)+n[k]}}/* summoned demons join their horde at once */
    else it.res={fail:cost>P.well?"not enough souls":"nothing to summon"}}
   if(it.shadow)P.shadowRes=it.res;else h.t.res=it.res}}
 /* 2. princely (after summons, so a rank gained now unlocks new tiers next turn) */
 const FC=forgeCost(T),paid=[],forged=new Set(),broke=new Set();
 for(const P of G.players)if(!P.human&&activeBonds(P.id).some(k=>k.from<T)&&!P.princely.some(c=>c.type==="BREAK"||c.type==="FORGE")&&P.well>=BREAKC+FC&&rnd()<.05*P.agg)P.princely=[{type:"BREAK"},...P.princely.filter(c=>c.type)].slice(0,4);/* now and then an AI prince backstabs */
 for(const P of G.players)if(P.princely.some(c=>c.type==="BREAK")&&activeBonds(P.id).length)broke.add(P.id);
 for(const P of G.players)if(!P.human&&!P.princely.some(c=>c.type==="FORGE")){/* an AI prince may answer a human's offer of a Blood Pact */
  const off=G.players.find(H=>H.human&&H.met.includes(P.id)&&H.princely.some(c=>c.type==="FORGE"&&c.target===P.id));
  if(off&&P.open&&P.well>=FC&&!pactBusy(P.id,off.id)&&!pactBusy(off.id,P.id))P.princely=[{type:"FORGE",target:off.id,souls:FC},...P.princely.filter(c=>c.type)].slice(0,4)}
 for(const P of G.players){
  let list=P.princely.slice(0,4).filter(c=>c.type);
  P.noOrders=!list.length&&!!P.human;
  
  for(const c of list){let s=Math.max(0,Math.min(Math.floor(c.souls||0),P.well));const e={type:c.type};
   if(c.type==="FOMENT"&&P.rank>=10){e.fail="you are already a Prince of Demons, the highest chaos power rank"}
   else if(c.type==="FOMENT"){P.well-=s;P.consumed+=s;P.foment+=s;e.souls=s;
    let up=false;while(P.rank<10&&P.foment>=RK[P.rank+1].c){P.rank++;up=true;P.rise=T+1;
     for(const s of humanSeats())if(s!==P.id)ev(s,{sev:"info",pri:-1,ico:"skull",text:riseText(P.id,P.rank)});
     if(P.human)ev(P.id,{sev:"good",pri:0,ico:"skull",text:`Chaos stirs: you rise to ${RK[P.rank].n} (rank ${P.rank}). More general slots and tier ${RK[P.rank].t} demons are yours.`,hl:`rose to ${RK[P.rank].n}`})}
    e.up=up;e.prog=P.foment;e.need=P.rank<10?RK[P.rank+1].c:0}
   else if(c.type==="UNLEASH"){const cap=Math.max(0,RK[P.rank0||P.rank].g-(P.genLost||0));/* the general limit is the rank held when the turn began */if(!ownsHome(P.id)){e.fail="no home plane"}else if(hordesOf(P.id).length<cap&&P.well>=UNLEASH){const rl=rally(P.id);if(!rl)e.fail="no home plane";else{P.well-=UNLEASH;P.consumed+=UNLEASH;const cl=c.cls==="F"?"F":"H",nh=newHorde(P.id,rl,{},cl,cleanName(c.name));nh.born=G.turn+1;e.cls=cl;e.name=cleanName(c.name);e.ok=true}}else e.fail=hordesOf(P.id).length>=cap?"no free general slot":"not enough souls"}/* the new general appears at once */
   else if(c.type==="SCRY"){const q=scrySnap(s);if(q<SCRYU)e.fail=P.well<SCRYU?"not enough souls":`it costs at least ${fmt0(SCRYU)} souls, in multiples of ${fmt0(SCRYU)}`;else{P.well-=q;P.consumed+=q;P.scryR=Math.max(P.scryR,1+q/SCRYU);e.souls=q;e.r=P.scryR}}
   else if(c.type==="FORGE"){const t=c.target;
    if(!(Number.isInteger(t)&&G.players[t]&&t!==P.id&&P.met.includes(t)))e.fail=P.met.length?"choose a rival prince you have met":"you have not met any prince yet";
    else if(!G.players[t].human&&!G.players[t].princely.some(c=>c.type==="FORGE"&&c.target===P.id))e.fail=G.players[t].open?`${G.players[t].name} answered another prince`:`${G.players[t].name} is not open to a Blood Pact this turn`;
    else if(broke.has(P.id)||broke.has(t))e.fail="a Blood Pact is being broken this turn";
    else if(forged.has(P.id))e.fail="only one Blood Pact can be made per turn";
    else if(pactBusy(P.id,t))e.fail="you are already bound by a Blood Pact to another prince";
    else if(pactBusy(t,P.id))e.fail=`${G.players[t].name} is already bound by a Blood Pact to another prince`;
    else if(P.well<FC)e.fail="not enough souls";
    else{forged.add(P.id);P.well-=FC;P.consumed+=FC;e.souls=FC;e.target=t;paid.push({a:P.id,b:t,e})}}
   else if(c.type==="BREAK"){const ab=activeBonds(P.id);
    if(!ab.length)e.fail="you have no Blood Pact to break";
    else if(P.well<BREAKC)e.fail="not enough souls";
    else{P.well-=BREAKC;P.consumed+=BREAKC;e.souls=BREAKC;e.ok=true;e.partner=ab[0].a===P.id?ab[0].b:ab[0].a;
     for(const k of ab){const o=k.a===P.id?k.b:k.a;k.until=T-1;k.broken=P.id;
      if(HUM(o))ev(o,{sev:"bad",pri:0,text:`BETRAYED! [[X:${P.id}]] has broken your Blood Pact. Your hordes may fight theirs from this turn, and the pact income is gone.`,hl:`was betrayed by [[X:${P.id}]], who broke the Blood Pact`});
      if(HUM(P.id))ev(P.id,{sev:"info",pri:2,text:`You broke your Blood Pact with [[X:${o}]]. Your hordes may fight theirs from this turn, and the pact income is gone.`})}}}
   if(P.human)P.echoP.push(e)}
  {const s=P.well;if(s>=HARV_CAP){if(P.human)P.echoP.push({type:"HARVEST",souls:s,off:true})}else if(s>0){P.well=0;P.hret+=Math.floor(s*4/3);if(P.human)P.echoP.push({type:"HARVEST",souls:s,ret:Math.floor(s*4/3),auto:true})}}/* harvesting scores no victory points; every unspent soul is harvested, and 3 become 4 next turn */
  P.unleash=0}
 for(const x of paid){/* a pact forms only when both princes paid for it. Otherwise the souls are lost and the payer is betrayed */
  const y=paid.find(z=>z.a===x.b&&z.b===x.a);
  if(y){x.e.ok=true;if(x.a<x.b){formBond(x.a,x.b,FC);const k=G.bonds.find(q=>(q.a===x.a&&q.b===x.b)||(q.a===x.b&&q.b===x.a));
    for(const s of [x.a,x.b])if(HUM(s))ev(s,{sev:"good",pri:3,text:`You and [[X:${s===x.a?x.b:x.a}]] are bound by a Blood Pact until turn ${k.until}. Your hordes will not fight each other or take each other's planes, and each of you earns ${fmt0(k.inc)} souls a turn (a third of the ${fmt0(FC)} paid).`,hl:`sealed a Blood Pact with [[X:${s===x.a?x.b:x.a}]]`})}}
  else{x.e.betrayed=true;if(HUM(x.a))ev(x.a,{sev:"bad",pri:0,text:`BETRAYED! You paid ${fmt0(FC)} souls for a Blood Pact with [[X:${x.b}]], but they did not answer. The souls are lost.`,hl:`was betrayed by [[X:${x.b}]]`})}}
 /* 3. movement */
 for(const h of G.hordes)if(h.owner>=0&&rageOn(h,3)){const c=h.cmd.type;
  if((c==="DOMINATE"||c==="RAID")&&rnd()<Math.min(1,RAGE.refuse*h.lv[2])){h.t.refused=c;h.cmd={type:"HOLD"}}
  else if(c==="MARCH")h.t.mut1=true}/* a Mutinous horde on a FORCED MARCH moves one plane at most */
 for(const h of G.hordes)if(h.owner>=0&&(h.cmd.type==="DOMINATE"||h.cmd.type==="MARCH"||h.cmd.type==="RAID")){const tp=G.planes[h.cmd.target];if(tp&&tp.owner!=null&&bonded(h.owner,tp.owner)){h.cmd={type:"HOLD"};h.t.pact=tp.id}}/* a Blood Pact forbids dominating a partner's plane */
 for(const h of G.hordes)if(h.owner>=0&&h.cmd.type==="RAID"){const tp=G.planes[h.cmd.target];if(!tp||tp.npc||tp.owner==null||tp.owner<0||tp.owner===h.owner){h.t.badraid=h.cmd.target||true;h.cmd={type:"HOLD"}}}/* only planes held by another prince can be raided */
 G.hit=G.hit||{};for(const h of G.hordes)if(h.owner>=0&&(h.cmd.type==="DOMINATE"||h.cmd.type==="MARCH"||h.cmd.type==="RAID")){const tp=G.planes[h.cmd.target];if(tp&&tp.owner!=null&&tp.owner>=0&&tp.owner!==h.owner)(G.hit[tp.owner]=G.hit[tp.owner]||{})[h.owner]=G.turn}/* an attack is an order that ends on a plane another prince owns (not a Blood Pact partner's, not a minor or unowned plane) */
 for(const h of G.hordes)if(h.cmd.type==="DOMINATE"||h.cmd.type==="MARCH"||h.cmd.type==="RAID")moveHorde(h);
 /* 4. conflicts */
 const ids=Object.keys(G.planes);
 /* fight order: work out who is attacking where first, then resolve each defender's home plane first (the whole Shadow Horde defends it), then the rest from the smallest attacking force to the largest, ties by plane id */
 const fkey={};for(const id of ids){const pl=G.planes[id];let a=0;for(const f of forcesAt(pl))if(f.owner!==pl.owner)a+=fStr(f);fkey[id]=[pl.owner!=null&&pl.owner>=0&&G.players[pl.owner].home===id?0:1,a]}
 const order=[...ids].sort((x,y)=>fkey[x][0]-fkey[y][0]||fkey[x][1]-fkey[y][1]||idCmp(x,y));
 for(let r=0;r<4;r++){let any=false;
  for(const id of order){const pl=G.planes[id];if(resolvePlane(pl))any=true;
   if(pl.npc&&!G.hordes.some(h=>h.owner===-1&&h.loc===id&&total(h))){const nm=pl.npcName;pl.npc=false;pl.owner=null;pl.dom=0;
    const w=forcesAt(pl)[0];if(w&&HUM(w.owner))ev(w.owner,{kind:"broke",sev:"good",pri:3,text:`${nm} is broken. [[P:${id}]] lies open.`,plane:id,hl:`broke ${nm} at [[P:${id}]]`})}
   if(pl.owner==null&&!pl.npc){const fs=forcesAt(pl).filter(f=>f.owner>=0);if(fs.length===1)takePlane(pl,fs[0].owner,"claim")}}
  if(!any)break}
 resolveRaids();
 /* 5. growth */
 for(const id of ids){const pl=G.planes[id];if(((pl.owner!=null&&pl.owner>=0)||pl.reb)&&!pl.hit&&pl.dom>0&&pl.dom<6)pl.dom++;pl.hit=false}
 /* 6. harvest */
 for(const P of G.players){const inc=income(P.id);P.well=P.well+Math.max(0,inc-(P.raidLost||0))+P.hret;P.hret=0;P.raidLost=0}
 /* 6b. elimination: no planes and less than a tenth of the weakest other prince's horde strength */
 {const sv=p=>{let s=0;for(const h of hordesOf(p))s+=hstats(h).val;return s};/* the Shadow Horde cannot attack, so it does not count */
  const live=G.players.filter(P=>!P.elim),out=[];
  for(const P of live){if(ownedPlanes(P.id).length)continue;const oth=live.filter(Q=>Q.id!==P.id).map(Q=>sv(Q.id));if(oth.length&&sv(P.id)<.1*Math.min(...oth))out.push(P)}
  for(const P of out){P.elim=T;G.hordes=G.hordes.filter(h=>h.owner!==P.id);P.shadow={};P.pendS=null;P.well=0;P.hret=0;P.princely=[];P.shadowCmd=null;P.unleash=0;P.unleashCls=[];P.unleashNm=[];G.bonds=(G.bonds||[]).filter(k=>k.a!==P.id&&k.b!==P.id)}
  for(const P of out)for(const s of HS)ev(s,{sev:"bad",pri:0,big:true,text:s===P.id?`In turn ${T} you were eliminated due to lack of planes and horde strength. Your remaining demons fled, your generals abandoned you, and your well of souls has cracked and the souls escaped. ${P.name} evaporates into sulfurous smoke. Further orders cannot be issued, but you could still win the game if your victory points are high enough...`:`In turn ${T} ${P.name} was eliminated. His sad form was pulverized into essence that became a dretch. Perhaps you can summon him into one of your hordes... His remaining demons, generals, and hordes were destroyed.`})}
 for(const k of (G.bonds||[])){/* bond reminders */
  const ends=k.until===T,warn=k.until===T+1;
  if(ends||warn)for(const [s,o] of [[k.a,k.b],[k.b,k.a]])if(HUM(s))ev(s,{sev:ends?"warn":"info",pri:ends?2:3,text:ends?`Your Blood Pact with [[X:${o}]] has ended.`:`Your Blood Pact with [[X:${o}]] lasts through next turn only. Both of you must pay for a Blood Pact again to renew it.`})}
 G.bonds=(G.bonds||[]).filter(k=>k.until>T);
 /* 8. echoes, knowledge, end check, report */
 const ECHO={};for(const s of HS)ECHO[s]=as(s,buildEcho);
 for(const h of G.hordes){if(h.owner<0||h.gone||!total(h))continue;/* abilities: one at Age 10, another at Experience 10 */
  for(const [slot,ok] of [["abA",genAge(h)+1>=10],["abE",(h.exp||0)>=10]]){if(h[slot]||!ok)continue;const pool=Object.keys(ABIL).filter(k=>!hasAb(h,k));if(!pool.length)continue;h[slot]=pool[Math.floor(rnd()*pool.length)];
   if(HUM(h.owner))ev(h.owner,{sev:"good",pri:3,text:`[[H:${h.id}]] gained the ability ${ABIL[h[slot]].n}: ${ABIL[h[slot]].t}`})}}
 {const rg=G.hordes.filter(h=>h.owner>=0&&!h.gone&&total(h));for(const h of rg)rageCalc(h);for(const h of rg)rageTick(h)}
 G.turn++;setOpen();
 for(const s of HS)as(s,()=>updateKnow(G.players[s].scryR));
 for(const h of G.hordes){if(h.owner<0)continue;const c=h.cmd;
  if(c.type==="SUMMON"||c.type==="RAID"||h.t.wiped||h.t.evicted)h.cmd={type:"HOLD"};/* a raid lasts one turn */
  else if((c.type==="DOMINATE"||c.type==="MARCH")&&G.planes[c.target]&&h.loc===c.target&&G.planes[c.target].owner===h.owner)h.cmd={type:"HOLD"};
  else if((c.type==="DOMINATE"||c.type==="MARCH")&&h.t.mv&&!h.t.mv.steps&&h.t.mv.stop)h.cmd={type:"HOLD"};
  h.stand=h.cmd.type!=="HOLD"}
 for(const s of HS){G.players[s].lastP=clone(G.players[s].princely);setDefaults(s)}
 if(!G.end){const trig=[];
  if(G.players.some(p=>p.rank>=6))trig.push({kind:"short",reason:"A prince has reached Chaos Lord (Chaos rank 6)"});
  if(G.everDom.length>=domNeed())trig.push({kind:"std",reason:`Nearly every plane has been dominated (${domNeed()} of ${NP})`});
  if(allMet())trig.push({kind:"std",reason:"Every prince has met every other"});
  if(trig.length){trig.sort((a,b)=>(a.kind==="short"?0:1)-(b.kind==="short"?0:1));G.end={t0:T,kind:trig[0].kind,reason:trig[0].reason}}}/* the first countdown to start is the only one; later triggers change nothing */
 if(G.end){if(G.end.t0==null){if(T>=G.end.at)G.over=true}/* a game saved before v2.87 keeps its fixed end */
  else{const h=endHaz(G.end.kind,T-G.end.t0);if(h>=1||(h>0&&rnd()<h))G.over=true}}
 if(T>=MAXT)G.over=true;
 {const hl=G.hist&&G.hist[G.hist.length-1];if(hl&&hl.t===T)hl.v=G.players.map((_,i)=>vp(i).total)}
 for(const s of HS){repsOf(s).push(as(s,()=>makeReport(BS[s],ECHO[s],T)));delete G.players[s].echoP}
}
function setDefaults(seat=ME){const P=G.players[seat];P.princely=[0,1,2,3].map(()=>({type:"",souls:0}));P.shadowCmd=null}
