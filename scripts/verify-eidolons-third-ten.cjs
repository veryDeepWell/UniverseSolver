const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data = HSR_DATA, team = HSR_TEAM;
const batch = ['1002','1103','1109','1210','1108','1111','1206','1207','1215','1102'];
const scenario = {targets:3,cycles:8,initialSP:3,energyPercent:50,seed:42,toughness:90,enemyLevel:95,enemyAttacks:'training'};
const forms = new Set(Object.keys(team.models).map(team.canonical));
assert.equal(new Set(batch).size, 10);
assert.ok(team.eidolonModels.size >= 38);
assert.ok([...team.eidolonModels].every(id => forms.has(id)));

for (const id of batch) {
  assert.ok(team.eidolonModels.has(id), id);
  const focus = ['1207','1215'].includes(id) ? '1102' : id;
  const lineup = [...new Set([focus,id,'1101','1106','1107'])].slice(0,4);
  const profiles = Object.fromEntries(lineup.map(hero => [hero,HSR_OPT.farmReference(hero,HSR_RELIC.archetype(hero,data),data).profile]));
  const policy = id === '1103' ? 'basic' : id === '1111' ? 'auto' : 'skill';
  const rows = Array.from({length:7}, (_,eidolon) => team.simulate(
    lineup, {...profiles,[id]:{...profiles[id],eidolon,policy}}, {...scenario,focus}, data, true
  ));
  assert.ok(rows.every(row => Number.isFinite(row.total) && row.events.every(event => event.sp >= 0 && event.sp <= row.maxSP)), id);
  assert.notEqual(rows[6].total, rows[0].total, id);
  const events = (rank,label) => rows[rank].events.filter(event => event.actor === id && event.label === label);
  if (id === '1103') {
    assert.equal(events(0,'Сервал E1 · соседняя цель').length, 0);
    assert.ok(events(1,'Сервал E1 · соседняя цель').length > 0);
  }
  if (id === '1108') {
    const firstSkillHits = rank => {
      const bounces = events(rank,'Сампо · отскок');
      return bounces.filter(event => event.time === bounces[0].time).length;
    };
    assert.equal(firstSkillHits(0), 5);
    assert.equal(firstSkillHits(1), 6);
    assert.ok(events(4,'Сампо E4 · подрыв Выветривания').length > 0);
  }
  if (id === '1102') {
    const flurry = events(6,'Зеле E6 · Вихрь бабочек');
    assert.ok(flurry.length > 0);
    const ultimates = events(6,'Ульта Зеле');
    for (const proc of flurry) {
      assert.equal(proc.kind, 'additional');
      assert.ok(ultimates.some(ult => ult.time <= proc.time && Math.abs(ult.damage * .15 - proc.damage) < 1e-6));
    }
  }
}
console.log(`Third batch: E0–E6 verified for ten heroes. Coverage ${team.eidolonModels.size}/${forms.size}.`);
