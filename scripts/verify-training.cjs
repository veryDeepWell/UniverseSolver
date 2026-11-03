const assert=require('node:assert/strict');global.window=global;require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');
const E=HSR_TEAM,D=HSR_DATA,scene={targets:3,cycles:3,initialSP:3,energyPercent:50,seed:42,toughness:0};
for(const id of ['1107','1221']){
 const ids=[id,'1101','1202','1203'],off=E.simulate(ids,{},scene,D,true),on=E.simulate(ids,{}, {...scene,enemyAttacks:'training'},D,true);
 assert(on.events.some(e=>e.label.startsWith('Тренировочная атака')));
 assert(on.events.some(e=>e.actor===id&&e.label.includes('контратака')));
 assert(on.breakdown.find(a=>a.id===id).followups>off.breakdown.find(a=>a.id===id).followups);
 assert.deepEqual(on,E.simulate(ids,{}, {...scene,enemyAttacks:'training'},D,true));
 assert(!off.events.some(e=>e.label.startsWith('Тренировочная атака')));
 assert(on.breakdown.every(a=>Number.isFinite(a.damage)));
}
assert.throws(()=>E.createSearch(['1107'],['1101','1202','1106'],{}, {...scene,requireSustain:true},D),/састейн/);
const search=E.createSearch(['1107'],['1101','1202','1106','1203'],{}, {...scene,requireSustain:true},D);const result=search.step(100);assert(result.top.length);assert(result.top.every(r=>r.ids.includes('1203')));
assert.equal(E.createSearch(['1107','1203','1101','1202'],[],{}, {...scene,requireSustain:true},D).total,1);
assert.throws(()=>E.createSearch(['1107','1101','1202','1106'],['1203'],{}, {...scene,requireSustain:true},D),/састейн/);
console.log('Training attacks, counters, seeded replay, sustain pool/core constraints verified.');
