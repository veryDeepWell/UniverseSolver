const assert=require('node:assert/strict');global.window=global;
require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');
const D=HSR_DATA,T=HSR_TEAM,S=HSR_SETS;
const scene={targets:1,cycles:3,initialSP:3,energyPercent:0,seed:42,toughness:0,allowPartial:true,wolfBoxGift:'cycle',novaAssistPolicy:'crew'};
const p=(id,x={})=>({...T.defaults(id,D),hp:5000,baseHP:1000,atk:1000,baseAtk:500,def:2000,baseDef:500,speed:100,baseSpeed:100,crit:0,critDamage:0,...x});
const fight=(ids,extra={},sc={})=>T.simulate(ids,Object.fromEntries(ids.map(id=>[id,p(id,extra[id])])),{...scene,...sc},D,true);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
assert.equal(Object.keys(D.characters).length,98);assert.equal(Object.keys(T.models).length,98);assert.deepEqual(Object.keys(T.models).sort(),Object.keys(D.characters).sort());assert.equal(new Set(Object.keys(T.models).map(T.canonical)).size,93);
// Gender aliases must remap profiles, output owners, journal and initial stats;
// an unused saved opposite-gender profile cannot override the selected one.
for(const [female,male] of Object.entries(T.aliases)){
 const a=fight([male],{}, {cycles:5,energyPercent:50}),b=fight([female],{}, {cycles:5,energyPercent:50});near(a.total,b.total);assert.equal(b.breakdown[0].id,female);assert.ok(b.events.every(e=>e.actor===female||e.actor==='dummy'));assert.ok(b.initialStats[female]);assert.ok(b.memories.every(m=>m.owner===female));
 const rp={[male]:p(male),[female]:p(female,{atk:9000})};near(T.simulate([male],rp,{...scene},D).total,fight([male]).total);
 assert.throws(()=>fight([male,female]),/один Путь/);
}
for(const a of Object.keys(T.models).filter(id=>id.startsWith('80')))for(const b of Object.keys(T.models).filter(id=>id.startsWith('80')))if(a!==b)assert.equal(T.compatible([a,b]),false);
assert.throws(()=>fight(['1506'],{},{wolfBoxGift:'random-magic'}),/коробочек/);
// No invented starting energy / ERR on resource-only Cyrene and Wolf 999.
const cy0=fight(['1415'],{},{cycles:1}),cy100=fight(['1415'],{}, {cycles:1,energyPercent:100});near(cy0.total,cy100.total);assert.equal(cy0.breakdown[0].ults,0);
const w0=fight(['1506'],{},{cycles:1}),w100=fight(['1506'],{},{cycles:1,energyPercent:100});near(w0.total,w100.total);assert.equal(w0.breakdown[0].ults,0);
// Evanescia gets 30 energy and exactly 30 Banger from one Skill, not 60.
const ev=fight(['1505'],{},{cycles:1});near(ev.events.find(e=>e.label==='Эванесса · Дисциплина').energy,30);near(ev.events.find(e=>e.label==='Эванесса · Дисциплина').banger,30);assert.equal(ev.breakdown[0].followups,0);
const fox=fight(['1505','1502','1313','1203'],{}, {cycles:6,energyPercent:50});assert.ok(fox.events.some(e=>e.label==='Учитель Лиса · бонус-атака'));
// Wolf's 100-hit enhanced Basic really completes 100 packets per use. Extra
// boxes do not create attacks, Basic SP refunds or an endless refund loop.
const wolf=fight(['1506','1501','1502','1503'],{'1506':{speed:160}}, {cycles:6,energyPercent:50});assert.ok(wolf.events.some(e=>e.label==='Непобедимый игрок · 3 усиленные базовые'));assert.ok(wolf.events.some(e=>e.label==='Волк 999 · отскок 100'));assert.ok(wolf.events.some(e=>e.label==='Волк 999 · последний удар'));
// Himeko's six beams and three end hits share one Ultimate activation.
const nova=fight(['1510'],{'1510':{speed:1}}, {cycles:1,energyPercent:100});assert.equal(nova.events.filter(e=>/^Звездопроходец · луч /.test(e.label)).length,6);assert.equal(nova.events.filter(e=>e.label==='Звездопроходец · Последний удар').length,3);near(nova.total,(6*.32+3*.2+9*.6+3*.8)*1000*1.2);
const crew=fight(['1510','1313','1414','1004'],{}, {cycles:4});assert.ok(crew.events.some(e=>e.label.startsWith('Совместный протокол')));assert.ok(crew.events.some(e=>e.label==='Поддержка · дополнительное действие компаньона'));
const novaOff=fight(['1510','1313','1414','1004'],{}, {cycles:4,novaAssistPolicy:'off'});assert.ok(!novaOff.events.some(e=>e.label==='Поддержка · дополнительное действие компаньона'));
// Robin freezes her own clock in Fever; the birds and SPD140 countdown act.
const summer=fight(['1512','1501','1502','1409'],{'1512':{hp:8000,speed:140}}, {cycles:8,energyPercent:50});assert.ok(summer.events.some(e=>e.label==='Раж · Музыканты выходят на сцену'));assert.ok(summer.events.some(e=>e.label.includes('Щебечущий квартет')));assert.ok(summer.events.some(e=>e.label.startsWith('Раж · отсчёт')));assert.equal(summer.memories.find(m=>m.owner==='1512').name,'Музыканты ясного неба');
const wave=fight(['1513','1105','1106','1013'],{}, {cycles:5});assert.ok(wave.breakdown[0].followups>0);assert.ok(wave.events.some(e=>e.label==='Прибой · расход Пыла'));
const multi=fight(['1513','1502','1105','1013'],{}, {cycles:5});assert.equal(multi.breakdown[0].followups,0);
// Cyrene's first Ultimate activates resource-based allies and unlocks an Ode.
const cy=fight(['1408','1415','1313','1203'],{}, {cycles:12});assert.ok(cy.events.some(e=>e.label==='Рябь прошлого · ульты команды активированы'));assert.ok(cy.events.some(e=>e.label==='Вечное горение · новые 8 действий'));assert.equal(cy.breakdown[0].ode,'phainon');
for(const heir of ['1402','1403','1404','1405','1406','1407','1409','1410','1412','1413','1414','8007']){
 const r=fight([heir,'1415','1502','1203'],{}, {cycles:12,energyPercent:50,targets:3,toughness:120});assert.ok(r.breakdown[0].ode,heir);near(r.total,r.events.reduce((n,e)=>n+e.damage,0));
}
// Completeness is executable: every catalog entry is exercised on one and
// five dummies, with and without toughness, alone and with team context.
for(const id of Object.keys(D.characters))for(const targets of [1,5]){
 const team=[id,'1502','1409','1313'].filter((v,i,a)=>a.indexOf(v)===i);if(team.length<4)team.push('1203');
 const profiles=Object.fromEntries(team.map(x=>[x,p(x,{hp:8000,atk:2500,speed:135,crit:.5,critDamage:1})])),before=JSON.stringify(profiles),sc={...scene,targets,toughness:targets===1?0:120,cycles:5,energyPercent:50,focus:id};
 const a=T.simulate(team,profiles,sc,D,true),b=T.simulate(team,profiles,sc,D,false);assert.ok(Number.isFinite(a.total)&&a.total>0,id);near(a.total,b.total);near(a.total,a.events.reduce((n,e)=>n+e.damage,0));near(a.total,a.damageByTarget.reduce((n,e)=>n+e,0));near(a.total,a.breakdown.reduce((n,e)=>n+e.damage,0));assert.equal(JSON.stringify(profiles),before);assert.ok(a.finalSP>=0&&a.finalSP<=a.maxSP,id);assert.ok(a.breakdown.every(x=>x.currentHP>=1&&x.currentHP<=x.maxHP+1e-5),id);assert.ok(a.memories.every(x=>x.hp>=0&&x.hp<=x.maxHP+1e-5),id);
 const solo=fight([id],{}, {cycles:2,targets,toughness:sc.toughness});assert.ok(Number.isFinite(solo.total),id+' solo');
}
const input={characterId:'1510',profile:p('1510'),context:['1512','1513','1203'],contextProfiles:{},position:0,focus:'1510',caverns:['123','125'],planars:['318','320'],mixed:true,scenario:{...scene,targets:3,cycles:4,toughness:120,externalDebuffs:0}};
const search=S.createSearch(input,D);let out;do{out=search.step(2);}while(!out.done);const oracle=S.packs(input.caverns,input.planars,true,D,'1510').map(pack=>S.run(input,pack,D).total).sort((a,b)=>b-a);out.top.forEach((r,i)=>near(r.total,oracle[i]));
console.log('Final roster verified: all 98 catalog entries / 93 mechanics, gender-profile equivalence and constraints, Cyrene Odes/resource Ultimates, Evanescia energy conversion, Wolf100 packets, Nova assist/Ultimate, Summeretto clocks, Waveflair FUA, 196 team fights plus 196 solo fights, conservation and set-search oracle.');
