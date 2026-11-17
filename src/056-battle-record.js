/* ===== BATTLE RECORDS: turn a finished fight into the words each human prince reads (wording lives in 055-report-language.js) ===== */
const hstr=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const wrng=seed=>{let t=seed|0;return()=>{t=(t+0x6D2B79F5)|0;let x=Math.imul(t^t>>>15,t|1);x^=x+Math.imul(x^x>>>7,x|61);return((x^x>>>14)>>>0)/4294967296}};
const LWORDS=["Light","Moderate","Heavy","Severe","Crushing"];
const lossIdx=f=>f<.10?0:f<.25?1:f<.45?2:f<.65?3:4;/* whole-fight loss */
const lossIdxR=f=>f<.11?0:f<.18?1:f<.28?2:f<.42?3:4;/* single-round loss */
const lossPair=(f,W)=>{const t=LWORDS[lossIdx(f)],a=CRL.Losses[t]||[t],i=Math.floor(W()*a.length);return{adj:a[i].toLowerCase(),adv:((CRL.LossAdv&&CRL.LossAdv[t]&&CRL.LossAdv[t][i])||a[i].toLowerCase()+"ly")}};
/* fill {tokens}; a token at the start of a sentence gets a capital, one mid-sentence loses a leading "The " */
const fix1=t=>t.replace(/\b1 rounds\b/g,"1 round").replace(/(\w)s's\b/g,"$1s'");
function fill(txt,tok){return fix1(txt.replace(/\{(\w+)\}/g,(m,k,off)=>{let v=tok[k];if(v==null)return"";v=String(v);const start=off===0||/[.!?] $/.test(txt.slice(Math.max(0,off-2),off));
 if(/^[A-Za-z]/.test(v)&&!v.startsWith("[["))v=start?v[0].toUpperCase()+v.slice(1):v.replace(/^The /,"the ");return v}))}
const pickW=(W,sheet,cs,tok)=>{const a=(CRL[sheet]||{})[cs];if(!a||!a.length)return"";return fill(a[Math.floor(W()*a.length)],tok||{})};
CRL.__purge={yours:["Your heavy demons unleash horrifying spells of eldritch power that destroy many of the enemy's {list}.","Your heavy demons chant and the air tears: many of the enemy's {list} are unmade.","A wave of eldritch power from your heavy demons withers many of the enemy's {list}."],
 theirs:["The enemy's heavy demons unleash horrifying spells of eldritch power that destroy many of your {list}.","The enemy's heavy demons chant and the air tears: many of your {list} are unmade.","A wave of eldritch power from the enemy's heavy demons withers many of your {list}."]};
const FB={planarTook:["Your {horde} attacked the planar defenses at {plane} and broke them after {rounds} rounds. Your losses were {yourloss}, the defenders' {enemyloss}."],
 planarRepulsed:["Your {horde} attacked the planar defenses at {plane} and was repulsed after {rounds} rounds. Your losses were {yourloss}, the defenders' {enemyloss}. Your horde withdrew to {yourretreat}."],
 planarLost:["{enemy} attacked your planar defenses at {plane} and beat them after {rounds} rounds. Your losses were {yourloss}, the enemy's {enemyloss}. The grip of your domination on {plane} is weaker."]};
/* the outcome as seen from side i (0 = attacker or first side, 1 = defender or second side) */
function pillOf(ctx,i){const o=ctx.out,att=ctx.mode==="att";
 if(att){if(o==="atkwin")return i===0?{label:"Took the plane",sev:"good",key:"Took the plane",po:"Took the plane"}:{label:"Driven out",sev:"bad",key:"Driven out",po:"Driven out"};
  return i===0?{label:"Repulsed",sev:"bad",key:"Repulsed",po:"Repulsed"}:{label:"Held",sev:"good",key:"Held",po:"Held"}}
 if(o==="meetBoth")return{label:"Mutual retreat",sev:"warn",key:"Mutual retreat",po:"Meeting engagement · both withdrew"};
 const iWon=(o==="meetA"&&i===0)||(o==="meetB"&&i===1);
 return iWon?{label:"Held the field",sev:"good",key:"Held the field",po:"Meeting engagement · you hold the field"}:{label:"Lost the field",sev:"bad",key:"Lost the field",po:"Meeting engagement · enemy holds the field"}}
const nameOfSide=(F,pl)=>F.planar?`the planar defenses of [[P:${pl.id}]]`:F.owner===-1?(F.hordes[0].npcName||"the Minor Horde"):`[[X:${F.owner}]]`;
const hordeTok=(F,pl)=>F.planar?"planar defenses":F.hordes.map(h=>`[[H:${h.id}]]`).join(" and ");
const demList=bt=>{const k=Object.keys(bt||{});return k.length?k.map(x=>`${fmt0(bt[x])} ${DT[x].n}`).join(", "):"none"};
function compLines(F,pre,mine,pl){
 if(F.planar){const L=[`Planar defenses at domination ${pl.dom}`];const sh=pre.find(c=>c.shadow);if(sh)L.push(`Shadow Horde: ${demList(sh.d)}`);return L}
 return pre.map(c=>`${mine?`[[H:${c.id}]]`:F.owner===-1?"Minor Horde":"Horde"}: ${demList(c.d)}`)}
function buildRecord(ctx,seat,me){
 const {pl,mode,A,B,res,preS,tot,pg,pr,pn,out,rets,notes}=ctx,FF=[A,B],op=1-me,pill=pillOf(ctx,me);
 const W=wrng((G.seed^hstr(pl.id+":"+G.turn+":"+seat))|0),nR=res.rounds.length;
 const lostF=[1-fStr(A)/res.S0[0],1-fStr(B)/res.S0[1]];
 const myRet=rets[me][0],foeRet=rets[op][0];
 const retTok=r=>!r?"":r.kind==="destroyed"?"oblivion":`[[P:${r.to}]]`;
 const ly=lossPair(lostF[me],W),le=lossPair(lostF[op],W);
 const tok={enemy:nameOfSide(FF[op],pl),horde:hordeTok(FF[me],pl),plane:`[[P:${pl.id}]]`,rounds:nR,yourloss:ly.adj,yourlossadv:ly.adv,enemyloss:le.adj,enemylossadv:le.adv,yourretreat:retTok(myRet),enemyretreat:retTok(foeRet)};
 /* headline */
 let head;const planarFoe=FF[op].planar,planarMe=FF[me].planar;
 if(planarFoe&&mode==="att"&&me===0)head=fill(FB[out==="atkwin"?"planarTook":"planarRepulsed"][0],tok);
 else if(planarMe&&out==="atkwin")head=fill(FB.planarLost[0],tok);
 else{const ck=Object.keys(CRL.Headlines).find(k=>k.startsWith(pill.key+" ·"));head=pickW(W,"Headlines",ck,tok)}
 {const gs=FF[op].planar||FF[op].owner<0?[]:FF[op].hordes.filter(h=>h.gen),pt=gs.map(h=>{const a=abOf(h).map(k=>ABIL[k].n);return h.gen+(a.length?" ("+a.join(", ")+")":"")});
  if(pt.length)head+=` The enemy ${pt.length>1?"generals were":"general was"} ${pt.length>1?pt.slice(0,-1).join(", ")+" and "+pt[pt.length-1]:pt[0]}.`}
 /* sides */
 const roleOf=i=>mode==="meet"?"meeting":i===0?"attacking":"defending";
 const sides=[me,op].map((i,j)=>({who:j===0?(FF[i].planar?"Your planar defenses":FF[i].hordes.map(h=>`[[H:${h.id}]]`).join(" + ")):nameOfSide(FF[i],pl)+(FF[i].planar||FF[i].owner===-1?"":"'s horde"),role:roleOf(i),mine:j===0,lines:compLines(FF[i],preS[i],j===0,pl)}));
 const bandName=SBANDS[res.sb0].n,strCase=res.sb0===0?"Even":`${bandName} · ${res.big0===me?"you stronger":"enemy stronger"}`;
 const intro=mode==="att"?(me===0?`Your ${tok.horde} attacked ${tok.enemy} at ${tok.plane}.`:`${tok.enemy} attacked your ${tok.horde}${FF[me].planar?"":", which was already on the plane"}.`):`Your ${tok.horde} and ${tok.enemy} met at ${tok.plane}.`;
 const strength=pickW(W,"Strength",strCase);
 /* rounds */
 const hasGen=!planarFoe&&!planarMe;
 const rounds=res.rounds.map((R,idx)=>{
  const last=idx===res.rounds.length-1;
  let tact="";if(R.tb>0&&hasGen&&R.tw>=0)tact=pickW(W,"Tactics",`${TBANDS[R.tb].n} · ${R.tw===me?"you had the edge":"enemy had the edge"}`,tok);
  const iWin=R.win===me;let cs,label,cls;
  if(R.mi===0){cs="Stalemate";label="Stalemate";cls="even"}
  else if(R.mi===1||R.mi===2){const w=R.mi===1?"Gaining minor advantage":"Clear advantage gained";cs=`${w} · ${iWin?"you win":"enemy wins"}`;label=`${R.mi===1?"Minor":"Clear"} advantage to ${iWin?"you":"the enemy"}`;cls=iWin?"win":"loss"}
  else if(R.mi===3){cs=`Enemy in Disarray · ${iWin?"enemy broken":"you broken"}`;label=iWin?"Enemy in disarray":"You are in disarray";cls=iWin?"win":"loss"}
  else{cs=`Rout · ${iWin?"enemy routed":"you routed"}`;label=iWin?"Enemy routed":"You were routed";cls=iWin?"win":"loss"}
  let mm="";
  if(!last&&R.mi!==4){if(R.tide)mm=pickW(W,"Momentum",`Tide turns · to ${R.mom.s===me?"you":"enemy"}`);
   else if(R.mom.s>=0&&(R.mom.s!==R.prev.s||R.mom.v!==R.prev.v)){const b=R.mom.v<=2?"Slight":R.mom.v<=4?"Clear":"Strong";mm=pickW(W,"Momentum",`${b} advantage · ${R.mom.s===me?"yours":"enemy's"}`)}}
  const PV=(who,names)=>pickW(W,"__purge",who,{list:names});
  const pnames=bt=>{const k=Object.keys(bt||{}).sort((x,y)=>DT[x].t-DT[y].t).map(x=>DT[x].n);return k.length>1?k.slice(0,-1).join(", ")+" and "+k[k.length-1]:k[0]||""};
  const pur=[];if(R.pk[op].kn)pur.push(PV("theirs",pnames(R.pk[op].bt)));if(R.pk[me].kn)pur.push(PV("yours",pnames(R.pk[me].bt)));
  return{r:R.r,pur,tact,happened:pickW(W,"Round Results",cs,tok),label,cls,mm,mine:LWORDS[lossIdxR(R.f[me])],foe:LWORDS[lossIdxR(R.f[op])]}});
 /* aftermath */
 const bk=res.broken;let endCase,etok={rounds:nR};
 if(!bk[0]&&!bk[1])endCase="Round limit reached";
 else if(bk[0]&&bk[1]&&["slip","rout","disarray"].every(c=>res.cause[0]!==c&&res.cause[1]!==c))endCase="Both broken by losses";
 else if(bk[0]&&bk[1]){/* both sides broke in the same round but not for the same reason: say what happened to each */
  const cs=i=>{const c=res.cause[i],m=i===me;return c==="slip"?(m?"You slipped away":"Enemy slipped away"):c==="rout"?(m?"You routed":"Enemy routed"):c==="disarray"?(m?"You in disarray":"Enemy in disarray"):(m?"You broken by losses":"Enemy broken by losses")};
  endCase=null;etok.rounds=nR;etok.round=nR;etok.nextround=nR+1;
  var bothText="Both sides broke in the same round. "+pickW(W,"How It Ended",cs(me),etok)+" "+pickW(W,"How It Ended",cs(op),etok)}
 else{const bi=bk[0]?0:1,mineBroken=bi===me,c=res.cause[bi];
  endCase=c==="slip"?(mineBroken?"You slipped away":"Enemy slipped away"):c==="rout"?(mineBroken?"You routed":"Enemy routed"):c==="disarray"?(mineBroken?"You in disarray":"Enemy in disarray"):(mineBroken?"You broken by losses":"Enemy broken by losses");
  etok.round=res.dis[bi];etok.nextround=(res.dis[bi]||0)+1}
 const ended=endCase===null?bothText:pickW(W,"How It Ended",endCase,etok);
 const retLines=[];
 for(const i of [me,op])for(const r of rets[i]){const t={retreat:r.kind==="destroyed"?"oblivion":`[[P:${r.to}]]`};
  const cs=i===me?(r.kind==="back"?"Your horde · back where it came from":r.kind==="friendly"?"Your horde · to a friendly plane":r.kind==="empty"?"Your horde · to an empty plane":"Your horde · destroyed"):(r.kind==="destroyed"?"Enemy horde · destroyed":"Enemy horde · withdrew");
  retLines.push(pickW(W,"Retreats",cs,t))}
 const planeLine=pickW(W,"Plane Outcome",pill.po,tok);
 const purges=[];
  const myLost=tot[me],foeLost=tot[op];
 const purgeNote=(who,pgv,rating,name)=>pgv.kn?`${who} ${name||"heavy demons"} (purge ${rating}) destroyed every demon of tier ${rating} or lower on the other side: ${demList(pgv.bt)}.`:"";
 const pMine=purgeNote("Your",pg[me],pr[me],pn[me]),pFoe=purgeNote("The enemy's",pg[op],pr[op],pn[op]);
 return{turn:G.turn,pl:pl.id,pname:pl.name,head,pill:{label:pill.label,sev:pill.sev},intro,strength,sides,rounds,
  aft:{ended,mine:{bt:myLost.bt,n:myLost.kn,v:myLost.kv,planar:!!FF[me].planar},foe:{bt:foeLost.bt,n:foeLost.kn,v:foeLost.kv,planar:!!FF[op].planar},purge:[pMine,pFoe].filter(Boolean),rets:retLines,plane:planeLine,notes:notes.slice()}}}
function battleEvents(ctx){
 const {pl,A,B,res,out,ownerBefore,mode}=ctx;
 for(const s of humanSeats()){
  const me=A.owner===s&&!A.planar?0:A.owner===s&&A.planar?0:B.owner===s?1:-1;
  const onMine=ownerBefore===s;
  if(me>=0){
   const rec=buildRecord(ctx,s,me),pill=rec.pill;
   ev(s,{sev:pill.sev,pri:pill.sev==="good"?5:4,text:rec.head,plane:pl.id,hl:pill.sev==="good"?`won at [[P:${pl.id}]]`:pill.sev==="bad"?`lost a fight at [[P:${pl.id}]]`:`fought to a draw at [[P:${pl.id}]]`,combat:true,battle:rec});
   const F=[A,B][me];if(!F.planar)for(const h of F.hordes){const lf=1-fStr(F)/res.S0[me];h.t.fights.push({pl:pl.id,res:pill.sev==="good"?"win":pill.sev==="bad"?"lose":"tie",name:nameOfSide([A,B][1-me],pl).replace(/^The /,"the "),out:pill.label,lw:LWORDS[lossIdx(lf)]})}
  }else if(onMine){
   ev(s,{sev:"info",pri:6,text:`${nameOfSide(A,pl)} and ${nameOfSide(B,pl)} fought at [[P:${pl.id}]], your plane. ${out==="atkwin"?"The defenders were driven out.":out==="atkfail"?"The attack was repulsed.":"The fight ended in a retreat."}`,plane:pl.id,combat:true})
  }else if(as(s,()=>nearMine(pl))&&shadowVal(s)>0){ev(s,{sev:"info",pri:9,rumor:true,plane:pl.id,text:`Fighting reported at [[P:${pl.id}]]. Your shadow horde cannot make out who won.`})}
 }
 /* a human prince's horde that fought a side it could not see still gets its echo; hordes of AI princes keep no record */
}
