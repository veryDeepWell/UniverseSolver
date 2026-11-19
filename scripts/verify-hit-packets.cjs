const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;
for(const file of ['data/game-data','data/supplements','data/aha','equipment-effects','team-engine'])require('../'+file+'.js');
const D=HSR_DATA,T=HSR_TEAM;
const source=fs.readFileSync(path.join(__dirname,'../team-engine.js'),'utf8');
const marker='const initialStats=Object.fromEntries(actors.map(a=>[a.id,stat(a)]));runUlts();';
assert.ok(source.includes(marker));
// Inject only test setup, then exercise the production hit/damage functions.
// These are deliberately synthetic controls, not claimed in-game skill data.
function probe(body,{ids=['1106'],profiles={},scenario={},choices}={}){
  const context=vm.createContext({HSR_DATA:D,HSR_SUPPLEMENTS,HSR_EQUIPMENT});context.window=context;
  vm.runInContext(source.replace(marker,marker.replace('runUlts();',body+';runUlts();')),context);
  const stats=Object.fromEntries(ids.map(id=>[id,{...T.defaults(id,D),hp:100000,baseHP:1000,atk:1000,baseAtk:500,crit:0,critDamage:1,speed:1,policy:'basic',...profiles[id]}]));
  let cursor=0;
  return context.HSR_TEAM.simulate(ids,stats,{focus:ids[0],targets:3,cycles:1,enemyLevel:0,encounter:'gepard',enemyHP:1000000,toughness:0,initialSP:0,energyPercent:0,seed:42,allowPartial:true,audit:true,...scenario},D,true,choices?()=>choices[cursor++]??0:undefined);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const plain=value=>JSON.parse(JSON.stringify(value));
const setup="const a=actors[0];a.actionKind='skill';beginAction(a);dummies[1].hp=dummies[1].maxHP=1000000;";
const plan="{abilityId:'synthetic',coverage:'synthetic',packets:[{damageShare:.8,toughness:2},{damageShare:.2,toughness:8}]}";
const split=probe(setup+`splitHit(a,1,1,'Probe',${plan});`,{scenario:{toughness:5}});
const hits=split.events.filter(e=>e.label==='Probe');
assert.equal(hits.length,2);near(hits[0].damage,720);near(hits[1].damage,180);
assert.equal(hits[0].toughness[1],3);assert.equal(hits[1].toughness[1],0);
assert.equal(hits[0].packet.sequenceId,hits[1].packet.sequenceId);
assert.deepEqual(plain(hits.map(e=>e.packet.index)),[1,2]);
assert.deepEqual(plain(hits.map(e=>e.action)),[hits[0].action,hits[0].action]);
assert.throws(()=>T.packetRules.validate({packets:[{damageShare:1}]}));
assert.throws(()=>T.packetRules.validate({packets:[{damageShare:.5,toughness:1}]}));
assert.throws(()=>T.packetRules.validate({packets:[{damageShare:1,toughness:NaN}]}));
assert.deepEqual(T.packetRules.targets([1],[0,2]),[]);
assert.deepEqual(T.packetRules.targets([1],[0,2],'random-living',()=>1),[2]);
assert.deepEqual(T.packetRules.targets([1],[],'random-living'),[]);
// Dead locked targets do not silently redirect to the boss or another guard.
const locked=probe(setup+`dummies[1].hp=100;splitHit(a,1,1,'Locked',${plan});hit(a,.5,[1],'Ghost');`);
assert.equal(locked.events.filter(e=>e.label==='Locked').length,1);
assert.ok(!locked.events.some(e=>e.label==='Ghost'));
assert.ok(locked.events.some(e=>e.kind==='hit-skipped'&&e.attackLabel==='Ghost'));
const rerouted=probe(setup+"dummies[1].hp=0;hit(a,.5,[1],'Explicit reroute',{retarget:'random-living'});");
const redirected=rerouted.events.find(e=>e.label==='Explicit reroute');
assert.ok([0,2].includes(redirected.targets[0]));assert.ok(!redirected.targets.includes(1));
// Independent Bernoulli crits, not one roll shared by the entire skill.
const rolled=probe(setup+`splitHit(a,1,1,'Crit',${plan});`,{profiles:{'1106':{crit:.5}},scenario:{rollCrits:true}});
assert.equal(rolled.events.filter(e=>e.kind==='random'&&e.mechanic.startsWith('crit-')).length,2);
const branches=[];
for(const [choices,expected]of [[[0,0],1000],[[1,0],1800],[[0,1],1200],[[1,1],2000]]){
  const outcome=probe(setup+`splitHit(a,1,1,'Crit branch',${plan});`,{profiles:{'1106':{crit:.5}},scenario:{rollCrits:true},choices});
  const damage=outcome.events.filter(e=>e.label==='Crit branch').reduce((sum,e)=>sum+e.damage,0);
  assert.equal(damage,expected);branches.push(damage);
}
assert.equal(branches.reduce((sum,value)=>sum+value*.25,0),1500);
// Each packet may read current stats, or an explicitly frozen action snapshot.
const equal="{coverage:'synthetic',packets:[{damageShare:.5,toughness:0},{damageShare:.5,toughness:0}]}";
const dynamic=probe(setup+`splitHit(a,1,1,'Dynamic',${equal},{afterPacket:index=>{if(index===0)buff(a,'probe','atk',{atk:1},2);}});`);
assert.deepEqual(plain(dynamic.events.filter(e=>e.label==='Dynamic').map(e=>e.damage)),[500,750]);
const frozen=probe(setup+`splitHit(a,1,1,'Frozen',${equal},{statPolicy:'action',afterPacket:index=>{if(index===0)buff(a,'probe','atk',{atk:1},2);}});`);
assert.deepEqual(plain(frozen.events.filter(e=>e.label==='Frozen').map(e=>e.damage)),[500,500]);
const aoePackets=probe(setup+`splitHit(a,1,[1,2],'AoE packets',${equal});`);
assert.equal(aoePackets.events.filter(e=>e.kind==='damage-calculation'&&e.attackLabel==='AoE packets').length,4);
const bounce=probe(setup+`dummies[1].hp=100;splitHit(a,1,1,'Bounce',${equal},{targeting:'bounce'});`);
const bounced=bounce.events.filter(e=>e.label==='Bounce');
assert.equal(bounced.length,2);assert.deepEqual(plain(bounced[0].targets),[1]);assert.ok([0,2].includes(bounced[1].targets[0]));
const phase=probe(setup+`splitHit(a,1,1,'Phase-locked',${equal},{afterPacket:index=>{if(index===0){boss.phase++;for(let i=0;i<dummies.length;i++)dummies[i]=enemySlot(i);}}});`);
assert.equal(phase.events.filter(e=>e.label==='Phase-locked').length,1,'A new phase cannot reuse the old target slot for remaining packets');
// Target-scoped stat reads are explicit. Fugue's first break changes Xueyi's
// BE->DMG conversion for the second target; a packet snapshot retains it.
for(const [policy,expected]of [['packet',1],['target',1.06]]){
  const result=probe(setup+`hit(a,1,[1,2],'AoE',{toughness:10,statPolicy:'${policy}'});`,{ids:['1214','1225'],scenario:{toughness:10}});
  const calculations=result.events.filter(e=>e.kind==='damage-calculation'&&e.attackLabel==='AoE');
  near(calculations[0].factors.damageBoost,1);near(calculations[1].factors.damageBoost,expected);
}
// Cone proc can only hit a surviving target of the original action.
const cone={id:'21029',rank:1};
const emptyCone=probe(setup+"dummies[1].hp=100;hit(a,1,[1],'Trigger');afterAttack(a,false,'skill');",{profiles:{'1106':{cone}}});
assert.ok(!emptyCone.events.some(e=>e.label==='Мы ещё встретимся · дополнительный урон'));
const livingCone=probe(setup+"dummies[1].hp=100;dummies[2].hp=10000;hit(a,.2,[1,2],'Trigger');afterAttack(a,false,'skill');",{profiles:{'1106':{cone}}});
assert.deepEqual(plain(livingCone.events.find(e=>e.label==='Мы ещё встретимся · дополнительный урон').targets),[2]);
// Damage ownership differs from buff supplier and from the actor detonating DoT.
const blessed=probe(setup+"dummies[1].hp=1;const ty=find('1202');ty.blessing={target:a.id};buff(a,ty.id,'benediction',{},3);addBlessingDamage(a,1);",{ids:['1106','1202']});
const blessingKill=blessed.events.find(e=>e.kind==='enemy-defeated');
assert.equal(blessingKill.damageOwner,'1106');assert.equal(blessingKill.triggerSource,'1202');
assert.equal(blessingKill.attackKillCredit,'1106');
const dot=probe(setup+"dummies[1].hp=1;dummies[1].guiBurn={owner:'1210',expires:10,coefficient:1};dotHit(1,'guiBurn',1,'Detonation',false,'1005');",{ids:['1005','1210']});
const dotKill=dot.events.find(e=>e.kind==='enemy-defeated');
assert.equal(dotKill.damageOwner,'1210');assert.equal(dotKill.triggerSource,'1005');assert.equal(dotKill.damageKind,'dot');
for(const body of ["creditBreak(a,1,200,'Break probe','superbreak');","trueHit(a,200,[1],'True probe');"]){
  const result=probe(setup+'dummies[1].hp=1;'+body);
  assert.equal(result.events.find(e=>e.kind==='enemy-defeated').damageOwner,'1106');
}
// Catalogue coverage inventory must not silently drop new attack-like skills.
const inventory=require('../data/hit-coverage.json');
const owners=Object.keys(T.models).filter(id=>!T.aliases[id]);
const candidates=Object.values(D.character_skills).filter(skill=>/Attack|Blast|Bounce/.test(skill.effect||'')&&owners.some(owner=>(D.characters[owner].skills||[]).includes(skill.id)||skill.id.startsWith(owner)||skill.id.startsWith('1'+owner)));
assert.deepEqual(inventory.abilities.map(e=>e.abilityId).sort(),candidates.map(e=>e.id).sort());
for(const [id,plan]of Object.entries(T.packetPlans))assert.deepEqual(inventory.abilities.find(e=>e.abilityId===id).packets,plan.packets);
assert.ok(inventory.supplementalForms.some(e=>e.id==='1511'));
console.log('Verified independent packets, toughness, crits, snapshots, dead-target policies, cone eligibility, kill provenance and complete packet-review inventory.');
