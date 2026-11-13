const assert=require('node:assert/strict');
global.window=global;
require('../data/game-data.js');
require('../optimizer-engine.js');
require('../equipment-effects.js');
require('../team-engine.js');
require('../set-engine.js');
require('../relic-engine.js');

const D=HSR_DATA,T=HSR_TEAM,S=HSR_SETS,O=HSR_OPT;
const hero='1220',allies=['1309','1224','1217'];
const reference=(id,boots)=>O.farmReference(id,HSR_RELIC.archetype(id,D),D,true,boots).profile;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
for(const id of Object.keys(T.models)){
  T.validateStats(reference(id,'speed'));
  T.validateStats(reference(id,'scaling'));
}
const fast=reference(hero,'speed'),power=reference(hero,'scaling');
assert.ok(fast.speed>power.speed&&power.atk>fast.atk);
assert.ok(fast.crit>.7&&fast.critDamage>1);

const scenario={targets:1,cycles:3,initialSP:3,energyPercent:50,seed:42,toughness:120,
  enemyLevel:95,externalDebuffs:0,enemyAttacks:'training'};
const profiles={ [hero]:fast,...Object.fromEntries(allies.map(id=>[id,reference(id)])) };
const ids=[hero,...allies];
const result=T.simulate(ids,profiles,{...scenario,sampleCycles:[2,3]},D);
for(const point of result.checkpoints)
  close(point.total,T.simulate(ids,profiles,{...scenario,cycles:point.cycles},D).total);
const input={characterId:hero,profile:fast,context:allies,contextProfiles:profiles,focus:hero,
  position:0,caverns:['110','120'],planars:['306','315'],mixed:false,stableRanking:true,scenario};
const ranking=S.createSearch(input,D).step(20);
assert.equal(ranking.checked,4);
const manualScores=S.packs(input.caverns,input.planars,input.mixed,D,hero).map(pack=>{
  const damagePerAV=[2,3].map(cycles=>{
    const battle=S.run({...input,stableRanking:false,scenario:{...scenario,cycles}},pack,D);
    return battle.total*100/battle.horizon;
  });
  return {pack,score:(damagePerAV[0]+damagePerAV[1])/2};
});
for(const row of ranking.top)
  close(row.score,manualScores.find(({pack})=>JSON.stringify(pack)===JSON.stringify(row.pack)).score);
close(ranking.top[0].score,Math.max(...manualScores.map(row=>row.score)));
assert.ok(ranking.top.every((row,i)=>!i||ranking.top[i-1].score>=row.score));

function solo(overrides,profile=fast){
  return T.simulate([hero],{[hero]:profile},{...scenario,allowPartial:true,...overrides},D,true);
}
const flat=solo({toughness:0,enemyLevel:0});
const armored=solo({toughness:0});
close(armored.total/flat.total,100/215);
const quantum=solo({toughness:0},{...fast,equipment:{cavern:['108','108','108','108'],planars:['301','302']}});
close(quantum.total/armored.total,215/192);
const firstUlt=battle=>battle.events.filter(event=>event.label.startsWith('Ульта Фэйсяо ·')).slice(0,7);
const intact=firstUlt(solo({toughness:1000,enemyLevel:0}));
const unprotected=firstUlt(flat);
assert.equal(intact.length,7);
assert.equal(unprotected.length,7);
for(let i=0;i<7;i++)close(intact[i].damage,unprotected[i].damage*.9);
console.log('Farm reference verified: full roster, legal stat budgets, cycle samples, DEF, Feixiao ultimate against intact targets.');
