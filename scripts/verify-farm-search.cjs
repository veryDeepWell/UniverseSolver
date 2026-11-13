const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine']) {
  require('../'+file+'.js');
}

const D=HSR_DATA, T=HSR_TEAM, id='1106', ids=[id];
const farm=HSR_OPT.farmReference(id,'support',D,false,'speed');
const baseItems=farm.items;
const profiles=items=>({[id]:HSR_OPT.sheetWithoutSets(items,farm.config,D)});
const baseline=profiles(baseItems);
const attack={type:'AttackAddedRatio',value:.12};
const faster={type:'SpeedDelta',value:7};
const variants=[attack,faster].map(sub=>({
  id:sub.type,
  profiles:profiles(baseItems.map((item,i)=>i===0?{...item,subs:[sub]}:item))
}));
const dummy={encounter:'dummy',focus:id,targets:1,cycles:2,enemyLevel:95,toughness:120,
  initialSP:3,energyPercent:50,seed:42,externalDebuffs:0,enemyAttacks:'off',allowPartial:true,trials:3};
const scenarios=[dummy,{...dummy,encounter:'gepard',enemyHP:25000}];
const search=T.createFarmSearch(ids,baseline,variants,scenarios,D);
assert.equal(search.step().checked,1);
const result=search.step(3);
assert.equal(result.checked,4);
assert.equal(result.done,true);
assert.deepEqual(result.rows.map(row=>row.id),variants.map(variant=>variant.id));
for(const [i,row] of result.rows.entries())for(const [j,settings] of scenarios.entries()){
  const variant=variants[i].profiles;
  const pair=row.fights[j];
  assert.deepEqual(pair.rows.map(battle=>battle.total),
    [baseline,variant].map(all=>T.evaluate(ids,all,settings,D).total));
  assert.equal(Boolean(pair.rows[1].encounter),j===1);
  const saved=JSON.parse(JSON.stringify(T.battleInput(ids,variant,{...settings,rollCrits:true},D)));
  assert.equal(T.replayBattle(saved,D).total,T.simulate(ids,variant,{...settings,rollCrits:true},D).total);
}
const ornaments=baseItems.slice(4).map(item=>({...item,setId:'302'}));
const upgrades=ornaments.map(item=>({...item,id:'upgrade-'+item.slot,setId:'301'}));
const changes=[...HSR_OPT.slotReplacements([upgrades[0]],[upgrades[1]])];
assert.deepEqual(changes,[[upgrades[0]],[upgrades[1]],upgrades]);
const equippedProfiles=changes=>{
  const pieces=[...baseItems.slice(0,4),...ornaments].map(item=>changes.find(other=>other.slot===item.slot)||item);
  const all=profiles(pieces);
  all[id].equipment={cavern:pieces.slice(0,4).map(item=>item.setId),planars:pieces.slice(4).map(item=>item.setId)};
  return all;
};
const pairSearch=T.createFarmSearch(ids,equippedProfiles([]),changes.map((items,id)=>({
  id,profiles:equippedProfiles(items)
})),[dummy],D).step(3);
const gains=pairSearch.rows.map(({fights:[fight]})=>fight.rows[1].total-fight.rows[0].total);
assert.ok(gains[0]<=0&&gains[1]<=0&&gains[2]>0,JSON.stringify(gains));
console.log('Verified incremental farm search, scenario separation, replay and a two-piece upgrade missed by single swaps.');
