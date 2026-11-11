const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data = HSR_DATA, team = HSR_TEAM;
const batch = ['1307','1314','1315','1317','1401','1403','1405','1406','1410','1412'];
const forms = new Set(Object.keys(team.models).map(team.canonical));
assert.equal(new Set(batch).size, 10);
assert.ok(team.eidolonModels.size >= 68);
assert.ok([...team.eidolonModels].every(id => forms.has(id)));

for (const id of batch) {
  assert.ok(team.eidolonModels.has(id), id);
  const focus = ['1314','1403','1412'].includes(id) ? '1405' : id;
  const lineup = [...new Set([focus,id,'1101','1108','1203'])].slice(0,4);
  const profiles = Object.fromEntries(lineup.map(hero => [hero,HSR_OPT.farmReference(hero,HSR_RELIC.archetype(hero,data),data).profile]));
  const scenario = {focus,targets:3,cycles:8,initialSP:3,energyPercent:50,seed:42,toughness:60,enemyLevel:95,enemyAttacks:'training'};
  const rows = Array.from({length:7},(_,eidolon) => team.simulate(
    lineup,{...profiles,[id]:{...profiles[id],eidolon,policy:'auto'}},scenario,data,true
  ));
  assert.ok(rows.every(row => Number.isFinite(row.total) && row.events.every(event => event.sp >= 0 && event.sp <= row.maxSP)),id);
  assert.notEqual(rows[6].total,rows[0].total,id);
  const events = (rank,label) => rows[rank].events.filter(event => event.actor === id && event.label.startsWith(label));
  if (id === '1315') assert.ok(events(6,'Бутхилл E6 · соседнее пробитие').length > 0);
  if (id === '1403') {
    const extra = events(1,'Трибби E1 · истинный урон');
    assert.ok(extra.length > 0 && extra.every(event => event.damage > 0));
  }
  if (id === '1405') assert.equal(events(1,'Анакса E1 · восстановлено 1 SP').length,1);
  if (id === '1406') assert.ok(events(4,'Цифер E4 · дополнительный урон').length > 0);
}
console.log(`Sixth batch: E0–E6 verified for ten heroes. Coverage ${team.eidolonModels.size}/${forms.size}.`);
