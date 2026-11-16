const assert = require('node:assert/strict');
global.window = global;
require('../data/game-data.js');
require('../equipment-effects.js');
require('../team-engine.js');

const D = HSR_DATA, T = HSR_TEAM;
const settings = {targets:1,cycles:1,seed:42,initialSP:3,energyPercent:0,
  enemyLevel:0,toughness:0,allowPartial:true,rollCrits:true,audit:true};
function fight(id, stats={}, scenario={}) {
  const profile={...T.defaults(id,D),atk:1000,crit:0,speed:110,policy:'skill',...stats};
  return T.simulate([id],{[id]:profile},{...settings,focus:id,...scenario},D,true);
}
const events=(battle,label)=>battle.events.filter(event=>event.label.startsWith(label));
const dan='1002', yanqing='1209';

// Max-level E0 values from the combat entries linked in BASE-KIT-AUDIT.md.
assert.deepEqual(D.character_skills['100202'].params[9],[2.6,.12,2,1]);
assert.deepEqual(D.character_skills['100203'].params[9],[4,1.2]);
assert.deepEqual(D.character_skills['120904'].params[9],[.2,.3,.6,.5,.5,.65]);

const skill = events(fight(dan),'Навык Дань Хэна');
assert.deepEqual(skill.map(hit=>Math.round(hit.damage)),[780,390,390,1040]);
assert.deepEqual(events(fight(dan,{policy:'basic'}),'Базовая атака').map(hit=>Math.round(hit.damage)),[450,550]);
assert.equal(events(fight(dan),'Замедление').length,0);
assert.equal(events(fight(dan,{crit:1}),'Замедление').length,4);
const partialCrit=fight(dan,{crit:.5});
assert.equal(events(partialCrit,'Замедление').length,
  events(partialCrit,'Навык Дань Хэна').filter(hit=>hit.crits[0]).length);
const ult=events(fight(dan,{speed:1},{energyPercent:100,toughness:80}),'Ульта Дань Хэна')[0];
assert.equal(ult.toughness[0],50);

const boss={encounter:'gepard',enemyHP:100000};
const duelist=fight(yanqing,{speed:200,hp:8000},boss);
assert.equal(events(duelist,'Навык Яньцина').filter(hit=>hit.time===50).length,4);
assert.ok(events(duelist,'Эмпатическая связь · снята').length);
assert.equal(events(duelist,'Ледяная благодать').length,0);
assert.ok(events(fight(yanqing),'Ледяная благодать').length);
const trace=fight(yanqing,{crit:1});
assert.ok(trace.events.some(event=>event.kind==='buff'&&event.label.endsWith('yanSpeed')&&event.values.speedPct===.1));
console.log('E0 kit audit fixtures verified: Dan Heng packet weights, crit-linked Slow, ultimate toughness, Yanqing Soulsteel loss, Ice weakness and critical speed trace.');
