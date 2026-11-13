const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','equipment-effects','team-engine']) require('../' + file + '.js');

const data = HSR_DATA, team = HSR_TEAM;
const ids = ['1002','1306'];
const profiles = {
  '1002': {...team.defaults('1002',data),speed:50,policy:'basic'},
  '1306': {...team.defaults('1306',data),speed:120,policy:'skill'}
};
const scenario = {focus:'1002',targets:1,cycles:1,enemyLevel:0,toughness:0,initialSP:3,energyPercent:100,
  seed:42,externalDebuffs:0,enemyAttacks:'off',allowPartial:true};
const eager = team.simulate(ids,profiles,scenario,data,true);
const delayed = team.simulate(ids,profiles,{...scenario,audit:true,rotation:{actor:'1002',ultimate:'buff'}},data,true);
const ultimate = result=>result.events.find(event=>event.label==='Ульта Дань Хэна');
assert.equal(ultimate(eager).time,0);
assert.equal(ultimate(delayed).time,10000/120);
assert.ok(ultimate(delayed).damage>ultimate(eager).damage);
assert.ok(delayed.events.some(event=>event.kind==='decision'&&event.waitAV===10000/120));
assert.ok(delayed.total>eager.total);

const result = team.createRotationSearch(ids,profiles,scenario,data,'1002').step(60);
assert.equal(result.total,60);
assert.equal(result.done,true);
assert.equal(result.baseline.total,eager.total);
const manual = [];
for (const opening of [undefined,['basic','basic'],['basic','skill'],['skill','basic'],['skill','skill']]) {
  for (const reserve of [undefined,1,2]) for (const ultimate of [undefined,'buff']) for (const ally of [undefined,'1306']) {
    manual.push(team.simulate(ids,profiles,{...scenario,rotation:{actor:'1002',opening,reserve,ultimate,ally}},data).total);
  }
}
assert.equal(result.top[0].total,Math.max(...manual));
const input = team.battleInput(ids,profiles,{...scenario,rotation:result.top[0].rotation},data);
assert.equal(team.replayBattle(JSON.parse(JSON.stringify(input)),data).total,result.top[0].total);
assert.ok(delayed.events.every(event=>event.sp>=0&&event.sp<=delayed.maxSP));

const boss = {...scenario,encounter:'gepard',enemyHP:100000,rotation:{actor:'1002',enemy:'weakest'}};
const target = team.simulate(ids,profiles,boss,data,true).events.find(event=>event.label==='Ульта Дань Хэна');
assert.deepEqual(target.targets,[1]);
console.log('Rotation verified: delayed ultimate, exhaustive short search, replay, SP and enemy targeting.');
