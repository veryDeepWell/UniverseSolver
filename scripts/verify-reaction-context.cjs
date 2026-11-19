const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
global.window=global;
for(const file of ['data/game-data','data/supplements','data/aha','equipment-effects','team-engine'])require('../'+file+'.js');
const source=fs.readFileSync(path.join(__dirname,'../team-engine.js'),'utf8');
const marker='const initialStats=Object.fromEntries(actors.map(a=>[a.id,stat(a)]));runUlts();';
assert.ok(source.includes(marker));
function probe(body,ids=['1106','1220'],profiles={},scenario={}){
  const context=vm.createContext({HSR_DATA,HSR_SUPPLEMENTS,HSR_EQUIPMENT});context.window=context;
  vm.runInContext(source.replace(marker,marker.replace('runUlts();',body+';runUlts();')),context);
  const stats=Object.fromEntries(ids.map(id=>[id,{...HSR_TEAM.defaults(id,HSR_DATA),hp:100000,baseHP:1000,atk:1000,baseAtk:500,crit:0,speed:1,policy:'basic',...profiles[id]}]));
  return context.HSR_TEAM.simulate(ids,stats,{focus:ids[0],targets:1,cycles:1,toughness:0,initialSP:0,energyPercent:0,seed:42,audit:true,allowPartial:true,...scenario},HSR_DATA,true);
}
const setup="const a=actors[0];a.actionKind='skill';beginAction(a);turnOwner=a;turnSPSpent=2;const key=a.actionKey;a.arcanaProcs={0:2};a.breakHits={0:7};a.attackTargets=new Set([0]);";
// Real nested Feixiao FUA commits damage but resumes the original action.
const nested=probe(setup+"feixiaoFollow(actors[1],0);record(a,'Context restored',0,'probe',null,{sameActor:activeActor===a,sameOwner:turnOwner===a,key:a.actionKey,expected:key,arcana:a.arcanaProcs[0],breakHits:a.breakHits[0],targetCount:a.attackTargets.size,spent:turnSPSpent});");
const resumed=nested.events.find(e=>e.label==='Context restored');
assert.equal(resumed.sameActor,true);assert.equal(resumed.sameOwner,true);
assert.equal(resumed.key,resumed.expected);assert.equal(resumed.sourceAction,resumed.expected);
assert.equal(resumed.arcana,2);assert.equal(resumed.breakHits,7);assert.equal(resumed.targetCount,1);assert.equal(resumed.spent,2);
assert.ok(nested.events.some(e=>e.label==='Бонус-атака Фэйсяо'&&e.damage>0));
// Same-actor interruption must also restore its original action key and maps.
const same=probe(setup+"withActionContext(()=>{beginAction(a);a.arcanaProcs[0]=99;hit(a,1,[0],'Nested packet');});record(a,'Same actor resumed',0,'probe',null,{key:a.actionKey,expected:key,arcana:a.arcanaProcs[0]});");
const own=same.events.find(e=>e.label==='Same actor resumed');
assert.equal(own.key,own.expected);assert.equal(own.arcana,2);
assert.notEqual(same.events.find(e=>e.label==='Nested packet').sourceAction,own.sourceAction);
// Cleanup must run even when a reaction fails; combat outcomes are not rolled back.
const failed=probe(setup+"try{withActionContext(()=>{beginAction(a);gainSP();throw Error('probe');});}catch(error){if(error.message!=='probe')throw error;}record(a,'Exception cleanup',0,'probe',null,{key:a.actionKey,expected:key,owner:turnOwner===a});");
const clean=failed.events.find(e=>e.label==='Exception cleanup');
assert.equal(clean.key,clean.expected);assert.equal(clean.owner,true);assert.equal(clean.sp,1);
const queue=probe(setup+"queueFinal('acheronEX',actors[1]);settleFinal();record(a,'Queue resumed',0,'probe',null,{key:a.actionKey,expected:key,owner:turnOwner===a,active:activeActor===a});",['1106','1308']);
const queued=queue.events.find(e=>e.label==='Queue resumed');
assert.equal(queued.key,queued.expected);assert.equal(queued.owner,true);assert.equal(queued.active,true);
assert.ok(queue.events.some(e=>e.label==='Ахерон EX · бонус-атака'));
// Ready off-turn ultimate + its hooks cannot steal the interrupted actor's context.
const ults=probe(setup+"actors[1].energy=HSR_DATA.characters[actors[1].id].max_sp;runUlts();record(a,'Ultimate resumed',0,'probe',null,{key:a.actionKey,expected:key,owner:turnOwner===a,active:activeActor===a});",['1106','1009']);
const ult=ults.events.find(e=>e.label==='Ultimate resumed');
assert.equal(ult.key,ult.expected);assert.equal(ult.owner,true);assert.equal(ult.active,true);
// A FUA handler and hit() may both call this hook: exactly one Duran stack.
const equipment=probe(setup+"const f=actors[1];beginAction(f);G.followupStart(f,actors);hit(f,1,[0],'Hook probe',{followup:true});record(f,'Duran once',0,'probe',null,{stacks:actors[0].eq.duran});",['1106','1220'],{'1106':{equipment:{cavern:['102','102','102','102'],planar:'315'}}});
assert.equal(equipment.events.find(e=>e.label==='Duran once').stacks,1);
const resumedHook=probe(setup+"const f=actors[1];beginAction(f);G.followupStart(f,actors);withActionContext(()=>{beginAction(f);G.followupStart(f,actors);});G.followupStart(f,actors);record(f,'Resumed FUA hook',0,'probe',null,{stacks:actors[0].eq.duran});",['1106','1220'],{'1106':{equipment:{cavern:['102','102','102','102'],planar:'315'}}});
assert.equal(resumedHook.events.find(e=>e.label==='Resumed FUA hook').stacks,2);
// An ordinary recipient buff applied off turn lasts through its next action.
const outside=probe("const a=actors[0];buff(a,'probe','duration',{damage:.5},1);playTurn(a);record(a,'Off-turn expiry',0,'probe',null,{retained:a.buffs.some(b=>b.key==='duration')});",['1106']);
assert.equal(outside.events.find(e=>e.label==='Off-turn expiry').retained,false);
assert.equal(outside.events.find(e=>e.kind==='damage-calculation').factors.damageBoost,1.5);
// Applied after the recipient's current turn has begun: the same generic
// duration survives this end, and expires at the end of its next normal turn.
const inside=probe("const a=actors[0];a.turn=1;turnOwner=a;beginAction(a);buff(a,'probe','duration',{damage:.5},1);finishTurn(a);record(a,'Own-turn retained',0,'probe',null,{retained:a.buffs.some(b=>b.key==='duration')});playTurn(a);record(a,'Next-turn expiry',0,'probe',null,{retained:a.buffs.some(b=>b.key==='duration')});",['1106']);
assert.equal(inside.events.find(e=>e.label==='Own-turn retained').retained,true);
assert.equal(inside.events.find(e=>e.label==='Next-turn expiry').retained,false);
// The final turn's buff is still present for an Ultimate inserted after BA.
const last=probe("const a=actors[0];buff(a,'probe','last',{damage:.5},1);a.turn=1;turnOwner=a;beginAction(a);a.energy=HSR_DATA.characters[a.id].max_sp;finishTurn(a);",['1106']);
assert.equal(last.events.find(e=>e.kind==='damage-calculation'&&e.damageKind==='ultimate').factors.damageBoost,1.5);
assert.ok(last.events.findIndex(e=>e.kind==='damage-calculation')<last.events.findIndex(e=>e.kind==='buff-expired'));
// Seele's pending extra action retains external character AND equipment
// buffs. Neither gets a free additional ordinary turn after Resurgence.
const resurgence=probe("const a=actors[0];a.turn=1;turnOwner=a;beginAction(a);a.buffs.push({source:'probe',key:'last',values:{critDamage:.5},expires:1});a.eq.timed.ice={critDamage:.25,expires:1};a.seeleExtraPending=true;finishTurn(a);record(a,'Before resurgence',0,'probe',null,{gear:!!a.eq.timed.ice,external:a.buffs.some(b=>b.key==='last')});seeleExtraTurn(a);record(a,'After resurgence',0,'probe',null,{gear:!!a.eq.timed.ice,external:a.buffs.some(b=>b.key==='last'),turn:a.turn});",['1102']);
const beforeExtra=resurgence.events.find(e=>e.label==='Before resurgence'),afterExtra=resurgence.events.find(e=>e.label==='After resurgence');
assert.equal(beforeExtra.gear,true);assert.equal(beforeExtra.external,true);
assert.equal(afterExtra.gear,false);assert.equal(afterExtra.external,false);assert.equal(afterExtra.turn,1);
// Opening aura calculations independent of lineup for these untargeted effects.
const openingA=probe('', ['1106','1303']),openingB=probe('', ['1303','1106']);
for(const id of ['1106','1303'])assert.equal(JSON.stringify(openingA.initialStats[id]),JSON.stringify(openingB.initialStats[id]));
// A recognized follow-up action may pass a pending Resurgence, even behind a
// deferred skill. A ready Ultimate remains blocked until the extra turn.
const priority=probe("const a=actors[0];a.seeleExtraPending=true;a.energy=HSR_DATA.characters[a.id].max_sp;queueFinal('nova',a);queueFinal('acheronEX',actors[1]);runUlts();record(a,'Priority probe',0,'probe',null,{queued:finalQueue.map(e=>e.kind),ults:a.ults,pending:a.seeleExtraPending});finalQueue.length=0;a.seeleExtraPending=false;a.energy=0;",['1102','1308']);
const priorityEvent=priority.events.find(e=>e.label==='Priority probe');
assert.deepEqual(Array.from(priorityEvent.queued),['nova']);assert.equal(priorityEvent.ults,0);assert.equal(priorityEvent.pending,true);
assert.ok(priority.events.some(e=>e.label==='Ахерон EX · бонус-атака'));
// Three incoming hits are ONE action: an Ultimate becoming ready on the
// first hit cannot execute until the action closes. It can Freeze before a
// second separate action, cancelling it. Synthetic attacks are not Gepard data.
const windowBody="const a=actors[0],original=incomingHit;incomingHit=function(...args){original(...args);a.energy=HSR_DATA.characters[a.id].max_sp;runUlts();};enemyActionSequence(0,[{name:'First enemy action',power:10},{name:'Second enemy action',power:10}]);";
const frozenWindow=probe(windowBody,['1312'],{'1312':{effectHit:10}},{incomingHits:3});
const firstHits=frozenWindow.events.map((e,index)=>[e,index]).filter(([e])=>e.kind==='incoming'&&e.label.startsWith('First enemy action'));
assert.equal(firstHits.length,3);
const firstUltimate=frozenWindow.events.findIndex(e=>e.kind==='damage-calculation'&&e.damageKind==='ultimate');
assert.ok(firstUltimate>firstHits[2][1]);
assert.ok(!frozenWindow.events.some(e=>e.kind==='incoming'&&e.label.startsWith('Second enemy action')));
assert.equal(frozenWindow.events.find(e=>e.kind==='enemy-actions-cancelled').reason,'freeze');
const openWindow=probe(windowBody,['1106'],{}, {incomingHits:3});
assert.equal(openWindow.events.filter(e=>e.kind==='incoming'&&e.label.startsWith('Second enemy action')).length,3);
const brokenWindow=probe(windowBody,['1106'],{}, {incomingHits:3,toughness:10});
assert.equal(brokenWindow.events.find(e=>e.kind==='enemy-actions-cancelled').reason,'break');
const replaced=probe("const original=trainingAttack;trainingAttack=function(...args){original(...args);dummies[0]={...dummies[0]};};enemyActionSequence(0,[{name:'Old phase',power:1},{name:'Invalid continuation',power:1}]);",['1106']);
assert.equal(replaced.events.find(e=>e.kind==='enemy-actions-cancelled').reason,'phase');
console.log('Verified reaction contexts, FUA priority, duration boundaries, equipment retention and atomic enemy actions with inter-action Ultimate/cancellation windows.');
