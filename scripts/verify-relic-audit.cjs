const assert = require('node:assert/strict');
global.window = global;
for(const file of ['data/game-data','optimizer-engine','equipment-effects','team-engine'])
  require('../'+file+'.js');
const D=HSR_DATA,O=HSR_OPT,G=HSR_EQUIPMENT,T=HSR_TEAM;
const close=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<tolerance,
  `${actual} != ${expected}`);

const common={HPAddedRatio:.432,AttackAddedRatio:.432,DefenceAddedRatio:.54};
const mains={
  HEAD:{HPDelta:705.6},HAND:{AttackDelta:352.8},
  BODY:{...common,CriticalChanceBase:.324,CriticalDamageBase:.648,HealRatioBase:.345606,StatusProbabilityBase:.432},
  FOOT:{...common,SpeedDelta:25.032},
  NECK:{...common,...Object.fromEntries(['Physical','Fire','Ice','Thunder','Wind','Quantum','Imaginary'].map(element=>[element+'AddedRatio',.388803]))},
  OBJECT:{...common,BreakDamageAddedRatioBase:.648,SPRatioBase:.194394}
};
const rolls={
  HPDelta:[33.87,42.3375],AttackDelta:[16.935,21.16875],DefenceDelta:[16.935,21.16875],
  HPAddedRatio:[.03456,.0432],AttackAddedRatio:[.03456,.0432],DefenceAddedRatio:[.0432,.054],
  SpeedDelta:[2,2.6],CriticalChanceBase:[.02592,.0324],CriticalDamageBase:[.05184,.0648],
  StatusProbabilityBase:[.03456,.0432],StatusResistanceBase:[.03456,.0432],BreakDamageAddedRatioBase:[.05184,.0648]
};
for(const [slot,expected] of Object.entries(mains)){
  const actual=O.mainAffixes(D,slot);
  assert.deepEqual(actual.map(affix=>affix.property).sort(),Object.keys(expected).sort());
  for(const a of actual)close(a.base+15*a.step,expected[a.property]);
}
assert.deepEqual(O.subAffixes(D).map(affix=>affix.property).sort(),Object.keys(rolls).sort());
for(const a of O.subAffixes(D)){
  const [low,high]=rolls[a.property];
  assert.equal(a.step_num,2);
  close(a.base,low,.0001);
  close(a.base+a.step,(low+high)/2,.0001);
  close(a.base+2*a.step,high,.0001);
}

const id='1106',base=T.defaults(id,D),actor=(pack,flags={})=>{
  const unit={id,turn:0,s:{...base,equipment:pack},buffs:[],...flags};
  G.init(unit,D,1);
  return unit;
};
const cavern=Array(4).fill('102');
const lotus=actor({cavern,planar:'316'});
G.hitStart(lotus,false);
assert.equal(G.modifiers(lotus,[lotus],D).breakEffect,undefined);
G.hitStart(lotus,true);
close(G.modifiers(lotus,[lotus],D).breakEffect,.4);
const sigonia=actor({cavern,planar:'313'}),city=actor({cavern,planar:'326'}),party=[sigonia,city];
G.followupDamageStart(city);
close(G.modifiers(city,party,D).atk,.12+.24);
for(let kill=0;kill<12;kill++)G.enemyDefeated(party);
close(G.modifiers(sigonia,party,D).critDamage,.4+.12);
close(G.modifiers(city,party,D).critDamage,.12);
const eternal=actor({cavern,planar:'323'},{memoryActive:true});
close(G.modifiers(city,[city,eternal],D).speedPct,.06+.08);
const arcadia=actor({cavern,planar:'321'});
close(G.modifiers(arcadia,[arcadia],D,3).damage,.12);
close(G.modifiers(arcadia,[arcadia],D,5).damage,.09);
const gepard='1104', protector=T.defaults(gepard,D);
function shields(equipment){
  return T.simulate([gepard],{[gepard]:{...protector,speed:1,equipment}},
    {focus:gepard,targets:1,cycles:1,initialSP:3,energyPercent:100,seed:42,allowPartial:true},D);
}
const normal=shields(null).breakdown[0].shield;
close(shields({cavern:Array(4).fill('128'),planar:'315'}).breakdown[0].shield/normal,1.22);

const scenario={focus:id,targets:1,cycles:1,initialSP:3,energyPercent:0,seed:42,toughness:0,
  enemyLevel:95,allowPartial:true,encounter:'gepard',enemyHP:100000};
const damage=equipment=>T.simulate([id],{[id]:{...base,crit:0,speed:120,policy:'basic',equipment}},scenario,D).total;
const without=damage(null),genius=damage({cavern:Array(4).fill('108'),planar:'315'});
close(genius/without,215/(100+115*.9));
function loss(equipment){
  const fight=T.simulate([id],{[id]:{...base,hp:9000,speed:1,equipment}},scenario,D,true);
  return fight.events.find(event=>event.kind==='incoming').hpLoss;
}
close(loss({cavern:Array(4).fill('106'),planar:'315'})/loss(null),.92);
const reference=O.farmReference(id,'support',D,false);
const items=reference.items.map(item=>item.slot==='BODY'?{...item,main:'HealRatioBase',subs:[]}:item);
close(O.sheetWithoutSets(items,reference.config,D).healingBonus,.345606);
const punklorde={cavern,planar:'325'};
function punklordeFight(elation){
  const profile={...base,equipment:punklorde,elation};
  return T.simulate([id],{[id]:profile},{...scenario,audit:true},D,true);
}
for(const [elation,expected] of [[.3199,0],[.32,.2],[.7199,.2],[.72,.32]]){
  const battle=punklordeFight(elation);
  close(battle.initialStats[id].critDamage,base.critDamage+expected);
  assert.equal(battle.events.filter(event=>event.label.startsWith('Панклорд')).length,expected?1:0);
}
const wave='1513',waveBase=T.defaults(wave,D);
const waveSettings={...scenario,focus:wave,encounter:'dummy',energyPercent:100,cycles:5,audit:true};
function waveFight(planar,keepLog=true){
  return T.simulate([wave],{[wave]:{...waveBase,crit:1,speed:130,elation:.25,policy:'basic',
    equipment:{cavern:['101','101','103','103'],planar}}},waveSettings,D,keepLog);
}
const waveBattle=waveFight('325');
const expiry=waveBattle.events.find(event=>event.label==='Истёк эффект · waveSpeed');
const afterExpiry=battle=>battle.events.find(event=>event.label==='Базовая атака'&&event.time>expiry.time).damage;
assert.equal(waveBattle.events.filter(event=>event.label==='Панклорд · крит. урон +32%').length,1);
const control=waveFight('315'),critical=1+control.initialStats[wave].critDamage;
close(afterExpiry(waveBattle)/afterExpiry(control),(critical+.32)/critical);
close(waveBattle.total,waveFight('325',false).total);
const completeCatalog=Object.keys(D.relic_sets);
assert.deepEqual([...G.cavern4].sort(),completeCatalog.filter(id=>id.startsWith('1')).sort());
assert.deepEqual([...G.planar].sort(),completeCatalog.filter(id=>id.startsWith('3')).sort());
const pack=(set,planar='315')=>({cavern:Array(4).fill(set),planar});
function relicFight(ids,gear,settings={},stats={}){
  const profiles=Object.fromEntries(ids.map(id=>[id,{...T.defaults(id,D),...stats[id],equipment:gear[id]}]));
  return T.simulate(ids,profiles,{...scenario,focus:ids[0],encounter:'dummy',audit:true,
    energyPercent:100,enemyLevel:0,...settings},D,true);
}
const nova='1510', dan='1002';
for(const [ids,bonus] of [[[nova,dan],.32],[[nova,id],0],[[id,dan],0]]){
  const wearer=ids[0],battle=relicFight(ids,{[wearer]:pack('102','327')});
  const control=relicFight(ids,{[wearer]:pack('102')});
  close(battle.initialStats[wearer].critDamage-control.initialStats[wearer].critDamage,bonus);
  close(battle.initialStats[wearer].crit-control.initialStats[wearer].crit,.08);
}
const oracle=relicFight([wave,'1502'],{[wave]:pack('130'),'1502':pack('130')},{cycles:3},{[wave]:{speed:155}});
assert.equal(oracle.events.filter(event=>event.label.startsWith('Прорицатель')).length,1);
const smith=relicFight([id,dan],{[id]:pack('132')});
assert.ok(smith.events.some(event=>event.actor===dan&&event.label.endsWith('comburent')&&event.values.damage===.15));
const anaxa='1405';
const smithRefresh=relicFight([anaxa,dan],{[anaxa]:pack('132')},
  {cycles:1,targets:3,energyPercent:0,initialSP:5},
  {[anaxa]:{speed:160,eidolon:1,policy:'skill'},[dan]:{speed:1}});
const anaxaSkills=smithRefresh.events.filter(event=>event.label==='Анакса · попадание');
const smithGrants=smithRefresh.events.filter(event=>event.actor===dan&&event.label.endsWith('comburent'));
const anaxaActions=new Set(anaxaSkills.map(event=>event.action));
assert.ok(anaxaActions.size>=2);
assert.equal(smithGrants.length,anaxaActions.size);

const smithActor=actor(pack('132'));
const skill={kind:'skill'};
close(G.damage(smithActor,base,skill,{defenseReduced:true}).critDamage,.28);
close(G.damage(smithActor,base,skill,{defenseReduced:false}).critDamage,0);
const pearl='1503';
const dreamlit=relicFight([wave,pearl],{[pearl]:pack('133')},{cycles:8},{[pearl]:{speed:150,energyRegen:1.5}});
assert.ok(dreamlit.events.some(event=>event.actor===wave&&event.label.endsWith('dreamlitElation')&&event.values.elation===.16));
assert.ok(dreamlit.events.some(event=>event.label.endsWith('dreamlitCrit')&&event.values.critDamage===.12));
const magical=(set,enemyLevel)=>relicFight([wave],{[wave]:pack(set)},{enemyLevel,cycles:3},{
  [wave]:{crit:0,policy:'basic'}
});
const magicalBattle=magical('129',95),flat=magical('134',95);
const elationSkills=battle=>battle.events.filter(event=>event.label==='Прибой · Поднимем бокалы!');
assert.ok(elationSkills(magicalBattle)[0].damage>elationSkills(flat)[0].damage);
const equippedWith=(set,planar='315')=>actor(pack(set,planar));
const bonuses=unit=>G.modifiers(unit,[unit],D);
function finish(unit,turn){
  unit.turn=turn;
  G.endTurn(unit);
}
const hunter=equippedWith('104'),thunder=equippedWith('109');
G.afterUltimate(hunter);
G.beforeSkill(thunder);
close(bonuses(thunder).atk,.2);
G.afterSkill(thunder);
finish(hunter,1);
close(bonuses(hunter).critDamage,.25);
hunter.turn=2;
close(bonuses(hunter).critDamage,.25);
finish(hunter,2);
close(bonuses(hunter).critDamage,0);
thunder.turn=1;
close(bonuses(thunder).atk,.2);
finish(thunder,1);
close(bonuses(thunder).atk,0);

const eagle=equippedWith('110');
eagle.distance=10000;
G.afterUltimate(eagle);
assert.equal(eagle.distance,7500);
const smithFire=equippedWith('107'), fire={element:'Fire'};
G.afterUltimate(smithFire);
close(G.damage(smithFire,base,{kind:'basic'},fire).damage,.22);
close(G.damage(smithFire,base,{kind:'skill'},fire).damage,.34);
G.afterAttack(smithFire);
close(G.damage(smithFire,base,{kind:'basic'},fire).damage,.1);

const scholar=equippedWith('122');
const skillBonus=()=>G.damage(scholar,base,{kind:'skill'},{}).damage;
G.beforeSkill(scholar);
close(skillBonus(),.2);
G.afterUltimate(scholar);
close(skillBonus(),.2);
G.afterSkill(scholar);
G.beforeSkill(scholar);
close(skillBonus(),.45);
G.afterSkill(scholar);
G.beforeSkill(scholar);
close(skillBonus(),.2);

const duke=equippedWith('115'),valorous=equippedWith('120');
G.followupStart(duke);
G.hitEnd(duke,9,true);
close(bonuses(duke).atk,.48);
G.followupStart(duke);
close(bonuses(duke).atk,0);
G.hitEnd(duke,1,true);
finish(duke,2);
close(bonuses(duke).atk,.06);
finish(duke,3);
close(bonuses(duke).atk,0);
const ultimateOptions={kind:'ultimate',ultimate:true};
G.followupEnd(valorous,[valorous]);
valorous.turn=1;
close(G.damage(valorous,base,ultimateOptions,{}).damage,.36);
finish(valorous,1);
close(G.damage(valorous,base,ultimateOptions,{}).damage,0);

const business=equippedWith('102','303'),architect=equippedWith('102','304');
for(const unit of [business,architect]){
  unit.id='1002';
  unit.s.effectHit=.49;
  unit.buffs.push({values:{effectHit:.1},expires:1});
}
close(bonuses(business).atk,.12+.69*.25);
close(bonuses(architect).def,.30);
architect.turn=2;
close(bonuses(architect).def,.15);

const stream=equippedWith('102','324');
G.skillPointSpent([stream],2);
close(bonuses(stream).critDamage,.16);
G.skillPointSpent([stream],3);
stream.turn=1;
G.skillPointSpent([stream],4);
finish(stream,3);
close(bonuses(stream).critDamage,.16);
const savior=equippedWith('127');
savior.memoryActive=true;
G.afterBasic(savior);
close(bonuses(savior).hp,.24);
close(bonuses(savior).damage,.15);
savior.memoryActive=false;
G.beforeSkill(savior);
close(bonuses(savior).damage,.15);
G.afterSkill(savior);
close(bonuses(savior).damage,0);

const aglaea='1402', sunday='1313';
const summoned=actor(pack('123','318'),{id:aglaea,memoryActive:true});
G.memoryAttack(summoned);
close(G.modifiers(summoned,[summoned],D).critDamage,.16+.32+.30);
close(G.modifiers(summoned,[summoned],D,undefined,true).critDamage,.16);
const banana=relicFight([aglaea],{[aglaea]:pack('123','318')},{cycles:3},{[aglaea]:{crit:1}});
const memoryHits=banana.events.filter(event=>event.damage&&event.label.includes('Колючая ловушка'));
assert.ok(memoryHits.length);
assert.ok(banana.events.some(event=>event.kind==='buff'&&event.source==='123'&&event.values.critDamage===.30));
const memoryTrailblazer='8007';
const epicFight=(cavern,critDamage=0)=>relicFight([memoryTrailblazer],{[memoryTrailblazer]:{cavern,planar:'318'}},
  {cycles:3,targets:3},{[memoryTrailblazer]:{crit:1,critDamage}});
const epic=epicFight(Array(4).fill('123'));
const epicControl=epicFight(['123','123','103','103']);
const epicCritControl=epicFight(['123','123','103','103'],.3);
const firstSpiritAttack=battle=>battle.events.find(event=>event.damage&&event.label.includes('Вместе, Мемо!'));
assert.ok(firstSpiritAttack(epic).damage>firstSpiritAttack(epicControl).damage);
close(firstSpiritAttack(epic).damage,firstSpiritAttack(epicCritControl).damage);
const firstSpiritIndex=epic.events.indexOf(firstSpiritAttack(epic));
assert.ok(epic.events.slice(0,firstSpiritIndex).some(event=>event.source==='123'&&event.recipientType==='memosprite'));

const yunli='1221';
const yunliFight=(cavern,planar)=>relicFight([yunli],{[yunli]:{cavern,planar}},
  {cycles:3,targets:3,enemyAttacks:'training'},{[yunli]:{crit:0,policy:'skill'}});
const counters=battle=>battle.events.filter(event=>event.damage&&event.label.startsWith('Интуит · ')
  &&['Истребление','Вырубка'].some(name=>event.label.endsWith(name)));
const yunliCavern=['115','115','103','103'];
const yunliPlain=counters(yunliFight(yunliCavern,'315'));
const yunliDuke=counters(yunliFight(Array(4).fill('115'),'315'));
const yunliCity=counters(yunliFight(yunliCavern,'326'));
assert.ok(yunliPlain.length>=2);
close(yunliDuke[0].damage,yunliPlain[0].damage);
close(yunliDuke[1].damage,yunliPlain[1].damage);
assert.ok(yunliCity[0].damage>yunliPlain[0].damage);

const yunliSplash=battle=>battle.events.find(event=>event.label==='Интуит · соседние цели'&&event.targets.length===2);
const plainSplash=yunliSplash(yunliFight(yunliCavern,'307'));
const dukeSplash=yunliSplash(yunliFight(Array(4).fill('115'),'307'));
close(dukeSplash.damage/plainSplash.damage,1+.09/1.3);

const supportRelics=relicFight([aglaea,sunday],{[sunday]:pack('121')},{cycles:3},{[aglaea]:{crit:1}});
assert.ok(supportRelics.events.some(event=>event.kind==='buff'&&event.source===sunday&&event.label.endsWith('sacerdos')&&event.recipientType==='memosprite'));

const tingyun='1202',dragonDan='1414';
const sacred=relicFight([dan,sunday,tingyun,dragonDan],{
  [sunday]:pack('121'),[tingyun]:pack('121'),[dragonDan]:pack('121')
},{cycles:2,initialSP:5},{[dan]:{crit:1,speed:1,policy:'basic'},[sunday]:{speed:160},[dragonDan]:{policy:'skill'}});
const directed=sacred.events.filter(event=>event.kind==='buff'&&event.actor===dan&&event.label.endsWith('sacerdos'));
assert.deepEqual(directed.slice(0,2).map(event=>[event.source,event.values.stacks]),[[sunday,1],[tingyun,1]]);
assert.ok(directed.some(event=>event.source===dragonDan&&event.values.stacks===1));
assert.ok(directed.some(event=>event.source===sunday&&event.values.stacks===2));
assert.ok(!sacred.events.some(event=>event.kind==='buff'&&event.label.endsWith('sacerdos')&&
  event.source===dragonDan&&event.actor!==dan));

const sparkle='1306';
for(const [set,key,stat,bonus] of [
  ['121','sacerdos','critDamage',.18],['133','dreamlitElation','elation',.16]
]){
  for(const target of [sparkle,dan]){
    const ids=target===sparkle?[sparkle]:[dan,sparkle];
    const battle=relicFight(ids,{[sparkle]:pack(set)},{cycles:1,energyPercent:0},
      {[sparkle]:{speed:100,policy:'skill'},[dan]:{speed:1,policy:'basic'}});
    assert.ok(battle.events.some(event=>event.actor===sparkle&&event.label.startsWith('Навык Искорки')));
    const grants=battle.events.filter(event=>event.source===sparkle&&event.label.endsWith(key));
    if(set==='133'&&target===sparkle)assert.equal(grants.length,0);
    else assert.deepEqual(grants.map(event=>[event.actor,event.values[stat]]),[[target,bonus]]);
  }
}

const lynx='1110';
for(const [set,key] of [['114','messenger'],['118','watchmaker']]){
  const friendly=relicFight([lynx,dan],{[lynx]:pack(set)});
  assert.ok(friendly.events.some(event=>event.actor===dan&&event.label.endsWith(key)));
  const offensive=relicFight([dan,lynx],{[dan]:pack(set)});
  assert.ok(!offensive.events.some(event=>event.label.endsWith(key)));
}
const yanqing='1209',yanStats={[yanqing]:{crit:1,effectRes:.01,policy:'skill'}};
const yanSkill=battle=>battle.events.find(event=>event.label==='Навык Яньцина').damage;
const yanWithout=relicFight([yanqing],{[yanqing]:pack('102','315')},{energyPercent:0},yanStats);
const yanWith=relicFight([yanqing],{[yanqing]:pack('102','310')},{energyPercent:0},yanStats);
assert.ok(yanSkill(yanWith)>yanSkill(yanWithout));
close(yanWith.initialStats[yanqing].critDamage,yanWithout.initialStats[yanqing].critDamage);

const spiritSpeed=planar=>relicFight([aglaea],{[aglaea]:pack('102',planar)},{cycles:1},{
  [aglaea]:{speed:100}
}).memories.find(unit=>unit.owner===aglaea).speed;
assert.ok(spiritSpeed('323')>spiritSpeed('315'));
const captain=equippedWith('126');
G.assist(captain,captain);
assert.equal(captain.eq.assist,0);
G.assist(captain,business);
G.assist(captain,business);
G.beforeUltimate(captain);
close(bonuses(captain).atk,.48);

const asta='1009',slow={[dan]:{speed:115,crit:0,policy:'skill'}};
const station=gear=>relicFight([dan,asta],gear,{cycles:1},slow);
const mixedCavern=['101','101','103','103'];
const a=station({[dan]:{cavern:mixedCavern,planar:'301'}}),b=station({[dan]:{cavern:mixedCavern,planar:'315'}});
close(a.initialStats[dan].atk-b.initialStats[dan].atk,T.defaults(dan,D).baseAtk*.12);
const firstDanSkill=battle=>battle.events.find(event=>event.label==='Навык Дань Хэна').damage;
assert.ok(firstDanSkill(a)>firstDanSkill(b));

const seamBattle=(planar,hp)=>relicFight([aglaea],{[aglaea]:pack('102',planar)},{cycles:1},{
  [aglaea]:{hp,crit:1,critDamage:1}
});
const seamHit=battle=>battle.events.find(event=>event.label.includes('Колючая ловушка')).damage;
const bone=seamBattle('319',5100),boneControl=seamBattle('307',5100);
assert.ok(bone.initialStats[aglaea].hp>=5000);
assert.ok(bone.memories[0].maxHP<5000);
close(seamHit(bone)/seamHit(boneControl),1.14);
close(seamHit(seamBattle('319',4000))/seamHit(seamBattle('307',4000)),1);

const jing='1204';
const lordHits=(cavern,planar)=>relicFight([jing],{[jing]:{cavern,planar}},{cycles:3},{
  [jing]:{crit:0,policy:'basic'}
}).events.filter(event=>event.label==='Повелитель молний · удар');
const dukeTwo=['115','115','103','103'];
const stackHits=lordHits(Array(4).fill('115'),'315'),plainHits=lordHits(dukeTwo,'315');
close(stackHits[0].damage,plainHits[0].damage);
assert.ok(stackHits[1].damage>plainHits[1].damage);
assert.ok(lordHits(dukeTwo,'326')[0].damage>plainHits[0].damage);

const bailu='1211',gallagher='1301';
for(const healer of [bailu,gallagher]){
  const keyed=relicFight([dan,healer],{[healer]:pack('121')},
    {encounter:'gepard',enemyHP:100000,cycles:3,energyPercent:0},
    {[dan]:{hp:6000,speed:1},[healer]:{hp:9000,speed:90,policy:'skill'}});
  assert.ok(keyed.events.some(event=>event.actor===dan&&event.label.endsWith('sacerdos')));
}
const huohuo='1217',march='1001';
const huohuoSkill=relicFight([dan,march,huohuo],{[huohuo]:pack('121')},
  {cycles:2,energyPercent:0},{[dan]:{speed:1},[march]:{speed:1},[huohuo]:{speed:110,policy:'skill'}});
assert.ok(huohuoSkill.events.some(event=>event.actor===huohuo&&event.label==='Хохо · Жертвенность жизни'));
assert.ok(!huohuoSkill.events.some(event=>event.label.endsWith('sacerdos')));
const arlan='1008',firefly='1310';
const arlanSkill=cavern=>relicFight([arlan],{[arlan]:{cavern,planar:'315'}},
  {energyPercent:0,cycles:2,toughness:0},{[arlan]:{speed:110,crit:0,policy:'skill'}})
  .events.filter(event=>event.label==='Арлан · навык без SP');
const band=arlanSkill(Array(4).fill('109')),bandControl=arlanSkill(['109','109','103','103']);
close(band[0].damage/bandControl[0].damage,1.2);
close(band[1].damage/bandControl[1].damage,1.2);

const fireflyFight=planar=>relicFight([firefly],{[firefly]:{cavern:['103','103','101','101'],planar}},
  {cycles:2,toughness:40},{[firefly]:{speed:110,crit:0,policy:'skill'}});
const lantern=fireflyFight('316'),lanternControl=fireflyFight('315');
const breakHit=battle=>battle.events.find(event=>event.kind==='break').damage;
const burnTick=battle=>battle.events.find(event=>event.label.startsWith('Эффект пробития · Fire')).damage;
close(breakHit(lantern)/breakHit(lanternControl),1.4);
assert.ok(burnTick(lantern)>burnTick(lanternControl));
const breakSetFight=(cavern,breakEffect)=>relicFight([firefly],{[firefly]:{cavern,planar:'315'}},
  {cycles:2,toughness:40,enemyLevel:80},{[firefly]:{speed:110,crit:0,policy:'skill',breakEffect}});
const cavalry=Array(4).fill('119'),cavalryControl=['119','119','103','103'];
for(const [effect,ignore] of [[1.1,0],[1.5,.1],[2.5,.1]]){
  const battle=breakSetFight(cavalry,effect),control=breakSetFight(cavalryControl,effect);
  close(breakHit(battle)/breakHit(control),2/(2-ignore));
  close(burnTick(battle)/burnTick(control),2/(2-ignore));
}
const prisoner=breakSetFight(Array(4).fill('116'),0);
const prisonerControl=breakSetFight(['116','116','103','103'],0);
close(burnTick(prisoner)/burnTick(prisonerControl),2/(2-.06));

const imbibitor='1213';
const wastelanderFight=(cavern,critDamage=0)=>relicFight([imbibitor],{[imbibitor]:{cavern,planar:'315'}},
  {cycles:2,toughness:10,energyPercent:0},
  {[imbibitor]:{speed:160,crit:1,critDamage,policy:'basic'}});
const wastelander=wastelanderFight(Array(4).fill('112'));
const wastelanderControl=wastelanderFight(['112','112','103','103']);
const wastelanderCritControl=wastelanderFight(['112','112','103','103'],.2);
const wearerAttacks=battle=>battle.events.filter(event=>event.actor===imbibitor&&event.kind==='attack'&&event.damage>0);
assert.ok(wastelander.events.find(event=>event.kind==='break'&&event.actor===imbibitor));
close(wearerAttacks(wastelander)[0].damage,wearerAttacks(wastelanderControl)[0].damage);
close(wearerAttacks(wastelander)[1].damage,wearerAttacks(wastelanderCritControl)[1].damage);

const boxer=actor(pack('105'));
const disciple=actor(pack('113'));
for(let hit=0;hit<3;hit++){
  G.receivedAttack(boxer);
  G.receivedAttack(disciple);
}
close(bonuses(boxer).atk,.15);
close(bonuses(disciple).crit,0);
G.hpLoss(disciple);
G.hpLoss(disciple);
close(bonuses(disciple).crit,.16);

const inheritable=actor(pack('103','311'));
close(G.conditional(inheritable,{speed:160}).damage,.18);
close(G.conditional(inheritable,{speed:160},true).damage,0);
const opener=actor(pack('103','305'));
opener.eq.startCritDamage=1.2;
close(G.conditional(opener,{}).crit,.6);
close(G.conditional(opener,{},true).crit,0);
G.afterAttack(opener);
close(G.conditional(opener,{}).crit,0);

const danBasic=cavern=>relicFight([dan],{[dan]:{cavern,planar:'315'}},
  {cycles:1,energyPercent:0},{[dan]:{speed:100,crit:0,policy:'basic'}})
  .events.find(event=>event.kind==='attack'&&event.label==='Базовая атака');
close(danBasic(Array(4).fill('134')).damage/danBasic(['134','134','103','103']).damage,1.2*1.36);

const streamBasic=(planar,energyPercent)=>relicFight([imbibitor],{[imbibitor]:pack('103',planar)},
  {cycles:1,energyPercent,initialSP:3},{[imbibitor]:{speed:75,crit:1,policy:'skill'}})
  .events.find(event=>event.label==='Пожиратель Луны · удар 1').damage;
close(streamBasic('324',100),streamBasic('318',100));
assert.ok(streamBasic('324',0)>streamBasic('318',0));

const yunliDuran=counters(yunliFight(yunliCavern,'315'));
const yunliNoDuran=counters(yunliFight(yunliCavern,'307'));
close(yunliDuran[0].damage/yunliNoDuran[0].damage,1.25/1.2);

const blade='1205',luocha='1203';
const autoHealing=relicFight([blade,luocha],{[luocha]:pack('121')},
  {cycles:4,toughness:600,energyPercent:0},
  {[blade]:{speed:180,policy:'skill'},[luocha]:{speed:1,policy:'basic'}});
assert.ok(autoHealing.events.some(event=>event.actor===luocha&&event.label.startsWith('Автоматическое лечение')));
assert.ok(autoHealing.events.some(event=>event.actor===blade&&event.source===luocha&&event.label.endsWith('sacerdos')));

const thiefEnergy=(cavern,energyRegen)=>relicFight([dan],{[dan]:{cavern,planar:'315'}},
  {cycles:1,toughness:10,energyPercent:0},{[dan]:{speed:100,policy:'basic',energyRegen}})
  .events.filter(event=>event.label==='Базовая атака').at(-1).energy;
for(const err of [1,1.1943948]){
  close(thiefEnergy(Array(4).fill('111'),err)-thiefEnergy(['111','111','103','103'],err),3*err);
}

const captainTarget=actor(pack('126'));
const allyCast={id:dan,actionKey:11};
G.assist(captainTarget,allyCast);
G.assist(captainTarget,allyCast);
assert.equal(captainTarget.eq.assist,1);
G.assist(captainTarget,{...allyCast,actionKey:12});
assert.equal(captainTarget.eq.assist,2);

const pioneer=actor(pack('117'));
close(G.damage(pioneer,base,skill,{debuffs:3}).critDamage,.12);
const restingCrit=bonuses(pioneer).crit;
G.debuff(pioneer);
close(G.damage(pioneer,base,skill,{debuffs:3}).critDamage,.24);
close(bonuses(pioneer).crit-restingCrit,.04);

const fallenHealer=relicFight([dan,luocha],{[luocha]:pack('121')},
  {encounter:'gepard',enemyHP:100000,targets:3,cycles:5,energyPercent:0,seed:1},
  {[dan]:{hp:4500,speed:145,policy:'basic'},[luocha]:{hp:1,speed:1,policy:'basic'}});
const healerDefeat=fallenHealer.events.findIndex(event=>event.actor===luocha&&event.kind==='ally-defeated');
assert.ok(healerDefeat>=0);
assert.ok(!fallenHealer.events.slice(healerDefeat+1).some(event=>event.actor===luocha&&event.label.startsWith('Автоматическое лечение')));
assert.ok(!fallenHealer.events.slice(healerDefeat+1).some(event=>event.source===luocha&&event.label.endsWith('sacerdos')));

const incomingSeries=incomingHits=>relicFight([dan],{[dan]:pack('103')},
  {encounter:'gepard',enemyHP:100000,targets:3,cycles:1,energyPercent:0,incomingHits},
  {[dan]:{hp:20000,speed:1,policy:'basic'}}).events.filter(event=>event.kind==='incoming');
const singleHit=incomingSeries(1)[0];
const threeHits=incomingSeries(3).slice(0,3);
assert.deepEqual(threeHits.map(event=>event.hit),[1,2,3]);
assert.ok(threeHits.every(event=>event.time===singleHit.time&&event.recipient===singleHit.recipient));
close(threeHits.reduce((sum,event)=>sum+event.hpLoss,0),singleHit.hpLoss);

const pioneerSequence=(id,cavern,policy,label)=>relicFight([id],{[id]:{cavern,planar:'315'}},
  {cycles:2,externalDebuffs:3,energyPercent:0},
  {[id]:{speed:145,crit:1,critDamage:0,effectHit:2,policy}})
  .events.filter(event=>event.actor===id&&event.label===label);
for(const [user,policy,label] of [['1004','skill','Навык Вельта · попадание'],['1009','basic','Базовая атака']]){
  const set=pioneerSequence(user,Array(4).fill('117'),policy,label);
  const control=pioneerSequence(user,['117','117','103','103'],policy,label);
  close(set[0].damage/control[0].damage,1.12);
  close(set[1].damage/control[1].damage,1.24);
}

console.log('Relic audit: equipment, conditions, timers, and first-hit order in the simulator verified.');
