"use strict";
/* ===== DATA (from the King of Demons deck) ===== */
const COLS="ABCDEFGHJKLMNPQR".split(""),MAXT=45,UNLEASH=5000;
let NX=10,NY=6,NP=60;const setDims=(x,y)=>{NX=x||10;NY=y||6;NP=NX*NY};
const AGG=[1,.8,1.3,.9,1.1,1.2,.7];
/* Blood Pact (internal code FORGE): cost 5,000 + 1,000 per elapsed turn; lasts 5 turns; each prince earns one third of the price paid every turn */
const forgeCost=t=>5000+1000*(t-1),BONDLEN=5,pactInc=pay=>Math.round(pay/3),BREAKC=2500;/* BREAK PACT (code BREAK) costs 2,500 souls and ends the pact at once */
const DT={Dre:{n:"Dretch",c:"F",t:1,st:0.88,cost:50,mv:3},
Maw:{n:"Mawling",c:"H",t:2,st:1.2,cost:60,mv:1},
Elb:{n:"Oni",c:"F",t:3,st:1.52,cost:85,mv:3},
Gor:{n:"Gorehide",c:"H",t:4,st:2.5,cost:120,mv:1},
Gal:{n:"Galbrex",c:"F",t:5,st:2.34,cost:130,mv:3},
Bra:{n:"Brazenhorn",c:"H",t:6,st:3.5,cost:170,mv:1,purge:1},
Raz:{n:"Razorwing",c:"F",t:7,st:4.1,cost:230,mv:3},
Hel:{n:"Hezrou",c:"H",t:8,st:6.0,cost:290,mv:1,purge:2},
Aby:{n:"Abyss Drake",c:"F",t:9,st:7.02,cost:400,mv:3},
Mal:{n:"Malflesh",c:"H",t:10,st:10.5,cost:520,mv:1,purge:3},
Oni:{n:"Arileth",c:"F",t:11,st:9.36,cost:525,mv:3},
Sla:{n:"Slagmaw",c:"H",t:12,st:14,cost:690,mv:1,purge:4},
Glo:{n:"Gloomrunner",c:"F",t:13,st:14.63,cost:840,mv:3},
Hat:{n:"Hate Fiend",c:"H",t:14,st:22,cost:1070,mv:1,purge:6},
Sto:{n:"Stormtalon",c:"F",t:15,st:18.72,cost:1080,mv:3},
Sou:{n:"Soulhammer",c:"H",t:16,st:28,cost:1380,mv:1,purge:8},
Rod:{n:"Vrock",c:"F",t:17,st:22.46,cost:1260,mv:3},
Sko:{n:"Balor",c:"H",t:18,st:33,cost:1610,mv:1,purge:10},
Voi:{n:"Voidstrider",c:"F",t:19,st:25.27,cost:1440,mv:3},
Ung:{n:"Shogoth",c:"H",t:20,st:37,cost:1840,mv:1,purge:12},
Bli:{n:"Blightwraith",c:"F",t:21,st:41.18,cost:2250,mv:3},
Yot:{n:"Ungol",c:"H",t:22,st:60,cost:2880,mv:1,purge:14}};
const DK=Object.keys(DT);
/* Every demon is Fast (class "F": 3 planes a turn, lower strength per soul) or Heavy (class "H": 1 plane a turn, higher strength per soul). A horde moves at the speed of its SLOWEST demon. Friendly planes cost half a move to enter. Each demon has one Strength value (st); there is no offense, defense or speed. Tiers run 1 to 22: Fast demons hold the odd tiers and Heavy the even ones. A horde is single-class: its general is Fast or Heavy when unleashed and can summon only that class. */
const CLS={F:"Fast",H:"Heavy"};
/* Bump on every published release; shown after the game number, e.g. 377560v29. */
const GAME_VERSION="2.53";const MIN_VER="2.0";/* saved games and turn codes from older versions (1.81 and earlier carry no stamp) are no longer supported */
/* prince colors: you are always color 1 (green); the other 11 palette colors are dealt to the rival princes at random, fixed for the life of a game by its seed */
const PAL=["#8cc276","#4db6c9","#a98be0","#e8782e","#d4688f","#e0c34a","#f7f2e4","#a8342e","#2d55b0","#2e8b4f","#b9d84a","#9a6a4a"];
function mkPal(n,seed){let x=((+seed||1)*2654435761+12345)>>>0;const r=()=>(x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296,a=[1,2,3,4,5,6,7,8,9,10,11];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return[0].concat(Array.from({length:Math.max(0,n-1)},(_,i)=>a[i%11]))}
function applyPal(p){const d=document.documentElement.style;for(let i=0;i<12;i++)d.setProperty("--c"+i,PAL[p&&p[i]!=null?p[i]:i])}
const verNum=v=>{const m=String(v).split(".");return(+m[0]||0)*10000+(+m[1]||0)};/* "1.100" is later than "1.99" */
const verOK=v=>v!=null&&verNum(v)>=verNum(MIN_VER);
let ME=0; /* the human seat that the report/fog code is working for (always 0 in a single-player game) */
const HUM=o=>o>=0&&!!G.players[o]&&!!G.players[o].human;
const humanSeats=()=>G.players.filter(p=>p.human).map(p=>p.id);
const as=(s,fn)=>{const m=ME;ME=s;try{return fn()}finally{ME=m}}; /* run fn as another human seat */
const ev=(seat,o)=>{o.seat=seat;G.ev.push(o)}; /* a turn event for one human prince */
/* notices shown to every other human prince when a prince rises in Chaos rank; {p} is the prince, {r} the new rank, {a} the rank with its article */
const RISE=["Chaos swirls around your foe: {p} rises to {r}.","Chaos froths in the Abyss. {p} is now {r}.","The Abyss shudders. {p} has ascended to {r}.","Chaos twists. {p} claims the title of {r}.","Thousands of souls cry out! {p} is raised to {r}.","The planes tremble as {p} becomes {a}.","A dark choir sings: {p} is now {r}.","Dark powers have recognized {p} as {r}.","Blood is spilled! {p} is {r}.","Chaos favors {p}, who is now {r}.","Unholy whispers in the void: {p} has become {r}.","Your foe stands taller. {p} is {r}.","The weak kneel as {p} rises to {r}.","Harsh laughter from afar: {p} rises to {r}.","Distant hordes change as {p} ascends to {r}.","A cold dread spreads. {p} has earned the rank of {r}.","Old powers stir. {p} is now {r}.","A name is carved in the Abyss: {p} rises to {r}.","Something vast turns its gaze on {p}, who rises to {r}.","Rejoice or tremble. {p} is now {r}."];
const NUDGE=["Your sycophants and generals want to see you ascend in power! Use the Foment Chaos command to increase the number of generals you can have and the power of demons you can summon!","Your generals grow restless in the shadow of your throne. Pour more souls into FOMENT CHAOS, and rise to command more hordes and call darker demons!","The Abyss waits for a prince who dares to climb. Use FOMENT CHAOS to win more generals and summon mightier demons!","Your courtiers mutter that your power has stalled. Silence them: use FOMENT CHAOS to claim more generals and call greater demons!"];
const riseText=(pid,rank)=>{const r=RK[rank].n,i=Math.abs(((pid+1)*31+rank*17+((G.seed0|0)%9973)))%RISE.length;return RISE[i].replace("{p}",`[[X:${pid}]]`).replace("{a}",(/^[AEIOU]/.test(r)?"an ":"a ")+r).replace("{r}",r)};
const repsOf=s=>s===0?G.reports:(G.players[s].reports||(G.players[s].reports=[])); /* each human prince's own list of turn reports */
const setPrev=(s,v)=>{if(s===0)G.prev=v;else G.players[s].prev=v};
const EVS=()=>(G.ev||[]).filter(e=>e.seat===ME); /* this turn's events for the seat being reported */
const idCmp=(a,b)=>a<b?-1:a>b?1:0; /* plane lists are always in letter order: A00, A01, ... B00, B01 ... */
const RK=[null,{n:"Chaos Soldier",t:2,b:0,c:0,g:2},{n:"Chaos Captain",t:4,b:.05,c:5000,g:3},{n:"Chaos Commander",t:6,b:.1,c:10000,g:4},{n:"Chaos Fiend",t:8,b:.15,c:20000,g:5},
{n:"Elder Chaos Fiend",t:10,b:.2,c:40000,g:6},{n:"Chaos Lord",t:12,b:.3,c:100000,g:7},{n:"Count of Chaos",t:14,b:.4,c:200000,g:8},{n:"Baron of the Planes",t:16,b:.5,c:325000,g:10},
{n:"Duke of the Abyss",t:19,b:.6,c:500000,g:12},{n:"Prince of Demons",t:22,b:.7,c:800000,g:14}];/* t = highest demon tier summonable: twice the rank, except rank 9 (19) and rank 10 (22). g = generals a player may control in all, Fast and Heavy together */
const DOM=[{n:"Uncontrolled",o:0,d:0,p:0},{n:"Rebellious",o:3,d:3,p:.1},{n:"Oppressed",o:5,d:5,p:.3},{n:"Afraid",o:10,d:10,p:.6},{n:"Terrified",o:10,d:20,p:.8},{n:"Kneeling",o:20,d:40,p:.9},{n:"Prostrate",o:40,d:40,p:1}];
const QN=["Abandoned","Sparse","Uncrowded","Crowded","Overcrowded","Thronging","Necropolis","Tombplane"];
const QW=[5,5,10,25,45,10,5,5]; /* deck frequencies add to 110%, so they are used as weights */
const QV=q=>800+200*q;
/* Garrisons by plane value (from the designer's spreadsheet). Values 3 to 7 are held by an NPC power; the higher the value, the stronger its planar defense (domination level) and garrison. Values 0 to 2 are empty. */
const NPCDEF={3:{npc:true,dom:1,g:{Dre:25}},4:{npc:true,dom:1,g:{Dre:75}},5:{npc:true,dom:2,g:{Dre:75,Gal:16}},6:{npc:true,dom:3,g:{Dre:75,Gal:48}},7:{npc:true,dom:4,g:{Dre:75,Gal:48,Hel:12}}};
const ADJ="Enfeebling,Lower,Blinding,Endless,Trackless,Impenetrable,Poisonous,Toxic,Acidic,Electric,Burning,Frozen,Drowned,Screaming,Silent,Infested,Plague Ridden,Haunted,Ghastly,Malignant,Grim,Unrelenting,Pestilential,Malevolent,Sickening,Nauseating,Alien,Eldritch,Loathsome,Accursed,Sunless,Gelatinous,Blood Red,Jet Black,Storm Wracked".split(",");
const NOUN="Swamp,Marsh,Depths,Waste,Badlands,Caves,Burrows,Sea,Ocean,Mountains,Lava Flows,Bog,Fens,Emptiness,Jungle,Plateau,Desert,Delta,Blasted Lands,Riverlands,Labyrinth".split(",");
const PFX="Agony,Rot,Blight,Gloom,Dread,Ash,Bone,Grave,Wail,Cinder,Ruin,Hollow,Gore,Murk,Sorrow,Night,Void,Salt,Bile,Plague,Dusk,Gall,Fester,Cairn".split(","),SFX="mire,fen,moor,reach,deep,vale,pit,barrow,wold,scar,drift,gulch,shoal,marsh".split(",");
const VERBS=["commanded","ordered","mandated","ruled","decreed","enjoined","compelled"];
const SYL=[["Mal","Bel","Ox","Ag","Bar","Zir","Ral","Az","Kru","Vor","Dra","Nez","Hul","Sar","Tor","Yeg","Ob","Gor"],["Zul","Gar","Mo","Gran","Drax","Rok","Vesh","Ul","Kar","Nul","Ash","Tux"],["Oth","Ath","Eth","Ul","Ith","Orn"],["Xag","Xar","Mon","Xoth","Mul","Zan"]];
const NPC_A="Pale,Hollow,Weeping,Gutted,Ashen,Gilded,Whispering,Drowned,Bleeding,Withered,Silent,Rusted,Crowned,Faceless,Starving,Burning,Black,Hungering,Veiled,Thorned,Ninefold,Sleepless".split(",");
const NPC_N="Choir,Maw,Idol,Court,Brood,Congregation,Host,Cabal,Conclave,Throne,Chorus,Swarm,Covenant,Tribunal,Hive,Mothers,Regents,Gaolers,Oracles,Orchard,Parliament,Pilgrims,Butchers,Harvest".split(",");
const NPC_O=["Teeth","Ash","Nine Wounds","the Last Hour","Salt","Rust","Thorns","Open Mouths","Broken Bells","Bone","Silence","Hunger","Many Eyes","Cinders"];
/* Demon Prince names for AI-controlled seats (drawn without repeats; the AI's aggression stays tied to its seat) */
const DPN=["Jubex the Viscous","Malgrath of the Weeping Spires","Ozrakh the Unrelenting","Vorgrathul the Hollow","Ashkelon Bloodmire","Nezzariel the Gilded Plague","Mordukai Sunderheart","Xyrthaza the Wounded","Gorvanth the Rust-Crowned","Ilvareth Whisperflame","Skarmoth the Patient","Beleth-Un the Sallow","Quillorax of the Black Tide","Drazgul Ashenmaw","Thessaly Nightveil","Urzhakar the Hungering","Phaelgor Soundless","Kharnivex the Tattered","Lazarhul Gravebloom","Mephistrax the Courteous","Orvoth Cinderhand","Zhulgar the Seventh Debt","Naamkesh the Weeping","Vyrmuth Bonepiper","Ghaldrim the Dark","Sethrazul Thornveil","Azkaroth the Toll-Taker","Yoggarith Lowhowl","Cindrael the Smiling Rot","Baalzekiel Duskmantle","Krovash the Bellringer","Hrazzul of the Salt Throne"];
function nameList(){try{const s=typeof localStorage!=="undefined"&&localStorage.getItem("kodAIN");if(s){const a=JSON.parse(s);if(Array.isArray(a)&&a.length>=3)return a}}catch(e){}return DPN}
function aiNames(seed,n){let s=(seed^0x9E3779B9)|0;const r=()=>{let t=s=(s+0x6D2B79F5)|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
 const pool=nameList().slice(),out=[];while(out.length<n){out.push(pool.splice(Math.floor(r()*pool.length),1)[0])}return out}

/* ===== STATE & RNG ===== */
let G=null;
function rnd(){let t=G.seed=(G.seed+0x6D2B79F5)|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1)),pick=a=>a[Math.floor(rnd()*a.length)];
const pid=(x,y)=>COLS[x]+String(y).padStart(2,"0");
/* AI strategy profiles (agg = attack readiness, fom = spends 20% on Foment, save = share of the Well left unspent to harvest until it reaches the cap) and the four Danger levels, which are measured win rates against default princes */
const STRAT={AW:{agg:1.3,fom:true},BW:{agg:1,fom:true},AM:{agg:1.3,fom:false},PW:{agg:.7,fom:true},PM:{agg:.7,fom:false},BM:{agg:1,fom:false},PS:{agg:.7,fom:true,save:.7},HEDGE:{agg:.7,fom:true,save:.8},BS:{agg:1,fom:true,save:.7},AS:{agg:1.3,fom:true,save:.7}};
const DANGER=[{k:"L",s:"Slap",n:"Strong Verbal Harassment and a Slap",d:"under 50% win",pool:["AW","BW","AM","PW","PM","BM"]},{k:"H",s:"Kick",n:"A Kick in the Teeth and a Knee to the Groin",d:"51-74% win",pool:["PS","HEDGE"]},{k:"X",s:"Armageddon",n:"Armageddon Made Manifest",d:"75%+ win",pool:["BS","AS"]}],DANGER_DEF=1;
const dangerOf=p=>{const k=typeof p.danger==="string"?p.danger:["L","L","H","X"][p.danger];return DANGER.find(d=>d.k===k)};/* v2.23 saves stored 0-3 */
const PEACE_T=20;/* NPC personalities last through this turn */
const PERS={PEACE:{n:"Peaceful",d:"attacks no prince who has not attacked it, and rival NPC princes leave it alone, through turn 20."},GRUDGE:{n:"Grudge",d:"keeps the same peace through turn 20, but a prince who attacks it is hunted hard until then."}};
const HARV_CAP=75000;/* harvest shuts off while the Well holds this many souls */
const TIP_WELL=`Your Well of Souls: the souls you hold right now. You spend them on commands. At the end of the turn, unspent souls are harvested: every 3 return as 4 next turn. Harvest shuts off while your Well holds ${HARV_CAP.toLocaleString("en-US")} or more souls.`,TIP_INC="Total Yield: the souls your planes pay into the Well each turn, after your Chaos and Shadow Horde bonuses. It is paid on top of any harvest, and the harvest limit does not affect it. A plane's Yield is determined by a plane's Value (shown as v on the realm map) and its Domination level (shown as d on the realm map).  Clicking on a plane will show its current yield and maximum potential yield in the detail section.";
const fmt0=n=>Math.round(n).toLocaleString("en-US");
const cleanName=(s,n)=>String(s==null?"":s).replace(/[^A-Za-z ]/g,"").replace(/ +/g," ").trim().slice(0,n||24).trim();
function genGeneral(){for(let i=0;i<200;i++){const r=rnd(),k=r<.6?2:r<.9?3:4;let s="";for(let j=0;j<k;j++)s+=pick(SYL[j]);s=s[0]+s.slice(1).toLowerCase();if(!G.usedGen.includes(s)){G.usedGen.push(s);return s}}return"Nameless"+G.usedGen.length}
function genNpcName(){for(let i=0;i<200;i++){const r=rnd(),a=pick(NPC_A),n=pick(NPC_N),o=pick(NPC_O);
 const nm=r<.7?`The ${a} ${n}`:`The ${n} of ${o}`;
 if(!G.usedNpcN.includes(nm)){G.usedNpcN.push(nm);return nm}}return"The Nameless Host"}
/* Six-digit game number taken from the start-time seed; a server would hand out sequential numbers in multiplayer. */
function gameNo(){return String((G.seed>>>0)%900000+100000)}
function wpick(w){let t=w.reduce((a,b)=>a+b),r=rnd()*t;for(let i=0;i<w.length;i++){if((r-=w[i])<0)return i}return w.length-1}

/* ===== MAP ===== */
function genMap(){
 const used=new Set(),pl={};
 for(let y=0;y<NY;y++)for(let x=0;x<NX;x++){
  const id=pid(x,y);
  const links=[pid((x+1)%NX,y),pid((x+NX-1)%NX,y),(x+y)%2===0?pid(x,(y+1)%NY):pid(x,(y+NY-1)%NY)];
  let nm,tries=0;do{if(rnd()<.5)nm=pick(ADJ)+" "+pick(NOUN);else{const a=pick(PFX),b=pick(SFX);nm=a+b}}while(used.has(nm)&&++tries<80);used.add(nm);
  pl[id]={id,x,y,links,name:nm,short:nm,q:wpick(QW),owner:null,dom:0,npc:false,npcName:null};
 }
 return pl;
}
function bfs(from,to){
 if(from===to)return[];const prev={[from]:null},q=[from];
 while(q.length){const c=q.shift();for(const n of G.planes[c].links){if(n in prev)continue;prev[n]=c;if(n===to){const p=[];let k=to;while(k!==from){p.unshift(k);k=prev[k]}return p}q.push(n)}}
 return[];
}
function distMap(from){const d={[from]:0},q=[from];while(q.length){const c=q.shift();for(const n of G.planes[c].links)if(!(n in d)){d[n]=d[c]+1;q.push(n)}}return d}

/* ===== HORDES ===== */
const total=h=>{let t=0;for(const k in h.demons)t+=h.demons[k];return t};
const hordesOf=o=>G.hordes.filter(h=>h.owner===o&&!h.gone);/* a general lost with no home plane is gone for good: kept only so old reports and horde numbers still resolve */
function hstats(h){
 let st=0,n=0,val=0,tier=0,mv=99;
 for(const k in h.demons){const c=h.demons[k],d=DT[k];if(!c)continue;st+=c*d.st;n+=c;val+=c*d.cost;tier+=c*d.t;mv=Math.min(mv,d.mv)}
 if(!n)mv=h.cls==="H"?1:3;
 if(h.owner>=0&&G&&G.hordes&&G.hordes.some(x=>x.owner===h.owner&&x.loc===h.loc&&hasAb(x,"HARD")))st*=1.05;/* Battlemaster: one force (same owner, same plane) shares it, never stacked */
 return{str:st,n,mv,val,tier};
}
const lashB=h=>hasAb(h,"LASH")?1:0;/* Lashmaster: +1 movement */
const cmdName=t=>t==="MARCH"?"FORCED MARCH":t==="DOMINATE"?"MOVE and DOMINATE":t;
const mvBudget=h=>Math.max(1,Math.round(hstats(h).mv)+lashB(h)+(h.cmd&&h.cmd.type==="MARCH"?2:0));/* movement points a turn; a FORCED MARCH adds 2 */
const stepCost=(o,id)=>{const pl=G.planes[id];return pl&&pl.owner!=null&&(pl.owner===o||bonded(o,pl.owner))?.5:1};/* entering a friendly plane costs half a move */
function route(from,to,o){/* cheapest path by move cost (friendly planes 0.5, others 1) */
 if(from===to)return[];const dist={[from]:0},prev={},done={};
 for(;;){let c=null;for(const k in dist)if(!done[k]&&(c===null||dist[k]<dist[c]))c=k;if(c===null||c===to)break;done[c]=1;
  for(const n of G.planes[c].links){const nd=dist[c]+stepCost(o,n);if(!(n in dist)||nd<dist[n]-1e-9){dist[n]=nd;prev[n]=c}}}
 if(!(to in dist))return[];const p=[];let k=to;while(k!==from){p.unshift(k);k=prev[k]}return p}
function costMap(from,o){const dist={[from]:0},done={};
 for(;;){let c=null;for(const k in dist)if(!done[k]&&(c===null||dist[k]<dist[c]))c=k;if(c===null)break;done[c]=1;
  for(const n of G.planes[c].links){const nd=dist[c]+stepCost(o,n);if(!(n in dist)||nd<dist[n])dist[n]=nd}}return dist}
function turnsFor(h,path){/* turns a horde needs to walk this path at its budget */
 const B=mvBudget(h);let t=1,left=B;for(const id of path){const c=stepCost(h.owner,id);if(c>left+1e-9){t++;left=B}left-=c}return t}
/* General abilities: one is drawn at random when the general reaches Age 10 (abA), another at Experience 10 (abE). They are lost if the horde is annihilated. */
const ABIL={TACT:{n:"Tactician",t:"+1 to its tactics roll in every round."},SIEG:{n:"Siegebreaker",t:"Each win over planar defenses cuts domination by 3 instead of 2."},IRON:{n:"Iron Will",t:"Its horde takes 10% fewer casualties in every round."},WARL:{n:"Warlock",t:"+1 purge rating, if the horde has a purge at all."},MEND:{n:"Necromancer",t:"After each fight, 5% of the strength the enemy lost is raised into its horde as its weakest demons (the lowest tier of its class)."},HARD:{n:"Battlemaster",t:"+5% strength for its whole force on the plane."},ABJU:{n:"Abjurer",t:"Reduces the enemy's highest purge rating by 1."},QUAR:{n:"Quartermaster",t:"Summons into its horde cost 5% fewer souls."},DOMI:{n:"Dominator",t:"Planes its horde conquers start at domination 2 instead of 1."},SOUL:{n:"Soulfinder",t:"Whenever its horde conquers a plane, it finds 100 × (your Chaos rank)^2.5 souls, paid into your Well."},ANTI:{n:"Antipaladin",t:"Carnage victory points earned by its horde are increased by 7%."},BERK:{n:"Berserk",t:"+10% strength from round 4 of a fight onward."},TRNC:{n:"Trench Master",t:"Its force's defender bonus is 25% instead of 15%, and 40% if the general's horde is under the HOLD order."},REAP:{n:"Reaper",t:"10% of the soul cost of the enemy demons its force kills goes into your Well."},MIND:{n:"Mindbreaker",t:"In the first round of a fight the enemy's strength is reduced by 15%."},UNSE:{n:"Unseen",t:"Its strength is hidden from every report unless it stands on an enemy prince's plane. SCRY does not reveal it."},SEER:{n:"Seer",t:"Reveals the demon mix of enemy hordes on adjacent planes. Against an Unseen horde both abilities cancel and only its strength is shown."},FARS:{n:"Farsighted",t:"Reveals the strength of enemy hordes within two planes. Overrides Unseen within one plane; at two planes an Unseen horde's presence shows but not its strength."},JUDG:{n:"Judge",t:"Reveals the abilities of enemy generals on its plane and on adjacent planes."},LASH:{n:"Lashmaster",t:"+1 plane of movement."},SLIP:{n:"Slippery",t:"Retreats automatically at the end of any round in which it is outnumbered 3 to 1."}};
const hasAb=(h,k)=>h.abA===k||h.abE===k;
const sumH=(n,h)=>{let s=0;for(const k in n)s+=(n[k]||0)*DT[k].cost;return Math.floor(s*(h&&hasAb(h,"QUAR")?.95:1))};/* soul cost of a summon, with the Quartermaster discount */
const abOf=h=>[h.abA,h.abE].filter(k=>k&&ABIL[k]);
const forceAb=(F,k)=>!!(F&&F.hordes&&F.hordes.some(h=>hasAb(h,k)));
const genAge=h=>Math.max(0,G.turn-(h.born==null?G.turn:h.born));/* turns since the general was unleashed (or last resurrected) */
const hno=h=>G.hordes.filter(x=>x.owner===h.owner&&x.id<=h.id).length;
function newHorde(owner,loc,demons,cls,name){const h={id:G.nextH++,owner,gen:owner<0?"":(name&&!G.usedGen.some(u=>u.toLowerCase()===name.toLowerCase())&&G.usedGen.push(name)?name:genGeneral()),cls:owner<0?"":(cls==="H"?"H":"F"),loc,from:null,demons:demons||{},cmd:{type:"HOLD"},born:G.turn,exp:0,res:0,t:{fights:[]}};G.hordes.push(h);return h}
const shadowVal=p=>{let v=0;for(const k in G.players[p].shadow)v+=G.players[p].shadow[k]*DT[k].cost;return v};
const capOf=p=>Math.max(0,RK[G.players[p].rank].g-(G.players[p].genLost||0));/* the rank limit, less every general lost while the prince had no home plane */
const ownsHome=p=>{const P=G.players[p],hp=G.planes[P.home];return !!hp&&hp.owner===p};

/* ===== NEW GAME ===== */
function spreadHomes(n){const ids=Object.keys(G.planes),hs=[pid(1,NY>1?1:0)];while(hs.length<n){const ds=hs.map(h=>distMap(h));let best=null,bd=-1;for(const id of ids){if(hs.includes(id))continue;const m=Math.min(...ds.map(d=>d[id]));if(m>bd){bd=m;best=id}}hs.push(best)}return hs}
function newGame(opts){opts=opts||{};const seats=opts.seats; /* multiplayer games (MPG) pass seats: [{human,name,email}] for 2-8 princes, plus nx,ny map size (ny even) */
 setDims(opts.nx,opts.ny);const NPL=seats?seats.length:4;
 G={seed:opts.seed!=null?opts.seed:(Date.now()^0x5bd1e995)|0,no:null,turn:1,planes:null,hordes:[],nextH:1,usedGen:[],players:[],reports:[],everDom:[],end:null,over:false,usedNpcN:[],bonds:[],hit:{}};
 G.seed0=G.seed;G.ver=GAME_VERSION;G.cfg={nx:NX,ny:NY};G.no=gameNo();if(seats)G.league={gm:true,created:Date.now()};
 G.planes=genMap();G.pal=mkPal(NPL,G.seed);
 const homeIds=(NX===10&&NY===6&&NPL===4)?[pid(1,1),pid(6,1),pid(3,4),pid(8,4)]:spreadHomes(NPL);
 const pick=aiNames(G.seed,NPL),names=pick.map((n,i)=>i?pick[i-1]:"Thraxxamazog");
 names.forEach((nm,i)=>{
  const sd=seats&&seats[i],human=seats?!!(sd&&sd.human):i===0;if(human&&sd&&cleanName(sd.name,40))nm=cleanName(sd.name,40);if(!seats&&i===0&&cleanName(opts.name,40))nm=cleanName(opts.name,40);
  const hp=G.planes[homeIds[i]];hp.q=7;hp.owner=i;hp.dom=6;
  const P={id:i,name:nm,human,email:(sd&&sd.email)||"",agg:i?AGG[i-1]:1,color:`var(--c${i})`,rank:1,rise:1,well:10000,foment:0,hret:0,consumed:0,carnage:0,domVal:0,home:hp.id,shadow:{},met:[],princely:[],lastP:null,known:{}};
  if(!human){const r=rnd(),rl=rnd(),rs=rnd(),ai=G.players.filter(q=>!q.human).length,od=opts.danger&&opts.danger[ai];
   P.pers=r<.165?"PEACE":r<.33?"GRUDGE":null;const lv=od!=null&&od>=0&&od<DANGER.length?od:DANGER_DEF,pool=DANGER[lv].pool;
   P.danger=DANGER[lv].k;P.strat=pool[Math.floor(rs*pool.length)];P.agg=STRAT[P.strat].agg}/* each game-run prince gets a Danger level (chosen, default A Kick in the Teeth) and a hidden strategy from that level's pool *//* 67% of NPC princes are unpredictable (none); the rest are Peaceful or Grudge */
  G.players.push(P);
  newHorde(i,hp.id,{Maw:25},"H");
 });
 /* fair start: each home plane has two v3 planes and one v4 plane next to it */
 for(const p of G.players){const nb=G.planes[p.home].links.filter(id=>G.planes[id].owner==null);const j=Math.floor(rnd()*nb.length);nb.forEach((id,i)=>{G.planes[id].q=i===j?4:3})}
 for(const id in G.planes){const p=G.planes[id];if(p.owner!=null)continue;
  const nd=NPCDEF[p.q];
  if(nd){p.dom=nd.dom;let nm=null;if(nd.npc){p.npc=true;p.npcName=nm=genNpcName()}
   const g=newHorde(-1,id,Object.assign({},nd.g));if(nm){g.npcName=nm;g.gen=nm}}}
 for(const p of G.players){G.everDom.push(p.home)}
 if(!seats&&!opts.name)G.askName=true;
 setOpen();
 for(const s of humanSeats()){as(s,()=>updateKnow());repsOf(s).push(as(s,()=>makeReport(null)));setDefaults(s)}
}
