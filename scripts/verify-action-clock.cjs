const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;
for(const file of ['data/game-data','data/supplements','data/aha','equipment-effects','team-engine'])require('../'+file+'.js');
const D=HSR_DATA,T=HSR_TEAM,C=T.timeline;
const scene={targets:1,cycles:3,enemyLevel:0,toughness:0,initialSP:3,energyPercent:0,seed:42,allowPartial:true,audit:true};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function fight(ids,overrides={},scenario={}){
  return T.simulate(ids,Object.fromEntries(ids.map(id=>[id,{...T.defaults(id,D),policy:'basic',crit:0,critDamage:0,...overrides[id]}])),{...scene,...scenario},D,true);
}
const turns=(battle,id)=>battle.events.filter(e=>e.kind==='turn'&&e.actor===id).map(e=>e.time);
// AG modifiers use the full 10000 gauge, not the remaining gauge.
assert.equal(C.advance(6000,.2),4000);assert.equal(C.advance(500,.2),0);
assert.equal(C.advance(500,1),0);assert.equal(C.delay(6000,.3),9000);
assert.equal(C.delay(10000,.4),14000);
assert.throws(()=>C.advance(-1,.2));assert.throws(()=>C.select([{delta:NaN}]));
assert.equal(C.select([{kind:'none',delta:Infinity}]),null);
// Single winner even when multiple later candidates successively improve.
for(const order of [[111,142,200],[200,142,111],[200,111,142]]){
  const selected=C.select(order.map(delta=>({kind:String(delta),delta})));
  assert.equal(selected.kind,'111');
}
assert.equal(C.select([{kind:'first',delta:100},{kind:'second',delta:100}]).kind,'first');
// Deterministic independent oracle over many candidate permutations.
for(let n=1;n<=60;n++){
  const candidates=Array.from({length:11},(_,i)=>({kind:String(i),delta:((n*19+i*37)%103)/7}));
  const minimum=Math.min(...candidates.map(e=>e.delta));
  assert.equal(C.select(candidates).delta,minimum);
}
// All actors on the exact horizon get a turn. Same-SPD ties use lineup
// order deterministically; this is explicit model policy, not a claim of
// experimentally verified cross-type tie priority in the live game.
const ids=['1106','1105'];
const boundary=fight(ids,Object.fromEntries(ids.map(id=>[id,{speed:200}])),{cycles:1});
assert.deepEqual(turns(boundary,'1106'),[50,100,150]);
assert.deepEqual(turns(boundary,'1105'),[50,100,150]);
assert.deepEqual(boundary.events.filter(e=>e.kind==='turn'&&e.time===150).map(e=>e.actor),ids);
// Speed buff expires after two recipient turns. No progress is reset.
const speed=fight(['1106','1009'],{'1106':{speed:100},'1009':{speed:1}},{energyPercent:100});
const expected=[200/3,400/3,700/3,1000/3];
turns(speed,'1106').forEach((t,i)=>near(t,expected[i]));assert.equal(turns(speed,'1106').length,4);
// Bronya's own basic advances by 30%: first turn 100, subsequent gaps 70.
const bronya=fight(['1101'],{'1101':{speed:100}});
assert.deepEqual(turns(bronya,'1101'),[100,170,240,310]);
// Welt adds 4000 AG and applies 10% Slow; 14000 / 90 AV to first enemy turn.
const delay=fight(['1004'],{'1004':{speed:1,effectHit:10}},{energyPercent:100});
near(delay.events.find(e=>e.label==='Ход болванки 1').time,14000/90);
// Competing end timers formerly dispatched Combustion at Concerto's time.
const clocks=fight(['1310','1309'],{'1310':{speed:1},'1309':{speed:1}},{energyPercent:100});
near(clocks.events.find(e=>e.label==='Концерт · окончание').time,10000/90);
near(clocks.events.find(e=>e.label==='Полное сгорание · окончание').time,10000/70);
const selected=clocks.events.filter(e=>e.kind==='scheduled');
assert.ok(selected.every(e=>e.selectedDelta>=0));
assert.ok(selected.every((e,i)=>i===0||e.time>=selected[i-1].time));
// Pearl: four Elation characters grant an extra turn, not a 100% advance.
const party=['1502','1501','1503','8009'];
const slow=Object.fromEntries(party.map(id=>[id,{speed:1,baseSpeed:1}]));
const pearl=fight(party,slow,{focus:'1502',energyPercent:100,cycles:1});
const extra=pearl.events.find(e=>e.kind==='extra-turn'&&e.actor==='1502');
const ended=pearl.events.find(e=>e.kind==='extra-turn-end'&&e.actor==='1502');
assert.equal(extra.time,0);assert.equal(ended.time,0);
assert.equal(extra.distance,10000);assert.equal(ended.distance,10000);
assert.equal(extra.normalTurns,0);assert.equal(ended.normalTurns,0);
assert.equal(extra.turnCounter,ended.turnCounter);
assert.equal(extra.banger-ended.banger,30);
// The extra basic earns 3 permanent Punchline; only the temporary 60 leave.
assert.equal(extra.punchline+3-ended.punchline,60);
assert.equal(pearl.breakdown.find(a=>a.id==='1502').turns,0);
// Two Elation instead grant 15% AG advance and do not create an extra turn.
const two=fight(['1502','1503'],{'1502':{speed:100,baseSpeed:100},'1503':{speed:1}},{focus:'1502',energyPercent:100,cycles:1});
assert.ok(!two.events.some(e=>e.kind==='extra-turn'));
near(turns(two,'1502')[0],85);
const one=fight(['1106','1503'],{'1106':{speed:100},'1503':{speed:1}},{focus:'1106',energyPercent:100,cycles:1});
near(turns(one,'1106')[0],90);
const three=fight(['1502','1501','1503'],{'1502':{speed:100,baseSpeed:100},'1501':{speed:1},'1503':{speed:1}},{focus:'1502',energyPercent:100,cycles:1});
near(turns(three,'1502')[0],70);
const pearlE2=fight(party,{...slow,'1503':{...slow['1503'],eidolon:2}},{focus:'1502',energyPercent:100,cycles:1});
const e2Extra=pearlE2.events.filter(e=>e.kind==='extra-turn');
assert.deepEqual(e2Extra.map(e=>e.actor),['1502','1501','8009']);
for(const start of e2Extra){
  const end=pearlE2.events.find(e=>e.kind==='extra-turn-end'&&e.actor===start.actor);
  assert.equal(start.time,0);assert.equal(end.distance,10000);
  assert.equal(start.banger-end.banger,60);
  assert.equal(start.turnCounter,end.turnCounter);
}
// Guard boundary: two events finish cleanly, a third is explicitly incomplete.
const context=vm.createContext({HSR_DATA:D,HSR_SUPPLEMENTS,HSR_EQUIPMENT});context.window=context;
const source=fs.readFileSync(path.join(__dirname,'../team-engine.js'),'utf8')
  .replaceAll('steps++>=10000','steps++>=2').replaceAll("timeline.limit('events',10000)","timeline.limit('events',2)");
vm.runInContext(source,context);
assert.doesNotThrow(()=>context.HSR_TEAM.simulate(['1106'],{'1106':{...T.defaults('1106',D),speed:100,policy:'basic'}},{...scene,cycles:1},D));
assert.throws(()=>context.HSR_TEAM.simulate(['1106'],{'1106':{...T.defaults('1106',D),speed:200,policy:'basic'}},{...scene,cycles:1},D),e=>e.code==='BATTLE_WORK_LIMIT'&&e.calculationStatus==='incomplete'&&e.stage==='events'&&e.maximum===2);
for(const stage of ['reactions','ultimates'])assert.throws(()=>C.limit(stage,100),e=>e.code==='BATTLE_WORK_LIMIT'&&e.stage===stage);
console.log('Verified action gauge, speed expiry, delay/advance, ties and horizon, competing clocks, genuine extra turns and explicit work limits.');
