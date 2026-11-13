const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','relic-engine','set-engine']) {
  require('../' + file + '.js');
}
const data = HSR_DATA, team = HSR_TEAM;
const ids = ['1308','1507','1406','1414'];
const profiles = Object.fromEntries(ids.map(id=>[id,HSR_OPT.farmReference(id,HSR_RELIC.archetype(id,data),data).profile]));
Object.assign(profiles['1308'],{eidolon:1,exEidolon:true});
const settings = {focus:'1308',targets:1,cycles:3,enemyLevel:95,toughness:120,initialSP:3,energyPercent:50,seed:42,externalDebuffs:0,enemyAttacks:'training',trials:3};
const replay = seed=>team.simulate(ids,profiles,{...settings,seed,rollCrits:true},data,true);
const battles = [42,104771,209500].map(replay);
assert.deepEqual(replay(42),battles[0]);
assert.ok(new Set(battles.map(battle=>battle.total)).size > 1);
assert.ok(battles.some(battle=>battle.events.some(event=>event.crits?.includes(true))));
assert.ok(battles.some(battle=>battle.events.some(event=>event.crits?.includes(false))));
assert.ok(battles[0].events.some(event=>event.label.startsWith('Ахерон EX')));
assert.ok(battles[0].events.every((event,i,events)=>!i||event.time>=events[i-1].time));
const averaged = team.evaluate(ids,profiles,settings,data);
assert.equal(averaged.total,battles.reduce((sum,battle)=>sum+battle.total,0)/3);
assert.equal(averaged.trials.min,Math.min(...battles.map(battle=>battle.total)));
assert.equal(averaged.trials.max,Math.max(...battles.map(battle=>battle.total)));
const search = team.createSearch(ids,[],profiles,settings,data).step();
assert.equal(search.top[0].total,averaged.total);
const input={characterId:ids[0],profile:profiles[ids[0]],context:ids.slice(1),contextProfiles:profiles,
  position:0,focus:ids[0],scenario:settings,caverns:['110','117'],planars:['316','314'],mixed:false};
assert.equal(HSR_SETS.run(input,null,data).total,averaged.total);
const sets=HSR_SETS.createSearch(input,data).step(4);
assert.equal(sets.top[0].total,HSR_SETS.run(input,sets.top[0].pack,data).total);
console.log('Rolled combat verified: replay, crits, EX, chronological logs, search and build scoring.');
