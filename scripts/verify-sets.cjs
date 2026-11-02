const assert=require('node:assert/strict');global.window=global;require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');require('../optimizer-engine.js');
const D=HSR_DATA,T=HSR_TEAM,G=HSR_EQUIPMENT,S=HSR_SETS,O=HSR_OPT;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const scenario={targets:3,cycles:5,initialSP:3,energyPercent:50,seed:42,externalDebuffs:0};
const input={characterId:'1220',profile:T.defaults('1220',D),context:[],contextProfiles:{},position:0,focus:'1220',caverns:['102','115','120'],planars:['306','309','315'],mixed:true,scenario};
assert.equal(S.packs(input.caverns,input.planars,false,D,'1220').length,9);
assert.equal(S.packs(input.caverns,input.planars,true,D,'1220').length,18);
assert.equal(S.packs(['115'],['306'],false,D,'1205').length,0);
assert.throws(()=>S.run({...input,characterId:'1205',focus:'1205',profile:T.defaults('1205',D)},{cavern:['115','115','115','115'],planar:'306'},D));
assert.throws(()=>S.createSearch({...input,planars:['325']},D));
assert.throws(()=>S.createSearch({...input,context:['1220']},D));
assert.throws(()=>S.createSearch({...input,profile:{...input.profile,baseHP:0}},D));
const before=JSON.stringify(input),search=S.createSearch(input,D);let result;do{result=search.step(2);}while(!result.done);
assert.equal(result.checked,18);assert.equal(result.top.length,10);assert.equal(JSON.stringify(input),before,'Set search must not mutate reference stats');
const oracle=S.packs(input.caverns,input.planars,true,D,'1220').map(p=>S.run(input,p,D).total).sort((a,b)=>b-a);result.top.forEach((r,i)=>near(r.total,oracle[i]));
const best=result.top[0],logged=S.run(input,best.pack,D,true);near(logged.total,best.total);
// Stat bonuses use base values, not the already geared totals.
const custom={...input,characterId:'1205',focus:'1205',profile:{...T.defaults('1205',D),hp:6000,baseHP:1200,atk:3000,baseAtk:1000,speed:110,baseSpeed:100}};
let run=S.run(custom,{cavern:['113','113','113','113'],planar:'319'},D);near(run.initialStats['1205'].hp,6000+1200*.24);
assert.ok(run.breakdown[0].followups>0);
// Speed thresholds are evaluated after set stats, without scaling geared ATK twice.
const stats={...input,profile:{...input.profile,atk:3000,baseAtk:1000,speed:119,baseSpeed:100}};
run=S.run(stats,{cavern:['102','102','102','102'],planar:'301'},D);near(run.initialStats['1220'].speed,125);near(run.initialStats['1220'].atk,3360);
run=S.run({...stats,profile:{...stats.profile,speed:110}},{cavern:['102','102','102','102'],planar:'301'},D);near(run.initialStats['1220'].atk,3240);
// Real multi-hit ultimate must ramp Duke stacks rather than count as one damage instance.
run=S.run({...input,profile:{...input.profile,crit:0,critDamage:0}},{cavern:['115','115','115','115'],planar:'306'},D,true);
const fxUlt=run.events.filter(e=>e.label.startsWith('Ульта Фэйсяо'));
assert.ok(fxUlt.length>=7);assert.ok(fxUlt[1].damage>fxUlt[0].damage);
// Lord has an independent clock and does not generate energy for Jing Yuan.
const jing={...T.defaults('1204',D),atk:1000,baseAtk:1000,speed:1,crit:0,critDamage:0};
run=T.simulate(['1204'],{'1204':jing},{...scenario,targets:1,cycles:2,energyPercent:0,allowPartial:true},D,true);
near(run.total,1980);near(run.breakdown[0].energy,15);assert.equal(run.breakdown[0].turns,0);assert.equal(run.breakdown[0].followups,1);
// Kafka's ult immediately detonates her Shock, and another actor's basic triggers her FUA.
const kafka={...T.defaults('1005',D),atk:1000,crit:0,critDamage:0};
run=T.simulate(['1005'],{'1005':kafka},{...scenario,targets:1,cycles:1,energyPercent:100,allowPartial:true},D,true);
near(run.events.filter(e=>e.time===0).reduce((n,e)=>n+e.damage,0),3700);
run=T.simulate(['1005','1105'],{}, {...scenario,allowPartial:true},D,true);assert.ok(run.breakdown[0].followups>0);assert.ok(run.events.some(e=>e.label==='Подрыв DoT'));
for(const id of ['1003','1005','1204','1305','1205']){run=T.simulate([id],{}, {...scenario,allowPartial:true},D,true);assert.ok(Number.isFinite(run.total)&&run.total>0);assert.ok(run.events.every(e=>e.sp>=0&&e.sp<=5));}
// Transferring six items excludes set stats and all temporary combat buffs.
const config={characterId:'1102',coneId:'',level:80,coneLevel:80,rank:1,actionId:'custom',skillLevel:10,scaling:'atk',kind:'skill',coefficient:1,enemyLevel:80,targets:1,debuffs:0,dots:0,resistance:0,elementWeakness:false,resPen:0,defReduction:0,vulnerability:0,damageBonus:0,atkBonus:0,hpBonus:0,defBonus:0,critBonus:0,critDamageBonus:0,speedFlat:0,minSpeed:0,minCrit:0,boxerStacks:0,traces:false,canCrit:false,broken:true};
const items=O.slots.map((slot,i)=>O.validateItem({id:'ref'+i,slot,setId:i<4?'102':'309',level:15,main:O.mainAffixes(D,slot)[0].property,subs:[]},D));
const clean=O.sheetWithoutSets(items,config,D),equipped=O.evaluate(items,config,D).stats;
near(equipped.atk-clean.atk,clean.baseAtk*.12);near(equipped.spd-clean.speed,clean.baseSpeed*.06);near(equipped.crit-clean.crit,.08);
assert.deepEqual(O.sheetWithoutSets(items,{...config,atkBonus:1,damageBonus:2,critBonus:.5},D),clean);
console.log('Set optimizer verified: 4pc/2+2 enumeration, fail-closed coverage, fixed reference stats, exhaustive ranking, dynamic thresholds, Duke multi-hit, independent summons, HP scaling, DoT detonations, transfer without double-counting.');
