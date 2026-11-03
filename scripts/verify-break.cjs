const assert=require('node:assert/strict');global.window=global;
require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');
const T=HSR_TEAM,D=HSR_DATA,S=HSR_SETS,base=3767.5533;
const scene={targets:1,cycles:2,initialSP:3,energyPercent:0,seed:42,toughness:20,allowPartial:true};
const profile=(id,extra={})=>({...T.defaults(id,D),atk:1000,baseAtk:500,speed:100,baseSpeed:100,crit:0,critDamage:0,breakEffect:0,...extra});
const fight=(ids,extra={},scenario={})=>T.simulate(ids,Object.fromEntries(ids.map(id=>[id,profile(id,extra[id])])),{...scene,...scenario},D,true);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const events=(r,kind)=>r.events.filter(e=>e.kind===kind);
const ids=['1310','1315','1317','1321','8005','1301','1214','1111','1206','1108'];
assert.equal(Object.keys(T.models).length,98);ids.forEach(id=>assert.ok(T.models[id]));
// A normal basic removes 10. The breaking hit's ordinary damage still sees
// the unbroken 0.9 multiplier; Break itself uses the now-broken 1.0 multiplier.
const raw=fight(['1301'],{'1301':{policy:'basic'}},{cycles:3});
near(raw.events.find(e=>e.kind==='attack').damage,900);
near(events(raw,'break')[0].damage,base*2*(.5+20/40));
assert.ok(raw.events.some(e=>e.label.startsWith('Стойкость восстановлена')));
assert.ok(raw.toughness[0].breaks>=1);
const boosted=fight(['1301'],{'1301':{policy:'basic',breakEffect:1,crit:1,critDamage:3,damageBonus:2}},{cycles:3});
near(events(boosted,'break')[0].damage,2*events(raw,'break')[0].damage);
const crit=fight(['1301'],{'1301':{policy:'basic',crit:1,critDamage:3,damageBonus:2}},{cycles:3});
near(events(crit,'break')[0].damage,events(raw,'break')[0].damage);
assert.ok(events(raw,'break-dot').length);
for(const [id,type] of [['1301',2],['1206',2],['1108',1.5],['1103',1],['1013',1],['1214',.5],['8005',.5]]){
  const r=fight([id],{[id]:{policy:'basic'}},{cycles:3});near(events(r,'break')[0].damage,base*type);
}
// No bar is an explicit compatibility mode, not an invented Break trigger.
const disabled=fight(['1310','8005','1225','1301'],{},{toughness:0,cycles:5,energyPercent:100});
assert.equal(events(disabled,'break').length,0);assert.equal(events(disabled,'superbreak').length,0);
for(const toughness of [-1,Infinity,1001,NaN])assert.throws(()=>fight(['1301'],{},{toughness}));
// Fugue: original 20 + exo 8, two genuine Break triggers, no recursion.
const exo=fight(['1301','1225'],{'1301':{speed:200,policy:'basic'},'1225':{speed:1,policy:'basic'}},{cycles:1,toughness:10});
assert.ok(events(exo,'break').some(e=>e.label.startsWith('Экзопробитие')));
assert.ok(exo.toughness[0].breaks>=2);
// Super Break is independently attributed to its attacking character. A
// partially used packet only converts the remaining toughness after the break.
const sb=fight(['1301','8005'],{'1301':{speed:100,policy:'basic'},'8005':{speed:1,policy:'basic'}},{cycles:1,energyPercent:100,toughness:5});
const sbEvent=events(sb,'superbreak').find(e=>e.actor==='1301');assert.ok(sbEvent);
// Gallagher's initial ult: 20-5=15 eligible, HMC +30% BE and 1.6 target factor,
// Besotted +12% break vulnerability. DEF and RES multipliers are both 1.
near(sbEvent.damage,base*1.5*1.6*1.3*1.12);
const beforeBreak=fight(['1301','8005'],{'1301':{speed:1},'8005':{speed:1}},{cycles:1,energyPercent:100,toughness:1000});
assert.equal(events(beforeBreak,'superbreak').length,0);
const pre=fight(['1321','8005','1301'],{'1321':{speed:200},'8005':{speed:1},'1301':{speed:1}},{cycles:1,toughness:1000,energyPercent:100,focus:'1301'});
assert.ok(events(pre,'superbreak').length>0,'Dahlia enables pre-break conversion');
const mei=fight(['1301','1303'],{'1301':{speed:100,policy:'basic'},'1303':{speed:200}},{cycles:1,toughness:1000});
assert.ok(mei.events.some(e=>e.actor==='1301'&&e.kind==='toughness'&&e.label.includes('−15.00')));
// All ten run against 1..5 targets; log on/off and fixed seeds agree. Damage
// attribution conserves totals, input profiles never acquire combat state.
for(const id of ids)for(const targets of [1,3,5]){
  const team=[id,...['1303','1225','1301'].filter(x=>x!==id)].slice(0,4);
  const profiles=Object.fromEntries(team.map(x=>[x,profile(x,{atk:2600,speed:145,breakEffect:2})]));
  const saved=JSON.stringify(profiles),sc={...scene,cycles:5,targets,energyPercent:50,toughness:120};
  const r=T.simulate(team,profiles,sc,D,true),again=T.simulate(team,profiles,sc,D,false);
  assert.ok(Number.isFinite(r.total)&&r.total>0,id);near(r.total,again.total);near(r.total,r.breakdown.reduce((n,a)=>n+a.damage,0));near(r.total,r.damageByTarget.reduce((n,a)=>n+a,0));near(r.total,r.events.reduce((n,e)=>n+e.damage,0));assert.equal(JSON.stringify(profiles),saved);
  assert.ok(r.events.every(e=>e.toughness.every(v=>v>=0&&v<=120)));
  assert.ok(r.events.some(e=>e.kind==='break'));
}
const ff=fight(['1310','8005','1301','1303'],{'1310':{atk:2800,breakEffect:2,speed:150}},{cycles:5,energyPercent:100,toughness:120});
assert.ok(ff.events.some(e=>e.label==='Полное сгорание · окончание'));
assert.ok(events(ff,'superbreak').some(e=>e.label.includes('Светлячок')));
const booth=fight(['1315','1303','1225','1301'],{'1315':{breakEffect:2,speed:150}},{cycles:5,toughness:40});
assert.ok(booth.events.some(e=>e.label.startsWith('Карманное преимущество')));assert.ok(events(booth,'break').some(e=>e.label.includes('повторное')));
const rappa=fight(['1317','8005','1225','1301'],{},{cycles:5,energyPercent:100,toughness:20});
assert.ok(rappa.events.some(e=>e.label==='Цветные чернила · 0'));
assert.ok(events(rappa,'break').some(e=>e.label.includes('брейк таланта')));
const xue=fight(['1214','1321','1225','1301'],{},{cycles:5,energyPercent:100,toughness:40,targets:5});
assert.ok(xue.breakdown.find(a=>a.id==='1214').followups>0);
// Set rankings repeat the same fight with actual BE bonuses; enumerate an
// independent oracle to ensure the new mechanics reach the set search too.
const input={characterId:'1310',profile:profile('1310',{atk:2600,speed:150,breakEffect:2}),context:['8005','1303','1301'],contextProfiles:{},position:0,focus:'1310',caverns:['111','118','119'],planars:['307','316'],mixed:true,scenario:{...scene,cycles:3,targets:3,toughness:120,externalDebuffs:0}};
const search=S.createSearch(input,D);let out;do{out=search.step(2);}while(!out.done);
const oracle=S.packs(input.caverns,input.planars,true,D,'1310').map(pack=>S.run(input,pack,D).total).sort((a,b)=>b-a);
assert.equal(out.checked,12);out.top.forEach((r,i)=>near(r.total,oracle[i]));
const hm={...input,characterId:'8005',profile:profile('8005'),context:['1310'],position:1,focus:'1310',scenario:{...input.scenario,energyPercent:100}};
const clock=S.run(hm,{cavern:['118','118','118','118'],planar:'307'},D,true);
assert.ok(clock.events.some(e=>e.label.startsWith('Запасной танцор')));
console.log('Break verified: 98 entries, depletion/recovery, elemental Break, BE scaling, no crit/DMG scaling, Exo, overflow Super Break, pre-break Dahlia, efficiency, all ten on 1/3/5 targets, seeded conservation and exhaustive set rankings.');
