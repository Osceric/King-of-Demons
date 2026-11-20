
/* ===== REPORT ===== */
const ownerRef=id=>{const pl=G.planes[id];return pl.npc?pl.npcName:pl.owner!=null&&pl.owner>=0?`[[X:${pl.owner}]]`:"no one"};
function buildEcho(){
 const out=[],me=G.players[ME];
 if(me.noOrders)out.push({tag:"Princely",sev:"info",text:(me.echoP||[]).some(e=>e.off)?"No Princely commands were given.":"No Princely commands were given. All unspent souls were harvested."});
 for(const e of (G.players[ME].echoP||[])){
  if(e.type==="FOMENT")out.push(e.fail?{tag:"Princely",sev:"bad",text:`FOMENT CHAOS failed: ${e.fail}.`}:{tag:"Princely",sev:e.up?"good":"info",text:`FOMENT CHAOS: ${fmt0(e.souls)} souls invested. ${e.up?`Chaos Power rose to ${RK[me.rank].n}.`:e.need?`Progress ${fmt0(e.prog)} of ${fmt0(e.need)} for ${RK[me.rank+1].n}.`:"You are at the summit."}`});
  else if(e.type==="HARVEST"&&e.off)out.push({tag:"Princely",sev:"warn",text:`Harvest is shut off: your Well holds ${fmt0(e.souls)} souls, at or above the ${fmt0(HARV_CAP)} limit. Your souls stay in the Well, and only income adds to it.`});
  else if(e.type==="HARVEST")out.push({tag:"Princely",sev:"good",text:`Unspent souls harvested: ${fmt0(e.souls)} souls. ${fmt0(e.ret)} will return to the Well.`});
  else if(e.type==="UNLEASH")out.push({tag:"Princely",sev:e.ok?"good":"bad",text:e.ok?`UNLEASH GENERAL: a new ${e.cls==="H"?"Assault":"Maneuver"} Commander${e.name?" named "+e.name:""} rises and can take ${e.cls==="H"?"Heavy":"Fast"} demons next turn.`:`UNLEASH GENERAL failed: ${e.fail}.`});
  else if(e.type==="FORGE")out.push(e.fail?{tag:"Princely",sev:"bad",text:`BLOOD PACT failed: ${e.fail}.`}:e.betrayed?{tag:"Princely",sev:"bad",text:`BLOOD PACT: BETRAYED! You paid ${fmt0(e.souls)} souls for a pact with [[X:${e.target}]], but they did not pay for one with you. The souls are lost and nothing happens.`}:{tag:"Princely",sev:"good",text:`BLOOD PACT: you paid ${fmt0(e.souls)} souls and [[X:${e.target}]] answered. The pact holds for ${BONDLEN} turns and returns ${fmt0(pactInc(e.souls))} souls to each of you every turn.`})
  else if(e.type==="BREAK")out.push(e.fail?{tag:"Princely",sev:"bad",text:`BREAK PACT failed: ${e.fail}.`}:{tag:"Princely",sev:"warn",text:`BREAK PACT: you paid ${fmt0(e.souls)} souls and ended your Blood Pact with [[X:${e.partner}]]. Hordes of yours and theirs on the same plane fight this turn.`});
  else if(e.type==="SCRY")out.push(e.fail?{tag:"Princely",sev:"bad",text:`SCRY failed: ${e.fail}.`}:{tag:"Princely",sev:"info",text:`SCRY: ${fmt0(e.souls)} souls spent. The Abyss is revealed within ${e.r} planar hops of your holdings.`}) }
 for(const h of G.hordes.filter(x=>x.owner===ME&&(!x.gone||(x.t&&x.t.disbanded)))){
  const c=h.t.cmd,t=h.t;if(!c)continue;
  const nm=`[[H:${h.id}]]`,verb=pick(VERBS),bits=[];let sev="info",head;
  const tgt=c.target?` [[P:${c.target}]]`:"";
  head=`${nm} was ${verb} to ${cmdName(c.type)}${tgt}.${h.stand?" (standing order)":""}`;
  if(c.type==="DOMINATE"||c.type==="MARCH"||c.type==="RAID"){
   const mv=t.mv;
   if(t.forced)bits.push("The Blood Pact was broken, so this horde stands and fights any former partner on its plane.");
   if(t.badraid)bits.push("A raid can only target a plane held by another prince. The horde holds.");
   if(c.type==="RAID"&&t.raid){bits.push(`Raided [[P:${t.raid.pl}]]: ${fmt0(t.raid.siph)} souls siphoned from its holder, ${fmt0(t.raid.keep)} came back to your Well. ${t.raid.lostN?fmt0(t.raid.lostN)+" demons were lost. ":""}${t.raid.from?`The horde withdrew to [[P:${t.raid.from}]].`:"It could not withdraw and stays."}`);sev="good"}
   else if(c.type==="RAID"&&mv&&mv.arrived&&!t.evicted&&!t.wiped)bits.push("The raid found nothing to take.");
   if(t.pact)bits.push(`A Blood Pact forbids dominating [[P:${t.pact}]], held by your partner. The horde holds.`);
   if(mv&&mv.steps)bits.push(`Moved ${mv.steps} plane${mv.steps>1?"s":""}.`);
   if(mv&&mv.stop)bits.push(mv.stop.kind==="border"?`Stopped short of [[P:${mv.stop.pl}]]: held by ${ownerRef(mv.stop.pl)}.`:`Blocked at hostile [[P:${mv.stop.pl}]].`);
   if(mv&&mv.arrived&&!mv.stop)bits.push(`Arrived.`);
   if(mv&&!mv.arrived&&!mv.stop&&mv.steps)bits.push(`Ran out of movement; ${bfs(h.loc,c.target).length} plane(s) still to go.`);
   sev=t.took||(mv&&mv.arrived&&!t.evicted&&!t.wiped)?"good":(mv&&mv.steps)?"warn":"info";
  }
  if(c.type==="DISBAND"){const r=t.res||{};bits.push(`Disbanded. The general and ${fmt0(r.n||0)} demons are gone, ${fmt0(r.back||0)} souls came back, and the general slot is free to UNLEASH GENERAL again.`);sev="info"}
  if(c.type==="SUMMON"){
   const r=t.res||{};
   if(r.summon){bits.push(`Summoned ${nText(r.summon)} for ${fmt0(r.cost)} souls.`);sev="good"}
   else{bits.push(`Failed: ${r.fail||"no effect"}.`);sev="bad"}}
  if(c.type==="HOLD"&&!t.fights.length&&!t.evicted)bits.push(`Held [[P:${h.loc}]]. Nothing to report.`);
  for(const f of t.fights)bits.push(`Fought ${f.name} at [[P:${f.pl}]]: ${f.out}. Your losses were ${f.lw.toLowerCase()}.`);
  if(t.took)bits.push(`Seized [[P:${t.took}]] (domination ${G.planes[t.took].dom}).`);
  if(t.wiped){bits.push("Every demon fell. The general fled home and can summon again.");sev="bad"}
  else if(t.evicted){bits.push(`Driven out to [[P:${h.loc}]].`);sev="bad"}
  else if(t.fights.some(f=>f.res==="lose"))sev="bad";
  else if(t.fights.length&&sev==="info")sev="good";
  out.push({tag:"Horde",sev,text:head+" "+bits.join(" ")})}
 const sr=me.shadowRes;
 out.push({tag:"Shadow",sev:"info",text:sr&&sr.summon?`Shadow Horde: summoned ${nText(sr.summon)}. ${shadowBonus(ME)?`It adds ${Math.round(shadowBonus(ME)*100)}% to your total yield.`:""}`:`Shadow Horde OPPRESSES the unloyal${shadowBonus(ME)?`: +${Math.round(shadowBonus(ME)*100)}% yield.`:". It is too small to help yet; summon demons into it."}`});
 me.shadowRes=null;
 return out}
function attention(){
 const A=[],me=G.players[ME],T=G.turn,inc=income(ME),cap=capOf(ME);
 for(const h of hordesOf(ME)){if(!total(h))A.push({sev:"warn",text:`[[H:${h.id}]] has no demons. Summon some at [[P:${h.loc}]].`,tab:"orders"});
 }
 for(const e of EVS())if(e.lost)A.push({sev:"bad",text:`You lost [[P:${e.lost}]]. Retake it or write it off.`,tab:"realm",plane:e.lost});
 const mine=ownedPlanes(ME).map(p=>p.id),dm=multiDist(mine),K=me.known,seen=[];
 for(const id in K){const k=K[id];if(k.h&&k.ht>=T-1&&k.h.some(x=>x.o!==ME)&&dm[id]!=null&&dm[id]<=2&&!mine.includes(id))seen.push([id,k.h.filter(x=>x.o!==ME)[0]])}
 seen.slice(0,3).forEach(([id,x])=>A.push({sev:"bad",text:`${x.o===-1?"A Minor Horde":`[[X:${x.o}]]'s horde`} (strength ${x.p==null?"unknown":"~"+fmt0(x.p)}) sits at [[P:${id}]], ${dm[id]} hop${dm[id]>1?"s":""} from your holdings.`,tab:"realm",plane:id}));
 if(me.rank<10){const n=RK[me.rank+1].c;if(me.foment>=n*.7)A.push({sev:"good",text:`Foment Chaos is ${Math.round(me.foment/n*100)}% of the way to ${RK[me.rank+1].n}.`,tab:"orders"})}
 if(me.rank<10&&me.rise!=null&&T-me.rise>=4&&(T-me.rise)%2===0&&!(me.foment>=RK[me.rank+1].c*.7))A.push({sev:"info",text:NUDGE[((T-me.rise-4)/2)%NUDGE.length],tab:"orders"});/* four turns without a rank-up, then every other turn */
 if(hordesOf(ME).length<cap&&me.well>=UNLEASH)A.push({sev:"info",text:`You can command ${cap} hordes and have ${hordesOf(ME).length}. UNLEASH GENERAL costs ${fmt0(UNLEASH)}.`,tab:"orders"});
 if(G.end){A.push({sev:"bad",text:`End game: ${G.end.reason}. ${endNote(T)}`,tab:"standing"})}
 else if(MAXT-T+1<=5){const left=MAXT-T+1;A.push({sev:"bad",text:`End game: the turn limit is near. The game ends after turn ${MAXT}; ${left} turn${left===1?"":"s"} remain.`,tab:"standing"})}
 return A}
/* a plane taken by force is one event (it keeps the fight's place in the sequence, unless it was taken from a prince, which ranks higher): the fight that took it, the broken defender and the new holding are told in one line under the battle */
function mergeTakes(evs){const bt=evs.filter(e=>e.battle&&e.plane&&e.battle.pill&&e.battle.pill.label==="Took the plane"),add=new Map(),out=[];
 for(const e of evs){if(e.kind==="take"||e.kind==="broke"){const b=bt.slice().reverse().find(x=>x.plane===e.plane&&x.seat===e.seat);if(b){if(e.kind==="take")add.set(b,e);continue}}out.push(e)}
 return out.map(e=>{const t=add.get(e);if(!t)return e;const m=Object.assign({},e,{text:e.text+" "+t.text,pri:t.pri<3?t.pri:e.pri});if(e.battle)m.battle=Object.assign({},e.battle,{head:(e.battle.head||e.text)+" "+t.text});return m})}
function makeReport(B,echo,T){
 const me=G.players[ME];
 if(!B)return{turn:0,headline:`You are ${me.name}, lord of ${G.planes[me.home].name} at [[P:${me.home}]]. `,intro:["One horde is awaiting your command at your home plane. Open the Orders tab (blinking above) to give it a command and to issue up to four Princely commands. Each turn, study the nearby planes on the Realm tab (also blinking) to see which ones are nearby and how strong their defenses are. If your horde is strong enough, order it to DOMINATE a plane you can beat. If it is not, issue the SUMMON order to recruit more demons. This is the general game loop.", "Many commands, like SUMMON, consume souls. Every plane you control yields souls each turn, which is why dominating planes is vital to your success. Any souls your orders do not spend are kept in your Soul Well for later. The bar at the top right shows the turn, your Well, your total yield, and your plane count.", "The game ends when certain trigger conditions are met, as explained on the Standing tab (the third blinking tab). The Standing tab also shows your victory points, your victory point ranking, the chance that the game ends (once the end game has been triggered), and your Chaos Power rank.", "Your Chaos Power determines how many generals (hordes) you can have and how powerful the demons are that you can summon. It also improves your total yield and contributes to your victory points!", "Explore the Princely and Horde commands, dominate the Abyss, and wreak havoc on your foes. Lastly, the blinking Gameplay Info tab describes basic gameplay, and it details plane domination and plane value, combat, and the order in which the various commands are resolved."],stats:null,attention:attention(),echo:[],events:[],rumors:[],intel:[]};
 const hls=EVS().filter(e=>e.hl).sort((a,b)=>a.pri-b.pri).slice(0,3).map(e=>e.hl);
 const dW=me.well-B.well;
 const headline=hls.length?`Turn ${T}: you ${hls.join("; you ")}. Your total yield is now ${fmt0(income(ME))} souls a turn.`:`Turn ${T}: no major clashes. Your total yield is now ${fmt0(income(ME))} souls a turn.`;
 const inc=income(ME),vr=vpRank(ME);
 const stats={well:[me.well,me.well-B.well],income:[inc,inc-B.income],planes:[ownedPlanes(ME).length,ownedPlanes(ME).length-B.planes],demons:[demonCount(ME),demonCount(ME)-B.demons],rank:[me.rank,me.rank-B.rank],vpr:[vr,B.vpr-vr]};
 const intel=[];for(const id in me.known){const k=me.known[id];if(k.full&&k.fs===G.turn&&T>0)intel.push(id)} intel.sort(idCmp);
 return{turn:T,headline,stats,attention:attention(),echo,events:mergeTakes(EVS().filter(e=>!e.rumor)).sort((a,b)=>a.pri-b.pri),rumors:EVS().filter(e=>e.rumor),intel}}
