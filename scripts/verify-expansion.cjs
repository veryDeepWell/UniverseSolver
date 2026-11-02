const assert=require('node:assert/strict');
global.window=global;require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');require('../set-engine.js');
const E=HSR_TEAM,D=HSR_DATA,scene={targets:3,cycles:1,initialSP:3,energyPercent:0,seed:42,allowPartial:true};
function profile(id,extra={}){return {...E.defaults(id,D),atk:1000,baseAtk:500,speed:100,baseSpeed:100,crit:0,critDamage:0,energyRegen:.1,...extra};}
function fight(ids,profiles,extra={}){return E.simulate(ids,profiles,{...scene,...extra},D,true);}
// Hook: opening ultimate 4000, enhanced skill 2800+800*2,
// one talent 1000, one primary-only Burn tick 650. No E1/E4/E6.
const hook=fight(['1109'],{'1109':profile('1109')},{energyPercent:100});
assert.equal(hook.total,10050);
assert.equal(hook.events.find(e=>e.label==='Усиленный навык Хук').time,80);
assert.equal(hook.events.filter(e=>e.label==='Талант Хук · дополнительный урон').length,1);
assert.deepEqual(hook.damageByTarget,[8450,800,800]);
// Guinaifen: own 25% opening advance, three independent Burns, first
// tick gains A6 but not the Firekiss it applies after dealing damage.
const gui=fight(['1210'],{'1210':profile('1210')});
assert.equal(gui.events.find(e=>e.label==='Навык Гуйнайфэнь').time,75);
assert.ok(Math.abs(gui.total-(2000+2182.1*1.2*3))<1e-8);
assert.equal(gui.events.filter(e=>e.label==='Огненный поцелуй · 1 ур.').length,3);
assert.ok(gui.events.every(e=>!e.label.includes('4 ур.')));
// A foreign Burn can trigger Firekiss; her ultimate detonates Burns,
// while Kafka can detonate the newly supported Burns as well.
const duo=fight(['1109','1210'],{'1109':profile('1109'), '1210':profile('1210',{energyRegen:1})},{cycles:10,energyPercent:100});
assert.ok(duo.events.some(e=>e.label==='Подрыв Горения'));
assert.ok(duo.events.some(e=>e.actor==='1210'&&e.label==='Огненный поцелуй · 3 ур.'));
const kafka=fight(['1210','1005'],{'1210':profile('1210'),'1005':profile('1005',{speed:80})},{cycles:5});
assert.ok(kafka.events.some(e=>e.actor==='1210'&&e.label==='Подрыв DoT'));
// Guaranteed crit on all skill hits: primary target alone is slowed;
// its first turn is delayed, the other two dummies still act at 100 AV.
const dan=fight(['1002'],{'1002':profile('1002',{crit:1,speed:125})},{cycles:2});
assert.ok(dan.events.some(e=>e.label.startsWith('Замедление')));
assert.equal(dan.events.find(e=>e.label==='Ход болванки 2').time,100);
assert.ok(dan.events.find(e=>e.label==='Ход болванки 1').time>100);
// Allied targeted ability activates RES PEN for the next complete
// attack only. Tingyun's 40% basic bonus and additional attacks are separate.
const assisted=fight(['1002','1202'],{'1002':profile('1002',{speed:1}),'1202':profile('1202',{speed:1})},{energyPercent:100,cycles:1});
assert.ok(Math.abs(assisted.events.find(e=>e.label==='Ульта Дань Хэна').damage-4000*1.5*1.36)<1e-8);
assert.ok(assisted.events.some(e=>e.label.startsWith('Превосходство')));
// Every new model participates in the shared set engine, with immutable
// input profiles and identical seeded results with or without event logs.
for(const id of ['1002','1109','1210']){
  const profiles={[id]:profile(id,{crit:.6,critDamage:1.2,energyRegen:1})},before=JSON.stringify(profiles);
  const a=fight([id],profiles,{cycles:5}),b=fight([id],profiles,{cycles:5});assert.deepEqual(a,b);assert.ok(a.total>0);assert.equal(JSON.stringify(profiles),before);
  const input={characterId:id,profile:profiles[id],context:[],contextProfiles:{},position:0,focus:id,caverns:['102','117'],planars:['306','309'],mixed:true,scenario:{...scene,cycles:5,externalDebuffs:0}};
  const search=HSR_SETS.createSearch(input,D);let result;do{result=search.step(3);}while(!result.done);assert.equal(result.checked,6);assert.ok(result.top.every(r=>r.total>0));
  for(const event of a.events)assert.ok(event.sp>=0&&event.sp<=5&&Number.isFinite(event.damage));
}
console.log('Character expansion verified: Hook enhanced skill/energy/advance, Guinaifen Burn/Firekiss/detonations, Kafka interaction, Dan Heng slow/independent target turns/allied RES PEN, seeded reproducibility.');
