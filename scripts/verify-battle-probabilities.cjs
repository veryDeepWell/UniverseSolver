const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','equipment-effects','team-engine']) {
  require('../' + file + '.js');
}

const data = HSR_DATA, team = HSR_TEAM, id = '1106';
const scenario = {focus:id,targets:1,cycles:1,enemyLevel:0,toughness:0,initialSP:3,
  energyPercent:0,seed:42,externalDebuffs:0,enemyAttacks:'off',allowPartial:true,trials:32};
const input = (crit,settings=scenario) => ({
  ids:[id],scenario:settings,
  profiles:{[id]:{...team.defaults(id,data),speed:120,policy:'basic',crit,critDamage:1}}
});
const compare = (a,b,options) => team.compareBattles(a,b,data,options);
const dummy = compare(input(0),input(.5));
assert.equal(dummy.method,'exact');
assert.deepEqual(dummy.outcomes,[1,1]);
assert.ok(Math.abs(dummy.rows[1].total-dummy.rows[0].total*1.5)<1e-9);

const boss = {...scenario,encounter:'gepard',enemyHP:600};
const noncrit = input(0,boss), mixed = input(.5,boss), guaranteed = input(1,boss);
const exact = compare(noncrit,mixed);
const base = exact.rows[0].total;
assert.deepEqual(exact.outcomes,[1,2]);
assert.ok(base<600&&base*1.5>600);
assert.equal(compare(noncrit,guaranteed).rows[1].total,600);
assert.equal(exact.rows[1].total,(base+600)/2);
assert.equal(compare(noncrit,input(.5,{...boss,seed:124})).rows[1].total,exact.rows[1].total);

const sampled = compare(noncrit,mixed,{preferExact:false});
assert.equal(sampled.method,'paired');
assert.equal(sampled.count,32);
const trueDelta = exact.rows[1].total-base;
assert.ok(sampled.interval.lower<trueDelta&&sampled.interval.upper>trueDelta);
assert.deepEqual(compare(noncrit,mixed,{preferExact:false}),sampled);
assert.deepEqual(compare(mixed,mixed,{preferExact:false}).interval,{lower:0,upper:0});
const single = input(.5,{...boss,cycles:2,trials:1});
assert.equal(compare(single,single).interval,null);

const dan = {ids:['1002'],scenario:{...scenario,focus:'1002'},
  profiles:{1002:{...team.defaults('1002',data),speed:120,policy:'basic',crit:0}}};
assert.deepEqual(compare(dan,dan).outcomes,[2,2]);

const manyHits = {ids:['1014'],scenario:{...boss,focus:'1014',energyPercent:100,enemyHP:1000000},
  profiles:{1014:{...team.defaults('1014',data),crit:.5,critDamage:1}}};
assert.equal(compare(manyHits,manyHits).method,'paired');
console.log('Verified weighted crit branches, HP cap, linear expected crit, paired interval, and work limit.');
