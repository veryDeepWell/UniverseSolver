const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data = HSR_DATA, team = HSR_TEAM;
const batch = ['1321','1402','1404','1407','1408','1409','1413','1414','1415','8005'];
const forms = new Set(Object.keys(team.models).map(team.canonical));
assert.equal(new Set(batch).size,10);
assert.ok(team.eidolonModels.size >= 78 && [...team.eidolonModels].every(id => forms.has(id)));
for (const id of batch) {
  assert.ok(team.eidolonModels.has(id),id);
  const focus = ['1321','8005'].includes(id) ? '1310' : ['1409','1414','1415'].includes(id) ? '1404' : id;
  const lineup = [...new Set([focus,id,'1101','1203','1106'])].slice(0,4);
  const profiles = Object.fromEntries(lineup.map(hero => [hero,HSR_OPT.farmReference(hero,HSR_RELIC.archetype(hero,data),data).profile]));
  const scenario = {focus,targets:3,cycles:8,initialSP:3,energyPercent:50,seed:42,toughness:90,enemyLevel:95,enemyAttacks:'training'};
  const rows = Array.from({length:7},(_,eidolon) => team.simulate(
    lineup,{...profiles,[id]:{...profiles[id],eidolon,policy:'skill'}},scenario,data,true
  ));
  assert.ok(rows.every(row => Number.isFinite(row.total) && row.events.every(event => event.sp >= 0 && event.sp <= row.maxSP)),id);
  assert.notEqual(rows[6].total,rows[0].total,id);
  const events = (rank,label) => rows[rank].events.filter(event => event.actor === id && event.label.startsWith(label));
  if (id === '1404') assert.equal(events(6,'Мидей E6 · Кровная месть').length,1);
  if (id === '1407') assert.ok(events(2,'Кастория E2 · Новое цветение').length > 0);
  if (id === '1408') assert.ok(events(2,'Фаенон E2 · дополнительный ход').length > 0);
  if (id === '8005') {
    assert.equal(events(1,'Первопроходец E1 · восстановлено 1 SP').length,1);
    assert.ok(events(6,'Первопроходец · попадание 7').length > 0);
  }
}
console.log(`Seventh batch: E0–E6 verified for ten forms. Coverage ${team.eidolonModels.size}/${forms.size}.`);
