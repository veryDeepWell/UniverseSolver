const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data = HSR_DATA, team = HSR_TEAM;
const batch = ['1014','1015','1110','1201','1214','1221','1222','1223','1224','1312'];
const forms = new Set(Object.keys(team.models).map(team.canonical));
assert.equal(new Set(batch).size, 10);
assert.ok(team.eidolonModels.size >= 58);
assert.ok([...team.eidolonModels].every(id => forms.has(id)));

for (const id of batch) {
  assert.ok(team.eidolonModels.has(id), id);
  const focus = id === '1224' || id === '1110' ? '1205' : id;
  const lineup = [...new Set([focus,id,'1101','1106','1108'])].slice(0,4);
  const profiles = Object.fromEntries(lineup.map(hero => [hero,HSR_OPT.farmReference(hero,HSR_RELIC.archetype(hero,data),data).profile]));
  if (id === '1015') for (const ally of lineup.slice(1)) profiles[ally].policy = 'basic';
  const scenario = {focus,targets:3,cycles:8,initialSP:id === '1015' ? 5 : 3,energyPercent:50,seed:42,toughness:90,enemyLevel:95,enemyAttacks:'training'};
  const rows = Array.from({length:7},(_,eidolon) => team.simulate(
    lineup,{...profiles,[id]:{...profiles[id],eidolon,policy:'skill'}},scenario,data,true
  ));
  assert.ok(rows.every(row => Number.isFinite(row.total) && row.events.every(event => event.sp >= 0 && event.sp <= row.maxSP)),id);
  assert.notEqual(rows[6].total,rows[0].total,id);
  const events = (rank,label) => rows[rank].events.filter(event => event.actor === id && event.label === label);
  if (id === '1015') assert.ok(events(1,'Арчер E1 · восстановлено 2 SP').length > 0);
  if (id === '1201') assert.ok(events(4,'Цинцюэ E4 · Независимость').length > 0);
  if (id === '1221') assert.equal(events(1,'Интуит · дополнительный удар').length,9*events(1,'Интуит · Истребление').length);
  if (id === '1222') assert.equal(events(6,'Фуюань E6 · дополнительный удар').length,4*events(6,'Фуюань · бонус-атака').length);
  if (id === '1224') assert.ok(events(2,'Март 7 E2 · бонус-атака').length > 0);
  if (id === '1312') {
    const firstUltimateHits = rank => {
      const hits = events(rank,'Миша · удар ульты 1');
      return rows[rank].events.filter(event => event.time === hits[0].time && event.label.startsWith('Миша · удар ульты')).length;
    };
    assert.equal(firstUltimateHits(1),firstUltimateHits(0)+scenario.targets);
  }
}
console.log(`Fifth batch: E0–E6 verified for ten heroes. Coverage ${team.eidolonModels.size}/${forms.size}.`);
