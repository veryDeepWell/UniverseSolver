const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','set-engine'])
  require('../'+file+'.js');

const D=HSR_DATA, T=HSR_TEAM, O=HSR_OPT, S=HSR_SETS;
const dd='1002', sunday='1313', ids=[dd,sunday];
const scenario={focus:dd,targets:1,cycles:1,enemyLevel:0,toughness:0,initialSP:5,
  energyPercent:0,seed:42,externalDebuffs:0,enemyAttacks:'off',allowPartial:true};
const farm=(id,boots,budget)=>O.farmReference(id,id===sunday?'support':'atk',D,true,boots,budget);
const candidates=Object.fromEntries(ids.map(id=>[id,['speed','scaling'].flatMap(boots=>
  Array.from({length:13},(_,budget)=>{
    const {items,profile}=farm(id,boots,budget);
    const affix=O.subAffixes(D).find(entry=>entry.property==='SpeedDelta');
    const roll=affix.base+affix.step;
    const spent=items.flatMap(item=>item.subs).filter(sub=>sub.type==='SpeedDelta')
      .reduce((sum,sub)=>sum+sub.value/roll,0);
    assert.equal(spent,budget);
    assert.ok(Math.abs(profile.speed-farm(id,boots,0).profile.speed-budget*roll)<1e-9);
    assert.ok(items.every(item=>O.validateItem(item,D)));
    return {boots,budget,profile:{...profile,policy:id===dd?'basic':'skill'}};
  })
)]));
const baseline={[dd]:candidates[dd][0].profile,[sunday]:candidates[sunday][12].profile};
const options={[dd]:[candidates[dd][0]],[sunday]:candidates[sunday]};
const order=[sunday,dd];
const search=S.createLineupSearch(order,baseline,options,scenario,D,ids);
const result=search.step(27);
assert.equal(result.done,true);
assert.equal(result.checked,27);
assert.ok(result.after.total>result.before.total);
assert.deepEqual(result.after.ids,ids);
const manual=Math.max(...options[sunday].map(({profile})=>
  T.simulate(ids,{...baseline,[sunday]:profile},scenario,D).total));
assert.equal(result.after.total,manual);
const log=T.replayBattle(T.battleInput(ids,result.profiles,scenario,D),D);
const opening=log.events.filter(event=>event.kind==='turn').slice(0,3);
assert.deepEqual(opening.map(event=>event.actor),[dd,sunday,dd]);
assert.equal(opening[1].time,opening[2].time);
console.log('Verified reachable speed budgets, coordinate search and Sunday advancing the damage dealer.');
