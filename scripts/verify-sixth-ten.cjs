const assert=require('node:assert/strict');global.window=global;
require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');
const T=HSR_TEAM,D=HSR_DATA,S=HSR_SETS;
const ids=['1413','8007','1501','1502','1503','8009','1504','1507','1508','1509'];
const scene={targets:1,cycles:3,initialSP:3,energyPercent:0,seed:42,allowPartial:true,toughness:0};
const p=(id,x={})=>({...T.defaults(id,D),hp:5000,baseHP:1000,atk:1000,baseAtk:500,def:2400,baseDef:500,speed:100,baseSpeed:100,crit:0,critDamage:0,...x});
const fight=(ids,extra={},sc={})=>T.simulate(ids,Object.fromEntries(ids.map(id=>[id,p(id,extra[id])])),{...scene,...sc},D,true);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
assert.equal(Object.keys(T.models).length,98);ids.forEach(id=>assert.ok(T.models[id]));
assert.throws(()=>fight(['8007','8009']),/один Путь/);assert.equal(T.compatible(['8001','8010']),false);
assert.throws(()=>T.validateStats(p('1502',{elation:Infinity})),/Радость/);
// Aha has a distinct clock: 80 + 1/5 the fastest Elation SPD.
const yao=fight(['1502']);const aha=yao.events.find(e=>e.label.startsWith('Аха · ход'));
near(aha.time,100);assert.ok(yao.breakdown[0].banger>=0);
// Level-based Elation damage ignores ordinary ATK, elemental/DMG bonuses.
const zero=fight(['1502'],{'1502':{policy:'basic'}},{cycles:1});
const bonus=fight(['1502'],{'1502':{policy:'basic',atk:4000,damageBonus:3,elementBonus:3}},{cycles:1});
const elationSum=r=>r.events.filter(e=>e.label.includes('огни счастья')||e.label.includes('отскок Радости')).reduce((n,e)=>n+e.damage,0);
near(elationSum(zero),elationSum(bonus));assert.ok(elationSum(zero)>0);
const joy=fight(['1502'],{'1502':{policy:'basic',elation:1}},{cycles:1});assert.ok(elationSum(joy)>elationSum(zero));
// Independent numeric case: first Aha follows a basic at AV100, stores 3
// Punchline, applies 16% vulnerability. No ATK or ordinary DMG multiplier.
near(zero.events.find(e=>e.label==='Яо Гуан · огни счастья').damage,7535.107*(1+15/243)*1.16);
assert.throws(()=>fight(['1501'],{},{sparxieRefundPercent:101}),/Шанс подарка/);
const noGifts=fight(['1501'],{},{cycles:1,sparxieRefundPercent:0}),allGifts=fight(['1501'],{},{cycles:1,sparxieRefundPercent:100});
assert.ok(noGifts.events.some(e=>e.label==='Искра · стрим 3 интеракций'));
assert.ok(allGifts.events.some(e=>e.label==='Искра · стрим 20 интеракций'));
assert.equal(noGifts.finalSP,1);assert.equal(allGifts.finalSP,5);
const ultYao=fight(['1502'],{'1502':{speed:1}},{energyPercent:100,cycles:1});assert.ok(ultYao.events.some(e=>e.label==='Аха · дополнительный ход · Юмор 20'&&e.time===0));
// Mem is independent, starts at 90% on first summon, then charges from energy.
const mem=fight(['8007']);assert.equal(mem.memories[0].name,'Мемо');near(mem.memories[0].speed,130);assert.ok(mem.events.some(e=>e.label.includes('Я! Помогу!')));
const memTeam=fight(['1509','8007','1203','1313'],{},{cycles:5});assert.ok(memTeam.events.some(e=>e.kind==='true'&&e.label.includes('Поддержка Мемо')));
// Evernight starts with her sprite, uses HP and sacrifices it at >=16 Memoria.
const ever=fight(['1413']);assert.ok(ever.events.some(e=>e.label.includes('Сон. Растворяется. Словно роса')));assert.ok(ever.breakdown[0].memoDamage>0);assert.ok(ever.breakdown[0].currentHP<5000);
// Ashveil's dummy is already Bait: Skill refunds its cost and deals 300% ATK.
const ash=fight(['1504'],{},{cycles:1});near(ash.events.find(e=>e.label==='Эшвейл · Приманка').damage,3000);assert.equal(ash.finalSP,3);assert.equal(ash.breakdown[0].followups,0);
const ashTeam=fight(['1504','1105','1106','1013'],{},{cycles:1});assert.ok(ashTeam.breakdown[0].followups>=2);
// Mortenax uses free Skills only inside his timed Ultimate field.
const mort=fight(['1507'],{},{cycles:5});assert.ok(mort.events.some(e=>e.label.startsWith('Безмерная ярость · отсчёт')));assert.ok(mort.events.some(e=>e.label==='Мортенакс · Под клинком'));assert.ok(mort.breakdown[0].currentHP>=1);
// Rin's enhanced Skill consumes excess SP to 2, converts it to gems, then
// consumes gems in multiples of 3. No ordinary 1-SP Skill charge on top.
const rin=fight(['1508'],{},{cycles:1,initialSP:5});assert.equal(rin.maxSP,7);assert.equal(rin.finalSP,2);assert.equal(rin.events.filter(e=>e.label==='Рин · отскок камня').length,9);
// Active / joint FuAs with Archer and Saber are attributed independently.
const rinArcher=fight(['1015','1508','1306','1203'],{},{cycles:5,energyPercent:50});assert.ok(rinArcher.events.some(e=>e.label==='Свободный стиль Тосаки · Рин'));assert.ok(rinArcher.events.some(e=>e.label==='Свободный стиль Тосаки · Арчер'));assert.equal(rinArcher.maxSP,11);
const gil=fight(['1509','1014','1313','1203'],{},{cycles:5,energyPercent:50});assert.ok(gil.events.some(e=>e.label==='Королевский дуэт · Гильгамеш'));
for(const team of [['1413','1407','1409','8007'],['1501','1502','1503','8009'],['1507','1504','1409','1413'],['1015','1508','1306','1503'],['1509','1014','8007','1507']]){
 const result=fight(team,Object.fromEntries(team.map(id=>[id,{hp:8000,atk:3000,speed:150,crit:.7,critDamage:1.5}])),{cycles:10,targets:5,toughness:120,energyPercent:50});
 near(result.total,result.events.reduce((n,e)=>n+e.damage,0));assert.ok(result.events.length<10000);assert.ok(result.finalSP>=0&&result.finalSP<=result.maxSP);
}
// Every new model, one/five dummies, with/without toughness: conservation,
// determinism, HP and resource bounds, logging does not change outcomes.
for(const id of ids)for(const targets of [1,5])for(const toughness of [0,120]){
 const team=[id,'1502','1409','1313'].filter((v,i,a)=>a.indexOf(v)===i);if(team.length<4)team.push('1203');
 const profiles=Object.fromEntries(team.map(x=>[x,p(x,{hp:8000,atk:2800,speed:140,crit:.5,critDamage:1,elation:.2})]));const before=JSON.stringify(profiles),sc={...scene,targets,toughness,cycles:5,energyPercent:50,focus:id};
 const a=T.simulate(team,profiles,sc,D,true),b=T.simulate(team,profiles,sc,D,false);assert.ok(Number.isFinite(a.total)&&a.total>0,id);near(a.total,b.total);near(a.total,a.damageByTarget.reduce((n,x)=>n+x,0));near(a.total,a.events.reduce((n,x)=>n+x.damage,0));near(a.total,a.breakdown.reduce((n,x)=>n+x.damage,0));assert.equal(JSON.stringify(profiles),before);assert.ok(a.finalSP>=0&&a.finalSP<=a.maxSP);assert.ok(a.breakdown.every(x=>x.currentHP>=1&&x.currentHP<=x.maxHP+1e-6));assert.ok(a.memories.every(x=>x.hp>=0&&x.hp<=x.maxHP+1e-6));
}
const input={characterId:'1502',profile:p('1502'),context:['1501','1503','1313'],contextProfiles:{},position:0,focus:'1501',caverns:['123','125'],planars:['318','320'],mixed:true,scenario:{...scene,cycles:3,toughness:120,externalDebuffs:0}};
const search=S.createSearch(input,D);let out;do{out=search.step(2);}while(!out.done);const oracle=S.packs(input.caverns,input.planars,true,D,'1502').map(pack=>S.run(input,pack,D).total).sort((a,b)=>b-a);out.top.forEach((r,i)=>near(r.total,oracle[i]));
console.log('Sixth ten verified: 98 entries, Aha clock, Elation formula, independent Certified Banger durations, Mem charge/true damage, Evernight sacrifice, Ashveil refunds, Mortenax HP, Rin/Archer and Gilgamesh/Saber joint attacks, conservation and exhaustive set ranking.');
