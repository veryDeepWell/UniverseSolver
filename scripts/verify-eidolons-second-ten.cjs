const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data=HSR_DATA, team=HSR_TEAM;
const batch=['1101','1306','1006','1104','1105','1211','1203','1003','1107','1112'];
const scenario={targets:3,cycles:8,initialSP:3,energyPercent:50,seed:42,toughness:90,enemyLevel:95,externalDebuffs:2,enemyAttacks:'training',focus:'1205'};
assert.equal(new Set(batch).size,10);
assert.ok(team.eidolonModels.size>=28 && batch.every(id=>team.eidolonModels.has(id)));

for (const id of batch) {
  const lineup=['1205',id,...['1220','1203','1106'].filter(other=>other!==id).slice(0,2)];
  const profiles=Object.fromEntries(lineup.map(hero=>[hero,HSR_OPT.farmReference(hero,HSR_RELIC.archetype(hero,data),data).profile]));
  const simulate=eidolon=>team.simulate(lineup,{...profiles,[id]:{...profiles[id],eidolon,policy:id==='1105'?'basic':'skill'}},scenario,data,true);
  const rows=Array.from({length:7},(_,rank)=>simulate(rank));
  assert.ok(rows.every(row=>Number.isFinite(row.total) && row.events.every(event=>event.sp>=0 && event.sp<=row.maxSP)),id);
  assert.notEqual(rows[6].total,rows[0].total,id);
  const count=(rank,tag)=>rows[rank].events.filter(event=>event.label===tag).length;
  if (id==='1306') assert.equal(rows[4].maxSP,rows[3].maxSP+1);
  if (id==='1006') assert.ok(count(4,'Серебряный Волк E4 · дополнительный урон')>0);
  if (id==='1003') assert.equal(count(6,'Химеко E6 · отскок'),2*rows[6].breakdown.find(actor=>actor.id===id).ults);
  if (id==='1105') assert.ok(count(6,'Наташа E6 · дополнительный урон')>0);
}
console.log('Second batch: E0–E6 verified for ten heroes.');
