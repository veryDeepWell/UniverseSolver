const assert=require('node:assert/strict');global.window=global;
require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');
const T=HSR_TEAM,D=HSR_DATA,S=HSR_SETS,G=HSR_EQUIPMENT;
const newIds=['1402','1407','1409','1408','8001','8003','1001','1008','1110','1312'];
const scene={targets:1,cycles:1,initialSP:3,energyPercent:0,seed:42,allowPartial:true,toughness:0};
const p=(id,x={})=>({...T.defaults(id,D),hp:5000,baseHP:1000,atk:1000,baseAtk:500,def:2000,baseDef:500,speed:100,baseSpeed:100,crit:0,critDamage:0,breakEffect:0,...x});
const fight=(ids,extra={},sc={})=>T.simulate(ids,Object.fromEntries(ids.map(id=>[id,p(id,extra[id])])),{...scene,...sc},D,true);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
assert.equal(Object.keys(T.models).length,98);newIds.forEach(id=>assert.ok(T.models[id]));
// Separate Paths/forms cannot be assembled into an impossible team. Pools
// may contain alternatives; the search must filter the combinations instead.
assert.throws(()=>fight(['8001','8005']),/один Путь/);assert.throws(()=>fight(['1001','1224']),/один Путь/);
assert.throws(()=>T.createSearch(['8001','8003'],['1203','1313'],{},scene,D),/один Путь/);
const pool=['8001','8003','8005','1001','1224','1203'];
const permitted=T.combinations(pool,3).filter(ids=>ids.filter(id=>['8001','8003','8005'].includes(id)).length<=1&&!(ids.includes('1001')&&ids.includes('1224')));
const domain=T.createSearch(['1015'],pool,{},scene,D);assert.equal(domain.total,permitted.length);let ranking;do{ranking=domain.step(3);}while(!ranking.done);assert.ok(ranking.top.every(r=>T.compatible(r.ids)));
// Arlan's free Skill spends MAX HP, increases damage by the actual missing
// HP fraction, and neither consumes nor restores SP. No invented kills.
const arlan=fight(['1008'],{},{initialSP:0});near(arlan.breakdown[0].currentHP,4250);assert.equal(arlan.finalSP,0);near(arlan.events.find(e=>e.label==='Арлан · навык без SP').damage,2400*1.108);
// Physical Trailblazer's trace only boosts the designated target. The
// Ultimate picks single target at N=1, blast otherwise.
const phys=fight(['8001'],{},{targets:3});near(phys.total,1562.5+1250*2);
const singleUlt=fight(['8001'],{'8001':{speed:1}},{energyPercent:100});near(singleUlt.total,4500);
const blastUlt=fight(['8001'],{'8001':{speed:1}},{energyPercent:100,targets:3});near(blastUlt.total,3375+1620*2);
const fire=fight(['8003'],{'8003':{speed:1}},{energyPercent:100});near(fire.total,4000);near(fire.breakdown[0].shield,200);
const march=fight(['1001']);near(march.breakdown[0].shield,1900);assert.equal(march.breakdown[0].followups,0);
const lynx=fight(['1110'],{'1110':{policy:'skill'}});near(lynx.breakdown[0].maxHP,5575);near(lynx.breakdown[0].currentHP,5575);
const lynxHeal=fight(['1008','1110'],{'1008':{speed:140},'1110':{speed:150}},{cycles:5});assert.ok(lynxHeal.events.some(e=>e.actor==='1110'&&e.label.startsWith('Лечение')));
const misha=fight(['1312'],{},{energyPercent:100});assert.equal(misha.events.filter(e=>e.label.startsWith('Миша · удар ульты')).length,3);assert.equal(misha.breakdown[0].resource,5);assert.ok(misha.events.some(e=>e.label==='Заморозка · урон'));
// Garmentmaker is a genuine independent entity, immediately summoned, with
// skill level 6 scalings (110% / 66%), not the unused level-10 rows.
const ag=fight(['1402'],{},{cycles:3});const first=ag.events.find(e=>e.label==='Швея · Колючая ловушка');near(first.damage,1100);near(first.time,100);const second=ag.events.filter(e=>e.label==='Швея · Колючая ловушка')[1];near(second.time,100+10000/90);
assert.ok(ag.memories[0].speed>35);assert.equal(ag.breakdown[0].followups,0);
const supreme=fight(['1402'],{},{energyPercent:100});near(supreme.events.find(e=>e.label==='Тысячекратный поцелуй · Аглая').damage,3692);assert.ok(supreme.events.some(e=>e.label==='Швея · совместная базовая'));assert.ok(supreme.events.some(e=>e.label==='Высшая форма · Швея исчезает'));
// Bronya's personal Skill buff must not silently become a memosprite buff;
// her native teamwide 10% damage is present in both control scenarios.
const agBronyaSkill=fight(['1402','1101'],{'1101':{policy:'skill'}},{cycles:1});
const agBronyaBasic=fight(['1402','1101'],{'1101':{policy:'basic'}},{cycles:1});
near(agBronyaSkill.events.find(e=>e.label==='Швея · Колючая ловушка').damage,agBronyaBasic.events.find(e=>e.label==='Швея · Колючая ловушка').damage);
// Castorice's normal and joint Skills are SP-neutral. Overhealing charges
// Newbud, with a strict 4080-per-unit cap in one action. No ERR conversion.
const cast=fight(['1407'],{},{initialSP:0});near(cast.events.find(e=>e.label==='Кастория · навык').damage,3000);assert.equal(cast.finalSP,0);assert.equal(cast.breakdown[0].energy,0);
const overheal=fight(['1407','1301'],{'1407':{speed:1,baseSpeed:1,policy:'basic'},'1301':{policy:'skill'}});near(overheal.breakdown[0].resource,1600);
const cap=fight(['1407','1203'],{'1407':{speed:1,baseSpeed:1,policy:'basic'},'1203':{atk:50000,policy:'skill'}});near(cap.breakdown[0].resource,4080);
const team=['1407','1409','1203','1403'],drainProfiles=Object.fromEntries(team.map(id=>[id,p(id,{hp:8000,speed:140})]));
const castBurst=T.simulate(team,drainProfiles,{...scene,cycles:6,targets:3,energyPercent:100,toughness:120},D,true);
const count=castBurst.breakdown[0].ults;assert.ok(count>0);assert.equal(castBurst.events.filter(e=>/^Крылья Смерти · дыхание /.test(e.label)).length,count*4);assert.equal(castBurst.events.filter(e=>e.label==='Крылья Смерти · завершение').length,count*6);
assert.ok(castBurst.events.some(e=>e.memory.includes('Ика')));assert.ok(castBurst.events.some(e=>e.memory.includes('Крылья Смерти')));
// Little Ica has SPD 0. Its attacks are extra actions after Hyacine's
// abilities under After Rain. Healing tally includes overheal and halves.
const hy=fight(['1409'],{'1409':{policy:'basic'}},{energyPercent:100});const clouds=hy.events.filter(e=>e.label==='Ика · Тучи прочь!');near(clouds[0].damage,903.76);near(clouds[1].damage,451.88);assert.equal(hy.memories[0].speed,0);near(hy.memories[0].maxHP,3850);assert.ok(hy.memories[0].turns>=2);
const wounded=fight(['1008','1409'],{'1008':{speed:140},'1409':{speed:150}},{cycles:5,energyPercent:100});assert.ok(wounded.events.some(e=>e.actor==='1409'&&e.label.startsWith('Лечение Арлан')));
// Eight Phainon extra actions cover one fixed countdown. The first is at
// entry, the other seven split 10000/(0.6*base SPD); ordinary turns and
// foreign summons stop. Buff durations do not tick on those extra actions.
const ph=fight(['1408','1313','1412','1202'],{}, {cycles:7,energyPercent:100,initialSP:5});
const entry=ph.events.findIndex(e=>e.label==='Каослана · союзники покидают поле'),exit=ph.events.findIndex((e,i)=>i>entry&&e.label==='Каослана · союзники возвращаются');assert.ok(entry>=0&&exit>entry);
const interval=ph.events.slice(entry,exit+1),special=interval.filter(e=>/^Каослана · действие /.test(e.label));assert.equal(special.length,8);near(special[0].time,ph.events[entry].time);near(special[7].time-special[0].time,10000/60);assert.ok(interval.filter(e=>['attack','followup'].includes(e.kind)).every(e=>e.actor==='1408'));assert.ok(interval.some(e=>e.label==='Каослана · последний удар'));assert.ok(interval.every(e=>e.sp===ph.events[entry].sp));
const pFast=fight(['1408','1313','1412','1202'],{'1408':{speed:180}},{cycles:7,energyPercent:100,initialSP:5});const fastTimes=pFast.events.filter(e=>/^Каослана · действие /.test(e.label)).slice(0,8);near(fastTimes[7].time-fastTimes[0].time,10000/60);
// All ten, independent damage conservation and seeded fights, with and
// without toughness, and against both one and five enemies.
for(const id of newIds)for(const targets of [1,5])for(const toughness of [0,120]){
  const ids=[id,'1409','1313','1203'].filter((v,i,a)=>a.indexOf(v)===i);if(ids.length<4)ids.push('1403');
  const profiles=Object.fromEntries(ids.map(x=>[x,p(x,{hp:8000,atk:2500,speed:140,crit:.5,critDamage:1,breakEffect:1})])),before=JSON.stringify(profiles),sc={...scene,cycles:5,targets,toughness,energyPercent:50,focus:id};
  const a=T.simulate(ids,profiles,sc,D,true),b=T.simulate(ids,profiles,sc,D,false);assert.ok(Number.isFinite(a.total)&&a.total>0,id);near(a.total,b.total);near(a.total,a.events.reduce((n,e)=>n+e.damage,0));near(a.total,a.breakdown.reduce((n,e)=>n+e.damage,0));near(a.total,a.damageByTarget.reduce((n,e)=>n+e,0));assert.equal(JSON.stringify(profiles),before);assert.ok(a.finalSP>=0&&a.finalSP<=a.maxSP);assert.ok(a.memories.every(m=>m.hp>=0&&m.hp<=m.maxHP+1e-6));
}
// Memory sets and healing planar are searchable rather than quietly ignored.
assert.ok(['123','125','127'].every(id=>G.cavern4.includes(id)));assert.ok(G.planar.includes('320'));
const input={characterId:'1402',profile:p('1402'),context:['1409','1313','1203'],contextProfiles:{},position:0,focus:'1402',caverns:['123','127'],planars:['318','320'],mixed:true,scenario:{...scene,cycles:3,toughness:120,externalDebuffs:0}};
const search=S.createSearch(input,D);let out;do{out=search.step(2);}while(!out.done);assert.equal(out.checked,6);const oracle=S.packs(input.caverns,input.planars,true,D,'1402').map(pack=>S.run(input,pack,D).total).sort((a,b)=>b-a);out.top.forEach((r,i)=>near(r.total,oracle[i]));
const invalid={...input,characterId:'8001',focus:'8001',profile:p('8001'),context:['8005']};assert.throws(()=>S.createSearch(invalid,D),/один Путь/);
console.log('Fifth ten verified: 98 entries, level-6 memosprites, independent HP/SPD, joint attacks, overheal caps, Ica tally, Phainon 8-action retreat, SP-free Skills, old four-stars, form compatibility, seeded conservation and exhaustive memory-set ranking.');
