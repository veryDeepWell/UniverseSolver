const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data = HSR_DATA, team = HSR_TEAM;
const catalog = new Set(Object.keys(data.characters));
const forms = new Set([...catalog].map(team.canonical));
assert.deepEqual(new Set(Object.keys(team.models)),catalog);
assert.deepEqual(team.eidolonModels,forms);
assert.equal(catalog.size - forms.size,Object.keys(team.aliases).length);

const profiles = Object.fromEntries([...catalog].map(id => [
  id, HSR_OPT.farmReference(id,HSR_RELIC.archetype(id,data),data).profile
]));
const base = {targets:3,cycles:2,initialSP:4,energyPercent:100,seed:42,toughness:60,enemyLevel:95,enemyAttacks:'training'};
function fight(id,eidolon,options={}) {
  const lineup = [id,...['1101','1203','1106','1205'].filter(ally => ally !== id).slice(0,3)];
  const focus = ['1512','8007','8009'].includes(team.canonical(id)) ? lineup[1] : id;
  const current = Object.fromEntries(lineup.map(ally => [ally,{...profiles[ally],eidolon:ally === id ? eidolon : 0}]));
  return team.simulate(lineup,current,{...base,focus,...options},data,true);
}
function finiteFight(result,label) {
  assert.ok(Number.isFinite(result.total) && result.total >= 0,label);
  assert.ok(result.events.every(event => Number.isFinite(event.damage) && event.sp >= 0 && event.sp <= result.maxSP),label);
  const logged = result.events.reduce((sum,event) => sum + event.damage,0);
  assert.ok(Math.abs(logged - result.total) <= 1e-8 * Math.max(1,result.total),label);
}
for (const id of catalog) for (let rank = 0; rank <= 6; rank++) {
  finiteFight(fight(id,rank),`${id} E${rank}`);
}
for (const [alias,form] of Object.entries(team.aliases)) {
  for (const rank of [0,6]) {
    const primary = fight(form,rank);
    const variant = fight(alias,rank);
    assert.equal(variant.total,primary.total,`${alias} E${rank}`);
    assert.deepEqual(variant.events.map(e => ({...e,actor:team.canonical(e.actor)})),primary.events.map(e => ({...e,actor:team.canonical(e.actor)})));
  }
}
const lastBatch = ['1512','1513','8001','8003','8007','8009'];
for (const id of lastBatch) {
  const rows = [0,6].map(rank => fight(id,rank,{cycles:6}));
  rows.forEach((row,index) => finiteFight(row,`${id} long E${index * 6}`));
  assert.notEqual(rows[0].total,rows[1].total,id);
  if (id === '1512') assert.ok(rows[1].events.some(e => e.label.startsWith('Зарянка: Яснопея E1')));
  if (id === '8003') assert.ok(rows[1].events.some(e => e.label.startsWith('Первопроходец E1 · огненный урон')));
}
console.log(`Eidolon roster verified: ${forms.size} forms, ${catalog.size} entries, ${catalog.size * 7} E0–E6 fights, aliases match.`);
