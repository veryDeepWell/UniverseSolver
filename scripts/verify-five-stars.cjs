const assert=require('node:assert/strict');
global.window=global;require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');
const E=HSR_TEAM,D=HSR_DATA,newIds=['1004','1302','1212','1303','1309','1306','1203','1211','1104','1208'];
const scene={targets:3,cycles:5,initialSP:3,energyPercent:0,seed:42,allowPartial:true};
function p(id,extra={}){return {...E.defaults(id,D),hp:5000,baseHP:1000,atk:1000,baseAtk:500,def:1000,baseDef:500,speed:100,baseSpeed:100,crit:0,critDamage:0,...extra};}
function fight(ids,extra={},s={}){const profiles=Object.fromEntries(ids.map(id=>[id,p(id,extra[id])]));return E.simulate(ids,profiles,{...scene,...s},D,true);}
function close(a,b){assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);}
assert.equal(Object.keys(E.models).length,98);assert.ok(newIds.every(id=>D.characters[id].rarity===5));
// Original Welt: 3 skill hits, each 72% ATK; Slow guaranteed with EHR.
// Every hit also triggers 60% ATK talent, all with the broken-target trace.
const welt=fight(['1004'],{'1004':{effectHit:1}},{targets:1,cycles:1});
close(welt.total,3*(720+600)*1.2);assert.equal(welt.events.filter(e=>e.label==='Талант Вельта').length,3);
const prison=fight(['1004'],{'1004':{effectHit:1,speed:1}},{targets:1,cycles:1,energyPercent:100});
assert.ok(!prison.events.some(e=>e.actor==='dummy'),'40% delay + 10% Slow delays first turn past 150 AV');
// Full Argenti ultimate: AoE + exactly six random bounces; no invented
// kills, no low-HP bonus, no automatic 90-energy ultimate.
const argenti=fight(['1302'],{}, {cycles:1,energyPercent:100});
close(argenti.events.filter(e=>e.time===0).reduce((n,e)=>n+e.damage,0),2800*3+950*6);
assert.equal(argenti.events.filter(e=>e.label==='Аргенти · отскок ульты').length,6);
const waiting=fight(['1302'],{'1302':{speed:1}},{cycles:1,energyPercent:50});assert.equal(waiting.breakdown[0].ults,0);
// Jingliu: 20 energy normal skill, 30 enhanced, first normal action
// advances 10%; second normal skill enters state and grants a free action.
const jing=fight(['1212','1205'],{'1212':{energyRegen:.1},'1205':{speed:1}},{targets:1,cycles:3});
const normals=jing.events.filter(e=>e.label==='Непостижимая Зарница'),enhanced=jing.events.filter(e=>e.label==='Луна на застывшей реке');
close(normals[0].time,100);close(normals[1].time,190);close(enhanced[0].time,190);
close(enhanced[0].damage,2500+500*1.8*2.5);assert.equal(enhanced[0].sp,1);
assert.ok(jing.events.some(e=>e.label.includes('поглощено HP')));
assert.ok(jing.breakdown.find(a=>a.id==='1205').currentHP<5000);
// Ruan Mei supplies 10% base SPD to other allies, not herself. Her
// skill's 36% cap includes her in-combat 20% BE trace and gear BE.
const meiLow=fight(['1105','1303'],{'1105':{speed:50},'1303':{breakEffect:0}},{cycles:2});
const meiHigh=fight(['1105','1303'],{'1105':{speed:50},'1303':{breakEffect:1.6}},{cycles:2});
close(meiHigh.initialStats['1105'].speed,60);close(meiHigh.initialStats['1303'].speed,100);
const lowBasic=meiLow.events.find(e=>e.actor==='1105'&&e.kind==='attack'),highBasic=meiHigh.events.find(e=>e.actor==='1105'&&e.kind==='attack');
close(highBasic.damage/lowBasic.damage,1.68/1.32);
const meiFraction=fight(['1105','1303'],{'1105':{speed:50},'1303':{breakEffect:1.53}},{cycles:2});
close(meiFraction.events.find(e=>e.actor==='1105'&&e.kind==='attack').damage,1000*1.638);
const station={cavern:['103','103','103','103'],planar:'301'};
const threshold=fight(['1105','1303'],{'1105':{speed:110,equipment:station}},{cycles:1});
close(threshold.initialStats['1105'].speed,120);close(threshold.initialStats['1105'].atk,1120);
// Forge's conditional BE now matters for Ruan Mei's damage buff, even
// though the dummy itself has no break damage. All dummies are Fire-weak.
const forge=fight(['1105','1303'],{'1105':{speed:30},'1303':{breakEffect:1,equipment:{cavern:['103','103','103','103'],planar:'316'}}},{cycles:5});
const allyHits=forge.events.filter(e=>e.actor==='1105'&&e.label==='Базовая атака');
assert.ok(allyHits.some(e=>Math.abs(e.damage-1560)<1e-7),'Forge BE increases Mei skill damage bonus after she attacks');
const meiPen=fight(['1105','1303'],{'1105':{speed:50}},{cycles:2,energyPercent:100});close(meiPen.initialStats['1105'].resPen,0);
close(meiPen.events.find(e=>e.actor==='1105'&&e.kind==='attack').damage,1000*1.25*1.32);
// Robin's fixed SPD-90 countdown is independent of her own speed.
// No basic/skill turns during Concerto. Crit stats cannot change the
// fixed 100% / 150% additional hit, which must not trigger itself.
const robin=fight(['1105','1309'],{'1105':{speed:100},'1309':{speed:200,critDamage:8}},{cycles:2,energyPercent:100});
close(robin.events.find(e=>e.label==='Концерт · окончание').time,10000/90);
const robinHit=robin.events.find(e=>e.label==='Концерт · дополнительный урон');close(robinHit.damage,1.2*(1000+1000*.228+200)*2.5);
assert.ok(!robin.events.some(e=>e.actor==='1309'&&e.label==='Базовая атака'&&e.time<10000/90));
// Sparkle raises the cap to seven and restores four. No-SP spend must
// still produce no Talent stack; a skill triggers one before damage.
const sparkle=fight(['1306','1105'],{'1306':{speed:1},'1105':{speed:1}},{cycles:1,energyPercent:100,initialSP:5});
assert.equal(sparkle.maxSP,7);assert.equal(sparkle.events.find(e=>e.label.includes('+4 SP')).sp,7);
const sparkAdvance=fight(['1002','1306'],{'1002':{speed:50},'1306':{speed:200}},{cycles:1});
assert.ok(sparkAdvance.events.find(e=>e.actor==='1002'&&e.label==='Навык Дань Хэна').time<200);
assert.ok(sparkAdvance.events.every(e=>e.sp>=0&&e.sp<=7));
const stackFight=fight(['1013','1306'],{'1306':{speed:1}},{cycles:3,initialSP:3});
const hertaSkills=stackFight.events.filter(e=>e.label==='Навык Герты');
for(let i=0;i<3;i++)close(hertaSkills[i].damage,D.character_skills['101302'].params[9][0]*1075*(1.45+.06*(i+1))*3);
const sparkCrit=fight(['1013','1306'],{'1013':{speed:50,policy:'basic',crit:1,critDamage:1},'1306':{speed:200,critDamage:2}},{cycles:1});
close(sparkCrit.events.find(e=>e.actor==='1013'&&e.label==='Базовая атака').damage,1075*1.06*2.93);
// Luocha automatically heals HP consumption, spends no SP for the
// trigger, and eventually creates a field that heals after attacks.
const luocha=fight(['1205','1212','1203'],{'1205':{speed:140},'1212':{speed:140},'1203':{speed:120}},{cycles:10,energyPercent:50});
const autos=luocha.events.filter(e=>e.label.startsWith('Автоматическое лечение'));
assert.ok(autos.length>0);assert.ok(luocha.events.some(e=>e.label==='Поле Цветка Бездны · начало'));
assert.ok(luocha.events.some(e=>e.actor==='1203'&&e.label.startsWith('Лечение')));
// Bailu heals two bounces with 15% multiplicative reduction. Overheal
// adds 10% BASE HP, not 10% geared HP, and expires on recipient turns.
const bailu=fight(['1211'],{}, {cycles:1,energyPercent:100});close(bailu.initialStats['1211'].hp,5000);close(bailu.breakdown[0].maxHP,5100);
// Gepard's 35% DEF->ATK is a flat addition, snapshotted on his turn.
// Freeze damage cannot crit; unfreezing advances the next dummy action.
const gepard=fight(['1104'],{'1104':{policy:'skill',effectHit:1,crit:1,critDamage:5}},{cycles:2,energyPercent:100,targets:1});
close(gepard.initialStats['1104'].atk,1350);assert.ok(gepard.events.some(e=>e.label==='Щит Гепарда · 1050.00'));
close(gepard.events.find(e=>e.label==='Заморозка · урон').damage,1350*.6);
assert.ok(gepard.events.some(e=>e.label==='Разморозка · продвижение 50%'));
// Fu Xuan's base attack and ultimate scale on HP, not ATK.
const fu=fight(['1208'],{'1208':{atk:9999}},{cycles:1,energyPercent:100});
close(fu.events.find(e=>e.label==='Ульта Фу Сюань').damage,5000*3);
const fuBasic=fight(['1208'],{'1208':{policy:'basic',atk:9999}},{cycles:1});close(fuBasic.total,5000*.5);
// Each new model runs in the set optimizer and seeded combat, preserving
// input profiles. Pair supports with a fixed DPS so set ranking is meaningful.
for(const id of newIds){
  const profiles={[id]:p(id), '1220':p('1220')},before=JSON.stringify(profiles),ids=[id,'1220'];
  const a=E.simulate(ids,profiles,scene,D,true),b=E.simulate(ids,profiles,scene,D,true);assert.deepEqual(a,b);assert.equal(JSON.stringify(profiles),before);
  assert.ok(Number.isFinite(a.total)&&a.total>0);assert.ok(a.events.every(e=>e.sp>=0&&e.sp<=a.maxSP));
  const input={characterId:id,profile:profiles[id],context:['1220'],contextProfiles:profiles,position:0,focus:'1220',caverns:['102','117'],planars:['306','309'],mixed:true,scenario:{...scene,externalDebuffs:0}};
  const search=HSR_SETS.createSearch(input,D);let result;do{result=search.step(3);}while(!result.done);assert.equal(result.checked,6);assert.ok(result.top.every(r=>Number.isFinite(r.total)));
}
// Mixed supports + HP consumer stresses event ordering and chained effects.
for(const ids of [['1212','1309','1306','1203'],['1205','1208','1211','1303'],['1302','1306','1309','1104']]){
  const a=fight(ids,{}, {cycles:10,energyPercent:100,targets:5});assert.ok(a.events.every((e,i)=>Number.isFinite(e.damage)&&e.sp>=0&&e.sp<=a.maxSP&&(i===0||e.time>=a.events[i-1].time-1e-8)));assert.ok(a.breakdown.every(a=>a.currentHP>0&&a.currentHP<=a.maxHP));
}
console.log('Ten 5-star models verified: original kits, damage formulas, independent Concerto, SP cap/stacks, HP consumption/healing, RES PEN/BE, Freeze, set search and mixed-team reproducibility.');
