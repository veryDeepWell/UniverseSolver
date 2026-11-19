const assert = require('node:assert/strict');
global.window = global;
for (const file of ['data/game-data','data/supplements','data/aha','optimizer-engine','equipment-effects','team-engine','set-engine','relic-engine']) {
  require('../' + file + '.js');
}

const data = HSR_DATA, team = HSR_TEAM, id = '1511';
const lineup = ['1501',id,'1502','1503'];
const reference = hero => HSR_OPT.farmReference(hero,HSR_RELIC.archetype(hero,data),data).profile;
const profiles = Object.fromEntries(lineup.map(hero => [hero,reference(hero)]));
const scenario = {targets:3,cycles:5,initialSP:3,energyPercent:50,seed:42,toughness:120,enemyLevel:95,externalDebuffs:0};
const simulate = eidolon => team.simulate(lineup,{...profiles,[id]:{...profiles[id],eidolon}},scenario,data,true);
const all = Array.from({length:7},(_,rank) => simulate(rank));
const actor = result => result.breakdown.find(row => row.id===id);

assert.equal(team.defaults(id,data).baseSpeed,94);
assert.ok(all.every(result => Number.isFinite(result.total) && result.aha.turns>0));
assert.deepEqual(simulate(0),all[0]);
assert.ok(all[0].events.some(event => event.label.startsWith('Эманатор Радости')));
assert.ok(all[0].events.some(event => event.label==='Эон Аха · истинный урон Мига' && event.damage>0));
assert.ok(actor(all[1]).ults>actor(all[0]).ults);
assert.ok(actor(all[2]).damage>actor(all[1]).damage);
assert.ok(actor(all[4]).damage>actor(all[3]).damage);
assert.equal(all[6].events.filter(event => event.label==='Юмор +100').length,1);
assert.ok(all.every(result => result.events.every(event => event.sp>=0 && event.sp<=result.maxSP)));

const fixed = team.createSearch(['1501',id,'1502'],['1503'],profiles,scenario,data).step(1);
assert.equal(fixed.top[0].total,all[0].total);
const gear = HSR_SETS.createSearch({
  characterId:id,profile:profiles[id],context:lineup.filter(hero=>hero!==id),contextProfiles:profiles,position:1,
  focus:lineup[0],scenario,caverns:['102','120'],planars:['301'],mixed:false
},data).step(2);
assert.equal(gear.checked,2);
assert.ok(gear.top.every(row=>Number.isFinite(row.total)));

const equipment = HSR_EQUIPMENT;
const bareReference = HSR_OPT.farmReference(id,HSR_RELIC.archetype(id,data),data,false).profile;
const withCone = (coneId,rank) => equipment.coneProfile(id, bareReference, {id:coneId,rank}, {}, data);
const audit = {...scenario, audit:true, allowPartial:true};
const travelCone = team.simulate(lineup,{...profiles,[id]:withCone('22009',5)},audit,data,true);
const noConditional = team.simulate(lineup,{...profiles,[id]:{...withCone('22009',5),cone:undefined}},audit,data,true);
assert.ok(Math.abs(travelCone.initialStats[id].critDamage-noConditional.initialStats[id].critDamage-.6)<1e-9);
const signature = withCone('23065',5);
const tour = team.simulate(lineup,{...profiles,[id]:signature},audit,data,true);
assert.equal(signature.baseSpeed,bareReference.baseSpeed+20);
assert.ok(tour.events.some(event=>event.label==='Юмор +18'));
assert.equal(tour.events.find(event=>event.label==='Импровизированное турне').defenseIgnore,.24);
const solo = team.simulate([id],{[id]:signature},audit,data,true);
assert.ok(!solo.events.some(event=>event.label==='Импровизированное турне'));

const ornament = planar=>({cavern:['101','101','102','102'],planar});
const start = (heroes,stats)=>team.simulate(heroes,stats,audit,data,true);
const march = '1001';
const joy = 'Миг радости бога · продвижение действия на 40%';
const center = 'Подпространственный центр · эффект пробития команды +18%';
for(const [elation,active] of [[.399,false],[.4,true]]){
  const result=start([march],{[march]:{...team.defaults(march,data),elation,equipment:ornament('329')}});
  assert.equal(result.events.some(event=>event.label===joy),active);
}
const subspace = hero=>{const base=team.defaults(hero,data);return {...base,speed:145-.06*base.baseSpeed,equipment:ornament('330')};};
const subspaceOwner=subspace(march);
assert.equal(start([march],{[march]:{...subspaceOwner,speed:subspaceOwner.speed-.01}}).events.filter(event=>event.label===center).length,0);
assert.equal(start([march,'1002'],{[march]:subspaceOwner,'1002':subspace('1002')}).events.filter(event=>event.label===center).length,1);

for (const hero of ['1220','1309','1313','1218','1204','1213']) {
  const ids = [hero,...['1220','1309','1204','1218','1203'].filter(member=>member!==hero).slice(0,3)];
  const original = Object.fromEntries(ids.map(member=>[member,reference(member)]));
  const zero = team.simulate(ids,original,scenario,data);
  const six = team.simulate(ids,{...original,[hero]:{...original[hero],eidolon:6}},scenario,data);
  assert.ok(Number.isFinite(six.total) && six.total>zero.total,hero);
}
console.log('Aeon Aha and Eidolons verified in battle, team search and build search.');
