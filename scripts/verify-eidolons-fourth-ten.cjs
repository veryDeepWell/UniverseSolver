const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data = HSR_DATA, team = HSR_TEAM;
const batch = ['1001','1004','1005','1008','1013','1205','1209','1212','1302','1310'];
const forms = new Set(Object.keys(team.models).map(team.canonical));
assert.equal(new Set(batch).size, 10);
assert.ok(team.eidolonModels.size >= 48);
assert.ok([...team.eidolonModels].every(id => forms.has(id)));

for (const id of batch) {
  assert.ok(team.eidolonModels.has(id), id);
  const lineup = id === '1001' ? [id] : [id,'1101','1106','1108'];
  const profiles = Object.fromEntries(lineup.map(hero => [hero,HSR_OPT.farmReference(hero,HSR_RELIC.archetype(hero,data),data).profile]));
  const scenario = {focus:id,allowPartial:id === '1001',targets:id === '1212' ? 1 : 3,cycles:8,initialSP:3,energyPercent:50,seed:42,toughness:60,enemyLevel:95,enemyAttacks:'training'};
  const simulate = eidolon => team.simulate(lineup,{...profiles,[id]:{...profiles[id],eidolon,policy:'skill'}},scenario,data,true);
  const rows = Array.from({length:7},(_,rank) => simulate(rank));
  assert.ok(rows.every(row => Number.isFinite(row.total) && row.events.every(event => event.sp >= 0 && event.sp <= row.maxSP)),id);
  assert.notEqual(rows[6].total,rows[0].total,id);
  const events = (rank,label) => rows[rank].events.filter(event => event.actor === id && event.label === label);

  if (id === '1001') {
    assert.equal(events(0,'Март 7 E2 · начальный щит').length,0);
    assert.equal(events(2,'Март 7 E2 · начальный щит').length,1);
    assert.ok(events(4,'Март 7 · контратака').length > 0);
  }
  if (id === '1004') {
    const firstSkillHits = rank => {
      const hits = events(rank,'Навык Вельта · попадание');
      return hits.filter(event => event.time === hits[0].time).length;
    };
    assert.equal(firstSkillHits(5),3);
    assert.equal(firstSkillHits(6),4);
  }
  if (id === '1005') assert.ok(events(1,'Кафка E1 · уязвимость к DoT').length > 0);
  if (id === '1205') assert.ok(events(4,'Блэйд E4 · макс. HP повышено').length > 0);
  if (id === '1212') assert.ok(events(1,'Цзинлю E1 · дополнительный урон').length > 0);
  if (id === '1310') {
    assert.ok(events(2,'Светлячок E2 · дополнительный ход').length > 0);
    const opener = eidolon => team.simulate([id],{[id]:{...profiles[id],eidolon,policy:'skill'}},
      {...scenario,allowPartial:true,initialSP:0,energyPercent:100},data,true)
      .events.find(event => event.actor === id && event.label.startsWith('Светлячок · усиленн'));
    assert.equal(opener(0).label,'Светлячок · усиленная базовая');
    assert.equal(opener(1).label,'Светлячок · усиленный навык');
    assert.equal(opener(1).sp,0);
  }
}
console.log(`Fourth batch: E0–E6 verified for ten heroes. Coverage ${team.eidolonModels.size}/${forms.size}.`);
