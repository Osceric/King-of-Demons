# KoD notes (session of 2026-11-13)

# Working agreements (read this first in any new session)

Project: King of Demons (KoD), a single-page HTML play-by-mail demon-prince strategy game. Owner: Dennis Dillman. Source is split in `src/` and joined by `node build.js` into `index.html`. Repo: Osceric/King-of-Demons (main); Pages: https://osceric.github.io/King-of-Demons/. On Dennis's PC the folder is `C:\Users\denni\Documents\KoD`.

## Versions
- `GAME_VERSION` is "major.minor" in `src/02-data-and-setup.js`. Bump the minor by 1 for every change to the game. `MIN_VER="2.0"` stays untouched.
- Dennis controls version bumps and releases. Add a NOTES.md entry for every version.

## Where things get deployed
- Default: the Test artifact and the PC folder only.
- The public Claude link and GitHub are updated only on an explicit instruction ("push everything everywhere", "update everything everywhere", "push it everywhere"). Each such instruction covers that one push only.
- Test artifact: publish a **test copy** so its title reads "King of Demons Test" and `TEST_BUILD` is true: `sed 's|<title>King of Demons</title>|<title>King of Demons Test</title>|; s|const TEST_BUILD=false|const TEST_BUILD=true|' kod/index.html > testcopy/index.html`.
- PC: do the file commits one after another. Commit `index.html` first, then `NOTES.md` and any changed `src/` files in a second call.
- GitHub: copy `src/`, `index.html`, `NOTES.md`, `build.js` into the clone, commit, push `origin HEAD`.
- Do not paste artifact links unless asked. After publishing, one sentence saying what it is.

## Testing
- ENG = engine test (`node t2.js`, expects `"bad": []`). BTN = button test (`node pwbtn.js`, expects `[]`). Report as "ENG and BTN pass".
- Rebuild the engine file before ENG: `(echo '"use strict";'; cat src/02 03 04 05 055 056) > engine.js`.
- A 30-game AI smoke test (`q55.js`) after anything touching the engine or AI.

## Style and conduct
- Be honest about unknown causes. Correct earlier misstatements promptly.
- RULE: do not use the term "league" anywhere (game text, code, comments, notes or documentation) until a league feature is added. Say "multiplayer game" (MPG).
- Call the computer-run princes "NPC princes" (in UI text and in conversation), not "AI players" or "AI princes": they run on an algorithm, not AI. Code comments and old NOTES entries may still say AI.
- Player color is green. "Green is you" in the note text.
- Flags: `SHOW_PDF=false` hides Export PDF; the Multiplayer button shows only in the test build, with `#mp` in the address, or when the mode is not solo.

## Rules decisions already made (do not reopen without asking)
- Turn: 1 Summon, 2 Prince stage, 3 Movement, 4 Fights, 5 Growth and harvest. Harvest stops at a Well of 75,000.
- Fight order: defenders' home planes first, then other planes smallest attacking force first, ties by plane id. Within a plane: scrum among arrivals (lowest experience, then age, then victory points, then random), then partners of the defender, the owner's horde, then planar defense. Blood Pact partners never fight each other and cannot team up. If domination is 2 or less, the better general goes first; otherwise scrum order.
- A horde already pushed out this turn that is beaten again is destroyed. Both sides can be destroyed; a 2:1 survivor lives on.
- Summon screen shows only the top tier the rank allows. Shadow Horde summons Fast demons only. Purge kills 20% of units of each kind (min 1) at tiers up to the rating and cannot be soaked.
- Free SCRY shows strength only; paid SCRY (multiples of 2,500, up to 7,500) also shows horde makeup in reach. Slippery threshold 3:1; HOLDR 2:1.

## Parked or open
- Demon traits (RIOT, ARTILLERY, governability, raider, ranged; 1 or 2 types per tier): see "Parked: demon traits". No code yet.
- Known Planes icon set: mock-up published as a separate page; waiting for Dennis to pick an option (A icons above labels, B icons only, C icons in cells with domination pips). Not built.
- Deal the dark-green and lime player colors last so they do not clash with the green player color.
- AI danger levels need retuning after the harvest cap change.
- iPad persistence test (Chrome v2.19, Safari v2.27) still open.
- Cloudflare automatic multiplayer is design only (see roadmap).

---


## Goal
A single-player web take on play-by-mail games. The turn report is the core: it should let a player see what happened, what they know, and what to do next, quickly.

## Report design (implemented)
Headline sentence, then stat tiles with deltas, a "needs your attention" list whose buttons jump to the right screen, battles and events, each order echoed with an outcome (success / partial / setback), new intel, and shadow-horde rumors. Filters and a per-turn archive. Planes and hordes named in the report are clickable. Multi-turn orders (Move and Dominate, Forced March) carry over until the horde arrives. Stale map info is drawn dashed with its age.

## Assumptions where the deck was silent or conflicted
- Dretches can join any horde (rank 1 allows only tier 1).
- Starting general capacity is 2 (slide 6), not 3 (rank table).
- Ungol = tier 37, Yothoth = tier 51 (names were swapped between the table and ability notes).
- Plane quality frequencies add to 110%, so they are used as weights.
- Horde movement: portals crossed per turn = round(speed / 8), at least 1 (75% slower than the first version).
- Shadow Horde defense: each owned plane adds 50% of the owner's shadow offense/defense to its planar defense (100% at the home plane); when a plane's defense takes casualties, 50% of that loss percentage applies to the shadow demons. DELVE stops short of any plane held by another party and does not claim planes.
- Combat: casualties kill the loss % of demons and also add loss/2 as damage; hordes heal 30% per quiet turn (20% before v61).
- Unspent souls are harvested automatically (v65). The old 2% idle fade was removed afterwards.
- Victory points: "Demons killed and lost" gives 100 x tier per enemy demon destroyed and 75 x tier per own demon lost (more than the 50 x tier for a demon merely alive in a horde). The deck gave no points for losses.
- NPC powers get names generated from tables (either "The [adjective] [noun]" or "The [noun] of [phrase]", never both an adjective and an "of" phrase), giving titles like "The Pale Choir" or "The Maw of Ash", unique within a game. Prince names are chosen by players (multiplayer plan); generals use the deck's syllable scheme.
- End game countdowns: a prince reaching Chaos rank 7 starts a 10-turn countdown; the other triggers (rank 10, every plane dominated, every prince met) start 5-turn countdowns. Only the first countdown to start counts; later triggers change nothing. If several start on the same turn, the shortest applies. The game also ends after turn 30.
- Every game gets a six-digit game number (from its start-time seed), shown under the page title and on the final results. Multiplayer should replace this with server-assigned numbers.
- The Known Planes table shows changes since last turn for Dom, Val, Souls / turn and Defense (blank means no change).
- Secret underdog bias: +1 to the side with under half the other's strength.
- Map: 10 x 6 planes, 3 portals each (east, west, and one vertical alternating), 4 princes.

## Not implemented yet
Surrender, Probe, shadow horde defending planes, veterancy, multiplayer, accounts, emailed turns.

## Deck issues to resolve
- Slide 9 ends with a stray "sdf"; slide 25 has a cut-off sentence.
- "FDPs" (slide 33) is never defined.
- Slide 27 first column vs. slide 6 on starting generals.
- Slide 33 Helkae note mentions "Vrock".

## Playtest findings
- Computer princes expand quickly; a passive player loses planes.
- "All princes met" triggers the endgame around turn 15 with 4 players, ending games near turn 20. Consider requiring more, or counting only direct combat.
- Victory-point scale: Chaos Power is now 50,000 per rank (was 300,000 in the deck), so carnage and planes matter more.

## Next steps
1. Play it and note what the report makes easy or hard.
2. Tune AI aggression, endgame triggers, VP weights.
3. Add Probe, Surrender, shadow defense.
4. Decide whether the multiplayer version (Azure SQL per the deck) shares this rules engine.

## Battle detail (blow by blow)
- Each battle in "Battles and events" has a Won/Lost/Draw button. Selecting it opens the step-by-step record: forces, offense/defense/speed, odds column, dice, table value, modifiers, numeric result, result name and loss %, casualties by demon type, purge effects, and the aftermath.
- The secret underdog bias is shown only as "Other circumstances +1".
- Bug fixed: kill/loss attribution was mis-paired. Each side's losses are now its own casualties plus demons purged by the enemy. This changes Carnage, "Demons killed and lost" VP and the "demons lost" counts.

## PDF export
- An "Export PDF" button (right of the tabs) saves one landscape PDF holding the Report (with every battle expanded), Realm and Standing tabs. It uses the artifact `downloads` capability, so the viewer confirms the save. When the page is not running inside claude.ai (own web host, or index.html opened locally) it falls back to a normal browser download. Inside claude.ai without that capability the button is hidden.
- The PDF is built in the page with a small built-in writer (Courier, text only). The map is not included; the Known Planes table is.
- Build order is now: 01-shell, 02, 03, 04, 05, 06, 065-pdf-export, 07.

## Garrisons by plane value (setup)
Source: the designer's spreadsheet "NPC Planes by Value" (table NPCDEF in 02-data-and-setup.js). New games only.
- Values 0-2: empty, no defense.
- Values 3-4: held by an NPC power at domination 1 (Rebellious: planar defense 3 offense / 3 defense), garrison 25 Dre at value 3 and 75 Dre at value 4.
- Value 5: NPC power, domination 2 (Oppressed), 75 Dre + 16 Gal. Value 6: domination 3 (Afraid), 75 Dre + 48 Gal. Value 7: domination 4 (Terrified), 75 Dre + 48 Gal + 12 Hel.
- Code: any live garrison now counts as hostile for movement and retreat, and as a target and a defense figure for the AI and the Known Planes table, whether or not the plane is an NPC power.
- Victory points and garrisons: demons killed in a fight with a garrison, and the player's own losses there, score like any other fight. When a garrison loses, the demons that survived the fight are wiped out and also count as kills (souls value to Carnage, tier x 100 to "Demons killed and lost"); the battle detail notes it.

## Free SCRY every turn
- Every turn the Prince automatically scries one hop: every plane adjacent to the player's planes and hordes is fully revealed (holder, domination, value, hordes seen), at no cost. Done in updateKnow(), also at game start and on loading a saved game.
- The paid SCRY command costs 2,500 souls per extra hop beyond the free one, spent in multiples of 2,500 from 2,500 up to a cap of 7,500 (reach 2 to 4 hops in total; SCRYMAX in 04-economy-ai-turn.js): reach = 1 + souls/2,500 hops. The Orders panel defaults it to 2,500, steps by 2,500, snaps typed amounts down to a multiple (and down to the cap) and shows an error that blocks the turn if the amount is invalid; the turn engine also refuses an invalid amount (no cost, reported as a failed SCRY).
- A note about the free SCRY sits at the top of the Princely commands panel.
- The 25% / 50% / All buttons are not shown for the SCRY command (the amount is picked with the field or its 2,500 steps); other Princely commands keep them.

## Chaos Power ranks: invested to date
- The ranks table (Orders panel fold-out and Standing tab) has an "Invested to date" column: ranks already reached show their full cost, the next rank shows the souls invested so far and the percentage, and later ranks show 0. Progress resets to 0 each time a rank is reached, as before.

## Plane lists in letter order; horde card overflow
- Every list of planes (target choices in a horde's command, the Known Planes table, the report's new intelligence) is in plane-id order: A00, A01 ... B00, B01 ... (function idCmp in 06-ui-report.js). Previously targets were by distance and Known Planes by owner and freshness; distance is still shown on each target.
- Horde command cards no longer overflow narrow screens: the card's grid column and its children can shrink (min-width 0) and the target dropdown is clipped with an ellipsis.

## Known planes grouped by holder
- The Known Planes table is grouped: you, then each rival in turn order, then Minor Powers (NPCs), then planes no one holds. Each group has a heading with its plane count, and planes are in letter order inside each group. Every NPC holder is shown as "Minor Power"; selecting the row opens the plane's detail, which still gives the NPC's name.

## "Minor Power" naming and game version
- Everything the player sees now says "Minor Power" instead of NPC / NPC power: the map legend, the map cell label ("Minor"), the plane detail and the Known Planes table. (Code names such as npc, NPCDEF and the name tables keep the short form.)
- The game version is shown after the game number, e.g. GAME NO. 377560v29, and in the PDF header. It is the constant GAME_VERSION in 02-data-and-setup.js: bump it on every published release so it matches the artifact version.

## v30 – Multiplayer (GM-run play by mail)
- Multiplayer button (top right) switches between Solo, Play in a friend's game, and Run a game (GM). Each mode has its own saved game (kod1 / kodP / kodGM).
- GM: set up 4 seats (human or AI), custom prince names and emails. Each turn: Prepare mail (one email per human prince with a private, fogged turn code) → paste each returned orders code → Resolve (missing princes keep their multi-turn orders + default Princely plan).
- Player: paste turn code, play normally, "Make orders code", reply by email. Report history accumulates locally.
- Codes are gzip+base64url (~4 KB), wrapped in BEGIN/END KOD CODE markers. Views swap the player's seat with seat 0 and redact unknown planes and other princes' private state.
- Gmail drafts NOT yet wired (connector not connected): mail is copy-to-clipboard for now. GM must share the artifact link with friends.
- Not yet handled: game-over screen for players.

## v31
- GM mail: Copy all messages, per-player Mark sent tracker, remembered roster (names, emails, seat types) prefilled at setup.

## v32
- Mail link ends in #play: opens straight into player mode (join screen, no Multiplayer button). Players get a "Load turn code" button for later turns.

## v33
- Email wording per GM: KOD Turn Code / KOD Orders Code with BEGIN/END KOD TURN CODE and ORDERS CODE lines (old lines still accepted); button "Finalize Orders and Make KOD Orders Code".

## v34
- AI princes get names from a 32-name table (DPN in 02-data-and-setup.js), drawn without repeats per game; gameplay unchanged (aggression stays tied to seat).

## v35
- AI prince name list is editable (Multiplayer menu > Edit AI prince names): one per line, min 3, saved in browser (kodAIN), restore-default button.

## v36
- GM setup: choose human princes (1-6), AI princes (0-5, 2-6 in all), map width (6-14) and height (4-10, even). Game stores G.cfg {nx,ny}; NX/NY/NP are now variable (setDims). Homes: legacy spots for 10x6 with 4 princes, otherwise farthest-point spread. Added colours c4,c5. AI aggression table AGG. Opening the #play link in an already open page switches to player mode.
- Roster saved as kodRoster2 (counts, map size, names, emails).

## v37
- Known planes table: "Your planes produce" total row now sits directly under your own group of planes.

## v38
- Up to 8 princes (1-8 human, 0-7 AI). Colours c6,c7 added; AGG table extended; map width up to 16 (column letters to R).

## v39
- Demon display names changed per spreadsheet: Elbren->Oni, Helkae->Hezrou, Oni->Arileth, Rodim->Vrock, Skor->Balor, Ungol->Shogoth, Yothoth->Ungol. Internal codes (Elb, Hel, Oni, Rod, Sko, Ung, Yot) unchanged so saved games keep working.

## v40
- End-game countdowns: Count of Chaos (rank 7) = 15 turns; every plane dominated once = 10 turns; every prince meets every other = 15 turns; True Prince countdown removed. Shortest countdown wins if several trigger the same turn; later triggers change nothing; turn 30 still ends the game.

## v41
- Maximum turn limit raised to 45 (MAXT in 02-data-and-setup.js); the game ends after turn 45 even if no countdown started. A report warning appears in the last 5 turns when no countdown is running.

## v42
- "The princes of the Abyss" card (all princes by full name and colour, you marked) on the Opening briefing and on the Standing tab. Previously only first names appeared in the Realm map legend.

## v43
- Princes of the Abyss card now sits on the Standing tab between "How the game ends" (victory points) and Chaos Power ranks, and lists each prince's current Chaos rank title.

## v44 – Forge Bond (5th Princely command)
- Cost 5,000 + 1,000 per elapsed turn (forgeCost). Target: a prince you have met.
- A bond forms only if BOTH princes name each other with Forge Bond the same turn and each pays. If only one pays the souls are lost, nothing happens, and the payer's report says BETRAYED (no refund; the other prince is not told).
- Lasts 5 turns including the turn it is forged (G.bonds {a,b,from,until}); both re-forging while active adds 5 more turns. Bonded princes never fight each other (hostile(), pdOn and the combat loop skip bonded pairs; their planes are not hostile to each other) and each earns +1,500 souls per turn per bond (inside income()).
- AI princes never start a bond, but may answer a human's offer (chance 0.75 - 0.25*aggression, min 0.2, needs the souls).
- Reports: echo line, success/betrayal events, reminder the turn before it ends and when it ends. Standing > Princes of the Abyss shows "Bonded - N turns left" beside the bonded prince. Players' views carry only their own bonds; orders codes carry the Forge Bond target (seat-swapped back by the GM).
- Known limits: two bonded hordes alone on a free plane do not claim it (claim needs a single prince).

## v45 – Blood Pact (renamed from Forge Bond)
- Command renamed BLOOD PACT (internal code stays FORGE). All text now says Blood Pact / pact.
- Income: each prince earns one third of the price paid, every turn (pactInc = round(pay/3)); stored per bond as inc. Renewing while active adds 5 turns and resets inc to the new price / 3.
- Partners cannot dominate each other's planes: a DOMINATE/DELVE order aimed at a partner's plane becomes HOLD (report says so). Hordes also never fight and the planes are not hostile to each other.
- Standing > Princes of the Abyss tag reads "Blood Pact · N turns left · +X souls/turn".

## v46 – One Blood Pact at a time
- A prince may hold only one active Blood Pact. An order is refused with no souls charged when the sender, or the named prince, is already bound to someone else (pactBusy in p3). Renewing with the current partner is still allowed, and a new partner is possible once the pact has lapsed.
- Only one BLOOD PACT order per prince per turn is honoured. The AI will not answer an offer if either side is busy. The Orders screen warns about the sender's own busy state.

## v47 – BREAK PACT
- New princely command BREAK PACT (code BREAK, BREAKC=2,500 souls). Needs an active Blood Pact; otherwise it fails and costs nothing.
- The bond ends immediately (until=T-1), before movement and combat. Income stops that turn for both princes. Former partners' hordes on the same plane fight; any LOITER horde there is switched to HOLD so it cannot slip away. Dominating each other's planes is allowed again.
- The partner is told they were BETRAYED. No Blood Pact order involving either prince is honoured on the turn of a break.
- AI princes bound for at least a turn backstab with probability 0.05 x aggression per turn (needs souls). About 5% per turn in testing.

## v48 – AI princes declare whether they are open to a Blood Pact
- Each turn start (newGame and after G.turn++) setOpen() sets P.open for every AI prince: no active pact (or one ending this turn), enough souls for the price, and a hash-based roll below max(.2, .75 - agg*.25). The roll does not use rnd(), so game outcomes are unchanged. Saved state now carries `open`, so the regression baseline md5s were regenerated; outcomes are identical.
- An open AI prince always answers the first human who offers. A closed one, or one that answered someone else, makes the order fail with no souls charged.
- Shown in Standing > Princes of the Abyss ("Open to a Blood Pact" / "Closed to a Blood Pact") and in the Orders target list ("(open)" / "(closed)"). calcPlan refuses a closed target. Player view carries `ai` so human rivals are not shown as closed.

## v49 – "Garrison" renamed "Minor Horde"
- All player-visible text now says Minor Horde (Standing/Realm lists, reports, combat notes). Internal names such as garrisoned() are unchanged.

## v50 – DELVE becomes MOVE
- Players see MOVE; the internal order code stays DELVE so saved games and codes still work (CMDN maps the label).
- MOVE travels at double speed (mvHops = 2 x hopsFor).
- The target cannot be a plane held by a Minor Horde or another prince. Known barred planes are disabled in the target list and give an Orders error; if the order still reaches the engine, the horde holds and the report says why. The horde still stops short of any such plane on the way. Own planes are allowed.

## v51 – Chaos rank costs are cumulative
- FOMENT CHAOS souls are no longer zeroed on a rank rise (removed P.foment=0). The RK costs are running totals: 5,000 / 10,000 / 20,000 / 40,000 / 100,000 / 200,000 / 400,000 / 600,000 / 1,000,000 invested in total. Surplus carries over and a big FOMENT can rise several ranks at once.
- Chaos table and Orders text explain it. AI princes rise faster, so max rank in long sims went from 7-8 to 8-10; game length is similar (28-43 turns). Regression baseline regenerated.

## v52 – Values from the designer's spreadsheet (Chaos Rank and Demon Values)
- Chaos ranks (total cost / harvest / generals): 2: 5,000/5%/3; 3: 10,000/10%/4; 4: 20,000/15%/5; 5: 40,000/20%/6; 6: 100,000/30%/7; 7: 200,000/40%/8; 8: 325,000/50%/10; 9: 500,000/60%/12; 10: 800,000/70%/14. Tiers unchanged.
- Demons: Malflesh spd 7; Arileth off 5, spd 6; Pazu spd 5; Vrock spd 3; Balor off 16, def 8, spd 3; Shogoth off 18, def 9, spd 3; Ungol purge 12.
- Long sims (13 games): games ended turn 30-39, rank 10 reached in 6 of 13. Observation: horde speed is the average of its demons and hops = max(1, round(spd/8)), so only speed 12+ moves 2 planes a turn.

## v53 – Movement value per demon
- Every demon has `mv` (planes per turn) = speed / 4, set from DT in p2 after the table so it can be tuned per demon: Dretch 3, Oni 2.5, Galbrex 2.25, Hezrou 2, Malflesh 1.75, Arileth 1.5, Pazu 1.25, Vrock/Balor/Shogoth/Ungol 0.75.
- A horde moves at the count-weighted average of its demons mv, scaled down by the same damage penalty that slows speed, then rounded to whole planes, minimum 1. MOVE doubles the average before rounding (so Pazu 1.25 gives 1 plane, 3 with MOVE). Replaces round(speed/8).
- Orders horde card shows a Move figure. Long sims: games ended turn 28-42 (slightly shorter).

## v54 – Purge made visible
- Summon and Banish lists show a stats line under every demon (tier, off, def, speed, move) with a gold "Purge N" and a tooltip where it has one. Horde cards show Purge when the horde has it.
- Battle reports name the purging demon: "the enemy's Malflesh (purge 2) destroyed every demon of tier 2 or lower on this side: ..." and "Your Malflesh (purge 2) destroys every enemy demon of tier 2 or lower." (purgerName in p3; record fields eby/oby).
- New "Purge" entry under Standing > Rules at a glance, generated from the demon table so it stays right when values change. The movement text in Prototype assumptions now describes speed/4 averaging.

## v55 – Speed and movement fully decoupled
- Speed is used only in combat. Movement (mv, planes per turn) is its own number on each demon in the DT table, no longer computed from speed. Starting values equal speed/4 but are edited independently.
- Damage slows the two separately: speed keeps its old penalty (combat); movement is multiplied by 0.9 / 0.75 / 0.5 for minor / damaged / severely damaged and drops to the minimum 1 plane when crippled.


## v56 rules revision (2026-11-15) - supersedes the older notes on combat, demons, movement, ranks and victory points
Source spreadsheets (all in `spreadsheets/`): Combat Results Roll, Tactics Roll Bands, Combat Report Language, Chaos Rank and Demon Values. The Demon Roster is a live Sheets artifact; Chaos Rank and Demon Values.xlsx holds its current values.

### Demons
- 22 demons, tiers 1-22. Every demon is Fast (class F, odd tiers, move 3, about 1.5 strength per 100 souls) or Heavy (class H, even tiers, move 1, about 2.05 per 100 souls). One Strength value each; offense, defense and speed are gone. Pazu was dropped (Slagfiend replaces its purge 3).
- Horde movement = its slowest demon (MOVE doubles it); damage still slows a horde. A general is Fast or Heavy (chosen with UNLEASH) and can summon only demons of that class, so hordes are single-class. NPC garrisons stay mixed.
- Rank gating: highest tier = 2 x rank, except rank 9 = 19 and rank 10 = 22. Generals are one shared pool (2,3,4,5,6,7,8,10,12,14) across Fast and Heavy.
- Purge (nerfed 2026-11-15): at the end of every round each side's best purge rating destroys 10% (minimum 1) of each kind of enemy demon of that tier or lower; both fire together, win or lose, count as casualties and toward the 60% break. Reports say the heavy demons unleash eldritch spells that destroy many of the named demons.

### Combat (up to 6 rounds)
- Each round: tactics roll 3d6 v 3d6 (gap bands: Tie 0-1, Better Plan 2-4, Loser Outclassed 5-7, Disastrous Decision 8-10, Catastrophic Imbalance 11-15) nudges each side's strength; defender x1.2 (none in a meeting engagement); the stronger side adds a strength-band bonus (Even 0, Minor 1, Advantaged 2, Strong 3, Overwhelming 6) to a 3d6 roll; the margin picks Stalemate / Gaining minor advantage / Clear advantage gained / Enemy in Disarray / Rout, each with winner/loser loss percentages and a momentum bonus (stacks for the same winner, replaced on a reversal, carried through a stalemate).
- Victor's loss is capped (attacker 2x, or 3x at 3:1 or better; defender 1.5x; meeting engagement 1.5x the loser's gross loss).
- A side is broken at 60% strength lost, Rout (that round) or Disarray (end of the next round). Round 6 ends the fight.
- Attacker (moved in) v defender (started the turn there): defender broken and attacker not -> defender leaves, attacker holds. Anything else (attacker broken, both broken, round limit) -> attacker repulsed, defender stays, even if the attacker was stronger. Meeting engagement (both moved in): only a broken horde retreats; both broken or round limit -> both retreat; plane ownership unchanged.
- Retreat is automatic: back the way it came (attackers only, if no fight there), else the adjacent friendly plane with the highest domination then value then random, else an adjacent plane with no fight, else the horde is destroyed (the general returns home). A broken Minor Horde is wiped out. Planar defenses fight as a defending force of strength (domination off + def) + the owner's Shadow Horde (half, all at home); beating them cuts domination by 2.
- Nothing numeric is shown to players: no dice, ratios, bonuses or multipliers.

### Report
- Each fight is one headline line with an outcome pill (Held, Took the plane, Repulsed, Driven out, Held the field, Lost the field, Mutual retreat) that opens a round-by-round record. Wording comes from 055-report-language.js (generated from Combat Report Language.xlsx; seven variants per case, picked deterministically per seat). A few headline lines for planar defenses are written in code because the sheet assumes an enemy horde.

### Victory points
- Carnage = soul cost of every demon you destroy (including the survivors of a horde that is destroyed or a Minor Horde that is wiped out, credited to the side that beat it). "Demons lost" = 75% of the soul cost of your own losses. Horde strength counts the soul cost of the demons you have. The old tier-based kill/loss points are gone.

### Still open
Purge redesign, a general-based speed attribute, whether rank 10 generals should also be capped by class, and balance of Fast v Heavy by simulation with real players.

### Removed from the earlier notes
Secret underdog bias, speed/freshness/home-defense combat bonuses, the Numeric Result table and the single 2d6 roll.


## v58-v59 changes
- v58: every starting horde is commanded by a Heavy general and holds 25 Mawlings (same 1,500 souls as the old 30 Dretches).
- Battle report wording: the Losses tab has an Adverb column (D); `{yourlossadv}` / `{enemylossadv}` are used after "lost", `{yourloss}` / `{enemyloss}` are adjectives. Headlines use complete phrases ("heavy losses on your side and severe on theirs"). `CRL.LossAdv` holds the adverbs; `lossPair` in 056 picks adjective and adverb with one draw. "Regents's" is fixed to "Regents'". Rout lines end "the fleeing demons".
- v59: the DOMINATE target list now includes the plane a horde is standing on when an enemy prince holds it, so a horde that beat the defenders can keep fighting the planar defenses (each win cuts domination by 2; at 0 the plane changes hands).
- UNLEASH defaults to a Heavy general (UI order, multiplayer parse, applyOrders, unleash spawn).

- v60: horde cards show each demon type's change from last turn (h.pd snapshot taken at the start of resolveTurn; dLine in 07).
- v61: horde healing raised from 0.20 to 0.30 damage per quiet turn.
- New hordes (UNLEASH) and wiped generals now appear at `rally(owner)`: the home plane while it is still theirs, otherwise their strongest plane with no enemy on it (home only if they hold nothing).
- No home plane: a prince who does not hold their home plane cannot UNLEASH, and a general destroyed in that state is gone for good (h.gone) and lowers the prince's general limit by one (P.genLost, capOf). With a home: generals return/appear at home, or if enemy forces hold it, at the owned plane with the highest domination, then highest value.
- v62: general placement: home if held and free of enemy hordes, else the owned plane of highest domination (then value) that no enemy horde occupies; if none, an UNLEASH is refunded and a wiped general is gone for good (lowers the limit).
- LOITER removed from the order list (saved LOITER orders convert to HOLD). New DISBAND order: dissolves a horde and its general (10% of the demons' cost back), frees the general slot without lowering the limit, and can be followed by an UNLEASH the same turn. BANISH is unchanged (destroys chosen demons).
- Once the game is over, each rival in the Report tab's princes card has a Points button that expands that prince's full victory-point breakdown (vpTable in 06, act "pvp").
- v64 (v63 skipped at the owner's request): LOITER removed, DISBAND added, end-of-game rival victory-point breakdowns.
- HARVEST is no longer a Princely command. Every soul left in the Well after horde and princely spending is harvested automatically (consumed; 4 return per 3 next turn), for humans and AI princes. The default with no Princely orders is 25% of the Well to FOMENT. Old saved HARVEST orders are cleared by migrate().
- v65: automatic harvest of unspent souls (HARVEST command removed).
- v66: idle fade removed; UNLEASH shown as UNLEASH GENERAL with Assault Commander (Heavy) and Maneuver Commander (Fast) labels.
- Generals have Age (turns since unleashed or last resurrected), Experience (combats fought, win or lose) and Resurrection Count (h.born, h.exp, h.res). Age and Experience reset when the horde is annihilated and the general returns; Resurrection Count goes up by one. Shown on the horde card.
- General abilities: one random ability at Age 10 (h.abA) and another at Experience 10 (h.abE), drawn from ABIL (Tactician +1 tactics roll, Siegebreaker domination -3 on planar wins, Iron Will -10% casualties, Warlock +1 purge rating, Pathfinder +1 move, Mender heals 50%, Battle-hardened +5% strength). Lost if the horde is annihilated. Shown under Details on the horde card; the player is told in the turn report when one is earned.
- Abilities added/renamed: Abjurer (enemy purge rating -2), Slippery (retreats at the end of a round when outnumbered 3:1; new How It Ended cases "You slipped away"/"Enemy slipped away"), Battle-hardened is now Battlemaster, Mender is now Necromancer.
- Added the Quartermaster ability (QUAR): summons into its horde cost 5% fewer souls (sumH).

- Prince naming: solo/new games show a "Name your demon prince" box (blank/keep = default). Game Master setup already names human seats. Game keeps the same map and AI names after renaming (G.seed0).

- Version scheme: GAME_VERSION is now a string "major.middle.minor" (1.00.70). Minor +1 for every change, middle for bigger changes, major for massive ones.

- Version scheme revised: GAME_VERSION is "major.minor" (1.70). Minor +1 for every change; major only for massive changes.

- v1.71: UNLEASH GENERAL has a name box (letters and spaces only, max 24, blank = random; duplicates fall back to random). Prince names (solo box and Game Master seat names) also filtered to letters and spaces (cleanName in 02).

- v1.72: opening briefing now reads "You are <prince>, lord of <home plane>." (replaces "the Well of Souls at").

- v1.73: opening briefing names the home plane by its name plus id ("lord of Haunted Waste of Loss at B01"). Plane names come from ADJ+NOUN+of+DESC in 02.

- v1.74: default prince name table (DPN) now 38 names (added 6 new from the user list; the other 26 were already there).

- v1.75: DPN prince name table now exactly the user list (32 names).

- v1.76: plane names shortened: 50% "Adjective Noun" (Frozen Riverlands), 50% one fused word (Gloomvale, Plaguefen) from PFX+SFX lists. Games already in progress keep their old names.

- v1.77: opening briefing has a four-paragraph intro (report.intro, rendered under the headline in 06).

- v1.78: Orders/Realm/Standing tabs pulse (ember background, G.seenTabs) until first clicked; games past turn 1 start with them seen; reduced-motion gets a steady tint.

- v1.79: Princely commands intro text reworded (harvest 3 to 4, SCRY hop costs spelled out).

- v1.80: removed the default FOMENT (25% of Well). With no Princely commands, 100% of unspent souls are auto-harvested. Removed the "Use defaults" button, default warning and report line.

- v1.81: report note "No Princely commands were given. All unspent souls were harvested." on turns with no Princely orders (human seats only).

- v1.82: (1) battle end text: when both sides break in the same round for different reasons, it now says what happened to each ("Both sides broke in the same round. ..."); (2) battle headline appends the enemy general name and abilities ("The enemy general was X (A, B)."); (3) games and turn codes from 1.81 or earlier are no longer supported (G.ver stamp, MIN_VER in 02; old solo save is replaced with a notice in the name box); (4) GM final view carries per-seat VP (fv) so the rival VP drill-down works in multiplayer. Verified in simulation: GM/player orders-code round trip keeps a named general.

- v1.83: default solo prince name is now Thraxxamazog.

- v1.84: opening briefing intro rewritten (five paragraphs, mentions blinking tabs and Chaos Power).

- v1.85: Shadow Horde can only SUMMON Fast demons (cleanN with cls F in 04 and 07; UI list filtered; note added).

- v1.86: Shadow Horde defense share on non-home planes cut from 50% to 33% (pdStats in 03; texts in 07). Home plane still gets all of it. Shadow casualty scaling when a planar defense is beaten (f*.5) unchanged.

- v1.87: every Fast demon strength (st) x1.17, rounded to 2 decimals (avg Fast/Heavy strength per soul now 0.868, about 7/8). Costs and moves unchanged. The Demon Types artifact and other design sheets are not updated.

- Spreadsheets refreshed for v1.87 Fast strengths: spreadsheets/Chaos Rank and Demon Values.xlsx (Demon Values) and the published Demon Roster sheet (Roster column H). The published Chaos Rank and Demon Values and Demon Types sheets still show an older Off/Def design and were not changed.

## v1.88 – cruft cleanup
- Removed dead code: CT, LOSE, WIN, DESC, AIN, sgn, shadowOf, knownIds, purgerName, whoText, lossWord, migrate().
- Removed LOITER (slip logic, report line, help text, order conversion) and the HARVEST command branch (auto-harvest echo stays), the dead "defaults" handler, unused CSS .bt-step.
- DELVE renamed MOVE internally (CMDN removed). Orders codes and saves from 1.82–1.87 that say DELVE are converted on load.
- usedDefault renamed noOrders.
- Dropped never-read fields: G.log, G.pend, G.usedNpc, killT, lastInc/lastRet, sf, scry flag, hit:false.
- Text: removed "This is a prototype." from rules; orders-code help no longer mentions a default Princely plan.
- Kept bg-*, s-* and r-* CSS classes: they are built dynamically.

## v1.89 – result codes
- New "result code": a gzip+base64 block (-----BEGIN KOD RESULT CODE-----) with game no., version, seed, map size, mode, final/current standings, each prince's points breakdown, and the human prince's orders plus every prince's points for each turn (G.hist, recorded in resolveTurn).
- Buttons: game-over screen ("Result code") and Standing tab (Make my result code / Read a result code). The reader decodes any pasted code into tables.
- unpack() accepts RESULT headers. Orders codes and turn codes are unchanged.

## v1.90 – harvest scores nothing
- Auto-harvest no longer adds to P.consumed, so unspent souls give no victory points (an idle prince had scored over a billion). Report line now says "Unspent souls harvested: N souls."

## v1.91 – elimination
- After each turn's harvest (step 7b in resolveTurn) a prince is eliminated if he owns no planes AND his horde strength (all hordes plus Shadow Horde, at soul cost, same measure as the Horde strength score) is under 10% of the weakest other live prince's. All candidates are judged against the same snapshot.
- Eliminated: P.elim=turn, hordes/shadow/well/pending summons/pacts removed. Orders are ignored (AI skipped, UI shows a notice, GM no longer waits for the seat). Scoring continues; the game still runs to its normal end.
- Every human gets a 20px event (e.big): one text for the eliminated prince, another for the rest. "Perhaps you can summon him into one of your hordes" is flavour only; no such mechanic exists.

## v1.92 – harvest cap, "Income" label
- HARV_CAP=250000 (02). At harvest time, if the unspent Well is at or above the cap the harvest is skipped: souls stay in the Well, no 4/3 return, only income adds to it. Report line explains it; the Orders summary reads "Left (kept, no harvest)".
- "Harvest" meaning plane income is now "Income" (header, report tile and headline, Chaos table, Shadow Horde text, help text). "Harvest" now only means the automatic return of unspent souls.

## v1.93 – tooltips
- Mouse-over text on the Well and Income displays (header and report tiles): TIP_WELL / TIP_INC in 02.

## v1.94 – "Income" renamed "Total Yield"
- Header, report tile, headline, tooltip, help and Shadow Horde text. The Chaos table column (a % bonus) is now "Yield bonus". Pact income text unchanged.

## v1.95
- Total Yield tooltip explains Value (v) and Domination (d) and points to the plane detail. Realm grid and legend use lower-case d for domination.

## v1.96
- Total Yield tooltip text replaced with the Value/Domination explanation only.

## v1.97
- Total Yield tooltip: original explanation restored, followed by the Value/Domination text (starts "A plane's Yield is determined…").

## v1.98 – carnage vs Minor Powers doubled
- runFight: kills of a Minor Horde or an NPC planar defense count x2 toward Carnage; scattering a Minor Horde and beating an NPC plane's planar defense (plane-value bonus) also x2. Same-seed AI games: average Carnage +7.7%, total points +2.2%.

## v1.99
- Elimination ignores the Shadow Horde (it cannot attack). Score 'Horde strength' still includes it.

## v1.100 – fight order
- Before fights each turn, every plane's attacking strength is computed. Planes then resolve in this order: each prince's home plane first, then ascending attacking strength, ties by plane id. Shadow Horde defense still = a third of whatever survives when that plane's fight starts (all of it at home).
- Version compare fixed: verOK now compares major and minor as integers (parseFloat would have read 1.100 as 1.1 and rejected every save). Minor numbers above 99 are fine.

## v1.101
- Orders summary label: Left (to be harvested) / Left (will not be harvested) depending on whether the leftover Well is under or at/above the 250,000 limit.

## v1.102
- Orders summary label reads 'Left after commands (to be harvested / will not be harvested)'.

## v1.103
- Shadow Horde no longer reveals hordes (removed the 1,000/20,000-soul sighting tiers in updateKnow). Sighting beyond the free 1-hop SCRY now needs the SCRY command. Card text: 'More demons raise your total yield.'

## v1.104
- Shadow Horde card text replaced; shows live 'Each plane now gains strength X and yield is raised Y%' (yield to one decimal).

## v1.105
- Shadow Horde SUMMON shows 'Only Fast demons can join the Shadow Horde.' above the demon list.

## v1.106
- Orders tab: expandable 'Show the demon table' card between the horde cards and Princely commands (tier, name, type, cost, strength, strength per 1,000 souls, purge; rows above your highest summonable tier are greyed). Open state kept in UI.open.dtab.

## v1.107
- Demon tables split into two side-by-side cards (Heavy with purge column, Fast) under one 'Show the demon tables' toggle.

## v1.108
- Demon tables: 'Per 1,000 souls' column replaced by 'Purged by Heavy Tier' (lowest Heavy tier whose purge rating reaches the demon, with + for that tier and above; computed from the table). Compact table CSS (.dtt).

## v1.109
- 'Purged by Heavy Tier' shows the Heavy demon's name with + (e.g. Hezrou+) instead of the tier number.

v1.111: Chaos rank names: 1 Chaos Soldier, 2 Chaos Captain, 3 Chaos Commander, 4 Chaos Fiend, 5 Elder Chaos Fiend, 6 Chaos Lord. Countdown text now names rank 7 correctly (Count of Chaos).

v1.112: Horde damage removed (no damage field, no Nominal/Damaged status, no healing, no movement penalty, no 'hold it back to heal' warning). Necromancer (MEND) now: after each fight raises back demons worth 5% of the strength its horde lost, lowest tier lost first; if that buys nothing, raises one demon of the lowest tier lost (free; only if the horde survived with demons). Reported as a note on the battle record.

v1.113: Abjurer now reduces the enemy's highest purge rating by 1 (was 2).

v1.114: New general ability Lashmaster (LASH): +1 plane of movement, added after the MOVE doubling (so MOVE does not double it). Eleven abilities now.

v1.115: Pathfinder removed (old saves lose it). New abilities: Dominator (conquered planes start at domination 2), Soulfinder (+100 x rank^2.5 souls to the Well on each conquest by its horde), Antipaladin (+7% carnage credit for its force). Necromancer rework pending.

v1.116: Necromancer reworked: after each fight (horde must have survivors) 5% of the strength the enemy lost is raised into its horde as the lowest-tier demon of the horde's own class (Dretch for Fast, Mawling for Heavy), probabilistic rounding; free; each Necromancer horde gets its own 5%.

v1.117: Abilities now merge across a force (same owner, same plane): duplicates never stack. Battlemaster +5% applies to every horde in the force once; Necromancer pool is 5% of enemy strength lost, split among the force's surviving hordes by strength (each gets its own class's lowest-tier demon); Soulfinder pays once per conquest. Iron Will and the other combat abilities already worked this way.

v1.118: Realm grid: enemy prince hordes seen on a plane show their horde number in a circle of that prince's colour (up to 2 circles, then +N); Minor Hordes and old snapshots keep the red !. visH now returns n (horde numbers).

v1.119: Realm grid hord circles capped at two, then +N.

v1.120: Enemy horde circles are smaller (r7) and sit on a row above the H tags when you have hordes on the same plane, so nothing overlaps; +N sits left of the two circles.

v1.121: Plane detail card lists every enemy prince horde on its own line ('Malgrath Horde 2 ~strength', with its demon mix when you have a horde there or hold the plane). Minor Hordes stay one combined line. visH now carries per-horde strengths (l).

v1.122: Eight new general abilities. Combat: Berserk (+10% strength rounds 4+), Trench Master (defender bonus 1.35 under HOLD), Reaper (10% of enemy soul cost killed -> Well), Mindbreaker (enemy -15% strength in round 1); Berserk/Mindbreaker change the strength the round is judged on (bands, caps), not casualty percentages; abilities merge per force. Information (all carried in visH/known snapshots, so they work in multiplayer): Unseen (strength hidden unless on an enemy prince's plane, SCRY too), Seer (demon mix of hordes on adjacent planes; Seer vs Unseen cancel, strength only), Farsighted (strength within 2 planes, overrides Unseen within 1, presence only at 2), Judge (enemy general abilities on same/adjacent plane, shown on the detail card and as a one-time event). Plane detail card shows unknown strength, demon mix and general abilities per horde; hordes seen by Farsighted also show on unexplored planes. Battle records are unchanged.

v1.123: Defender bonus (an attacker moved in) is now 15% (was 20%). A force with a horde under the HOLD order gets 25%. Trench Master: 25% without HOLD, 40% with HOLD. Planar defenses get the base 15%. HOLD order text and Trench Master text updated. defBonus(B) in 03.

v1.124: Trench Master text: '...and 40% if the general's horde is under the HOLD order.'

v1.125: Orders tab: 'Show general abilities' button under the demon tables (all abilities and effects from ABIL).

v1.126: New horde order FORCED MARCH (cmd type MARCH): behaves like DOMINATE (fights whoever holds the plane, stops at hostile planes) with +2 planes of movement; the share of a force that marched this turn fights at -25% strength in rounds 1-3 of every fight (judged strength: bands/caps, like Berserk). Added to the order list, target picker, realm plane-card buttons, reports (cmdName shows FORCED MARCH). Also fixed the report line 'Seized X (domination N)' to show the real domination (Dominator). AI never orders it.

v1.127: New horde order RAID (cmd RAID, one turn only). Target must be a plane held by another prince (not Minor Power, free, own or bonded). The horde moves like DOMINATE, fights any horde on the plane, but skips the planar defenses. If it survives and is on the target after fights it raids in resolveRaids() (before summons arrive): D = planar defense + Shadow share, R = strength/D, f = R^2/(1+R^2); siphon = 40% of f x the plane's remaining yield (so the 60% cut is applied), raider keeps half of that (20% of the full amount) into its Well at once, the holder's income is reduced by the siphon this turn (P.raidLost) and the holder gets an event. Raiders at one plane resolve individually, smallest first, each from what is left. Raider casualties c = 2% + 10% x D/(D+S). Afterwards the horde withdraws (back to where it came from if safe, else a friendly/empty plane; if none it stays). Order list, target picker (illegal targets disabled), warnings, plane-card buttons, reports updated. AI never raids.

## v1.128
- MOVE and DOMINATE merged: the old MOVE order is gone; DOMINATE is shown as "MOVE and DOMINATE". All movement orders stop and fight at the first hostile plane.
- Movement: budget = move + Lashmaster (+1) (+2 FORCED MARCH), no doubling. Entering a friendly plane (own or Blood Pact partner) costs 0.5, any other plane 1. Routes use the cheapest path (route/costMap/turnsFor/stepCost/mvBudget).
- AI scores targets by move cost. Saved games/codes from before 1.128 are rejected (MIN_VER 1.128); DELVE/Pathfinder shims removed.

## v1.129
- BANISH removed from horde and Shadow Horde commands (DISBAND covers it). MIN_VER 1.129.

## v2.0
- Major version bumped to 2 (minor resets to 0). MIN_VER 2.0. No gameplay changes.

## v2.1
- Fair start: each home plane now has two v3 planes and one v4 plane adjacent (a plane has only 3 neighbors). Set in newGame before Minor Powers are placed.

## v2.2
- Demon tables stack vertically when the screen is narrow (auto-fit grid, 440px minimum column) and use tighter cells on phones.

## v2.3 (Test artifact + PC only; shareable link stays at v2.2)
- Save diagnostics for the "game restarted on iPhone/iPad" reports: a boot log in localStorage (kodBoot), a "not saving" warning in the header when storage is blocked or a save fails, and a note on the name prompt when no saved game was found although the browser has opened the game before.

## v2.4 (Test artifact + PC only)
- MOVE and DOMINATE / FORCED MARCH target info now ends with the odds of winning every fight (high 67%+, medium 34-67%, low under 34%), worked out by simulating the real fight engine against the defenses the prince knows about: seen hordes, the planar defense for the known domination level, and an allowance for an unseen Shadow Horde (oddsFor in 03). It uses a private seed so the game dice are untouched. Not shown for RAID or when a defender is hidden.

## v2.5
- Odds wording: "We tortured an oracle and determined that your omens of victory are unfavorable / uncertain / favorable. Remember, fortune can favor the reckless (unfavorable) / bad luck can ruin the best odds (otherwise)." Same 34%/67% thresholds.

## v2.6 (Test artifact + PC only)
- Rank-up notices: whenever any prince rises in Chaos rank, every other human prince gets one of 20 flavour lines (RISE/riseText in 02) at the very top of Battles and events (pri -1). The line is picked from prince and rank, so it is stable. Your own rank-up keeps its old line.

## v2.7 (Test artifact + PC only)
- Rank-up nudge in Needs Your Attention: after four turns with no rank-up (P.rise = turn of the last rank-up, set in FOMENT resolution), then every other turn, one of 4 NUDGE texts urges FOMENT CHAOS. Skipped at rank 10 and when the Foment progress notice (70%+) is already showing. Saves older than 2.7 have no P.rise and never see it.

## v2.8 (Test artifact + PC only)
- Removed the stale "hordes heal 30%" from the Rules at a glance text (healing went away with damage tracking).

## v2.9
- Abyss map: portal link lines no longer drawn inside plane squares; they now appear only as short bright red connectors (#ff2d2d) across the gaps between squares. Wrap-around stubs also start at the square edge.

## v2.10
- Abyss map: edge wrap-around connectors shortened by 33%.

## v2.11
- Realm grid key reworded: "d = domination/defense", American spelling "color", and a new sentence explaining that solid and dotted lines are connections hordes can move through.

## v2.12
- Realm grid key: the line explanation now sits on its own line and reads "Solid and dotted red lines indicate a connection between planes that hordes can move through."

## v2.13
- Realm map: Minor Horde marker is now a light grey circle with a dark "!" (was red), matching the Minor Power color family.

## v2.14
- Prince 8 color darkened from brick red #c0504a to dark crimson #a8342e so it sits further from prince 5 (rose).

## v2.15
- Palette locked at 12 prince colors: orange, teal, violet, green, rose, gold, bone, dark crimson (#a8342e), navy blue (#2d55b0), forest green (#2e8b4f), lime (#b9d84a), bronze brown (#9a6a4a). Minor Powers stay light grey.
- You are always color 1 (orange). Colors 2-12 are dealt to the rival princes at random for each game (seeded, so a game keeps its colors for life; `G.pal`, `mkPal`, `applyPal`). Multiplayer views carry the palette so a prince keeps the same color for every viewer except where the viewer and seat 1 swap places.
- Older saves without a palette keep the original color order.

## v2.16
- Save code: Standing tab > "Make my save code" produces a text block holding the whole game; "Restore a saved game" pastes one back in and replaces the game in this browser (checks it is a save, a playable version, and the same mode). Backup against browsers that lose stored data.
- Header now shows "saved h:mm" (the time the game was last saved in this browser), so a fresh start vs. a loaded save is obvious.
- Code reader accepts "SAVE" code blocks.

## v2.17
- Header: added a space before "saved" so it no longer runs into the version number.

## v2.18
- Fast vs Heavy: in rounds 1-3 of a fight, a force made only of Fast demons adds +3 (FASTT) to its tactics roll against a force made only of Heavy demons. Planar defenses hold no demons and never count as Heavy. Applies to every fight that uses fightRounds (meetings, attacks, raids that meet hordes) and to the odds estimate. Rules text ("Prototype assumptions") updated.
- Simulation (equal strength, Fast-only vs Heavy-only, whole fight): Fast wins about 54% with the bonus vs 51% without.

## v2.19
- Purge starts sooner and runs one step higher through most of the ladder: Brazenhorn 1, Hezrou 2, Malflesh 3, Slagmaw 4, Hate Fiend 6, Soulhammer 8, Balor 10, Shogoth 12, Ungol 14 (was Hezrou 1, Malflesh 2, Slagfiend 3, Hate Fiend 5, Soulhammer 7, Balor 9, Shogoth 11, Ungol 13).
- Slagfiend renamed Slagmaw. Rules text and the "Purged by Heavy Tier" columns follow the table automatically.

## v2.20
- Shadow Horde strength is now public. The Defense column on Known Planes (and the plane detail) for a prince's plane = domination strength + the owner's Shadow Horde strength (all of it at their home plane, a third elsewhere), read live.
- The odds estimate uses that real defense number (jitter narrowed from 0.9-1.4x to 0.9-1.2x because the shadow part is no longer unseen). Example in test: an attack that was ~100% against a bare plane drops to ~13% when a 4,500-strength Shadow Horde defends it.
- A paid SCRY (2,500+ souls) also reads the makeup (demon kinds and counts) of the Shadow Horde of every prince who holds a plane within its reach. The latest reading is kept per prince (`players[0].sh`) and shown in the plane detail with the turn it was read. The free SCRY shows only strength.
- Multiplayer: each player's copy carries every prince's public Shadow strength (`shs`) and remaps their scried makeups to their own seat numbering.
- Rules text: SCRY description, Shadow Horde card and "Prototype assumptions" updated.

## v2.21
- Purge now reaches the Shadow Horde. When a horde fights a prince's planar defenses, its purge destroys 10% of each Shadow Horde kind within reach (min 1 of each kind present), scaled by the share defending that plane (all at the home plane, a third elsewhere). The defense strength drops by the matching share. A plane's own defense still never purges.
- Shadow Horde SUMMON renamed SHADOW SUMMON (internal type SSUMMON; older orders using SUMMON are converted on load). Function unchanged.
- Result codes / Turn by turn now list the command, e.g. "SHADOW SUMMON 3,000" (souls spent).

## v2.22
- NPC personalities (first 20 turns only, PEACE_T=20). Each game-run prince gets one at the start: 67% none (normal), 16.5% Peaceful, 16.5% Grudge. Human seats never have one.
- Peaceful: attacks no prince who has not attacked it. Grudge: same peace, but a prince who attacks it is hunted: lower attack threshold (1.0 instead of 1.6), 3x target priority, and its hordes are ready at half the usual strength.
- Other NPC princes never attack a Peaceful or Grudge prince through turn 20. Players are not restricted.
- An attack is a DOMINATE, MARCH or RAID order that ends on a plane another prince owns (G.hit[victim][attacker]=turn). Minor/unowned planes and Blood Pact partners' planes do not count. Every personality, including a Grudge hunt, ends after turn 20.
- Hidden until revealed: a prince's personality shows (princes list, plus a turn event) when one of its planes is in your SCRY reach, which includes planes next to yours. The multiplayer views strip unrevealed personalities. Rules text: "Princely personalities".
- Sims (80 games each, seat 1 forced): NPCs attacked a Peaceful/Grudge prince by T20 in 0 of 80 games; an unprovoked Peaceful/Grudge prince attacked no one by T20 (normal: 6/80). Provoked at T6, Grudge attacked the provoker in 46/80 by T20 (Peaceful 15/80, normal 13/80). Protected princes win more often when left alone (38% vs 23%).

## v2.23
- AI strategy profiles (STRAT) and four Danger levels (DANGER): Low (<25% win), Moderate (25-50), High (51-74), Extreme (75+). Each level has a pool of strategies from the sims: Low = aggressive-pathetic, balanced-pathetic, aggressive-mediocre; Moderate = passive-pathetic, passive-mediocre, balanced-mediocre; High = passive-strong, Hedger; Extreme = balanced-strong, aggressive-strong. A profile sets attack readiness (agg), whether the prince Foments, and how much of its Well it saves for harvest (up to 80%, spending down to 249k once the Well reaches 250k).
- New-game name screen now has a "Your rivals" picker: Random or a Danger level for each rival prince. The strategy itself stays hidden; the Danger level shows beside each rival on the princes list. Random = uniform over the four levels. Princes get a profile when a game is created (older saves keep the old planner).
- Check (120 all-AI games, each level on every seat equally): wins Low 2-8%, Moderate 3-5%, High 36-40%, Extreme 53%. High and Extreme separate clearly; Low and Moderate do not separate within a mixed field.

## v2.24
- Danger levels reduced to three and renamed: "Strong Verbal Harassment and a Slap" (old Low + Moderate, under 50% win, six strategies), "A Kick in the Teeth and a Knee to the Groin" (old High, 51-74%, default), "Literal Armageddon" (old Extreme, 75%+). The Random option is gone; every rival starts on the default level, so new games and multiplayer AI seats are all "Kick in the Teeth" unless changed on the name screen.
- P.danger is now a key (L/H/X). v2.23 saves that stored 0-3 are mapped by dangerOf().
- Check (120 all-AI games with one Slap, two Kicks and one Armageddon per game): win rate per seat Slap 4%, Kick 25%, Armageddon 45%.

## v2.25
- The princes list shows a short Danger label (Slap, Kick, Armageddon). The full names stay on the name screen picker and in the rules text.

## v2.26
- Game text says "End multiplayer game and return to setup", "Click again to delete this multiplayer game". The multiplayer flag in saves and turn codes is now G.mpg (old saves and codes are converted on load by oldKey in 08-multiplayer.js). Notes and code comments say multiplayer game (MPG).

## v2.27
- Purge destroys 20% (was 10%) of each affected kind per round of combat, still at least 1 per kind. This includes a prince's Shadow Horde in planar-defense fights (full 20% at the home plane, a third of that elsewhere). Rules text and demon tooltips updated.
- Why: nerf, not eliminate, the Jim strategy (no Foment, 30% of summons to the Shadow Horde). Sims (80 games, Jim 30% Shadow vs 3 Slap-level rivals): wins 74% to 56%; vs Kick-level rivals 34% to 26%; Patient 4% still beats Jim either way. Purged demons per all-AI game rose 939 to 1,585; danger-level win rates and game length barely moved.

## v2.28
- New-game screen: "Your rivals" is now a full heading like "Name your demon prince". Each rival has its own full-width dropdown, and each choice starts "Danger Level: ". The win-percentage text is gone from the picker and the rules (the ranges stay in the notes and code until they are checked against human play).

## v2.29
- Rivals picker text: "Choose how dangerous each rival prince will be. The details of its strategy remain a secret." plus a NOTE that a small minority of princes may also be Peaceful or Grudge (separate from danger level), revealed when you can see one of their planes, by adjacency or SCRY.

## v2.30
- Fix: the Shadow Horde SHADOW SUMMON order showed "Returns 250 souls." instead of "Cost 2,500 souls for 50 Dretch." The cost line only recognized the old SUMMON type, so the SSUMMON rename in v2.21 sent it to the dissolve text. The cost shown now matches a horde SUMMON (50 Dretch = 2,500 souls). Only the displayed text was wrong; the souls actually spent were always correct.

## v2.31
- UNLEASH GENERAL is greyed out in the princely command dropdown when you have no free general slot (generals held, less any being disbanded, plus other UNLEASH orders, against your Chaos rank limit), labelled "(no free general slot)", or "(needs a home plane)" if you have lost your home. If the order is already chosen when the slots fill up, the order error now reads: YOU CANNOT UNLEASH ANOTHER GENERAL UNTIL YOU ACHIEVE A HIGHER CHAOS POWER RANK WITH THE FOMENT CHAOS COMMAND, with your count and a note that disbanding a general frees a slot.

## v2.32
- The princes list now reads "Danger Level: Kick" (was "Danger: Kick").

## v2.33
- The princes list shows "Personality:" for every game-run prince: "Undiscovered" until one of its planes is in your SCRY reach (adjacent, or SCRY), then Peaceful, Grudge or None. Princes with no personality are now marked as seen too, so a plain prince no longer stays "Undiscovered" forever. The reveal event still appears only for Peaceful and Grudge. After turn 20 a revealed personality reads "(ended at turn 20)".

## v2.34
- A revealed prince with no personality now reads "Personality: Flexible" (was "None").

## v2.35
- Reports: a plane taken by force is now one event. The "X is broken. C01 lies open." line is dropped and "You now hold C01 (name), domination N. Taken from Y." is appended to the "Took the plane" battle line for that plane, so the fight, the defeat and the new holding read as one item. A fight against a different prince at the same plane (for example a meeting engagement just before) stays its own event. A plane taken with no fight keeps its own line. The report headline is unchanged. Done in mergeTakes() (05); events are tagged kind:"take"/"broke". Reports already saved keep their old form.

## v2.36
- Fix to v2.35: a merged capture line used the "You now hold" line's priority (3), which floated it above an earlier fight at the same plane and reversed the story. It now keeps the battle's priority (5), so fights at one plane read in the order they happened. A plane taken from another prince still ranks higher (priority 2).

## v2.37
- Turn order: the first stage is now two stages. Summon stage (SUMMON, SHADOW SUMMON, DISBAND for every prince), then Prince stage (Foment, Unleash General, Scry, Blood Pact, Break Pact). Summoned demons join their horde (or the Shadow Horde) immediately and fight the same turn, and an unleashed general appears immediately (it takes orders from next turn). Nothing another prince does with his hordes can interrupt a summon or princely command; only a Blood Pact can be denied, by a betrayal. The old "arrive after the fights" stage is gone, so there is no case where a destroyed horde loses its summons or a lost home plane refunds an Unleash. Summons still use the rank held at the start of the turn (a Foment rank-up unlocks new tiers next turn, though it raises the general limit at once for later Unleash commands in the list).
- New Gameplay tab after Standing: the order of a turn in full. "How a turn works" under Standing now points to it.
- Command help text updated (Summon, Unleash). 60 AI games: no errors, win rates by danger level unchanged within noise (2 / 30 / 38 percent for Low / Moderate / High-Extreme mix in that run).

## v2.38
- A rank gained by Foment no longer raises the general limit for an Unleash General ordered in the same turn. The limit now uses the rank held when the turn began (`P.rank0`), the same as summon tiers, so command order does not matter and the dropdowns need no knowledge of other princely commands. Texts (Unleash help, error message, Gameplay tab) say "A rank gained this turn only applies to your orders next turn."

## v2.39
- Gameplay tab: the Movement entry now says movement is simultaneous and that hordes which cross paths or swap places pass each other without fighting. No rule change. Measured over 60 AI games: about 9.5 such crossings per game (1.2 direct swaps, 6.6 mid-route, 1.7 passing a stationary enemy horde), in 15% of turns. A step-by-step movement rule (hordes that end a step on the same plane or swap stop and fight) was designed but not built; revisit if players complain.

## v2.40
- Meeting engagements (two forces that both arrived on a plane this turn): when the fight is a draw (neither force breaks, routs, falls into disarray or slips), both used to withdraw. Now a force keeps the field if its remaining strength is at least HOLDR (2) times the other force's and at least 2 times whatever else holds the plane: the other princes' forces there, or the planar defenses if there is no force and the plane is owned and dominated by a third prince. The other force alone withdraws. Reported as "Held the field" / "Lost the field". Broken-force results are unchanged. Measured over 60 AI games: 0.52 drawn meeting engagements per game, 0.15 of them now decided this way, so the change is rare. Win rates by danger level unchanged within noise. The Gameplay tab's Fights entry now explains the order on one plane and this rule.

## v2.41
- Gameplay tab reorganised into two sections with matching headers: "Gameplay" (the standard game loop and a card on other ways to win: saver, climber, defender, raider, diplomat) and "Turn Sequence" (the former "The order of a turn"). Text only.

## v2.42
- Gameplay tab: removed the "raider" and "diplomat" examples from "Other ways to win", since their effectiveness is untested. Saver, climber and defender remain.

## v2.43
- The player's color is now green (was orange). Palette slots 0 and 3 were swapped (CSS --c0/--c3, `PAL`), so rival colors and saved games stay consistent: whichever rival held slot 3 now shows orange. The player's horde markers on the map were hard-coded orange and are now green too. UI accents such as the ember highlight are unchanged.

## v2.44
- Prince color 7 ("bone", #e8dfc8) looked like the grey of Minor Powers (#8d7f78). It is now a much lighter ivory, #f7f2e4.

## v2.45
- Gameplay tab, "Other ways to win": removed the "For example:" lead-in and the three strategy bullets (saver, climber, defender). The two paragraphs remain.

## v2.46
- A horde cannot SUMMON while an enemy horde (another prince's not in a Blood Pact with you, or a Minor Power's garrison) is on its plane at the start of the turn. Reason: summons now join at once (v2.37), so without this a horde could be topped up in the middle of a fight. Orders screen: the SUMMON option is disabled and reads "SUMMON (not allowed: an enemy horde is on this plane)"; a SUMMON already set shows an error telling you to give another order; the engine also refuses it (no souls spent) as a failed order in the report. Shadow Summon is unaffected. AI hordes no longer plan summons in that situation (0 blocked orders in 30 AI games). Win rates by danger level unchanged within noise. Help text and Gameplay tab updated.

## v2.47
- Harvest cap lowered from 250,000 to 75,000 (`HARV_CAP`). Harvest still returns 4 per 3 unspent souls, but it shuts off while the Well holds 75,000 or more after spending, so the most free souls a saver can bank per turn falls from about 83,000 to about 25,000. Reason: in a playtest of the Hedger approach (game 179669), a prince that spent back down to just under the cap each turn earned about 83,000 free souls per turn from turn 14 on, more than plane yield until turn 30. Tested in 120-game sims: a Hedger AI against three Slap AIs won 37% before and 25% after (fair share 25%). Other options tried: 15% return with a 100,000 cap overshoots (Hedger 12%, and Armageddon falls below Slap); 25% return with a 75,000 cap gives Hedger 26%. Mixed-field win rates by danger level with this change: Slap 11%, Kick 31%, Armageddon 28%, against 4 / 29 / 39 before. Armageddon no longer clearly beats Kick, so the AI danger levels need retuning later. Saved games pick up the new cap on their next turn (an existing Well above 75,000 just stops earning harvest until it is spent down).

## v2.48
- FOMENT CHAOS is not available at rank 10 (Prince of Demons), the highest chaos power rank. It did nothing there except count as spending toward the 10% "Souls consumed" points. Orders screen: the FOMENT option is greyed out and reads "FOMENT CHAOS (not allowed: you are already a Prince of Demons)"; a FOMENT already set shows an error telling you to choose another command; the engine also refuses it with no souls spent and the report shows "FOMENT CHAOS failed: ...". The AI never fomented at rank 10.

## v2.49
- The top Danger Level is renamed from "Literal Armageddon" to "Armageddon Made Manifest" (picker, rules text). The short label stays "Armageddon". Saved games are unaffected, since they store the level code (L, H, X), not the name.

## Roadmap: automatic multiplayer on Cloudflare (design notes, nothing built yet; written 2026-11-18)
Goal: replace the save-code passing in multiplayer games with a server that holds each game, so players submit orders and read results on the site. Everything free.

**Turn timing (decided)**
- A turn is processed as soon as every player has submitted orders. Turns take no time to resolve (about 10 ms for six princes), so a group that is all online can play its first 10 turns in one evening.
- A schedule is the backstop for stragglers: orders are due at fixed times (for example 1:00 PM and 10:00 PM) and the server processes the turn then, with results ready by about 1:05 PM / 10:05 PM. Whoever has not submitted keeps their multi-turn orders (a horde with none holds).
- Times are stored in UTC and shown in each player's local time. Still to decide: whether "1 PM" means a fixed local time or fixed UTC (daylight saving shifts local), and whether a game may be set to strict-schedule only.
- With turn processing on the server, email is not needed to send or receive turns. Notifications are optional extras.

**Architecture**
- The game page stays a static page on GitHub Pages. A Cloudflare Worker is the server, with one Durable Object per game holding the game state and each player's secret orders for the current turn. The same engine code (plain deterministic JS, seeded) runs inside the Worker. `viewFor()` already strips hidden information, so each player is sent only their own view.
- The Claude artifact sandbox blocks `fetch` to other sites, so a server-backed game cannot run as a Claude artifact. The public Claude link stays solo play (or links out).
- Storage: one row per game for the state (a row or value may be up to 8 MB, a game is about 350 KB at turn 34), reports stored one row per player per turn, few indexes to keep row writes low.
- Identity: each player gets a secret per-game link. No email means no recovery, so the organizer can reissue a lost link.
- Schedule trigger: a Durable Object alarm (or a Cron Trigger) per game.
- Avoid the standard WebSocket API (it keeps the object awake and billed). Plain HTTP requests, or the WebSocket Hibernation API, are fine.
- Cloudflare cannot be reached from the Claude workspace, so I write the Worker code and config into the KoD folder and the user runs the deploy. Deploy options: GitHub Actions with the Cloudflare wrangler action (needs a Cloudflare API token stored as a GitHub secret, by the user; lets ENG and BTN gate the deploy), or Cloudflare Workers Builds connected to the repo (no secrets in GitHub). Leaning toward GitHub Actions.

**Free-plan facts (from Cloudflare docs, checked 2026-11-18; recheck before building)**
- Allowances per day, reset 00:00 UTC: 100,000 requests, 13,000 GB-s duration, 5 million SQLite rows read, 100,000 rows written; 5 GB total Durable Object storage. Past a limit, operations fail until the reset (no charge).
- Only SQLite-backed Durable Objects are available on the free plan.
- Duration is billed only while an object runs or sits idle and cannot hibernate; idle objects that can hibernate (about 10 s) are not billed. Standard WebSockets block hibernation (evicted after 70 to 140 s idle). Pending I/O can hold an object for up to 15 minutes.
- Requests count HTTP calls, RPC sessions, alarms and incoming WebSocket messages (20 to 1).
- The docs do not say whether index updates count as rows written, and disagree on per-object storage (1 GB or 10 GB on free). Neither matters at this scale.

**Capacity estimate (6-player games, 2 turns a day each, rough)**
- About 100 requests and about 150 row writes per game per day. First limit hit is requests: roughly 450 concurrent games with the page polling every 30 s, about 1,000 without polling. Rows written about 650 games. Storage about 2,700 finished games kept forever (about 1.8 MB each if all reports are stored); archive or delete finished games. Duration is not a concern with plain HTTP.
- With early processing the request count rises (players reload and resubmit more often during a fast evening), but a single game is far below any limit.

**Notifications (all optional and opt-in; none needed for the schedule to work)**
- Free options: Discord webhook per game channel (@mention by Discord ID); Discord bot DMs; Telegram bot (player taps a link, bot learns the chat ID); ntfy.sh (player subscribes to a secret topic); browser push (service worker, iPhones only from the Home Screen); a static calendar file with two recurring daily events (no server needed). SMS has no reliable free option.
- Email via Brevo REST (`POST https://api.brevo.com/v3/smtp/email`, `api-key` header kept as a Worker secret): free plan is 300 emails a day (about 25 six-player games at 12 mails per game per day). The sender must be verified; with no domain, delivery from a free-provider address is unproven and may need a test send. A third-party review says free emails carry a "Powered by Brevo" badge. Email would be opt-in, addresses kept only in the game's private storage, never in any player's view, deleted at game end, one-click opt-out, no game details in the mail.
- Suggested first set: Discord webhook and ntfy, then a Telegram bot if asked. Email last, behind the opt-in.

**Suggested order of work**
1. Worker plus Durable Object: state, orders, turn processing (early when all in, otherwise at the deadline).
2. Game page talking to it, still hosted on GitHub Pages; keep the save-code route as an offline fallback.
3. Schedule and deadlines, calendar file.
4. Optional notifications.

**Open questions**: local versus UTC schedule; strict-schedule games; how a lost player link is reissued; how a game is created and joined (invite link and seat claim); whether finished games are archived or deleted; per-game schedule settings.

## v2.50
- "Name your demon prince" screen: removed the "Keep this name" button. It ignored the rival Danger Level dropdowns (a player who chose levels and then pressed it lost them), and Begin already handles an unchanged name. The screen now has the single Begin button, and the intro line mentions choosing rivals.

## v2.51 (Test artifact + PC only)
- Known Planes: the single Defense column is replaced by three: Horde (strength of the hordes last seen on the plane; a Minor Power's horde is its whole defense; "+?" or "?" when a horde could not be read), Shadow (the holder's public Shadow Horde strength that defends the plane, all at home, a third elsewhere; "–" for Minor Power and unheld planes), Planar (offense + defense from the plane's domination; "–" for Minor Power and unheld planes). A prince's plane is defended by Planar + Shadow. The plane detail shows the same three. Delta arrows work per column. Note text now says green is you.

## v2.52 (pushed everywhere)
- Gameplay tab text rewritten from the user's draft (heading "Basic Gameplay"; sections: standard loop with other-ways-to-win note, Planar Domination and Value, Combat [horde vs horde, horde vs planar defenses, Minor Power planes have no planar defense, three defense columns], Turn Sequence). The old "Set before anyone moves" stage was folded into the Prince stage. Corrections vs the draft: meeting engagement applies to any hordes that arrive together, defender bonus numbers, harvest cap 75,000, RAID and Blood Pact exceptions, Slippery 3:1 end, retreat/destroy rules, Shadow Horde and Blood Pact explained.

## v2.53 (Test artifact + PC only)
- Gameplay tab wording: Trench Master bonus names the ability, "whatever the horde's order", "horde against horde combat above", and a note that a broken Minor Power plane is usually dominated by the victor unless the victor fled.

## v2.54 (Test artifact + PC only)
- A horde that has already withdrawn this turn cannot withdraw again. If it is beaten again (the rare case of two beaten hordes both retreating to the same empty plane), it is destroyed. A draw there destroys both unless one force is at least 2:1 over the other (the usual stay rule), in which case that force lives, battered. Implemented in retreatForce (a horde already flagged `t.evicted` is treated as having nowhere to go). Not yet reflected in the Gameplay text.

## v2.55 (Test artifact + PC only)
- Defender rule: only the plane's owner (or a Minor Power's horde on its plane) is the defender, whether or not that force moved this turn. An owner's horde that arrives on its own plane joins the defense without fighting its way in. Every other force on the plane counts as an arrival, including one that has sat there for turns or an ex Blood Pact partner, so it fights the other arrivals in the scrum with no defender bonus, then the owner's horde, then the planar defenses. Change is in resolvePlane (forces split by owner instead of by whether they moved). Gameplay text not yet updated.

## v2.56 (Test artifact + PC only)
- Fight sequencing on a plane. Defenders: the plane's owner (or a Minor Power's horde) and any Blood Pact partner of the owner standing there. Everything else is an arrival (including a horde that has sat there for turns).
- Scrum among arrivals: pairs of enemy forces fight, one or both leave. Order: the two forces whose general has the lowest Experience fight first; ties go to the lowest general Age, then the prince with the fewest victory points, then random. The winner's Experience rises after each fight, so the highest-experience general tends to fight last and sees the others weakened. A force's key is taken from its horde with the highest Experience (ties: older general). Blood Pact partners in the scrum do not fight each other.
- Then each surviving arrival fights the owner's Blood Pact partners first (they defend, with the defender bonus), then the owner's horde, then the planar defenses. Implemented in resolvePlane (kf/cmpK keys; stays sorted partners first, owner last). Tested with a hook: three hordes at experience 5/1/3 fought in the order 1 vs 3, then the winner vs 5; and an attacker fought a partner horde, then the owner.
- Gameplay text not yet updated.

## v2.57 (Test artifact + PC only)
- Scrum order for a prince with several hordes on one plane: the prince counts as one general with the best Experience and the best Age among them (taken separately, not added or combined).

## v2.58 (Test artifact + PC only)
- Blood Pact partners arriving together attack the defender and the planar defenses one after another. Order: scrum order (lower Experience first, so the better general goes last), except when the plane's domination is 2 or less, when the better general goes first because he can take the plane outright. If the first takes the plane, the partner cannot attack it. Domination is read when each attacker is picked; if the first attacker cuts domination the partner faces the weakened defenses. Intended (confirmed by the user): if a Minor Power's horde is destroyed while two pact partners are on the plane, nobody claims it (the claim needs exactly one prince's force there). It stays unclaimed.

## v2.59 (Test artifact + PC only)
- Gameplay tab, Turn Sequence stage 4 (Fights) replaced by the user's outline: 1 Fight Locations, 2 Fight Types, 3 Main Fight Sequence (general scrum, Blood Pact partner of the defender, defending horde, planar defenses; RAID skips the planar defenses), 4 Withdrawal. Nested numbered lists. The Combat section above it is unchanged.

## v2.60 (Test artifact + PC only)
- Summon UI shows only the highest tier your rank allows, in the horde's class (Fast only for the Shadow Horde). Reason: strength per soul is flat across tiers (Fast about 17.3 to 18.3 per 1,000 souls, Heavy about 20.0 to 20.8), higher tiers carry purge and are untouched by lower purge, and purge cannot be soaked up by fodder (it kills 20% of each kind in reach, at least 1). Any lower-tier amounts in a draft order are dropped when the box renders. The engine and the AI are unchanged and still accept any tier, so old save codes and turn codes work.

## v2.61 (Test artifact + PC only)
- A paid SCRY now also reveals the makeup (demon types) of every horde in its reach, not only the Shadow Horde makeup of princes who hold planes there. The free SCRY still shows strength only. An Unseen general still hides his horde unless a Farsighted general is within one plane of it. Plan: 1 or 2 demon types per tier with traits (governability/ungovernable, raider, ranged, and so on), the same for every player; makeup becomes hidden information worth scrying. Not built yet: the demon types and traits.

## Parked: demon traits (no code, no version bump)
- Idea: 1 or 2 demon types at every tier, the same for every player, each with a trait, so the summon choice is real. Makeup is hidden information; a paid SCRY (v2.61) and the Seer ability reveal it.
- Trait ideas: RIOT (+15% strength when controlled; uncontrolled, it kills off other demons in the horde; control from a general with Experience 15, Age 25, Mindbreaker or Dominator; optional Governor ability raising the bonus to 25%) and ARTILLERY (+40% strength in round 1, then -20% each round; optional Shielded ability cancelling it). Other ideas: raider, defender, siege, fleet.
- Analysis so far: Riot's control thresholds are mostly out of reach (abilities arrive at Age 10 / Experience 10 and are random; Age 25 only the starting general reaches). The summon UI offers only the top tier your rank allows, so a low-tier trait demon is on sale only briefly. Options: Riot only at high tiers, show the top two tiers, scale control with tier, or leave Riot out. Artillery needs a defined decay rule (percentage points or multiple), a cost or base-strength trade-off, and its bonus applies only to the artillery share of a horde. Shadow Horde cannot use Riot (no general).
- Status: parked by the user on 2026-11-19.

## v2.62 (Test artifact + PC only)
- SUMMON (horde and Shadow Horde) has a "Max affordable" button under the quantity box. It fills in the most the Well can pay for after all your other commands (other summons, princely commands), counting the Quartermaster discount, and updates the cost line.

## v2.63 (Test artifact + PC only)
- The Export PDF button is hidden (`SHOW_PDF=false` in 02-data-and-setup.js). The export code and `initPdf()` are untouched; set the flag to true to bring the button back.

## v2.64 (Test artifact + PC only)
- The Multiplayer button is hidden by default. It shows when `TEST_BUILD` is true (the Test artifact copy is published with `const TEST_BUILD=false` changed to true and the title "King of Demons Test"), when the game is opened once with `#mp` on the end of the address (remembered in that browser), or when that browser is already in Game Master or player mode. Publishing the Test copy: `sed 's|<title>King of Demons</title>|<title>King of Demons Test</title>|; s|const TEST_BUILD=false|const TEST_BUILD=true|' index.html`.

## v2.65 (Test artifact + PC only)
- The Gameplay tab is renamed "Gameplay Info", about 15% smaller (12px against 14px), and set 24px apart from the other tabs (`.tab.info` in 01-shell.html).

## v2.66 (Test artifact + PC only)
- Opening Briefing: the last paragraph now ends with "Lastly, the blinking Gameplay Info tab describes basic gameplay, and it details plane domination and plane value, combat, and the order in which the various commands are resolved." The Standing tab is described as "the third blinking tab" (Orders, Realm, Standing, Gameplay Info blink). The source said "the last blinking tab", which stopped being true once Gameplay Info began to blink after it.

## v2.67
Known Planes (Realm tab) now uses icons: column headers are icon-only (crown Domination, gem Value, flame Souls per turn, horned head Horde, dashed violet head Shadow Horde, shield Planar defense) with the name on hover, and a key with the icon names sits under the table. Cells carry the same icon beside the number, and Domination shows six pips. Icons are inline SVG in the text color, so no image files. Explanatory note below the table now names each icon. Options B and C from the icon mock-up; Dennis chose both.

## v2.68
Icons moved from the Known Planes cells to the Abyss map. The table keeps its icon-only headers and key, but its cells are plain numbers again and the domination pips are gone. On the map each plane square now shows a crown icon with domination and a gem icon with value (replacing "d3" and "v4"); Minor Power and free planes still read "Minor" and "free". Map legend names the two icons.

## v2.69
Icon names changed: crown = "Domination Level", horned head = "Horde Strength", shield = "Planar Defense Strength" (Shadow Horde, Value and Souls per turn unchanged). Applies to the table header hover names, the key under Known Planes, the map legend, the plane detail labels and the note under the table.

## v2.70
Shadow icon name changed to "Shadow Horde Strength" (header hover, key, plane detail, note), matching Domination Level, Horde Strength and Planar Defense Strength.

## v2.71
Known Planes table: every column except Plane is now centered (headers and contents). Group rows and the "Your planes produce" label stay left.

## v2.72
Icon tooltips. Hovering or clicking (tapping) a crown, gem, flame, horned head or shield shows a small box with its name and a one-line meaning. Works on the Abyss map icons, the Known Planes column headers and the key under the table. It closes after a few seconds, on scroll, or when you click elsewhere. The old browser title tooltip on the headers was replaced.

## v2.73
Abyss map: a faint crown watermark in the holder's color now sits on any prince's home plane that its starting prince still holds (yours and any rival home you know). It disappears when the home plane falls. Chosen from the Abyss mock-up (layer 2); the rest of the mock-up layers are not built.

## v2.74
Abyss map atmosphere and glow (from the Abyss mock-up, layers 1 and part of 2): deep red-black radial background with a faint rune lattice, an edge vignette, 34 slow embers drifting upward (switched off for reduced-motion devices), unexplored and unknown planes fade into fog, and every known plane gets a soft glow in its holder's color that grows with plane value. Not built: domination notches, inner tile light, living portals.

## v2.75
Home-plane crown watermark on the Abyss map shrunk by a third.

## v2.76
Home-plane crown watermark moved off the bottom of the tile and vertically centered, so it clears the HOME label and the H tags. It can still sit under a rival horde marker when both your horde and a rival's are on the plane.

## v2.77
Removed the home-plane crown watermark (redundant with the HOME label). Versions 2.73 to 2.76 describe its history. Atmosphere and glow from v2.74 stay. Note: only your own home plane carries the HOME label; rival home planes have no marker.

## v2.78
Abyss map "chasm": the vertical gap between planes is wider (map is 96 pixels taller) and wherever two vertically adjacent planes have no portal between them the gap is filled with a dark hatched band. Connected pairs keep their red link. East and west links always exist, so only vertical edges can be blocked. Wrap-around edges at the top and bottom are unchanged. From the "No-portal mock-ups" page, option 2. Options 4 (selection highlight) and 5 (horde reach) were liked as possible additions but not built.

## v2.79
Abyss map: removed the radial background glow and the edge vignette (flat dark background now; rune lattice and embers stay). Per-tile glow in the holder's color strengthened and spread slightly, still scaling with plane value (value 0 faint, value 7 strongest).

## v2.80
Removed the drifting embers from the Abyss map (they appeared to pop in and out). Rune lattice stays.

## v2.81
Chasm made quieter: the hatching and outline are gone. A blocked gap is now only a faint darker patch (30% opacity) with no border, so it reads as negative space rather than an object. Connected gaps still carry the red link.

## v2.82
More map tooltips (hover or click): rival and Minor Power horde markers ("Horde 2 of Ilvareth - Strength about 51 when last seen"), your own H tags (current strength), the HOME label ("Your starting plane. All of your Shadow Horde defends it."), and the red portal lines ("Hordes can only travel between planes that are joined by these red portal lines"), which now have a wider invisible hit area so they are easy to hit.

## v2.83
Taller map tiles with a horde area. Each known plane tile is 80 pixels tall (was 62) and has a thin divider just below the value row; under it sit up to two rows of horde icons: your own H tags first, then the hordes you last saw there (prince number circles in the prince's color, "!" for Minor Horde). Icons are smaller (about 13 pixels) so a row holds about four, and past two rows a "+n" note appears with its own tooltip. The map is 108 pixels taller; gaps between planes and the chasm are unchanged. From the extra-row mock-up.

## v2.84
Dotted wrap-around portal lines now have their own tooltip: "Wrap-around portal to K00. This dotted portal line is just like a solid portal line, except that it connects to a wrap-around plane on the opposite edge of the map: plane K00." Each stub names the plane it leads to.

## v2.85
Domination Level icon changed from a crown to a sword (header, key, map tiles, legend, tooltips and the note under Known Planes). Chosen from the Domination icon mock-up; the boot, whip, shackle, fist and trident were not used.

## v2.86
Domination sword tilted 45 degrees clockwise (tip toward the upper right) and drawn about 30% larger, filling more of its icon box (the first try was 25 degrees; Dennis wanted 45).

## v2.87 (Test artifact + PC only)
- Random game ending. A countdown (rank 7, every prince met, every plane dominated) no longer ends the game on a fixed turn. After the trigger the game cannot end for the first turns; then each turn has a chance of ending it, and the chance rises until the end is certain. Standard schedule (rank 7 and every prince met), counted in turns after the trigger: +12 10%, +13 15%, +14 20%, +15 35%, +16 45%, +17 55%, +18 65%, +19 75%, +20 85%, +21 95%, +22 certain. Average 15 turns, the same as the old fixed countdown (sim of 300 games: 15.0). Every plane dominated uses the same shape 5 turns earlier (+7 first chance, certain at +17, average 10). The turn limit stays at 45 (about 1% of games reach it; Dennis did not want longer games).
- Players are told the chance in words only: under 20% "unlikely but possible", 20% up to 50% "not very likely", 50% up to 75% "likely", 75% and up "very likely". Before the first chance the text says the game cannot end for at least N more turns. The last turn before the turn limit says so. Shown in the turn report alert, the report banner and the Standing tab; the rules text and the Standing tab explain it.
- The roll uses the game's seeded random numbers at the end of each turn's resolution (G.end is now {t0,kind,reason}). A game saved before v2.87 (G.end.at) keeps its old fixed end.
- AI end dump. An AI knows the exact chance. From 25% up it cancels its horde summons and princely commands, buys any chaos rank that costs under 50,000 souls per rank (rank costs are cumulative Foment totals) and puts the rest of its Well into a Shadow Summon. Reason: unspent souls score nothing when the game ends, while souls put into demons score about 1.1 points each. Background: a friend's game on v2.48 was won partly by a 130,000 soul Shadow Summon on the last turn; sims showed a lone dumper gains about 6 points of win rate and that when every AI dumps the edge disappears.
- Not run: the lone-dumper edge under the new random ending.

## v2.88 (Test artifact + PC only)
- The Chaos rank trigger now fires at rank 6 (Chaos Lord), not rank 7 (Count of Chaos). Same standard schedule as "every prince has met every other" (average 15 turns after the trigger). Standing tab: "A prince reaches Chaos Lord (rank 6)", with the progress bar out of 6.
- Why: in 300 simulated AI games rank 7 was the first trigger only 1% of the time (average turn about 30), and rank 7 was never reached in 31% of games. With rank 6 it is the first trigger in 33 of 300 games (11%), average turn 24; "every prince met" is first in 252 (84%, average turn 19.5) and "every plane dominated" in 15 (5%, average turn 20). No game reached the turn 45 limit in that run.
- Only the first trigger starts the countdown; later triggers change nothing (Dennis's decision). Ties on one turn go to "every plane dominated" (shorter schedule).
- Correction to the v2.87 analysis: median turns for the first trigger are 19 (met), 21 (planes dominated) and 30 (rank 7). An earlier table printed the minimum by mistake.

## v2.89 (Test artifact + PC only)
- The "every plane dominated" trigger now needs 97% of the planes dominated once (58 of 60 on the standard map; `domNeed()` = round(planes x 0.97), so it scales with map size), not all 60. Reason text: "Nearly every plane has been dominated (58 of 60)". Standing tab bar shows progress toward 58 and says the map has 60. Schedule unchanged (average 10 turns after the trigger).
- Why: with all 60 planes it started the countdown in only 8 of 300 simulated AI games (the last few planes are often strongly defended or behind a chasm). Dennis chose 97%, the cautious option, because this countdown is short and can shorten games a lot.
- Sim of 300 AI games with this build: first trigger is "every prince met" in 181 (60%, average turn 18.8), planes dominated in 108 (36%, average turn 19.6), Chaos Lord in 11 (4%, average turn 24.6). Counted with ties going to the planes trigger, which is why 36% is higher than the 28% the earlier strictly-before count gave for 58 planes. Average last turn of a game is 32.4 (about 35 before v2.88/v2.89, so about 2.6 turns shorter). No game reached the turn 45 limit.
- Standard countdown averaged 14.9 turns (12 to 19), plane countdown 9.7.

## v2.90 (Test artifact + PC only)
- Countdown lengths swapped, Dennis's call: reaching Chaos Lord (rank 6) now starts the short countdown (average 10 turns: first chance of ending at +7, certain at +17), and 97% of the planes dominated starts the standard one (average 15 turns: first chance at +12, certain at +22), same as "every prince met". If two triggers fire on one turn, the shorter countdown wins. The Standing tab labels say "averages ten turns" for rank and "averages fifteen turns" for planes and met. END_SCHED keys are now std and short (short was dom).
- Reason: with planes at 15 and rank at 10 the average game length is about what it was before the random ending. Sim of 300 AI games: average last turn 34.1 (it was 32.4 with the v2.89 schedule and about 34 before v2.87). First trigger: met 181 games (60%, turn 18.8), planes 107 (36%, turn 19.5), rank 6 only 12 (4%, turn 24.4). No game reached the turn 45 limit. Standard countdown averaged 14.9 turns.
- Because rank 6 is the first trigger in only about 4% of games, the shorter countdown seldom applies.

## v2.91 (Test artifact + PC only)
- End game flavor text. The plain "chance the game ends" wording is replaced by an omen line, five per situation (1 = the game cannot end yet, with the first turn it might end; 2 = unlikely but possible; 3 = not very likely; 4 = likely; 5 = very likely). Each line still says how likely the end is, so the odds stay clear. Lines live in `END_FLAV` in 02-data-and-setup.js; source is the shared spreadsheet "End Game Flavor Text" (Dennis wrote or edited most of them; all marked Keep).
- Which line shows: picked by game and turn ((game seed + turn) mod 5), so it changes each turn, never repeats back to back, is the same on every screen within a turn, and uses none of the game's random numbers. The line appears after "End game: <reason>." in the report alert, the report banner and the Standing tab. Turn 45 (the limit) and old saves still show plain text.
- Standing tab explanation reworded: players are never told the exact chance, only the omen.
- Double spaces in Dennis's text are collapsed to one in the code. (Line 1A's garbled phrase was fixed in v2.92.)

## v2.92 (Test artifact + PC only)
- Flavor line 1A fixed at Dennis's wording: "Well, if they're cold they won't bother us." (was "if they're they can't bother you!"). The spreadsheet line was updated to match.

## v2.93 (Test artifact + PC only)
- Flavor text no longer speaks of reality ending. The game's end is told as a coronation (the chaos gods crowning a king), with the same likelihood wording in each line. 20 of the 25 lines were reworded from the spreadsheet; 1A and 1D are as Dennis had them (1D still has the Bell of Endings), 1E's last sentence is now "No king will be crowned before then." 2A (Dennis's frog line) keeps its wording except "crown a king" for "end reality". The spreadsheet holds the new text; the earlier reality wording is in its version history.

## v2.94 (pushed everywhere, with v2.73 to v2.93)
- Flavor text picks up Dennis's later edits in the spreadsheet: 3E ("...shuffling their notes. So, a coronation next turn..."), 4C ("Complete your plans!"), 4D ("Fortune favors the prepared.") and 5E (two sentences). Pushed to the public Claude link and GitHub together with every version since v2.72 (v2.73 to v2.94: icons and tooltips, flat map with per-tile glow and chasm, horde row, sword icon, random game ending with omen text, 97% planes and Chaos Lord triggers, AI end dump).

## v2.95 (pushed everywhere)
- Wording: the Game Master and multiplayer setup screens say "NPC princes" instead of "AI princes" (setup text, the princes list, the name-table dialog and the results table's "(NPC)" tag). Dennis: the computer-run princes are driven by an algorithm, so they are not called AI. Added to the working agreements. Code comments and earlier NOTES entries still say AI.

## v2.96 (test only): Mindless Rage stats, no consequences yet
- New per-horde stats: rage (slow buildup), temp rage (swings that fade after two turns; tr this turn plus tp last turn), iron fist (age + experience + purge bonus). Cause text in h.rc.
- Placeholder rules in RAGE (02-data-and-setup.js): off the home plane only; plane with 100+ demons and no fight adds rage, slowed by iron fist; a fight drops it; rival horde +2 temp, own other horde +1 temp, the prince's own plane -1.5 temp.
- Shown on the horde detail in the Test build only. Planned stages: Discontent, Rioting, Mutinous, Frothing Mad (names are working names). Purge not built yet.
- First sim (30 NPC games): final rage p50 0, p90 0.7, max 5.9, so the buildup rate needs raising once thresholds are set.

## v2.96 revised (test only): rage growth rules
- Growth per turn = size x distance x iron fist. Size = n*(1+max(0,n-10)*str/1000) over every demon on the plane, scaled so 100 demons of strength 250 = 1, capped at 6. Distance = portals from home / 3 (0 at home, triple at 8). Iron fist factor = max(0.4, 1/(1+fist/20)), so it slows rage but never stops it.
- No growth on a turn with combat, unless the horde was forced to leave the plane in defeat or a draw. Rage never falls by itself (no drop for fights, frozen at home). Only Discipline (the new name for Purge, not built yet) will lower it.
- Stages by total of rage plus temp rage: Discontent 3, Rioting 6, Mutinous 10, Frothing Mad 15. Shown in the Test build horde detail. No consequences yet.
- Sim (40 NPC games, 1,076 hordes): 61% of horde-turns calm, 12% Discontent, 13% Rioting, 8% Mutinous, 6% Frothing Mad; 23% of hordes reach Frothing Mad at some point.

## v2.96 (test only): Mindless Rage consequences, DISCIPLINE and rebellion
- Each horde keeps levels h.lv[0..3] for Discontent, Rioting, Mutinous and Frothing Mad: turns spent as the top stage. A level resets when the long-term rage falls below that stage (temp rage can raise the stage but never clears a level). All lower-stage penalties keep applying. Nothing acts while the horde is on its home plane.
- Discontent: tactics roll -1.5 per level, rounded toward zero, capped at -6 (worst horde in a force). Rioting: 1% of the horde per Rioting level dies each turn, at least one demon; the losses count as demons lost for VP (deliberately, to see if anyone exploits it). Mutinous: DOMINATE, RAID and DISBAND refused at 20% per level; FORCED MARCH is never refused but moves one plane at most; from level 6 rage growth doubles. Frothing Mad: (level - 1) x 33% a turn to rebel.
- Rebellion: the general dies and returns at home next turn with no army; the horde becomes a Rebel Power horde (owner -1, a rebel name, no rage effects). It attacks the plane it stands on if a prince owns it; if it wins, the plane becomes a Rebel Power plane whose domination grows. It can be attacked like any Minor Power.
- DISCIPLINE (replaces the working name Purge, which clashes with the demon trait): a horde command, always obeyed, only works from Discontent up. Sacrifices 10% of the horde (min 1 demon, counts as demons lost), lowers rage by 6, adds 3 to iron fist. Shown on the horde card only when the horde is at least Discontent.
- NPC princes: at Mutinous or worse always DISCIPLINE; at Rioting 50% of turns (RAGE.npcDisc, RAGE.npcP).
- Rebel names: REB_A list in 02-data-and-setup.js.
- Sim (40 NPC games): 71% of horde-turns calm, 18% Discontent, 9% Rioting, 2% Mutinous, no Frothing; no rebellions because NPCs discipline in time. With NPC discipline turned off (25 games): 7.4 rebellions and 3.2 rebel-seized planes per game, so the mechanic bites when ignored.
- Open: what "rival horde" means for temp rage, and how several of your own hordes on one plane should affect it.

## v2.96 (test only): temp rage and stacked hordes
- Temp rage sources now: a Blood Pact partner's horde on the plane +2 (they are the only different-prince hordes that do not fight), a defeat, retreat or drawn fight +2, the prince's own plane -1.5. Fades after two turns.
- Several hordes of one prince on a plane count as one for rage growth: demons and strength add up, only the best Iron Fist counts, and the same increase goes to each horde (no extra temp rage for stacking). A fight by any of them stops growth for the group unless one was forced out.
- Sim (40 NPC games) after this change: 72% calm, 18% Discontent, 8.5% Rioting, 1% Mutinous, no rebellions.

## v2.96 (test only): four ways to make DISCIPLINE a decision
- Rage drop per DISCIPLINE is now 3 (was 6). Demon cost scales with the stage: 10% Discontent, 12.5% Rioting, 15% Mutinous, 20% Frothing Mad.
- NPC princes see only the stage and react by chance each turn: 0% calm or Discontent, 35% Rioting, 60% Mutinous, 85% Frothing Mad (RAGE.npcP).
- A Mutinous or worse horde may defy DISCIPLINE: 10% per Mutinous level, capped at 75%. The demons are still sacrificed but the rage does not ease.
- Sim (40 NPC games): 67% calm, 16% Discontent, 12% Rioting, 4% Mutinous, 1% Frothing; 2.0 rebellions and 0.45 rebel-seized planes per game; 12% of hordes reach Frothing Mad.

## v2.96 (test only): inner tile light on the Abyss map
- Each fully explored plane now has a soft radial "ball" of the holder's color inside the square: brightest at the center, fading to nothing before the edges, stronger for higher plane value (opacity .35 + .09 x value). Drawn under the text. The outer blurred halo stays.
- The inner tile light is drawn only for planes held by a prince, not for Minor Power planes or empty planes (the outer halo is unchanged).
- Inner tile light reduced by 20% (opacity now (.35 + .09 x value) x .8).
- Inner tile light reduced by a further 20% (factor .64 in all, the original strength times .64).
- Inner tile light moved to the right side of the square (center at 72% of the width, narrower) so it no longer sits behind the sword and gem numbers.
- Princes of the Abyss card: the three rivals' personality lines moved out of the rows into a block at the bottom of the card (name in the prince's color, then the personality). Rows keep rank, Blood Pact, open or closed, and danger level.
- Princes of the Abyss card: the personality pill (name only, e.g. Personality: Peaceful) is back beside each prince; a block at the bottom now defines the three personalities: Peaceful, Grudge, Flexible.
- Rage display fix: Rage and Temp rage numbers are gone from General Details (they are horde values). The horde card now shows a line "Mindless Rage: stirred by ..., eased by ..." when the horde is away and at least Discontent, next to the stage pill. The causes are split: h.rc holds what stirs rage (a crowd of demons far from home, a Blood Pact partner's horde, a defeat or drawn fight) and h.rk holds what eases it (the prince's hold on this plane), so the calming plane is no longer reported as a cause. The report line also says "eased by". The numbers appear only in Test builds, as a labeled test note on the horde card; Iron fist stays in General Details in Test builds only.
- Renamed the Peaceful personality to "Craven and Spiteful" (name only; the key PEACE and the mechanic are unchanged, so saved games still work). Updated the princes card, Gameplay Info and the multiplayer note.
- Renamed the Grudge personality to "Vengeful" (name only; the key GRUDGE and the mechanic are unchanged).
- Renamed the "Gameplay Info" tab to "How to Play" (including the opening briefing text). In it, "Basic Gameplay" is now "The Standard Loop"; the duplicate header, the subtitle and the closing "Expanding and fighting..." paragraph were removed.
- The "The Standard Loop" heading on the How to Play tab is now "How to Play the Game".

## v2.96 (test only): the How to Play tab is expanded
- "How to Play the Game" now walks the player through the turn in order: 1 Read the report (info cards with change since last turn, Needs your attention, drilling into battles, the header and its tooltips), 2 Review your Realm map (portals and chasms, the Abyss map, plane detail cards and how they are revealed, the Known Planes table), 3 Give your orders (3a horde cards, the Details toggle, the demon tables and general abilities buttons; 3b each princely command; 3c the soul bar at the bottom), 4 Review your Standing (score, end game, the princes card, the Chaos Power table), then Resolve the turn.
- The Turn and Planes figures in the header now have hover tips like Well and Total Yield.
- How to Play also gained, in this order after the loop: Tips for Your First Game, Souls and Your Well of Souls (yield formula in words, harvest, what souls buy), Hordes, Generals and Demons (Heavy and Fast, rank limits, summoning, the Shadow Horde), Mindless Rage (causes and stages without showing the hidden numbers, DISCIPLINE), Minor Powers and Rebels, and Blood Pacts, ahead of the existing Planar Domination and Value, Combat and Turn Sequence sections.

## v2.96: pushed everywhere
- Mindless Rage, DISCIPLINE and rebels, the inner tile light, the personality renames (Craven and Spiteful, Vengeful), the Princes card rearrangement and the expanded How to Play tab are all in v2.96 and pushed to the public link, GitHub, the Test copy and the PC.
- Decision: the long How to Play tab stays as the full rules and strategy guide for now. It is a wall of text; a short quick-start version, or collapsible sections, may come later.

## Tutorials tab (prototype, in progress)
- New tab "Tutorials" (before How to Play). Animated slide shows on the REAL screens: a throwaway demo game (fixed seed) is rendered with the real renderers; spotlight ring, moving cursor, one-line caption, Back/Pause/Next, dots, progress bar. No sound.
- Sandbox: `withDemo()` swaps G, map size, seat and UI.open and restores them; `save()` refuses to write while DEMO_ON. Source: src/066-tutorials.js (slide shows are the `TUTS` array; each step = selector, caption, optional act that "clicks").
- Rule: a highlight never moves or resizes until it has shown for 2 s (clicks fire at 2.0 s). Cursor sits at the highlight's lower right and steps outward to avoid text.
- Done: "Souls and your Well" (5 slides), "The Realm map" (8), "Hordes: reading the card" (9 slides: card, general, details, type, strength and purge, rage, move, demon tables, general abilities) and "Orders: horde commands" (3), "Orders: princely commands" (5), "Orders: the soul bar" (8). To build: princely commands, soul bar, Standing, Mindless Rage, Combat, Planes. Excluded by Dennis: Minor Powers, Blood Pacts, Turn Sequence.

- Term "standing order" removed from the game (it implies a permanent order, which the game does not have). Multi-turn orders now say "Estimated turns to complete: N" under the target picker (not shown for Raid).

- Tutorial card titles: What Are Souls? / Understanding Your Realm / Understanding Your Hordes / Understanding Orders, 1/3 (horde commands) / 2/3 (princely commands) / 3/3 (the soul bar).

- Battles and events row icons (left of the pill): crossed swords = horde combat, mountain = planar combat, skull demon = chaos rank ascension (yours and other princes'), larger orange blast cluster = "under attack: domination cut to N". Events carry an `ico` field; battles pick swords or mountain from `battle.aft.*.planar` (`evIco` in 06-ui-report.js). Rows without an icon keep an empty slot so the pills align.

## v2.97: pushed everywhere
- Tutorials tab (six animated shows: What Are Souls?, Understanding Your Realm, Understanding Your Hordes, Understanding Orders 1/3, 2/3, 3/3), multi-turn order wording with estimated turns to complete, league renamed to mpg, and icons on the Battles and events rows.

## Tutorials: six more topics (v2.97, Test)
- New shows in 066-tutorials.js: Mindless Rage (after Hordes), Understanding Generals, Understanding Combat, Understanding Your Opponents, How Do I Win the Game?, How Do I Read Reports? Card order: What Are Souls?, Realm, Hordes, Mindless Rage, Orders 1/3 to 3/3, Generals, Combat, Opponents, How Do I Win, Reports.
- Combat, Win and Reports run on a real fight: tutFight() drops an NPC horde onto your horde's plane, doubles your demons so the practice fight is won, and resolves one real turn in the sandboxed demo game. Report tab slides read from that real report.
- Iron Fist appears in the Generals show only when TEST_BUILD is true (the stat is test-only in the horde card).
- No dedicated Standing or Planes topic (Dennis, v2.97).

## Victory point display grouped (v2.97, Test)
- The Standing tab and the end-of-game prince tables group victory points: Military (Carnage, Demons lost, Horde strength), Realm Size (Planes dominated, Planes held), Power & Economy (Chaos Power, Souls consumed); True Prince bonus stays below. Built by vpRows() in 07-ui-orders-realm-standing.js.
- Row names are now "Demons lost" and "Souls consumed" (no percentages in the name); older saved games' longer names map across (vpNorm). The row descriptions were out of date (Demons lost showed the generic 15% line) and now match the real scoring.
- Tutorial card order: How Do I Win the Game?, What Are Souls?, Realm, Hordes, Mindless Rage, Generals, Orders 1/3, 2/3, 3/3, Opponents, Combat, Reports.

## Online games and cloud saves, client side (written 2026-11-22, not yet released)
- `src/08-multiplayer.js` has an ONLINE section. It switches on only when the page is served by the Cloudflare server (probe of `/api/room/probe/status` answers "No such game."); in a Claude artifact, a file, or any other host it stays hidden and the code-passing game is unchanged.
- Game Master: Set up a game shows an "Online game" checkbox (default on). Starting creates a room, stores the keys in the GM's game (`G.ol`), publishes turn 1 views. The GM screen then shows per-seat Copy link buttons, orders status, Check for orders now, Publish this turn again. It collects orders every 20 s; Resolve publishes the next turn.
- Player: opening `#o=<room>.<key>` stores the link, switches to player mode, loads the published turn. "Finalize Orders" posts the orders to the server (falls back to the orders code if the server fails). "Check for new turn" button and a 20 s poll load the next turn.
- Cloud save: Multiplayer menu and the Save code section show "Cloud save…" (online only). One 20-character key; the room is made from the first 8 characters plus the mode letter, the secret is the rest.
- Tested end to end with a local Node copy of the server logic (`/tmp/w/oltest`): GM create, player link, orders, collect, resolve, republish, player sync, cloud save and load.

## v2.98 (2026-11-22)
- Online games and cloud saves (see the section above), released with the Cloudflare server.
- Multiplayer button now also shows whenever the page is served by the Cloudflare server (OL.on), not only in the Test build or with #mp.
