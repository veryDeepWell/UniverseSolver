const assert=require('node:assert/strict');global.window=global;
require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');
const T=HSR_TEAM,D=HSR_DATA,S=HSR_SETS;
const ids=['1014','1015','1404','1412','1414','1201','1207','1215','1223','1224'];
const scene={targets:1,cycles:1,initialSP:3,energyPercent:0,seed:42,allowPartial:true,toughness:0};
const profile=(id,extra={})=>({...T.defaults(id,D),hp:8000,baseHP:1200,atk:1000,baseAtk:500,def:1000,baseDef:500,speed:100,baseSpeed:100,crit:0,critDamage:0,breakEffect:0,...extra});
const fight=(team,extra={},sc={})=>T.simulate(team,Object.fromEntries(team.map(id=>[id,profile(id,extra[id])])),{...scene,...sc},D,true);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
assert.equal(Object.keys(T.models).length,98);ids.forEach(id=>assert.ok(T.models[id]));
// Archer spends 2 SP per active Skill. The first two Skills in one turn
// have +0%/+100% skill damage. E0 cannot refund the E1's two extra SP.
const archer=fight(['1015'],{},{initialSP:5});
assert.equal(archer.maxSP,7);assert.equal(archer.finalSP,1);
const circuit=archer.events.filter(e=>e.label.startsWith('Арчер · навык'));
assert.equal(circuit.length,2);near(circuit[0].damage,3600);near(circuit[1].damage,7200);near(archer.total,10800);assert.equal(archer.breakdown[0].turns,1);
const both=fight(['1015','1306'],{'1306':{speed:1}},{energyPercent:100,initialSP:5});
assert.equal(both.maxSP,9);assert.equal(both.events.filter(e=>e.label.startsWith('Арчер · навык')).length,4);
const archerFua=fight(['1015','1009'],{'1015':{speed:1,policy:'basic'},'1009':{speed:100,policy:'basic'}});
assert.equal(archerFua.breakdown[0].followups,1);near(archerFua.events.find(e=>e.label==='Арчер · бонус-атака').damage,2280);assert.equal(archerFua.finalSP,5);
// Saber starts with >=60% energy. External energy can reach 480, and
// her Ultimate spends 360 rather than discarding the 120 overflow.
const saber=fight(['1014'],{'1014':{speed:1}});near(saber.breakdown[0].energy,216);assert.equal(saber.breakdown[0].resource,1);
const overflow=fight(['1014','1313','1202'],{'1014':{speed:1},'1313':{speed:1},'1202':{speed:1}},{energyPercent:100});
near(overflow.events.find(e=>e.label==='Экскалибур').energy,125);assert.equal(overflow.events.filter(e=>e.label==='Экскалибур · отскок').length,10);
const golden=fight(['1014'],{},{energyPercent:100});assert.ok(golden.events.some(e=>e.label==='Отпущенный золотой скипетр'));assert.ok(!golden.events.some(e=>e.label==='Сэйбер · навык'));assert.equal(golden.finalSP,4);
// Mydei loses CURRENT HP, scales from MAX HP, gains charge from actual
// HP lost and cannot obtain charge from nonexistent enemy attacks.
const mydei=fight(['1404']);near(mydei.breakdown[0].currentHP,4000);near(mydei.breakdown[0].resource,50);near(mydei.events.find(e=>e.label==='Мидей · навык').damage,7200);
const vengeance=fight(['1404','1203'],{'1404':{speed:150},'1203':{speed:140}},{cycles:10,energyPercent:100});
assert.ok(vengeance.events.some(e=>e.label==='Кровная месть · продвижение 100%'));
assert.ok(vengeance.events.some(e=>e.label==='Убить бога, чтобы стать богом'));near(vengeance.breakdown[0].maxHP,12000);assert.ok(vengeance.breakdown[0].currentHP>0);
// Cerydra's copy is BEFORE the original, does not spend a second SP,
// and does not generate the copied Skill's base 30 Energy. Both retain
// Peerage's Skill crit bonus while a new Charge comes from the original.
const coup=fight(['1102','1412'],{'1412':{speed:180},'1102':{crit:1}},{cycles:8,energyPercent:100,initialSP:5});
const at=coup.events.findIndex(e=>e.label.startsWith('Внезапная атака'));assert.ok(at>=0);
const time=coup.events[at].time,copyPair=coup.events.slice(at+1).filter(e=>e.time===time&&e.actor==='1102'&&e.label==='Навык Зеле');
assert.equal(copyPair.length,2);near(copyPair[1].energy-copyPair[0].energy,30);assert.equal(copyPair[0].sp,copyPair[1].sp);assert.ok(copyPair.every(e=>e.damage>0));
// Reciprocal converted ATK buffs cannot recursively feed themselves.
for(const team of [['1412','1414','1309','1203'],['1414','1412','1309','1203']])assert.ok(Number.isFinite(fight(team,{}, {cycles:5,energyPercent:100}).total));
// The Souldragon has its own SPD-165 clock. It is first summoned by the
// Skill (no free Technique), and two enhanced actions are available.
const dragon=fight(['1414'],{},{cycles:3,energyPercent:100});
const firstDragon=dragon.events.find(e=>e.label.startsWith('Душа дракона · ход'));
near(firstDragon.time,60+10000/165);assert.equal(dragon.breakdown[0].followups,2);assert.ok(dragon.breakdown[0].shield<=1890);
const summoned=fight(['1414','1313'],{'1414':{speed:100},'1313':{speed:100}},{cycles:3,energyPercent:100,focus:'1414'});
assert.ok(summoned.events.some(e=>e.label==='Душа дракона · бонус-атака'));
// Qingque's Ultimate supplies the hand; E0's Enhanced Basic gives no SP,
// uses +72% base ATK, and has no E4 follow-up or E6 refund.
const qq=fight(['1201'],{},{targets:3,energyPercent:100});
near(qq.events.find(e=>e.label==='Вишенка на торте!').damage,2.4*1360);assert.equal(qq.finalSP,3);assert.equal(qq.breakdown[0].followups,0);
const qqA=fight(['1201','1009'],{},{cycles:5}),qqB=fight(['1201','1009'],{},{cycles:5});assert.deepEqual(qqA.events,qqB.events);assert.ok(qqA.events.some(e=>e.label.startsWith('Цинцюэ · добор')));
// Yukong's own Skill turn does not consume a Bowstring; the following
// ally turn does. Hanya counts attacks, not each hit of Asta's bounce.
const yk=fight(['1002','1207'],{'1207':{speed:200}},{cycles:1});
const bow=yk.events.filter(e=>e.label.startsWith('Ревущая тетива · осталось'));
assert.ok(bow.length>=2);near(bow[0].time,100);assert.ok(bow[0].label.endsWith('1'));assert.ok(bow[1].label.endsWith('0'));
const hanya=fight(['1002','1215'],{'1215':{speed:200}},{cycles:2});
near(hanya.events.find(e=>e.label==='Ханья · Ноша').damage,3120);near(hanya.events.find(e=>e.label==='Ноша · возврат SP 1/2').time,100);assert.ok(hanya.events.some(e=>e.label==='Ноша · возврат SP 2/2'));
// Moze cannot use his Skill alone. Departed pauses his regular turns;
// allied follow-ups can use all nine charges and make him reappear.
assert.ok(!fight(['1223'],{}, {cycles:3}).events.some(e=>e.label==='Отсутствие · 9 зарядов'));
const moze=fight(['1223','1220','1112','1304'],{}, {cycles:6,energyPercent:50});
assert.ok(moze.events.some(e=>e.label.startsWith('Отсутствие · окончание')));assert.ok(moze.breakdown[0].followups>=3);
// March's master is the eligible focus; seven charges advance her by
// 100%. The next enhanced basic contains 3..6 or 5..8 seeded hits.
const march=fight(['1220','1224','1309','1203'],{}, {cycles:6,energyPercent:100,focus:'1220'});
assert.ok(march.events.some(e=>e.label==='Учитель → Фэйсяо'));assert.ok(march.events.some(e=>e.label==='Март 7 · продвижение 100%'));
const hits=march.events.filter(e=>/^Март 7 · \d+ усиленных ударов$/.test(e.label)).map(e=>Number(e.label.split(' · ')[1].split(' ')[0]));assert.ok(hits.length>0&&hits.every(n=>n>=3&&n<=8));
// Every new model runs in full teams on 1/3/5 targets, with and without
// toughness. Logs conserve damage; input sheets and fixed seeds are stable.
for(const id of ids)for(const targets of [1,3,5])for(const toughness of [0,120]){
  const team=[id,...['1412','1414','1203'].filter(x=>x!==id)].slice(0,4);if(team.length<4)team.push('1309');
  const profiles=Object.fromEntries(team.map(x=>[x,profile(x,{atk:2500,speed:140,crit:.5,critDamage:1,breakEffect:1})])),before=JSON.stringify(profiles),sc={...scene,targets,toughness,cycles:5,energyPercent:50,focus:id};
  const a=T.simulate(team,profiles,sc,D,true),b=T.simulate(team,profiles,sc,D,false);near(a.total,b.total);assert.ok(a.total>0&&Number.isFinite(a.total),id);near(a.total,a.events.reduce((n,e)=>n+e.damage,0));near(a.total,a.breakdown.reduce((n,e)=>n+e.damage,0));near(a.total,a.damageByTarget.reduce((n,e)=>n+e,0));assert.equal(JSON.stringify(profiles),before);assert.ok(a.finalSP>=0&&a.finalSP<=a.maxSP);
}
// Full enumeration oracle for a new carry with the new support/summon.
const input={characterId:'1014',profile:profile('1014'),context:['1412','1414','1203'],contextProfiles:{},position:0,focus:'1014',caverns:['102','111','120'],planars:['307','318'],mixed:true,scenario:{...scene,cycles:3,toughness:120,externalDebuffs:0}};
const search=S.createSearch(input,D);let result;do{result=search.step(2);}while(!result.done);
const oracle=S.packs(input.caverns,input.planars,true,D,'1014').map(pack=>S.run(input,pack,D).total).sort((a,b)=>b-a);assert.equal(result.checked,12);result.top.forEach((r,i)=>near(r.total,oracle[i]));
assert.equal(HSR_EQUIPMENT.supportsFour('115','1223'),false);
console.log('Fourth ten verified: 98 entries, Saber overflow, Archer SP chains, Mydei HP/extra actions, Cerydra copy before original, Souldragon timeline, Qingque hand, Yukong/Hanya timing, Moze absence, March charges, conservation, seeded 1/3/5-target fights and exhaustive set rankings.');
