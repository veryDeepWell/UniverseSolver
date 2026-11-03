const assert=require('node:assert/strict');
global.window=global;require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');
const E=HSR_TEAM,D=HSR_DATA,newIds=['1006','1107','1112','1209','1213','1217','1218','1304','1313','1314'];
const scene={targets:3,cycles:1,initialSP:3,energyPercent:0,seed:42,allowPartial:true};
function p(id,extra={}){return {...E.defaults(id,D),hp:5000,baseHP:1000,atk:1000,baseAtk:500,def:2000,baseDef:500,speed:100,baseSpeed:100,crit:0,critDamage:0,...extra};}
function fight(ids,extra={},s={}){return E.simulate(ids,Object.fromEntries(ids.map(id=>[id,p(id,extra[id])])),{...scene,...s},D,true);}
function close(a,b){assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);}
assert.equal(Object.keys(E.models).length,98);assert.ok(newIds.every(id=>D.characters[id].rarity===5));
// All weaknesses exist already: SW's -20% implanted RES never applies.
const sw=fight(['1006'],{'1006':{effectHit:1}},{targets:1});close(sw.total,1960*1.1);assert.ok(sw.events.some(e=>e.label.startsWith('Баг')));
// Infinite, passive dummies do not manufacture Clara counters or marks.
const clara=fight(['1107'],{}, {energyPercent:100});close(clara.total,3600);assert.equal(clara.breakdown[0].followups,0);
// Numby uses an independent 80-SPD timeline. E0 normal attacks give no
// Energy; boosted attacks give only the A6 10 Energy, not E2's extra 5.
const topaz=fight(['1112'],{'1112':{speed:1}},{targets:1,cycles:2});
close(topaz.events.find(e=>e.label==='Счетовод · атака').time,125);close(topaz.total,1500*1.15*1.5*2);close(topaz.breakdown[0].energy,0);
const boosted=fight(['1112'],{'1112':{speed:1}},{targets:1,cycles:2,energyPercent:100});
assert.equal(boosted.events.filter(e=>e.label==='Счетовод · усиленная атака').length,2);close(boosted.breakdown[0].energy,25);
const pushed=fight(['1112','1220'],{'1112':{speed:1}},{cycles:2});assert.ok(pushed.events.find(e=>e.label==='Счетовод · атака').time<125);
assert.throws(()=>E.simulate(['1112'],{'1112':p('1112',{equipment:{cavern:['115','115','115','115'],planar:'306'}})},scene,D));
// Yanqing skill immediately activates crit stats; HP consumption is not
// incoming damage. His FUA probability is seeded and cannot recurse.
const yan=fight(['1209'],{'1209':{crit:1}});close(yan.events.find(e=>e.label==='Навык Яньцина').damage,2200*1.3);
assert.ok(yan.events.filter(e=>e.label==='Яньцин · бонус-атака').length<=1);
// DHIL hit-by-hit coefficients and stacks: plain Basic 30/70; Fulgurant
// Leap 14.2%*6+14.8%, adjacent damage only on the last four hits.
const plain=fight(['1213'],{'1213':{policy:'basic'}},{targets:1,initialSP:0});close(plain.total,300+700*1.1);assert.equal(plain.finalSP,1);
const il=fight(['1213']);close(il.total,6509+2610*2);assert.equal(il.finalSP,0);assert.equal(il.events.filter(e=>/^Пожиратель Луны · удар/.test(e.label)).length,7);
const livestream=fight(['1213'],{'1213':{crit:1,critDamage:1,equipment:{cavern:['103','103','103','103'],planar:'324'}}});close(livestream.events.find(e=>e.label==='Пожиратель Луны · удар 1').damage,710*2.72);
const scales=fight(['1213'],{}, {energyPercent:100,initialSP:1});
const enhancement=scales.events.find(e=>e.label==='Усиление базовой · 3');assert.ok(enhancement);assert.equal(enhancement.sp,0);assert.equal(enhancement.resource,0);assert.ok(scales.events.every(e=>e.sp>=0));
// Huohuo restores percent-max Energy without recipient ERR. Support
// ordering here lets Argenti spend first; his 32 refund then gains 36.
const hh=fight(['1302','1217'],{'1302':{speed:1},'1217':{speed:1}},{energyPercent:100});close(hh.breakdown.find(a=>a.id==='1302').energy,68);close(hh.breakdown.find(a=>a.id==='1217').energy,6);
const fx=fight(['1220','1217'],{'1220':{speed:1},'1217':{speed:1}},{energyPercent:100});assert.equal(fx.breakdown.find(a=>a.id==='1220').resource,3);
// Jiaoqiu EHR->ATK, two primary Ash stacks on Skill, separate DoT and
// zone activation cap. The Ash status also counts as Burn for Guinaifen.
const jiao=fight(['1218'],{'1218':{effectHit:1.4}});close(jiao.initialStats['1218'].atk,2200);close(jiao.events.find(e=>e.label==='Навык Цзяоцю').damage,3300);assert.ok(jiao.events.some(e=>e.label==='Жаркий пепел · 2 ур.'));
const zone=fight(['1218'],{'1218':{speed:1,effectHit:1.4}},{targets:5,cycles:5,energyPercent:100});assert.equal(zone.events.filter(e=>e.label.startsWith('Зона Цзяоцю · активация')).length,6);
const ashBurn=fight(['1218','1210'],{'1218':{effectHit:1.4},'1210':{speed:1}},{cycles:3});assert.ok(ashBurn.events.some(e=>e.actor==='1210'&&e.label.startsWith('Огненный поцелуй')));
// Aventurine scales on DEF and snapshots a beginning shield; no charges
// are awarded for incoming attacks because the dummies never attack.
const aven=fight(['1304'],{'1304':{atk:9999,policy:'basic'}});close(aven.total,2000);close(aven.initialStats['1304'].crit,.08);close(aven.breakdown[0].shield,800);assert.equal(aven.breakdown[0].followups,0);
const bingo=fight(['1112','1220','1304'],{}, {cycles:8,energyPercent:50});assert.ok(bingo.events.some(e=>e.label==='Авантюрин · попадание бонус-атаки'));assert.ok(bingo.events.every(e=>e.actor!=='1304'||e.resource<=10));
const panicRobin=fight(['1304','1309'],{'1304':{speed:1},'1309':{speed:1}},{energyPercent:100});close(panicRobin.events.find(e=>e.label==='Концерт · дополнительный урон').damage,1.2*1428*2.65);
// Sunday advances both character and summon; skill never advances a
// Harmony unit. His Energy restoration has a minimum of 40.
const sunday=fight(['1204','1313'],{'1204':{speed:1}},{cycles:2});close(sunday.events.find(e=>e.label==='Повелитель молний · удар').time,100);
const sundayNumby=fight(['1112','1313'],{'1112':{speed:1}},{cycles:2});close(sundayNumby.events.find(e=>e.label==='Счетовод · атака').time,100);
const harmony=fight(['1303','1313'],{'1303':{speed:1}},{cycles:1});assert.equal(harmony.breakdown.find(a=>a.id==='1303').turns,0);
const minEnergy=fight(['1303','1313'],{'1303':{speed:1},'1313':{critDamage:2}},{targets:1,cycles:5,energyPercent:50,initialSP:5});close(minEnergy.breakdown.find(a=>a.id==='1303').energy,105);assert.deepEqual(minEnergy.events.filter(e=>e.label.startsWith('Воскресенье · продвижение')).map(e=>e.sp),[4,3,3,3,2,1]);
// Jade Debtor grants 30 flat SPD, charges per DISTINCT enemy per attack,
// drains 2% HP once per action and never gains charges from her own FUA.
const jade=fight(['1013','1314'],{'1013':{speed:50}},{cycles:3});
close(jade.events.find(e=>e.label==='Сборщик долгов · дополнительный урон').damage,1015*.25*3);
assert.equal(jade.events.filter(e=>e.label==='Яшма · бонус-атака').length,1);close(jade.breakdown.find(a=>a.id==='1013').currentHP,4800);assert.equal(jade.breakdown.find(a=>a.id==='1314').resource,4);
// Each model runs in set search with a fixed DPS and unchanged profiles.
for(const id of newIds){const profiles={[id]:p(id),'1220':p('1220')},before=JSON.stringify(profiles),s={...scene,cycles:5};const a=E.simulate([id,'1220'],profiles,s,D,true),b=E.simulate([id,'1220'],profiles,s,D,true);assert.deepEqual(a,b);assert.equal(JSON.stringify(profiles),before);assert.ok(a.total>0&&a.events.every(e=>Number.isFinite(e.damage)&&e.sp>=0&&e.sp<=a.maxSP));
const input={characterId:id,profile:profiles[id],context:['1220'],contextProfiles:profiles,position:0,focus:'1220',caverns:['102','117'],planars:['306','309'],mixed:true,scenario:{...s,externalDebuffs:0}},search=HSR_SETS.createSearch(input,D);let r;do{r=search.step(3);}while(!r.done);assert.equal(r.checked,6);assert.ok(r.top.every(v=>Number.isFinite(v.total)));}
for(const ids of [['1112','1304','1313','1220'],['1213','1306','1217','1006'],['1205','1314','1203','1309'],['1218','1005','1210','1217'],['1112','1314','1304','1313']]){const a=fight(ids,{}, {cycles:10,targets:5,energyPercent:100});assert.ok(a.events.every((e,i)=>Number.isFinite(e.damage)&&e.sp>=0&&e.sp<=a.maxSP&&(i===0||e.time>=a.events[i-1].time-1e-8)));assert.ok(a.breakdown.every(a=>a.currentHP>0&&a.currentHP<=a.maxHP));}
console.log('Second ten 5-star models verified: Numby timeline/advance, DHIL per-hit SP/scales, shields/DEF, Sunday summons/Energy, Ash DoT/zone, Huohuo healing/Energy, Jade target charges/HP, seeded set search and mixed teams.');
