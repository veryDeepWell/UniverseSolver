const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data=HSR_DATA, team=HSR_TEAM;
const batch=['1009','1202','1303','1217','1304','1208','1225','1301','1106','1305'];
const scenario={targets:3,cycles:8,initialSP:3,energyPercent:50,seed:42,toughness:90,enemyLevel:95,externalDebuffs:2,enemyAttacks:'training'};
assert.ok(team.eidolonModels.size>=18);
assert.equal(new Set(Object.keys(team.models).map(team.canonical)).size,94);
assert.ok(batch.every(id=>team.eidolonModels.has(id)));

for(const id of batch){
  const lineup=[id,...['1305','1205','1203','1106'].filter(other=>other!==id).slice(0,3)];
  const profiles=Object.fromEntries(lineup.map(hero=>[hero,HSR_OPT.farmReference(hero,HSR_RELIC.archetype(hero,data),data).profile]));
  const simulate=eidolon=>team.simulate(lineup,{...profiles,[id]:{...profiles[id],eidolon,policy:'skill'}},scenario,data,true);
  const results=Array.from({length:7},(_,rank)=>simulate(rank));
  assert.ok(results.every(result=>Number.isFinite(result.total)),id);
  assert.notEqual(results[6].total,results[0].total,id);
  const count=(rank,tag)=>results[rank].events.filter(event=>event.label===tag).length;
  if(id==='1009'){
    for(const rank of [0,1])assert.equal(count(rank,'Навык Асты · отскок'),count(rank,'Навык Асты · первый удар')*(rank?5:4));
  }
  if(id==='1106')assert.ok(count(6,'Пела E6 · дополнительный урон')>0);
  if(id==='1305'){
    assert.equal(count(1,'Рацио E2 · дополнительный урон'),0);
    assert.ok(count(2,'Рацио E2 · дополнительный урон')>0);
  }
}
console.log('First batch: E0–E6 verified for ten heroes.');
