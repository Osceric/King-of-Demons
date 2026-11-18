
/* ===== KNOWLEDGE (fog of war, human player only) ===== */
function multiDist(srcs){const d={},q=[];for(const s of srcs){d[s]=0;q.push(s)}while(q.length){const c=q.shift();for(const n of G.planes[c].links)if(!(n in d)){d[n]=d[c]+1;q.push(n)}}return d}
const compStr=h=>Object.keys(h.demons).filter(d=>h.demons[d]>0).sort((p,q)=>DT[q].t-DT[p].t).map(d=>`${fmt0(h.demons[d])} ${DT[d].n}`).join(", ");
/* what viewer "me" can learn about the enemy hordes on plane id: strength (hidden for Unseen), demon mix (own/held plane, or a Seer next door), general abilities (a Judge nearby) */
function visH(id,me){
 const here=G.hordes.filter(h=>h.loc===id&&h.owner!==me&&total(h));if(!here.length)return[];
 const pl=G.planes[id],mine=hordesOf(me).filter(h=>total(h)),dm=distMap(id);
 const dAb=k=>{let b=99;for(const h of mine)if(hasAb(h,k)&&dm[h.loc]!=null)b=Math.min(b,dm[h.loc]);return b};
 const far=dAb("FARS"),seer=dAb("SEER"),judge=dAb("JUDG"),seeIn=pl.owner===me||mine.some(h=>h.loc===id);
 const by={};
 for(const h of here){const s=hstats(h);
  const unseen=hasAb(h,"UNSE")&&!(pl.owner!=null&&pl.owner>=0&&pl.owner!==h.owner&&!bonded(pl.owner,h.owner))&&far>1;/* Farsighted within one plane overrides Unseen */
  let strV=true,compV=seeIn||seer<=1;
  if(unseen){strV=seer<=1;compV=false}/* Seer vs Unseen: both cancel, only the strength shows */
  const e={n:h.owner>=0?hno(h):0,p:strV?Math.round(s.str):null};
  if(compV)e.c=compStr(h);
  if(judge<=1&&h.owner>=0){e.a=abOf(h);e.g=h.gen}
  (by[h.owner]=by[h.owner]||[]).push(e)}
 return Object.keys(by).map(o=>{const l=by[o].sort((a,b)=>a.n-b.n),vis=l.filter(x=>x.p!=null);return{o:+o,p:vis.length?vis.reduce((a,x)=>a+x.p,0):null,n:l.map(x=>x.n),l}})}
function snap(id,extra){const K=G.players[ME].known,p=G.planes[id];K[id]=Object.assign(K[id]||{},{t:G.turn,o:p.owner,d:p.dom,q:p.q,np:p.npc?p.npcName:null,full:true,fs:(K[id]&&K[id].full)?K[id].fs:G.turn},extra||{})}
function stub(id){const K=G.players[ME].known;if(!K[id])K[id]={t:-1,full:false}}
function updateKnow(scryR){
 const paid=(scryR||0)>=2;scryR=Math.max(1,scryR||0); /* a free SCRY every turn: every plane adjacent to your holdings and hordes is revealed */
 for(const id in G.players[ME].known){const k=G.players[ME].known[id];if(k.o===ME&&G.planes[id].owner!==ME)snap(id)} /* a plane you held and lost is never shown as yours */
 const mine=new Set();for(const id in G.planes)if(G.planes[id].owner===ME)mine.add(id);
 for(const h of hordesOf(ME))mine.add(h.loc);
 for(const id of mine){snap(id,{h:visH(id,ME),ht:G.turn});for(const n of G.planes[id].links)stub(n)}
 if(scryR){const dm=multiDist([...mine]);for(const id in dm)if(dm[id]<=scryR&&!mine.has(id)){snap(id,{h:visH(id,ME),ht:G.turn});for(const n of G.planes[id].links)stub(n)}
  if(paid){const P=G.players[ME];P.sh=P.sh||{};for(const id in dm)if(dm[id]<=scryR){const o=G.planes[id].owner;if(o!=null&&o>=0&&o!==ME)P.sh[o]={t:G.turn,d:Object.assign({},G.players[o].shadow)}}}}/* a paid SCRY also reads the makeup of the Shadow Horde of every prince who holds a plane in its reach */
 {const P=G.players[ME];P.pk=P.pk||{};const dm2=multiDist([...mine]);for(const id in dm2)if(dm2[id]<=scryR){const o=G.planes[id].owner;if(o!=null&&o>=0&&o!==ME&&!P.pk[o]){P.pk[o]=G.turn;if(G.players[o].pers&&P.human&&G.ev&&G.turn<=PEACE_T){const q=PERS[G.players[o].pers];ev(ME,{sev:"info",pri:2,text:`You have learned that [[X:${o}]] is ${q.n}: it ${q.d}`})}}}}/* a prince's personality shows when one of its planes lies in your SCRY reach (the free SCRY covers adjacent planes) */
 {const K=G.players[ME].known;/* Farsighted: the hordes (not the planes) within two planes of one of your Farsighted generals */
  for(const fh of hordesOf(ME))if(total(fh)&&hasAb(fh,"FARS")){const dd=distMap(fh.loc);for(const id in dd)if(dd[id]<=2&&!mine.has(id)){const hs=visH(id,ME);if(K[id]||hs.length)K[id]=Object.assign(K[id]||{t:-1,full:false},{h:hs,ht:G.turn})}}
  /* Judge: say what a newly read general carries, once */
  const P=G.players[ME];P.judged=P.judged||{};
  for(const id in K){const k=K[id];if(!k.h||k.ht!==G.turn)continue;for(const x of k.h)for(const y of x.l||[])if(y.a&&y.a.length){const key=x.o+":"+y.n,sig=y.a.join(",");if(G.ev&&P.judged[key]!==sig){P.judged[key]=sig;ev(ME,{sev:"info",pri:4,text:`Your Judge reads [[X:${x.o}]]'s Horde ${y.n}: General ${y.g} carries ${y.a.map(k=>ABIL[k].n).join(" and ")}.`,plane:id})}}}}
}

/* ===== COMBAT ===== */
/* A fight is up to six rounds. Each round: both generals roll tactics (3d6 each, the gap picks a band that nudges each side's strength), the stronger side gets a roll bonus from the strength band, both roll 3d6, and the margin picks the round result and the casualty percentages. Nothing but words is shown to players. All tables below mirror spreadsheets/Combat Results Roll.xlsx and Tactics Roll Bands.xlsx. */
const TBANDS=[{n:"Tie",lo:0,w:0,l:0},{n:"Better Plan",lo:2,w:.1,l:-.09},{n:"Loser Outclassed",lo:5,w:.2,l:-.17},{n:"Disastrous Decision",lo:8,w:.33,l:-.25},{n:"Catastrophic Imbalance",lo:11,w:.5,l:-.33}];
const SBANDS=[{n:"Even",lo:1,bonus:0},{n:"Minor Advantage",lo:1.5,bonus:1},{n:"Advantaged",lo:2,bonus:2},{n:"Strong Advantage",lo:3,bonus:3},{n:"Overwhelming",lo:4,bonus:6}];
const MRES=[{n:"Stalemate",lo:0,w:.15,l:.15,mom:0},{n:"Gaining minor advantage",lo:3,w:.1,l:.15,mom:1},{n:"Clear advantage gained",lo:6,w:.08,l:.2,mom:3},{n:"Enemy in Disarray",lo:8,w:.08,l:.3,mom:5},{n:"Rout",lo:10,w:.08,l:.5,mom:0}];
const DEFB=1.15,DEFH=1.25,DEFT=1.25,DEFTH=1.4,BROKEN=.6,MAXR=6,HOLDR=2;/* HOLDR: in a drawn meeting engagement a force that is this many times stronger than the other, and than what else waits on the plane, keeps the field */
const roll3=()=>ri(1,6)+ri(1,6)+ri(1,6);
const bandOf=(arr,v)=>{let b=0;for(let i=0;i<arr.length;i++)if(v>=arr[i].lo)b=i;return b};
function forceOf(pl,owner,hs){return{owner,hordes:hs}}
function forcesAt(pl){const m=new Map();for(const h of G.hordes){if(h.loc!==pl.id||!total(h))continue;if(!m.has(h.owner))m.set(h.owner,[]);m.get(h.owner).push(h)}return[...m].map(([o,hs])=>forceOf(pl,o,hs))}
function shadowStr(o){let s=0;const S=G.players[o].shadow;for(const k in S)s+=S[k]*DT[k].st;return s}
/* A Shadow Horde's strength is public. In the real game it is read live; in a player's own copy of the game it is carried in "shs". */
const pubSh=o=>{const P=G.players[o];return P.shadow?shadowStr(o):(P.shs||0)};
/* what the Known Planes table and the odds show as a prince plane's defense: domination plus the public Shadow Horde (all of it at their home, a third elsewhere) */
const pubDef=(id,k)=>{const d=DOM[k.d],o=k.o,has=o!=null&&o>=0;return d.o+d.d+(has?Math.round(pubSh(o)*(id===G.players[o].home?1:.33)):0)};
/* planar defense strength: the domination level's own strength plus the owner's Shadow Horde (all of it at home, half elsewhere) */
function pdStats(pl){const d=DOM[pl.dom],has=pl.owner!=null&&pl.owner>=0,sh=has?shadowStr(pl.owner):0,f=has&&pl.id===G.players[pl.owner].home?1:.33;return{o:d.o,d:d.d,s:d.o+d.d+sh*f,f}}
function pdForce(pl){const s=pdStats(pl);return{owner:pl.owner,planar:true,hordes:[],s0:s.s,rem:1,dom:pl.dom,f:s.f,shf:pl.owner!=null&&pl.owner>=0?shadowStr(pl.owner)*s.f:0}}
const fStr=F=>{if(F.planar)return F.s0*F.rem;let t=0;for(const h of F.hordes)t+=hstats(h).str;return t};
function applyFrac(F,f){let kv=0,kn=0;const bt={};
 const kill1=(S,k,c,kill)=>{S[k]=c-kill;if(!S[k])delete S[k];kv+=kill*DT[k].cost;kn+=kill;if(kill)bt[k]=(bt[k]||0)+kill};
 if(f<=0)return{kv,kn,bt};
 if(F.planar){F.rem=Math.max(0,F.rem*(1-f));if(F.owner>=0){const S=G.players[F.owner].shadow;for(const k of Object.keys(S)){const c=S[k];kill1(S,k,c,Math.min(c,Math.floor(c*f*.5+rnd())))}}return{kv,kn,bt}}
 for(const h of F.hordes)for(const k of Object.keys(h.demons)){const c=h.demons[k];kill1(h.demons,k,c,f>=1?c:Math.min(c,Math.floor(c*f+rnd())))}
 return{kv,kn,bt}}
function purgeOf(F){let t=0;for(const h of F.hordes||[])for(const k in h.demons)if(DT[k].purge)t=Math.max(t,DT[k].purge);return t>0&&forceAb(F,"WARL")?t+1:t}
/* Purge (nerfed): at the end of every round each side's best purge rating destroys 10% of the enemy's demons of that tier or lower */
function purgeRound(F,thr){let kv=0,kn=0;const bt={};if(!thr)return{kv,kn,bt};
 if(F.planar){/* purge reaches a prince's Shadow Horde when its planar defenses are fought: 20% of each kind within reach (never fewer than 1), scaled by the share that defends here (all of it at home, a third elsewhere) */
  if(F.owner>=0&&F.shf>0){const S=G.players[F.owner].shadow;let before=0,lost=0;for(const k in S)before+=S[k]*DT[k].st;
   for(const k of Object.keys(S))if(DT[k].t<=thr){const c=S[k],x=Math.min(c,Math.max(1,Math.floor(c*.2*(F.f||1)+rnd())));if(x>0){S[k]=c-x;if(!S[k])delete S[k];kv+=x*DT[k].cost;kn+=x;bt[k]=(bt[k]||0)+x;lost+=x*DT[k].st}}
   if(before>0&&F.s0>0)F.rem=Math.max(0,F.rem*(1-(F.shf/F.s0)*(lost/before)))}
  return{kv,kn,bt}}
 for(const h of F.hordes)for(const k of Object.keys(h.demons))if(DT[k].t<=thr){const c=h.demons[k],x=Math.min(c,Math.max(1,Math.floor(c*.2+rnd())));if(x>0){h.demons[k]=c-x;if(!h.demons[k])delete h.demons[k];kv+=x*DT[k].cost;kn+=x;bt[k]=(bt[k]||0)+x}}
 return{kv,kn,bt}}
function purge(F,thr){let kv=0,kn=0;const bt={};if(!thr||F.planar)return{kv,kn,bt};
 for(const h of F.hordes)for(const k of Object.keys(h.demons))if(DT[k].t<=thr){const c=h.demons[k];kv+=c*DT[k].cost;kn+=c;bt[k]=(bt[k]||0)+c;delete h.demons[k]}
 return{kv,kn,bt}}
/* victory points: every demon destroyed is worth its soul cost to the side that destroyed it (Carnage), and 75% of its cost to the side that lost it */
function credit(owner,r){if(owner>=0)G.players[owner].carnage+=r.kv}
function lostSouls(owner,kv){if(owner>=0){const P=G.players[owner];P.lostSouls=(P.lostSouls||0)+kv}}
const mergeBt=(a,b)=>{const o=Object.assign({},a);for(const k in b)o[k]=(o[k]||0)+b[k];return o};
/* ---- the rounds of one fight. A is the attacker (or first side of a meeting engagement), B the defender ---- */
/* FORCED MARCH: the share of a force's strength that marched this turn fights at -25% in rounds 1 to 3 */
function marchF(F){if(!F.hordes||!F.hordes.length)return 1;let a=0,b=0;for(const h of F.hordes){const s=hstats(h).str;b+=s;if(h.cmd&&h.cmd.type==="MARCH"&&movedH(h))a+=s}return b>0?1-.25*a/b:1}
/* the defender's strength bonus when an attacker moved in: 15% as it stands, 25% for a force with a horde under the HOLD order, 25% with a Trench Master, 40% with both */
function defBonus(B){if(!B||!B.hordes)return DEFB;const hold=B.hordes.some(h=>h.cmd&&h.cmd.type==="HOLD"),tm=forceAb(B,"TRNC");return tm?(hold?DEFTH:DEFT):hold?DEFH:DEFB}
/* FAST vs HEAVY: a force made only of Fast demons adds FASTT to its tactics roll in rounds 1 to 3 against a force made only of Heavy demons. Planar defenses hold no demons, so they never count as Heavy. */
const FASTT=3;
function onlyCls(F,c){let n=0;for(const h of F.hordes||[])for(const k in h.demons)if(h.demons[k]>0){if(DT[k].c!==c)return false;n++}return n>0}
const fastVsHeavy=(F,E)=>!F.planar&&!E.planar&&onlyCls(F,"F")&&onlyCls(E,"H");
function fightRounds(A,B,mode){
 const F=[A,B],S0=[fStr(A),fStr(B)],DB=defBonus(B),cum=[{bt:{},kv:0,kn:0},{bt:{},kv:0,kn:0}];
 const adj0=[S0[0],S0[1]*(mode==="att"?DB:1)],big0=adj0[0]>=adj0[1]?0:1,sb0=bandOf(SBANDS,adj0[big0]/Math.max(adj0[1-big0],1e-9));
 const R=[];let mom={s:-1,v:0};const dis=[null,null],rout=[false,false];let broken=[false,false],cause=[null,null],limit=false;
 for(let r=1;r<=MAXR;r++){
  const cs=[fStr(A),fStr(B)];if(cs[0]<=0||cs[1]<=0)break;
  const ce=[0,1].map(i=>cs[i]*(r>=4&&forceAb(F[i],"BERK")?1.1:1)*(r===1&&forceAb(F[1-i],"MIND")?.85:1)*(r<=3?marchF(F[i]):1));/* Berserk and Mindbreaker change the strength the round is judged on, not the casualty percentages */
  const tr=[roll3()+(forceAb(A,"TACT")?1:0)+(r<=3&&fastVsHeavy(A,B)?FASTT:0),roll3()+(forceAb(B,"TACT")?1:0)+(r<=3&&fastVsHeavy(B,A)?FASTT:0)],td=Math.abs(tr[0]-tr[1]),tb=bandOf(TBANDS,td),tw=tb>0?(tr[0]>tr[1]?0:1):-1;
  const adj=[ce[0],ce[1]];if(tb>0){adj[tw]*=1+TBANDS[tb].w;adj[1-tw]*=1+TBANDS[tb].l}
  if(mode==="att")adj[1]*=DB;
  const big=adj[0]>=adj[1]?0:1,sb=bandOf(SBANDS,adj[big]/Math.max(adj[1-big],1e-9)),bonus=[0,0];bonus[big]=SBANDS[sb].bonus;
  const momB=[0,0];if(mom.s>=0)momB[mom.s]=mom.v;
  const rr=[roll3(),roll3()],tot=[rr[0]+bonus[0]+momB[0],rr[1]+bonus[1]+momB[1]],margin=Math.abs(tot[0]-tot[1]),mi=bandOf(MRES,margin),M=MRES[mi];
  const win=mi===0?-1:tot[0]>tot[1]?0:1;
  const gross=[0,0];if(win<0){gross[0]=cs[0]*M.w;gross[1]=cs[1]*M.w}else{gross[win]=cs[win]*M.w;gross[1-win]=cs[1-win]*M.l}
  const capOf2=i=>mode==="meet"?1.5:i===0?(ce[0]/Math.max(ce[1],1e-9)>=3?3:2):1.5;
  const fin=[gross[0],gross[1]];
  if(win<0){for(let i=0;i<2;i++)fin[i]=Math.min(gross[i],capOf2(i)*gross[1-i])}else fin[win]=Math.min(gross[win],capOf2(win)*gross[1-win]);
  const f=[fin[0]/cs[0]*(forceAb(A,"IRON")?.9:1),fin[1]/cs[1]*(forceAb(B,"IRON")?.9:1)];
  for(let i=0;i<2;i++){const c=applyFrac(F[i],f[i]);cum[i].kv+=c.kv;cum[i].kn+=c.kn;cum[i].bt=mergeBt(cum[i].bt,c.bt)}
  const pr=[Math.max(0,purgeOf(A)-(forceAb(B,"ABJU")?1:0)),Math.max(0,purgeOf(B)-(forceAb(A,"ABJU")?1:0))],pk=[purgeRound(B,pr[0]),purgeRound(A,pr[1])];/* both purges are worked out from the demons standing after the round's casualties, then applied together */
  for(let i=0;i<2;i++){const q=pk[1-i];cum[i].kv+=q.kv;cum[i].kn+=q.kn;cum[i].bt=mergeBt(cum[i].bt,q.bt)}
  const prev={s:mom.s,v:mom.v};
  if(win>=0){if(mi===4)mom={s:-1,v:0};else if(mom.s===win)mom.v+=M.mom;else mom={s:win,v:M.mom}}
  if(mi===3&&dis[1-win]==null)dis[1-win]=r;
  if(mi===4)rout[1-win]=true;
  const lost=[1-fStr(A)/S0[0],1-fStr(B)/S0[1]];
  const bn=[0,1].map(i=>lost[i]>=BROKEN-1e-9||rout[i]||(dis[i]!=null&&r>=dis[i]+1));
  const sl=[0,1].map(i=>!bn[i]&&forceAb(F[i],"SLIP")&&fStr(F[1-i])>=3*Math.max(fStr(F[i]),1e-9));/* a Slippery general pulls out when outnumbered 3 to 1 */
  for(let i=0;i<2;i++)if(sl[i])bn[i]=true;
  const cs2=[0,1].map(i=>sl[i]?"slip":rout[i]?"rout":(dis[i]!=null&&r>=dis[i]+1)?"disarray":"loss");
  R.push({r,tb,tw,sb,big,mi,win,f,pk,prev,mom:{s:mom.s,v:mom.v},tide:win>=0&&prev.s>=0&&mom.s>=0&&prev.s!==mom.s});
  if(bn[0]||bn[1]){broken=bn;cause=cs2;break}
  if(r===MAXR)limit=true}
 const lost=[1-fStr(A)/S0[0],1-fStr(B)/S0[1]];
 return{rounds:R,cum,S0,lost,broken,cause,limit,dis,sb0,big0}}
/* ---- where a defeated horde goes: automatic, never chosen by the player ---- */
/* where a prince's wiped general returns and new hordes appear: the home plane while it is still theirs, otherwise their owned plane of highest domination, then highest value, never one an enemy horde occupies */
function rally(o){const P=G.players[o];if(ownsHome(o)&&!enemyHere(P.home,o))return P.home;
 const own=Object.values(G.planes).filter(x=>x.owner===o&&x.id!==P.home&&!enemyHere(x.id,o)).sort((a,b)=>(b.dom-a.dom)||(b.q-a.q)||idCmp(a.id,b.id));return own.length?own[0].id:null}/* null: no unoccupied plane to appear on */

const enemyHere=(id,o)=>G.hordes.some(h=>h.loc===id&&total(h)&&h.owner!==o&&!bonded(h.owner,o));
const safeFor=(id,o)=>!hostile(G.planes[id],o)&&!enemyHere(id,o);
function pickDest(h,isDefender){
 const o=h.owner,L=G.planes[h.loc].links;
 if(!isDefender&&h.from&&L.includes(h.from)&&safeFor(h.from,o))return{kind:"back",to:h.from};
 const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const fr=shuf(L.filter(x=>G.planes[x].owner===o&&!enemyHere(x,o))).sort((a,b)=>(G.planes[b].dom-G.planes[a].dom)||(G.planes[b].q-G.planes[a].q));
 if(fr.length)return{kind:"friendly",to:fr[0]};
 const em=shuf(L.filter(x=>safeFor(x,o)));
 if(em.length)return{kind:"empty",to:em[0]};
 return{kind:"destroyed",to:null}}
function meet(a,b){if(a<0||b<0||a===b)return;const A=G.players[a],B=G.players[b];if(!A.met.includes(b))A.met.push(b);if(!B.met.includes(a))B.met.push(a)}
const garrisoned=pl=>G.hordes.some(h=>h.owner===-1&&h.loc===pl.id&&total(h));
/* Blood Pact: bonded princes never fight each other or take each other's planes, and each earns a third of the price paid every turn while it lasts */
const activeBonds=p=>(G.bonds||[]).filter(k=>(k.a===p||k.b===p)&&k.from<=G.turn&&G.turn<=k.until);
const bonded=(a,b)=>a>=0&&b>=0&&a!==b&&(G.bonds||[]).some(k=>k.from<=G.turn&&G.turn<=k.until&&((k.a===a&&k.b===b)||(k.a===b&&k.b===a)));
/* Each turn every AI prince decides whether it is open to a Blood Pact. The choice is public, and an open prince always answers the first human who offers. */
function setOpen(){for(const P of G.players){if(P.human){P.open=false;continue}
 let t=(G.seed^Math.imul(G.turn+1,0x9E3779B1)^Math.imul(P.id+7,0x85EBCA6B))|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);const r=((t^t>>>14)>>>0)/4294967296;
 const ab=activeBonds(P.id);P.open=(!ab.length||ab.every(k=>k.until===G.turn))&&P.well>=forgeCost(G.turn)&&r<Math.max(.2,.75-P.agg*.25)}}
const pactBusy=(p,t)=>activeBonds(p).some(k=>k.a!==t&&k.b!==t);/* true when p is already pledged to a prince other than t */
function formBond(a,b,pay){G.bonds=G.bonds||[];const k=G.bonds.find(x=>((x.a===a&&x.b===b)||(x.a===b&&x.b===a))&&x.until>=G.turn);if(k){k.until+=BONDLEN;k.inc=pactInc(pay)}else G.bonds.push({a,b,from:G.turn,until:G.turn+BONDLEN-1,inc:pactInc(pay)})}
const hostile=(pl,o)=>pl.npc||garrisoned(pl)||(pl.owner!=null&&pl.owner!==o&&!bonded(pl.owner,o));
function takePlane(pl,no,how){
 const old=pl.owner;pl.owner=no;pl.hit=true;pl.npc=false;
 const P=G.players[no];const here=hordesOf(no).filter(h=>h.loc===pl.id&&total(h));pl.dom=here.some(h=>hasAb(h,"DOMI"))?2:1;
 {const h=here.find(x=>hasAb(x,"SOUL"));if(h){const f=Math.round(100*Math.pow(Math.max(1,P.rank),2.5));P.well+=f;if(HUM(no))ev(no,{sev:"good",pri:3,text:`[[H:${h.id}]] found ${fmt0(f)} souls in the conquered plane [[P:${pl.id}]].`,plane:pl.id})}}
 if(HUM(old))as(old,()=>snap(pl.id));P.domVal+=Math.max(1,pl.q);if(!G.everDom.includes(pl.id))G.everDom.push(pl.id);
 for(const h of hordesOf(no))if(h.loc===pl.id)h.t.took=pl.id;
 for(const s of humanSeats()){
  if(no===s){ev(s,{kind:"take",sev:"good",pri:old!=null&&old>=0?2:3,text:`You now hold [[P:${pl.id}]] (${pl.name}), domination ${pl.dom}.${old!=null&&old>=0?` Taken from [[X:${old}]].`:""}`,plane:pl.id,hl:`took [[P:${pl.id}]]${old!=null&&old>=0?" from [[X:"+old+"]]":""}`})}
  else if(old===s){ev(s,{sev:"bad",pri:1,text:`[[P:${pl.id}]] (${pl.name}) fell to [[X:${no}]].`,plane:pl.id,lost:pl.id,hl:`lost [[P:${pl.id}]] to [[X:${no}]]`})}}
 if(old!=null&&old>=0&&old!==no)meet(old,no);
}
const nearMine=(pl)=>{const d=distMap(pl.id);return Object.keys(d).some(k=>d[k]<=2&&G.planes[k].owner===ME)};
function compOf(F){if(F.planar)return F.owner>=0&&Object.keys(G.players[F.owner].shadow).length?[{id:0,shadow:true,d:Object.assign({},G.players[F.owner].shadow)}]:[];return F.hordes.map(h=>({id:h.id,d:Object.assign({},h.demons)}))}
const movedH=h=>!!(h.t&&h.t.mv&&h.t.mv.steps>0&&!h.t.evicted);
function retreatForce(F,pl,isDef,killer){const out=[];
 for(const h of F.hordes){
  if(F.planar)break;
  if(h.owner===-1){/* a defeated Minor Horde is scattered: its survivors are wiped out and count as kills */
   let kv=0;for(const k in h.demons)kv+=h.demons[k]*DT[k].cost;h.demons={};if(kv&&killer&&killer.owner>=0)credit(killer.owner,{kv:kv*2});out.push({h,kind:"destroyed",to:null,kv});continue}
  const dead=!total(h),d=dead?{kind:"destroyed",to:null}:pickDest(h,isDef&&!movedH(h));
  if(d.kind==="destroyed"){let kv=0;for(const k in h.demons)kv+=h.demons[k]*DT[k].cost;if(kv){if(killer&&killer.owner>=0)credit(killer.owner,{kv});lostSouls(h.owner,kv)}
   h.demons={};h.from=null;h.cmd={type:"HOLD"};h.t.wiped=true;
   const rl=ownsHome(h.owner)?rally(h.owner):null;if(rl){h.loc=rl;h.abA=h.abE=null;h.exp=0;h.res=(h.res||0)+1;h.born=G.turn+1}else{h.gone=true;const P=G.players[h.owner];P.genLost=(P.genLost||0)+1;if(HUM(h.owner))ev(h.owner,{sev:"bad",pri:1,text:`${h.gen} was destroyed with no free plane to return to. The general is gone for good and your general limit falls to ${capOf(h.owner)}.`})}out.push({h,kind:"destroyed",to:null,kv});continue}
  h.from=null;h.loc=d.to;h.t.evicted=true;h.cmd={type:"HOLD"};h.t.retreat=d;out.push({h,kind:d.kind,to:d.to})}
 return out}
function runFight(pl,A,B,mode){
 const preS=[compOf(A),compOf(B)],came=[A.hordes.map(h=>h.from),B.hordes.map(h=>h.from)],ownerBefore=pl.owner,domBefore=pl.dom;
 const res=fightRounds(A,B,mode);
 for(const F of [A,B])if(!F.planar)for(const h of F.hordes)h.exp=(h.exp||0)+1;/* every combat counts toward the general's Experience, win or lose */
 const rec=[];
 const pr=[0,0],pn=["",""],Z=()=>({kv:0,kn:0,bt:{}}),pg=[Z(),Z()];/* purge now fires every round inside fightRounds */
 const tot=[{kv:res.cum[0].kv+pg[1].kv,kn:res.cum[0].kn+pg[1].kn,bt:mergeBt(res.cum[0].bt,pg[1].bt)},{kv:res.cum[1].kv+pg[0].kv,kn:res.cum[1].kn+pg[0].kn,bt:mergeBt(res.cum[1].bt,pg[0].bt)}];
 /* Necromancer: one force-wide pool of 5% of the strength the enemy lost, raised as each horde's weakest demons (lowest tier of its class), shared out by strength */
 for(const F of [A,B]){if(F.planar||!forceAb(F,"MEND"))continue;const mine=F===A?0:1,foe=tot[1-mine].bt;let es=0;for(const k in foe)es+=foe[k]*(DT[k]?DT[k].st:0);
  const live=F.hordes.filter(h=>Object.values(h.demons).some(c=>c>0)).map(h=>({h,s:hstats(h).str})),S=live.reduce((a,x)=>a+x.s,0);if(!S)continue;
  for(const {h,s} of live){const lo=DK.filter(k=>DT[k].c===(h.cls==="H"?"H":"F")).sort((x,y)=>DT[x].t-DT[y].t)[0],x=es*.05*(s/S)/DT[lo].st,n=Math.floor(x)+(rnd()<x-Math.floor(x)?1:0);
   if(n>0){h.demons[lo]=(h.demons[lo]||0)+n;rec.push(`[[H:${h.id}]] was reinforced by ${n} ${DT[lo].n} raised by the Necromancer.`)}}}
 const mn=F=>F.owner<0||(F.planar&&pl.npc);/* carnage against Minor Powers counts double */
 {const ap=F=>forceAb(F,"ANTI")?1.07:1;credit(B.owner,{kv:tot[0].kv*(mn(A)?2:1)*ap(B)});credit(A.owner,{kv:tot[1].kv*(mn(B)?2:1)*ap(A)})}lostSouls(A.owner,tot[0].kv);lostSouls(B.owner,tot[1].kv);
 const bk=res.broken;let out;
 if(mode==="att")out=(bk[1]&&!bk[0])?"atkwin":"atkfail";else out=(bk[0]&&!bk[1])?"meetB":(bk[1]&&!bk[0])?"meetA":"meetBoth";
 if(mode!=="att"&&out==="meetBoth"&&!bk[0]&&!bk[1]){/* a draw: both would withdraw, unless one force clearly outmatches the other and whatever else holds the plane */
  const sA=fStr(A),sB=fStr(B);let oth=0,anyF=false;
  for(const f of forcesAt(pl)){if(f.owner===A.owner||f.owner===B.owner)continue;oth+=fStr(f);anyF=true}
  if(!anyF&&pl.owner!=null&&pl.owner>=0&&pl.dom>0&&pl.owner!==A.owner&&pl.owner!==B.owner)oth=pdStats(pl).s;
  const win=(s,t,w)=>s>=HOLDR*t&&s>=HOLDR*oth&&!bonded(w.owner,pl.owner);
  if(win(sA,sB,A))out="meetA";else if(win(sB,sA,B))out="meetB"}
 const rs=out==="atkwin"?[1]:out==="atkfail"?[0]:out==="meetA"?[1]:out==="meetB"?[0]:[0,1];
 const rets=[[],[]],FF=[A,B];
 for(const i of rs)rets[i]=retreatForce(FF[i],pl,mode==="att"&&i===1,FF[1-i]);
 for(const F of [A,B]){if(F.planar||F.owner<0||!forceAb(F,"REAP"))continue;const got=Math.floor(tot[F===A?1:0].kv*.1);if(got>0){G.players[F.owner].well+=got;rec.push(`Reaper: ${fmt0(got)} souls from the fallen went into the Well of [[X:${F.owner}]].`)}}
 const notes=rec.slice();
 if(B.planar){pl.hit=true;
  if(out==="atkwin"){const was=pl.dom;pl.dom=Math.max(0,pl.dom-(forceAb(A,"SIEG")?3:2));notes.push(`The planar defenses were beaten. Domination of [[P:${pl.id}]] fell from ${was} to ${pl.dom}.`);
   if(A.owner>=0){const V=Math.max(1,pl.q);G.players[A.owner].carnage+=V*Math.max(1,pl.dom+2)*250*(pl.npc?2:1);
    if(pl.dom<=0){takePlane(pl,A.owner,"conquest");notes.push(`[[P:${pl.id}]] changed hands.`)}
    else if(HUM(pl.owner))ev(pl.owner,{sev:"warn",pri:2,text:`[[P:${pl.id}]] is under attack: domination cut to ${pl.dom}.`,plane:pl.id,hl:`saw [[P:${pl.id}]] battered down to domination ${pl.dom}`})}}
  else{notes.push("The planar defenses held. Domination is unchanged.");if(HUM(pl.owner))ev(pl.owner,{sev:"good",pri:4,text:`The planar defenses of [[P:${pl.id}]] threw out the invader.`,plane:pl.id})}}
 const ctx={pl,mode,A,B,res,preS,came,tot,pg,pr,pn,out,rets,notes,domBefore,ownerBefore};
 battleEvents(ctx);
 return ctx}
function resolvePlane(pl){
 let fs=forcesAt(pl);
 const isRaid=f=>f.hordes&&f.hordes.length>0&&f.hordes.every(h=>h.cmd&&h.cmd.type==="RAID");/* raiders slip past the planar defenses */
 const pdOn=()=>pl.owner!=null&&pl.owner>=0&&pl.dom>0&&fs.some(f=>f.owner!==pl.owner&&!bonded(f.owner,pl.owner)&&!isRaid(f));
 if(fs.length<2&&!pdOn())return false;
 const players=fs.filter(f=>f.owner>=0).map(f=>f.owner);players.forEach(a=>players.forEach(b=>meet(a,b)));if(pl.owner!=null&&pl.owner>=0)players.forEach(a=>meet(a,pl.owner));
 G.fq=G.fq||{};let fought=false;
 const key=(a,b)=>pl.id+"|"+a.owner+"|"+(b.planar?"pd":b.owner),done=(a,b)=>G.fq[key(a,b)]||G.fq[key(b,a)];
 const hostilePair=(a,b)=>a.owner!==b.owner&&!bonded(a.owner,b.owner)&&!done(a,b);
 for(let guard=0;guard<14;guard++){
  fs=forcesAt(pl);
  const mv=f=>f.hordes.every(movedH),movers=fs.filter(mv).sort((a,b)=>a.owner-b.owner),stays=fs.filter(f=>!mv(f)).sort((a,b)=>a.owner-b.owner);
  let pair=null;
  for(const a of movers){for(const b of movers)if(a.owner<b.owner&&hostilePair(a,b)){pair=[a,b,"meet"];break}if(pair)break}
  if(!pair)for(const a of movers){for(const b of stays)if(hostilePair(a,b)){pair=[a,b,"att"];break}if(pair)break}
  if(!pair&&pdOn()){const pd=pdForce(pl),a=movers.concat(stays).find(f=>f.owner!==pl.owner&&!bonded(f.owner,pl.owner)&&!isRaid(f)&&!done(f,pd));if(a)pair=[a,pd,"att"]}
  if(!pair)for(const a of stays){for(const b of stays)if(a.owner<b.owner&&hostilePair(a,b)){pair=[a,b,"meet"];break}if(pair)break}
  if(!pair)break;
  G.fq[key(pair[0],pair[1])]=1;runFight(pl,pair[0],pair[1],pair[2]);fought=true}
 return fought}

/* RAID: a horde that reached a prince's plane and survived its fights siphons part of that plane's yield for the turn, takes a few casualties, and withdraws */
function resolveRaids(){
 const byPl={};
 for(const h of G.hordes){if(h.owner<0||!h.cmd||h.cmd.type!=="RAID"||h.gone||h.t.wiped||h.t.evicted||!total(h))continue;
  const pl=G.planes[h.cmd.target];if(!pl||h.loc!==pl.id||pl.npc||pl.owner==null||pl.owner<0||pl.owner===h.owner||bonded(h.owner,pl.owner))continue;
  (byPl[pl.id]=byPl[pl.id]||[]).push(h)}
 for(const id in byPl){const pl=G.planes[id],O=G.players[pl.owner],D=Math.max(pdStats(pl).s,1);let pool=yieldNow(pl);
  for(const h of byPl[id].sort((a,b)=>hstats(a).str-hstats(b).str||a.id-b.id)){
   const S=hstats(h).str,R=S/D,f=R*R/(1+R*R),siph=Math.floor(pool*f*.4),keep=Math.floor(siph*.5),c=.02+.10*D/(D+S);/* 60% of the take is lost, and the raider keeps half of the rest */
   pool-=siph;O.raidLost=(O.raidLost||0)+siph;G.players[h.owner].well+=keep;
   const lost=applyFrac({hordes:[h]},c);lostSouls(h.owner,lost.kv);credit(pl.owner,{kv:lost.kv});
   h.t.raid={pl:id,siph,keep,lostN:lost.kn,from:null};
   if(HUM(pl.owner))ev(pl.owner,{sev:"bad",pri:2,text:`[[X:${h.owner}]]'s horde raided [[P:${id}]] and siphoned ${fmt0(siph)} souls from its yield this turn.`,plane:id,hl:`was raided at [[P:${id}]] by [[X:${h.owner}]]`});
   if(total(h)){const d=pickDest(h,false);if(d.kind!=="destroyed"){h.from=null;h.loc=d.to;h.t.raid.from=d.to}}}}}

/* ---- what a prince can estimate before sending a horde: the odds of winning every fight on a plane, from only what it knows. Uses a private random stream, so the game's own dice are never touched. ---- */
const npcStr=q=>{const g=NPCDEF[q]&&NPCDEF[q].g;let s=0;if(g)for(const k in g)s+=g[k]*DT[k].st;return s};
function oddsFor(h,id,K){
 const k=K[id];if(!k||!k.full||!total(h))return null;
 const foes=[];let unknown=false,prince=false,pdS=0;
 for(const x of(k.h||[]).filter(x=>x.o!==0)){if(x.p==null)unknown=true;else foes.push({s:x.p,j:[.85,1.2]})}
 if(k.np&&!(k.h||[]).some(x=>x.o===-1)&&npcStr(k.q)>0)foes.push({s:npcStr(k.q),j:[.85,1.2]});
 if(k.o!=null&&k.o>0&&k.d>0&&!bonded(h.owner,k.o)){prince=true;pdS=pubDef(id,k);foes.push({s:pdS,j:[.9,1.2]})}/* the plane's defense now includes the owner's public Shadow Horde strength */
 if(unknown||!foes.length)return unknown?{unknown:true}:null;
 const N=300,sv=G.seed;let win=0;
 try{G.seed=(0x9E3779B1^Math.imul(h.id+1,2654435761)^Math.imul(G.turn+7,40503)^Math.imul(id.charCodeAt(0)*97+id.length,977))|0;
  for(let i=0;i<N;i++){const c=JSON.parse(JSON.stringify(h));c.t={mv:{steps:1}};const A={owner:h.owner,hordes:[c]};let ok=true;
   for(const f of foes){const B={owner:-9,planar:true,hordes:[],s0:f.s*(f.j[0]+rnd()*(f.j[1]-f.j[0])),rem:1},r=fightRounds(A,B,"att");if(!(r.broken[1]&&!r.broken[0])){ok=false;break}}
   if(ok)win++}}
 finally{G.seed=sv}
 const p=win/N;return{p,level:p>=.67?"high":p>=.34?"medium":"low",fights:foes.length,prince,def:Math.round(pdS*1.15)}}
