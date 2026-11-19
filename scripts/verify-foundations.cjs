const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
global.window=global;
for(const file of ['data/game-data','data/supplements','data/aha','equipment-effects','team-engine'])require('../'+file+'.js');
const D=HSR_DATA,T=HSR_TEAM,evidence=require('../data/mechanics-evidence.json');
const scenario={focus:'1106',targets:1,cycles:3,enemyLevel:0,toughness:0,initialSP:0,energyPercent:0,seed:42,externalDebuffs:0,enemyAttacks:'off',allowPartial:true};
const profile={...T.defaults('1106',D),atk:1000,speed:125,crit:0,critDamage:1,policy:'basic',eidolon:0};
const input=()=>T.battleInput(['1106'],{'1106':profile},scenario,D);
const replay=input(),fight=T.replayBattle(replay,D),expected=evidence.controls[0].expected;
assert.deepEqual(fight.events.filter(e=>e.kind==='turn').map(e=>e.time),expected.turnAV);
assert.deepEqual(fight.events.filter(e=>e.kind==='attack').map(e=>e.damage),expected.attackDamage);
assert.equal(fight.total,expected.total);assert.equal(fight.finalSP,expected.finalSP);
assert.equal(fight.breakdown[0].energy,expected.energy);assert.equal(fight.breakdown[0].ults,expected.ults);
assert.deepEqual(fight,T.replayBattle(JSON.parse(JSON.stringify(replay)),D));
for(const [i,crit]of evidence.controls[1].expected.critChance.entries()){
  assert.equal(T.simulate(['1106'],{'1106':{...profile,crit}},scenario,D).total,evidence.controls[1].expected.totals[i]);
}
assert.deepEqual(fight.events.map(e=>e.eventId),fight.events.map((_,i)=>i+1));
const calculations=fight.events.filter(e=>e.kind==='damage-calculation');
assert.equal(calculations.length,4);
for(const event of calculations){assert.equal(event.calculated,1000);assert.equal(event.effectiveDamage,1000);assert.equal(event.coefficient,1);assert.equal(event.stats.atk,1000);assert.ok(event.action>0);assert.equal(Object.keys(event.factors).length,15);assert.equal(Object.values(event.factors).reduce((product,factor)=>product*factor,1),event.calculated);}
const random=T.replayBattle(T.battleInput(['1106'],{'1106':{...profile,crit:.5}},{...scenario,rollCrits:true},D),D);
assert.ok(random.events.some(e=>e.kind==='random'&&e.probability===.5&&typeof e.outcome==='boolean'));
assert.equal(T.simulate(['1106'],{'1106':profile},scenario,D,true).total,fight.total,'Audit must not change damage');
for(const edit of [{eidolon:-1},{eidolon:7},{eidolon:1.5},{eidolon:'1'},{effectRes:NaN},{baseHP:0},{baseDef:-1},{healingBonus:Infinity},{exEidolon:'false'},{novaflare:1},{damageBonus:NaN},{exEidolon:true},{novaflare:true}]){
  assert.throws(()=>T.battleInput(['1106'],{'1106':{...profile,...edit}},scenario,D));
  assert.throws(()=>T.simulate(['1106'],{'1106':{...profile,...edit}},scenario,D));
}
for(const edit of [{rollCrits:'false'},{externalDebuffs:-1},{cycles:1.5},{seed:NaN},{allowPartial:1}])assert.throws(()=>T.battleInput(['1106'],{'1106':profile},{...scenario,...edit},D));
assert.throws(()=>T.battleInput(['missing'],{},scenario,D));
assert.throws(()=>T.battleInput(['__proto__'],{},scenario,D));
assert.throws(()=>T.battleInput(['1106','1106'],{},scenario,D));
const cyclic={...scenario};cyclic.loop=cyclic;
assert.throws(()=>T.battleInput(['1106'],{'1106':profile},cyclic,D),/циклическую/);
assert.throws(()=>T.battleInput(['1106'],{'1106':profile},{...scenario,initialDebuffs:[{id:'1106',kind:'atkDown',turns:1,value:NaN}]},D),/непереносимое/);
assert.throws(()=>T.replayBattle({...replay,format:1},D),/Версия/);
assert.throws(()=>T.replayBattle({...replay,identity:{...replay.identity,catalog:'different'}},D),/изменились/);
// Real mutation without a manually bumped version must invalidate replay.
const oldName=D.characters['1106'].name;
try{D.characters['1106'].name+=' changed';assert.throws(()=>T.replayBattle(replay,D),/изменились/);}finally{D.characters['1106'].name=oldName;}
const supplements=HSR_SUPPLEMENTS.characters;
try{HSR_SUPPLEMENTS.characters={...supplements,testFact:1};assert.throws(()=>T.replayBattle(replay,D),/изменились/);}finally{HSR_SUPPLEMENTS.characters=supplements;}
const damage=HSR_EQUIPMENT.damage;
try{HSR_EQUIPMENT.damage=()=>({});assert.throws(()=>T.replayBattle(replay,D),/изменились/);}finally{HSR_EQUIPMENT.damage=damage;}
const oldToughness=T.packetPlans['100201'].packets[0].toughness;
try{T.packetPlans['100201'].packets[0].toughness++;assert.throws(()=>T.replayBattle(replay,D),/изменились/);}finally{T.packetPlans['100201'].packets[0].toughness=oldToughness;}
const targetRule=T.packetRules.targets;
try{T.packetRules.targets=()=>[0];assert.throws(()=>T.replayBattle(replay,D),/изменились/);}finally{T.packetRules.targets=targetRule;}
const reordered=Object.fromEntries(Object.entries(D).reverse());
assert.deepEqual(T.battleIdentity(reordered),T.battleIdentity(D),'Object key order must not affect identity');
// Reinstall the actual source with one changed private helper and same version.
const context=vm.createContext({HSR_DATA:D,HSR_SUPPLEMENTS});context.window=context;
const equipmentSource=fs.readFileSync(path.join(__dirname,'../equipment-effects.js'),'utf8');
vm.runInContext(equipmentSource.replace('expires:actor.turn+turns','expires:actor.turn+turns+1'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../team-engine.js'),'utf8'),context);
assert.throws(()=>context.HSR_TEAM.replayBattle(replay,D),/изменились/);
// Windows and GitHub Pages may check out identical code with CRLF or LF.
const portableContext=vm.createContext({HSR_DATA:D,HSR_SUPPLEMENTS});portableContext.window=portableContext;
vm.runInContext(equipmentSource.replace(/\r?\n/g,'\r\n'),portableContext);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../team-engine.js'),'utf8').replace(/\r?\n/g,'\r\n'),portableContext);
assert.equal(JSON.stringify(portableContext.HSR_TEAM.battleIdentity(D)),JSON.stringify(T.battleIdentity(D)));
assert.equal(portableContext.HSR_TEAM.replayBattle(replay,D).total,fight.total);
assert.deepEqual(T.replayBattle(replay,D),fight,'Restored data must replay again');
// Every evidence record is traceable, with independent derivation and limits.
const seen=new Set();for(const record of evidence.controls){
  for(const key of evidence.recordContract.required)assert.ok(record[key]!==undefined,key);
  assert.ok(!seen.has(record.id));seen.add(record.id);
  assert.ok(evidence.recordContract.statuses.includes(record.status));
  for(const source of record.sources)assert.match(evidence.sources[source]?.url||'',/^https:\/\//);
  assert.ok(record.assumptions.length&&record.implementation.length&&record.derivation.length>20);
}
console.log('Verified independent AV/damage/SP/energy controls, crit boundaries, input rejection, trace events, data/rules identity and replay.');
