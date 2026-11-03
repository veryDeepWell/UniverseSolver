const assert=require('node:assert/strict');global.window=global;require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');
const E=HSR_TEAM,D=HSR_DATA,scenario={targets:3,cycles:5,initialSP:3,energyPercent:50,seed:42};
const profiles=Object.fromEntries(Object.keys(E.models).map(id=>[id,E.defaults(id,D)]));
assert.throws(()=>E.createSearch([],[],profiles,scenario,D),/кор/);
assert.throws(()=>E.createSearch(['1220'],['1101'],profiles,scenario,D),/недостаточно/);
const unsupported=Object.keys(D.characters).find(id=>!E.models[id])||'9999';
assert.throws(()=>E.createSearch([unsupported],[],profiles,scenario,D),/не поддержан/);
assert.throws(()=>E.simulate(['1220','1220','1101','1202'],profiles,scenario,D));
assert.throws(()=>E.validateScenario({...scenario,targets:6}));
assert.throws(()=>E.validateStats({...profiles['1220'],speed:0}));
const team=['1220','1101','1202','1106'];
const first=E.simulate(team,profiles,scenario,D,true),second=E.simulate(team,profiles,scenario,D,true);
assert.deepEqual(first,second,'Same seed and profiles must produce identical events');
assert.equal(first.total,E.simulate(team,profiles,scenario,D,false).total,'Collecting a log must not change the result');
assert.deepEqual(E.combinations(['a'],-1),[]);
assert.equal(first.horizon,550);assert.equal(first.damageByTarget.length,3);
assert.ok(first.breakdown.find(r=>r.id==='1220').followups>0);assert.ok(first.breakdown.find(r=>r.id==='1220').ults>0);
assert.ok(first.events.some(e=>e.label.includes('Навык Брони')));
for(const e of first.events){assert.ok(e.sp>=0&&e.sp<=5);assert.ok(Number.isFinite(e.damage)&&e.damage>=0);assert.ok(e.time<=550+1e-8);}
for(let i=1;i<first.events.length;i++)assert.ok(first.events[i].time>=first.events[i-1].time-1e-8);
assert.ok(Math.abs(first.total-first.damageByTarget.reduce((a,b)=>a+b,0))<1e-7);
assert.ok(Math.abs(first.total-first.breakdown.reduce((a,b)=>a+b.damage,0))<1e-7);
// With no resource interactions, basic-only turn counts follow 10000 / SPD.
const basic=structuredClone(profiles);for(const p of Object.values(basic)){p.policy='basic';p.speed=100;p.baseSpeed=100;p.crit=0;p.critDamage=0;p.damageBonus=0;p.energyRegen=.1;}
const plain=E.simulate(['1105','1106','1013','1103'],basic,{...scenario,energyPercent:0,cycles:1},D,true);
plain.breakdown.forEach(r=>assert.equal(r.turns,1));assert.ok(plain.events.filter(e=>e.kind==='attack').every(e=>Math.abs(e.time-100)<1e-8));
const fast=structuredClone(basic);fast['1105'].speed=200;
const faster=E.simulate(['1105','1106','1013','1103'],fast,{...scenario,energyPercent:0,cycles:1},D,true);
assert.equal(faster.breakdown.find(r=>r.id==='1105').turns,3);
// Infinite HP must never activate Herta's HP-threshold follow-up.
const aoeTeam=['1013','1103','1105','1106'];const one=E.simulate(aoeTeam,profiles,{...scenario,targets:1},D),five=E.simulate(aoeTeam,profiles,{...scenario,targets:5},D);
assert.equal(five.breakdown.find(r=>r.id==='1013').followups,0);assert.ok(five.total>one.total);
const search=E.createSearch(['1220'],['1101','1202','1106','1013'],profiles,scenario,D);let result;do{result=search.step(1);}while(!result.done);
assert.equal(result.total,4);result.top.forEach(r=>{assert.equal(r.ids[0],'1220');assert.equal(new Set(r.ids).size,4);assert.ok(r.ids.every(id=>['1220','1101','1202','1106','1013'].includes(id)));});
const oracle=E.combinations(['1101','1202','1106','1013'].sort(),3).map(t=>E.simulate(['1220',...t],profiles,{...scenario,focus:'1220'},D).total).sort((a,b)=>b-a);
result.top.forEach((r,i)=>assert.ok(Math.abs(r.total-oracle[i])<1e-7));
const locked=E.createSearch(team,[],profiles,scenario,D).step(1);assert.equal(locked.total,1);assert.deepEqual(locked.top[0].ids,team);
const validTeams=E.combinations(Object.keys(E.models).filter(id=>id!=='1220'&&!E.aliases[id]),3).filter(ids=>ids.filter(id=>/^80(?:0[1-9]|10)$/.test(id)).length<=1&&!(ids.includes('1001')&&ids.includes('1224')));assert.equal(E.createSearch(['1220'],[],profiles,scenario,D).total,validTeams.length);
// A stat change belongs to one actor and affects that actor's contribution.
const changed=structuredClone(profiles);changed['1105'].atk*=2;
const before=E.simulate(aoeTeam,profiles,scenario,D),after=E.simulate(aoeTeam,changed,scenario,D);
assert.ok(Math.abs(after.breakdown.find(r=>r.id==='1105').damage-2*before.breakdown.find(r=>r.id==='1105').damage)<1e-7);
console.log('Team simulation verified: core/pool constraints, seeded reproducibility, event ordering, SP caps, speed/advance, infinite HP, AoE, per-actor stats, ranking vs exhaustive oracle.');
