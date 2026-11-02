const assert=require('node:assert/strict');global.window=global;
require('../data/game-data.js');require('../optimizer-engine.js');
const E=HSR_OPT,D=HSR_DATA;
const config={characterId:'1102',coneId:'',level:80,coneLevel:80,rank:1,actionId:'custom',skillLevel:10,scaling:'atk',kind:'skill',coefficient:1,enemyLevel:80,targets:1,debuffs:0,dots:0,resistance:0,elementWeakness:false,resPen:0,defReduction:0,vulnerability:0,damageBonus:0,atkBonus:0,hpBonus:0,defBonus:0,critBonus:0,critDamageBonus:0,speedFlat:0,minSpeed:0,minCrit:0,boxerStacks:0,traces:false,canCrit:false,broken:true,afterSkill:false,afterUltimate:false,afterKill:false,lowHp:false,opening:false,resurgence:false,imprisoned:false};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
E.validateConfig(config,D);
const character=D.character_promotions['1102'].values[6],baseAtk=character.atk.base+79*character.atk.step;
near(E.evaluate([],config,D).score,baseAtk*.5);
near(E.evaluate([],{...config,broken:false},D).score,baseAtk*.5*.9);
near(E.evaluate([],{...config,resistance:.2},D).score,baseAtk*.5*.8);
near(E.evaluate([],{...config,defReduction:1},D).score,baseAtk);
near(E.evaluate([],{...config,critBonus:2,canCrit:true},D).factors.crit,1.5);
near(E.evaluate([],{...config,resistance:-1,resPen:1},D).factors.res,2);
// The source contains both original and enhanced trace trees. Never add both.
near(E.evaluate([],{...config,traces:true},D).stats.atk,baseAtk*1.28);
near(E.evaluate([],{...config,traces:true},D).stats.critDmg,.74);
near(E.evaluate([],{...config,actionId:'110203',traces:true},D).factors.res,1.2);
near(E.evaluate([],{...config,actionId:'110203',traces:false},D).factors.res,1);
const cone=D.light_cone_promotions['23001'].values[6],coneAtk=cone.atk.base+79*cone.atk.step;
near(E.evaluate([],{...config,coneId:'23001'},D).stats.atk,baseAtk+coneAtk);
near(E.evaluate([],{...config,coneId:'23001'},D).factors.damage,1.06);
near(E.evaluate([],{...config,coneId:'23001',speedFlat:100},D).factors.damage,1.36);
assert.throws(()=>E.validateConfig({...config,actionId:'110201',skillLevel:10},D));
const make=(id,slot,main,setId='108',subs=[])=>E.validateItem({id,slot,main,setId,level:15,subs},D);
assert.throws(()=>E.validateItem({id:'x',slot:'HEAD',main:'HPDelta',level:15,subs:[]},D));
assert.throws(()=>make('bad','HEAD','SpeedDelta'));
assert.throws(()=>make('bad','HEAD','HPDelta','108',[{type:'HPDelta',value:10}]));
assert.throws(()=>make('bad','HEAD','HPDelta','108',[{type:'CriticalChanceBase',value:1}]));
const pieces=E.slots.map((slot,i)=>make('base'+i,slot,E.mainAffixes(D,slot)[0].property,i<4?'108':'309'));
near(E.evaluate(pieces,{...config,elementWeakness:true},D).factors.def,1/(1+.8));
const arena=E.evaluate(pieces,{...config,critBonus:.7},D);near(arena.factors.damage,1.3); // quantum 10% + skill 20%
const noArena=E.evaluate(pieces,config,D);near(noArena.factors.damage,1.1);
near(E.evaluate(pieces,{...config,critBonus:.57},D).factors.damage,1.3);
near(E.evaluate(pieces,{...config,critBonus:.5699},D).factors.damage,1.1);
assert.equal(E.evaluate(pieces,{...config,minSpeed:999},D).feasible,false);
// Verify incremental enumeration against an independent Cartesian product oracle.
const inventory=pieces.flatMap((item,i)=>[item,make('alt'+i,item.slot,item.main,item.setId,[{type:'CriticalDamageBase',value:.0648}])]);
const pools=E.slots.map(s=>inventory.filter(i=>i.slot===s));let oracle=[];
function enumerate(depth,chosen){if(depth===6){oracle.push(E.evaluate(chosen,{...config,canCrit:true},D).score);return;}for(const item of pools[depth])enumerate(depth+1,[...chosen,item]);}
enumerate(0,[]);oracle.sort((a,b)=>b-a);
const search=E.createSearch(inventory,{...config,canCrit:true},D);let result;do{result=search.step(7);}while(!result.done);
assert.equal(result.checked,64);assert.equal(result.feasible,64);assert.equal(result.top.length,10);result.top.forEach((r,i)=>near(r.score,oracle[i]));
const noMatch=E.createSearch(inventory,{...config,minSpeed:999},D);assert.equal(noMatch.step(100).top.length,0);
assert.throws(()=>E.createSearch(inventory.filter(i=>i.slot!=='HEAD'),config,D));
assert.throws(()=>E.createSearch([...inventory,inventory[0]],config,D));
console.log('Optimizer verified: damage factors, stat composition, conditions, validation, exact top 10 vs 64-build Cartesian oracle, constraints.');
