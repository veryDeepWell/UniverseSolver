const assert=require('node:assert/strict');
global.window=global;
require('../data/game-data.js');
require('../data/supplements.js');
require('../data/aha.js');
require('../equipment-effects.js');
require('../team-engine.js');
const D=HSR_DATA,T=HSR_TEAM;
const scene={targets:3,cycles:1,seed:42,initialSP:3,energyPercent:0,enemyLevel:0,
  toughness:120,allowPartial:true,rollCrits:true,audit:true};
function fight(ids,profiles={},scenario={}){
  return T.simulate(ids,Object.fromEntries(ids.map(id=>[id,{
    ...T.defaults(id,D),atk:1000,hp:10000,crit:0,speed:1,
    novaflare:T.novaflareModels.has(T.canonical(id)),...profiles[id]
  }])),{...scene,focus:ids[0],...scenario},D,true);
}
const events=(battle,label)=>battle.events.filter(event=>event.label.startsWith(label));
const forms=Object.keys(T.models).filter(id=>T.canonical(id)===id&&id!=='1511');
let checked=0;
for(const id of forms){
  const ids=id==='1002'?['1002','1101']:[id,'1002'];
  for(const encounter of ['dummy','gepard']){
    const result=fight(ids,{}, {encounter,prebattle:[{id}]});
    assert.ok(Number.isFinite(result.total),id);
    for(const row of result.breakdown)for(const key of ['energy','resource','currentHP','damage'])
      assert.ok(Number.isFinite(row[key]),id+' '+key);
    assert.ok(events(result,'Применение техники').some(event=>event.actor===id),id);
    checked++;
  }
  const lethal=fight(ids,{}, {encounter:'gepard',enemyHP:1,toughness:10,prebattle:[{id}]});
  assert.ok(Number.isFinite(lethal.total),id+' lethal opener');
}

// KQM's Dan Heng, Bronya and Ruan Mei guides describe these opening values.
const preparations=fight(['1002','1101'],{}, {prebattle:[{id:'1002'},{id:'1101'}]});
assert.ok(Math.abs(preparations.initialStats['1002'].atk-(1000+.55*T.defaults('1002',D).baseAtk))<1e-9);
const ruan=fight(['1303','1002'],{}, {prebattle:[{id:'1303'}]});
assert.equal(ruan.breakdown.find(row=>row.id==='1303').energy,30);
assert.equal(ruan.finalSP,3);
assert.equal(ruan.initialStats['1002'].damage,.32);
const energy=fight(['1202'],{},{prebattle:[{id:'1202',uses:2}]});
assert.equal(energy.breakdown[0].energy,100);
const energyERR=fight(['1202'],{'1202':{energyRegen:2}},{prebattle:[{id:'1202'}]});
assert.equal(energyERR.breakdown[0].energy,50);
const sw=fight(['1006'],{},{prebattle:[{id:'1006'}],encounter:'gepard'});
assert.deepEqual(events(sw,'Техника ·')[0].toughness,[100,100,100]);
const firefly=fight(['1310'],{},{prebattle:[{id:'1310'}],encounter:'gepard',cycles:2});
assert.deepEqual(events(firefly,'Техника ·')[0].toughness,[100,100,100]);
assert.equal(events(firefly,'Применение техники').length,1);
const noPreparation=fight(['1002']);
assert.equal(events(noPreparation,'Применение техники').length,0);
const replayProfiles={'1002':{...T.defaults('1002',D),atk:1000,hp:10000,crit:0,speed:1}};
const replayScene={...scene,focus:'1002',prebattle:[{id:'1002'}]};
assert.deepEqual(T.replayBattle(T.battleInput(['1002'],replayProfiles,replayScene,D),D).events,
  T.simulate(['1002'],replayProfiles,replayScene,D,true).events);
assert.throws(()=>T.validatePrebattle([{id:'1005'},{id:'1006'}]),/одна атакующая/);
assert.throws(()=>T.validatePrebattle([{id:'1003'},{id:'1004'}]),/одно пространство/);
assert.throws(()=>fight(['1202','1002'],{},{prebattle:[{id:'1202',uses:5},{id:'1002'}]}),/очков техники/);

// Huohuo's cleansing occurs before the active ally loses their action to Freeze.
// See KQM Huohuo, Mechanics; the Novaflare talent adds a second heal.
const frozen={id:'1002',kind:'freeze',turns:1,value:0};
const frozenDan=fight(['1002'],{'1002':{speed:110}},{initialDebuffs:[frozen]});
assert.equal(events(frozenDan,'Заморозка · пропуск действия').length,1);
const rescued=fight(['1002','1217'],{'1002':{speed:110}},{initialDebuffs:[frozen]});
assert.equal(events(rescued,'Заморозка · пропуск действия').length,0);
assert.equal(events(rescued,'Очищение').length,1);
assert.ok(events(rescued,'Очищение')[0].time<=events(rescued,'Навык Дань Хэна')[0].time);
const manyDebuffs=Array.from({length:8},()=>({id:'1002',kind:'atkDown',turns:10,value:.01}));
const limited=fight(['1002','1217'],{'1002':{speed:200}},{cycles:3,initialDebuffs:manyDebuffs});
assert.equal(events(limited,'Очищение').length,6);
const afterCleanTurns=limited.events.filter(event=>event.actor==='1002'&&event.kind==='turn');
assert.ok(afterCleanTurns.length>=6);
const partial=fight(['1002','1217'],{'1002':{speed:200}},{cycles:3,
  initialDebuffs:[{id:'1002',kind:'atkDown',turns:10,value:.1}]});
assert.equal(events(partial,'Очищение').length,1);
assert.equal(limited.breakdown.find(row=>row.id==='1217').energy,
  partial.breakdown.find(row=>row.id==='1217').energy);
assert.throws(()=>fight(['1002'],{},{enemyEffectRes:2}),/Сопротивление/);
assert.throws(()=>fight(['1002'],{},{initialDebuffs:[{...frozen,kind:'unknown'}]}),/начальные/);
const blocked=fight(['1002'],{'1002':{speed:110,crit:1,effectHit:10}},
  {enemyEffectRes:1});
assert.equal(events(blocked,'Замедление').length,0);
const input=T.battleInput(rescued.ids,Object.fromEntries(rescued.ids.map(id=>[id,{
  ...T.defaults(id,D),atk:1000,hp:10000,crit:0,speed:id==='1002'?110:1,
  novaflare:T.novaflareModels.has(id)
}])),{...scene,focus:'1002',initialDebuffs:[frozen]},D);
assert.equal(T.replayBattle(input,D).total,rescued.total);

// Confirmed by the user against patch notes and gameplay, 17 November 2026.
const halving=fight(['1307'],{'1307':{effectHit:2,eidolon:2}},
  {cycles:3,toughness:0,targets:1});
assert.deepEqual(halving.events.filter(e=>e.kind==='arcana'&&e.natural)
  .map(e=>e.arcanaDamageStacks),[31,15,7]);
const bladeHeal=fight(['1205','1217'],{'1217':{speed:100}},{toughness:0});
const fullHPHeal=bladeHeal.events.find(e=>e.kind==='healing'&&e.recipient==='1205');
assert.equal(fullHPHeal.effectiveHealing,0);
assert.equal(fullHPHeal.overheal,684);
assert.equal(fullHPHeal.hpLossTally,171);
const jingliuShield=fight(['1212','1104'],{'1104':{def:10000}},
  {encounter:'gepard',toughness:0,prebattle:[{id:'1104'}]});
assert.equal(events(jingliuShield,'Цзинлю · событие потери HP').length,0);
const jingliuUnprotected=fight(['1212','1002'],{},{encounter:'gepard',toughness:0});
assert.ok(events(jingliuUnprotected,'Цзинлю · событие потери HP').length>0);

// Arcana overflow contributes to this detonation, then the excess is discarded.
const overflowing=fight(['1307','1005'],{
  '1307':{effectHit:2,eidolon:2},'1005':{effectHit:2,speed:200}
},{cycles:3,toughness:0,targets:1,initialSP:5,energyPercent:100,focus:'1005'});
const overflow=overflowing.events.find(e=>e.kind==='arcana'&&!e.natural&&e.arcanaDamageStacks>50);
assert.ok(overflow);
assert.equal(overflow.arcanaStacks,50);
const overflowHit=overflowing.events[overflowing.events.indexOf(overflow)-1];
const expected=overflowing.initialStats['1307'].atk*(2.4+.12*overflow.arcanaDamageStacks)*1.72*1.25*1.25*.75;
assert.ok(Math.abs(overflowHit.damage-expected)<1e-7);
const swanE4=fight(['1307'],{'1307':{effectHit:2,eidolon:4}},
  {cycles:2,targets:1,toughness:0,energyPercent:100});
assert.deepEqual(events(swanE4,'Чёрный Лебедь E4 · 8 энергии').map(e=>e.time),[100,200]);
console.log('Verified '+forms.length+' technique forms in '+checked+' opening fights and '+forms.length+' lethal openers, numeric effects, cleansing, control, overflow and replay.');
