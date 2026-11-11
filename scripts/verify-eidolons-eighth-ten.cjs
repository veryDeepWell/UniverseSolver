const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data = HSR_DATA, team = HSR_TEAM;
const batch = ['1501','1502','1503','1504','1505','1506','1507','1508','1509','1510'];
const forms = new Set(Object.keys(team.models).map(team.canonical));
assert.equal(new Set(batch).size,10);
assert.ok(team.eidolonModels.size >= 88 && [...team.eidolonModels].every(id => forms.has(id)));
for (const id of batch) {
  assert.ok(team.eidolonModels.has(id),id);
  const focus = id === '1503' ? '1501' : id;
  const lineup = [...new Set([focus,id,...(id === '1510' ? ['1001','1413','1101'] : ['1502','1501','1101','1203'])])].slice(0,4);
  const profiles = Object.fromEntries(lineup.map(hero => [hero,HSR_OPT.farmReference(hero,HSR_RELIC.archetype(hero,data),data).profile]));
  const scenario = {focus,targets:3,cycles:5,initialSP:4,energyPercent:50,seed:42,toughness:90,enemyLevel:95,enemyAttacks:'training'};
  const rows = Array.from({length:7},(_,eidolon) => team.simulate(
    lineup,{...profiles,[id]:{...profiles[id],eidolon,policy:'skill'}},scenario,data,true
  ));
  assert.ok(rows.every(row => Number.isFinite(row.total) && row.events.every(event => event.sp >= 0 && event.sp <= row.maxSP)),id);
  assert.notEqual(rows[6].total,rows[0].total,id);
  const events = (rank,label) => rows[rank].events.filter(event => event.label.startsWith(label));
  if (id === '1502') assert.ok(events(1,'Аха · дополнительный ход · Юмор 40').length > 0);
  if (id === '1503') assert.ok(events(6,'Жемчуг E6 · Радость образца').length > 0);
  if (id === '1506') assert.ok(events(2,'Волк 999 E2 · дополнительный ход').length > 0);
  if (id === '1510') assert.ok(events(6,'Химеко Нова E6 · импульс').length > 0);
}
console.log(`Eighth batch: E0–E6 verified for ten forms. Coverage ${team.eidolonModels.size}/${forms.size}.`);
