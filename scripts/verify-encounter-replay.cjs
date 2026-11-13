const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','set-engine','relic-engine']) {
  require('../' + file + '.js');
}
const data = HSR_DATA, team = HSR_TEAM;
const settings = {focus:'1002',targets:1,cycles:3,enemyLevel:0,toughness:0,initialSP:0,energyPercent:0,seed:42,externalDebuffs:0,enemyAttacks:'off',allowPartial:true};
const solo = { ...team.defaults('8001',data),speed:125,policy:'basic' };
const control = team.replayBattle(team.battleInput(['8001'],{'8001':solo},{...settings,focus:'8001'},data),data);
assert.deepEqual(control.events.filter(event=>event.kind==='turn').map(event=>event.time),[80,160,240,320]);
assert.deepEqual(control.events.filter(event=>event.kind==='attack').map(event=>event.sp),[1,2,3,4]);

const ids = ['1308','1006','1101','1217'];
const profiles = Object.fromEntries(ids.map(id=>[id,HSR_OPT.farmReference(id,HSR_RELIC.archetype(id,data),data).profile]));
Object.assign(profiles['1308'],{eidolon:1,exEidolon:true});
const scenario = {...settings,focus:ids[0],encounter:'gepard',enemyHP:100000,enemyLevel:95,toughness:120,initialSP:3,energyPercent:50,cycles:6,trials:3,rollCrits:true};
const input = team.battleInput(ids,profiles,scenario,data);
const fight = team.replayBattle(input,data);
assert.deepEqual(fight,team.replayBattle(JSON.parse(JSON.stringify(input)),data));
assert.throws(()=>team.replayBattle({...input,battleVersion:'unknown'},data),/Версия/);
assert.equal(fight.encounter.result,'victory');
assert.deepEqual(fight.events.filter(event=>event.kind==='phase').map(event=>event.phase),[1,2,3]);
assert.equal(fight.events.filter(event=>event.kind==='shield-break').length,2);
assert.ok(fight.events.some(event=>event.kind==='incoming'&&event.hpLoss>0));
assert.ok(Math.abs(fight.total-420000)<1e-6);
assert.ok(fight.events.some(event=>event.kind==='resource'&&event.label.endsWith('EX-эйдолон')));
for (const event of fight.events.filter(event=>event.kind==='resource'&&event.label.endsWith('сверхспособность'))) {
  assert.equal(event.before-event.after,9);
}
const doomed = team.simulate(['8001'],{'8001':{...solo,hp:1}}, {...scenario,focus:'8001',enemyHP:1000000},data,true);
assert.equal(doomed.encounter.result,'defeat');
assert.equal(doomed.breakdown[0].currentHP,0);
assert.equal(doomed.encounter.survivors,0);
const build = {characterId:ids[0],profile:profiles[ids[0]],context:ids.slice(1),contextProfiles:profiles,position:0,focus:ids[0],scenario};
for (const pack of [null,{cavern:Array(4).fill('117'),planar:'314'}]) {
  const args = HSR_SETS.battleArguments(build,pack,data);
  const replay = team.replayBattle(team.battleInput(args.ids,args.profiles,args.scenario,data),data);
  assert.equal(replay.total,HSR_SETS.run(build,pack,data,true).total);
  assert.ok(HSR_SETS.run(build,pack,data).encounter.wins>0);
}
console.log('Verified replay, 80 AV turn spacing, SP, Acheron EX charges, Gepard phases, barriers, defeat and build comparisons.');
