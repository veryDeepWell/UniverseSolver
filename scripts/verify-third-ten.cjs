const assert=require('node:assert/strict');global.window=global;
require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');
const E=HSR_TEAM,D=HSR_DATA,ids=['1221','1222','1225','1307','1308','1401','1403','1405','1406','1410'];
const scene={targets:3,cycles:1,initialSP:3,energyPercent:0,seed:42,allowPartial:true};
const p=(id,extra={})=>({...E.defaults(id,D),hp:5000,baseHP:1000,atk:1000,baseAtk:500,def:2000,baseDef:500,speed:100,baseSpeed:100,crit:0,critDamage:0,...extra});
const fight=(team,profiles={},s={})=>E.simulate(team,Object.fromEntries(team.map(id=>[id,p(id,profiles[id])])),{...scene,...s},D,true);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
assert.equal(Object.keys(E.models).length,98);assert.ok(ids.every(id=>D.characters[id].rarity===5));
// Yunli has no incoming attacks, but a missed Parry still produces Slash;
// her trace replaces the next missed Slash with Cull. Two stored charges
// spend 120 each, not the full 240 energy bar.
const yun=fight(['1221'],{'1221':{speed:1}},{energyPercent:100});assert.equal(yun.breakdown[0].ults,2);assert.equal(yun.breakdown[0].followups,2);assert.ok(yun.events.some(e=>e.label==='Интуит · Вырубка'));assert.ok(yun.events.some(e=>e.label==='Интуит · Истребление'));assert.equal(yun.events.filter(e=>e.label==='Интуит · дополнительный удар').length,6);
// Fuyuan is summoned by Skill (no automatic Technique), uses SPD 90,
// advances 20%, has independent action counts, and generates no Energy.
const ling=fight(['1222'],{}, {cycles:2});const fu=ling.events.find(e=>e.label==='Фуюань · бонус-атака');close(fu.time,100+8000/90);close(fu.damage,750*3);close(ling.breakdown[0].energy,60);
const be=fight(['1222'],{'1222':{breakEffect:2}},{cycles:2});close(be.initialStats['1222'].atk,1250);
const emergency=fight(['1205','1222'],{'1205':{speed:150},'1222':{speed:160}},{cycles:8});assert.ok(emergency.events.some(e=>e.label==='Фуюань · экстренное действие'));
// No toughness bar means Fugue cannot invent Break/Super Break damage.
const fugue=fight(['1225'],{}, {cycles:2});close(fugue.total,2000);assert.equal(fugue.finalSP,4);assert.ok(!fugue.events.some(e=>e.kind==='dot'));
// Black Swan: initial Arcana at guaranteed chance, Wind DoT, EHR->DMG.
const swan=fight(['1307'],{'1307':{speed:1,effectHit:1}},{targets:1});close(swan.total,2400*1.6);
const epiphany=fight(['1307'],{'1307':{speed:1,effectHit:1}},{targets:1,cycles:2,energyPercent:100});close(epiphany.total,1200*1.6+2*2400*1.6*1.25);
const det=fight(['1307','1005','1410'],{'1307':{effectHit:1},'1410':{effectHit:1}},{cycles:8});assert.ok(det.events.some(e=>e.actor==='1307'&&e.label==='Подрыв DoT'));assert.ok(det.events.some(e=>e.label==='Зона Гисиленсы · DoT'));
// Acheron starts with five at all Energy settings; ERR does not restore
// Slashed Dream. SW Skill + Bug is one charge, not two debuffs/charges.
const a0=fight(['1308'],{'1308':{speed:1,policy:'basic'}},{energyPercent:0}),a100=fight(['1308'],{'1308':{speed:1,policy:'basic',energyRegen:2}},{energyPercent:100});assert.equal(a0.breakdown[0].resource,5);assert.equal(a100.breakdown[0].resource,5);assert.equal(a100.breakdown[0].energy,0);
const unique=fight(['1308','1006'],{'1308':{speed:1},'1006':{speed:200,effectHit:1}});assert.equal(unique.breakdown.find(a=>a.id==='1308').resource,8);assert.equal(unique.breakdown.find(a=>a.id==='1308').ults,0);
const ach=fight(['1308','1006','1218','1307'],{'1006':{effectHit:1},'1307':{effectHit:1},'1218':{effectHit:1.4}},{cycles:5});assert.ok(ach.breakdown.find(a=>a.id==='1308').ults>0);assert.equal(ach.events.filter(e=>e.label==='Ядро грома · дополнительный удар').length,6*ach.breakdown.find(a=>a.id==='1308').ults);
// The Herta: one initial Interpretation per enemy and 25 on the first
// wave; initial Answer increases ultimate coefficient 2 -> 2.26.
const herta=fight(['1401'],{}, {targets:1,energyPercent:100});close(herta.events.find(e=>e.label==='Ульта Великой Герты').damage,2260);assert.ok(herta.events.some(e=>e.label==='Герта · завершение усиленного навыка'&&e.time===0));
const fixedEnergy=fight(['1401'],{'1401':{speed:1,energyRegen:2}},{targets:1,energyPercent:100});close(fixedEnergy.breakdown[0].energy,76);
const duo=fight(['1401','1013'],{}, {cycles:1});close(duo.initialStats['1401'].critDamage,.8);close(duo.initialStats['1013'].critDamage,.8);
// Tribbie Basic uses HP, her own Ultimate never triggers E6's extra FUA.
const tri=fight(['1403'],{'1403':{policy:'basic',atk:9999}});close(tri.total,3000);
const triUlt=fight(['1403'],{'1403':{speed:1}},{energyPercent:100});close(triUlt.total,5450*(.3*3+.12*3)*1.3);assert.equal(triUlt.breakdown[0].followups,0);
const ultTriggers=fight(['1302','1403'],{'1302':{speed:1},'1403':{speed:1}},{energyPercent:100});assert.equal(ultTriggers.breakdown.find(a=>a.id==='1403').followups,1);
// Anaxa: all seven weaknesses enable one free Skill, but never recursion.
const ana=fight(['1405']);close(ana.total,2*5*.7*1000*1.9);assert.equal(ana.events.filter(e=>e.label==='Анакса · попадание').length,10);assert.equal(ana.finalSP,2);close(ana.breakdown[0].energy,60);
const anaBasic=fight(['1405'],{'1405':{policy:'basic'}});close(anaBasic.total,1300+5*.7*1000*1.9);assert.equal(anaBasic.finalSP,4);
// Cipher records actual post-mitigation non-True damage, including her
// own FUA. It cannot record true damage or amplify it a second time.
const bank=fight(['1105','1406'],{'1406':{speed:50}});close(bank.breakdown.find(a=>a.id==='1406').recorded,(1400+2100)*.12);
const paid=fight(['1220','1406'],{'1406':{speed:170,critDamage:2}},{cycles:8,energyPercent:50});for(const e of paid.events.filter(e=>e.label.startsWith('Цифер · запись '))){const stored=Number(e.label.slice('Цифер · запись '.length)),trueDamage=paid.events.filter(t=>t.actor==='1406'&&t.time===e.time&&t.kind==='true').reduce((n,t)=>n+t.damage,0);close(trueDamage,stored);}
// Hysilens begins with a zone and +1 SP. One Skill applies one DOT per
// enemy; each natural tick receives exactly one non-recursive zone tick.
const hysi=fight(['1410']);close(hysi.total,5040+3*(300+960));assert.equal(hysi.finalSP,3);assert.equal(hysi.events.filter(e=>e.label==='Зона Гисиленсы · DoT').length,3);
for(const id of ids){const profiles={[id]:p(id),'1220':p('1220')},s={...scene,cycles:5},before=JSON.stringify(profiles),a=E.simulate([id,'1220'],profiles,s,D,true),b=E.simulate([id,'1220'],profiles,s,D,true);assert.deepEqual(a,b);assert.equal(JSON.stringify(profiles),before);assert.ok(a.total>0&&a.events.every(e=>Number.isFinite(e.damage)&&e.sp>=0&&e.sp<=a.maxSP));const input={characterId:id,profile:profiles[id],context:['1220'],contextProfiles:profiles,position:0,focus:'1220',caverns:['102','117'],planars:['306','309'],mixed:true,scenario:{...s,externalDebuffs:0}},search=HSR_SETS.createSearch(input,D);let r;do{r=search.step(3);}while(!r.done);assert.equal(r.checked,6);}
for(const team of [['1308','1307','1410','1222'],['1401','1405','1403','1222'],['1406','1314','1309','1403'],['1221','1403','1217','1222']]){const r=fight(team,{}, {cycles:10,energyPercent:100,targets:5});assert.ok(r.events.every((e,i)=>Number.isFinite(e.damage)&&e.sp>=0&&e.sp<=r.maxSP&&(i===0||e.time>=r.events[i-1].time-1e-8)));assert.ok(r.breakdown.every(a=>a.currentHP>0&&a.currentHP<=a.maxHP));}
console.log('Third ten verified: Parry expiry, Fuyuan, Arcana/Epiphany, unique Acheron debuff charges, Interpretation, Tribbie ult triggers, Anaxa free Skill, Cipher True damage, Hysilens DoT, fixed-context set ranking and mixed teams.');
