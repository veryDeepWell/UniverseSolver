const assert=require('node:assert/strict');
global.window=global;
require('../data/game-data.js');
require('../optimizer-engine.js');
require('../equipment-effects.js');
require('../team-engine.js');
require('../set-engine.js');

const data=HSR_DATA, team=HSR_TEAM, sets=HSR_SETS, gear=HSR_EQUIPMENT;
const hero='1102', ally='1101';
const scenario={targets:2,cycles:2,initialSP:3,energyPercent:50,seed:42,toughness:120,externalDebuffs:0};
const reference=team.defaults(hero,data);
const input={characterId:hero,profile:{...reference,atk:reference.atk*1.5+200,speed:137},
  coneRatios:{atk:.5},context:[],contextProfiles:{},position:0,focus:hero,scenario,
  cones:[{id:'21003',rank:2},{id:'23001',rank:1}],caverns:['102','108'],planars:['301'],mixed:false};
const equipped=sets.buildProfile(input,null,input.cones[0],data);
const coneBase=data.light_cone_promotions['21003'].values[6].atk;
const addedAtk=coneBase.base+79*coneBase.step;
assert.ok(Math.abs(equipped.atk-(input.profile.atk+1.5*addedAtk+.2*equipped.baseAtk))<1e-8);
assert.throws(()=>gear.coneProfile(hero,{...reference,baseAtk:reference.baseAtk+100},input.cones[0],{},data),/без конуса/);
const solo=(targets)=>team.simulate([hero],{[hero]:equipped},{...scenario,targets,allowPartial:true},data);
assert.ok(Math.abs(solo(2).initialStats[hero].crit-solo(3).initialStats[hero].crit-.15)<1e-8);

const shortlist=sets.createSearch(input,data).step(100);
assert.equal(shortlist.checked,4);
assert.equal(shortlist.bestByCone.length,2);
const candidates={
  [hero]:shortlist.top.slice(0,2).map((row,index)=>({
    id:'hunt-'+index,profile:sets.buildProfile(input,row.pack,row.cone,data)
  })),
  [ally]:[1,5].map(rank=>({id:'chorus-'+rank,
    profile:gear.coneProfile(ally,team.defaults(ally,data),{id:'20005',rank},{},data)}))
};
const core=[hero,ally,'1203'],pool=['1202','1106'];
const oracle=pool.map(lastId=>{
  let best;
  const ids=[...core,lastId];
  for(const a of candidates[hero])for(const b of candidates[ally]){
    const result=team.simulate(ids,{[hero]:a.profile,[ally]:b.profile},{...scenario,focus:hero},data);
    if(!best||result.total>best.total)best={ids,total:result.total,builds:{[hero]:a.id,[ally]:b.id}};
  }
  return best;
}).sort((a,b)=>b.total-a.total);
const search=team.createSearch(core,pool,{},scenario,data,candidates);
let result;
do{result=search.step(3);}while(!result.done);
assert.equal(result.checked,8);
assert.equal(result.rosters,2);
assert.deepEqual(result.top.map(({ids,total,builds})=>({ids,total,builds})),oracle);
for(const row of result.top)
  assert.equal(team.simulate(row.ids,row.profiles,{...scenario,focus:hero},data,true).total,row.total);
console.log('Build candidates verified: cone scaling, situational crit, combined roster/build search, exact result replay.');
