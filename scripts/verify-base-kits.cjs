const assert = require('node:assert/strict');
global.window = global;
require('../data/game-data.js');
require('../equipment-effects.js');
require('../team-engine.js');
require('../optimizer-engine.js');

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
const maxLevel = {
  '1001':[[.57,3,.3,760,5],[1.5,.5,1,.6],[1,2]],
  '1003':[[2,.8],[2.3,5],[1.4,3]],
  '1004':[[.72,.75,.1,2],[1.5,.4,1,.1],[.6]],
  '1005':[[1.6,.75,.6],[.8,1,2,2.9,1],[1.4,1,2]],
  '1006':[[1.96,.85,2,.2,1,.1,2],[3.8,1,.45,3],[.1,.08,.06,.72,3]],
  '1008':[[.15,2.4],[3.2,1.6],[.72]],
  '1009':[[.5],[50,2],[.14,5,3]],
  '1013':[[1,.5,.2],[2],[.5,.4]],
  '1101':[[.66,0,1,1],[.55,.16,.2,2],[.3]],
  '1102':[[2.2,.25,2],[4.25],[.8,1]],
  '1014':[[1.5,.75,3,.14],[2.8,1.1,10],[3,25,.6,2,8,.1,99,1]],
  '1015':[[3.6,1,2,1,5],[10,2,4],[2]],
  '1103':[[1.4,.6,.8,2,1.04],[1.8,2],[.72]],
  '1104':[[2,.65,1,.6],[.45,3,600],[.5]],
  '1105':[[.105,.072,2,280,192],[.138,368],[.3,.5]],
  '1106':[[2.1,1],[1,.4,2,1],[10]],
  '1107':[[1.2,1.2],[5,1.6,2,.25,2],[1,1.6,.1]],
  '1108':[[4,.56],[1.6,.3,2,1],[.65,.52,3,5]],
  '1109':[[2.4,1,2,.65],[4],[1,5]],
  '1110':[[.075,200,2,.12,320,5],[1,.135,360],[2,.036,96,.045,120]],
  '1111':[[1.2,1,.24,3.38,3],[3.3,1,.2,3,2],[1,.85]],
  '1112':[[1.5,.5],[1.5,.25,.5,2],[80,1.5,.5]],
  '1201':[[2,.28,4],[2],[.72]],
  '1202':[[.4,.5,3,.25],[50,2,.5],[.6]],
  '1203':[[.6,800,.5,2],[2,1],[2,.18,2,240]],
  '1204':[[1,2],[2,3],[60,.66,10,3,.25,10]],
  '1205':[[.3,3,1,.4],[.4,1,.16,.4,1,.4,.9],[3,.44,.25,1.1]],
  '1206':[[2.1,1,.33],[3.2,2,.5,.3],[.2,2]],
  '1207':[[2,.8],[3.8,.28,.65],[.8,1,1]],
  '1208':[[.65,0,3,.06,.12],[1],[.18,.5,.9]],
  '1210':[[1.2,.4,1,2.1821,2],[1.2,.92],[1,0,0,.07,3,3]],
  '1211':[[.117,312,.15,2],[.135,360,2],[.054,144,.18,480,2]],
  '1212':[[2,1],[3,1,1.5,1],[.3,.04,5.4,1.8,2,1,.5]],
  '1213':[[.12,4],[3,1.4,2,3],[.1,6]],
  '1214':[[1.4,.7],[2.5,.15,.6],[8,.9,1]],
  '1215':[[2.4,2],[.6,2,.2],[.3,2]],
  '1217':[[.21,560,.168,448,1],[.2,.4,2],[2,1,.045,0,120,.5,6]],
  '1218':[[1.5,.9,1],[1,.6,.15,3,6],[1,.15,.05,5,2,1.8]],
  '1220':[[2],[1.6,1,6,7],[1.1,2,6,12,.6,2]],
  '1221':[[1.2,.6,.3,200],[2.2,1,0,6,0,1.1,.72,120],[1.2,.6,15]],
  '1222':[[.8,.14,420,.2],[1.5,.12,360,.25,2,1],[90,.75,.12,360,5,1,3,.75]],
  '1223':[[1.5,9],[2.7],[.3,3,1.6]],
  '1224':[[.1,.2,1],[2.4,2,.2],[7,.8,10]],
  '1225':[[3,.3,1,.18,2,.5],[2],[1,.4]],
  '1301':[[1600],[1.5,2],[.12,640]],
  '1302':[[1.2],[1.6,90],[3,.025,10]],
  '1303':[[.32,.5,3],[.25,2,.2,.1,.5],[.1,1.2]],
  '1304':[[.24,320,3,2],[7,2.7,.15,3],[1,7,.25,.5,2]],
  '1305':[[1.5],[2.4,2],[2.7,.4,.2]],
  '1306':[[.24,.45,1,.5],[2,4,.1,2],[2,.06,2,3]],
  '1307':[[.9,1,1,.208,3],[1.2,2,.25,1],[2.4,.65,.12,3,1.8,7,.2,50]],
  '1308':[[1.6,.6,1],[.24,.15,1.2,9,.6,3.72,3],[9,.2]],
  '1309':[[.5,3],[.228,90,200,1.2,1,1.5],[.2,2]],
  '1310':[[2,.4,.6,.25],[.2,.5,60,70],[.4,.5,.2,.3]],
  '1312':[[2,.8,1],[3,.6,.2,.3,10],[2,1]],
  '1313':[[1,.3,2,.5],[.2,.3,3,.12],[.2,3]],
  '1314':[[30,.02,.25,3],[.8,2,2.4],[.024,50,8,5,1.2]],
  '1315':[[.3,.15,2],[4,.4,2],[.7,1.2,1.7,.5,3,16]],
  '1317':[[1.2],[.5,.3,3],[10,0,.6,2,.5,1]],
  '1321':[[1.6,3,.5],[3,4,.18],[.3,5,2,35,.6]]
};
const specialBasics={'1110':[.5],'1208':[.5],'1217':[.5],'1224':[1,1],'1307':[.6,.65,.65],'1314':[.9,.3]};
for(const [id,skills] of Object.entries(maxLevel)){
  assert.deepEqual(D.character_skills[id+'01'].params[5],specialBasics[id]||[1],id);
  assert.deepEqual(['02','03','04'].map(s=>D.character_skills[id+s].params[9]),skills,id);
  assert.ok(Number.isFinite(fight(id).total),id);
}

// Technique data, including effects triggered only after entering combat.
const techniques = {
  '1001':[1,1,.5],
  '1003':[1,.1,2,15],
  '1004':[1,.2,.1,15,.5],
  '1005':[1,2,.5],
  '1006':[.8],
  '1008':[.8],
  '1009':[.5],
  '1013':[.4,3],
  '1101':[.15,2],
  '1102':[20],
  '1014':[.35,2,2],
  '1015':[2,1],
  '1103':[1,.5,3,.5],
  '1104':[.24,2,150],
  '1105':[1,.3,1,.8],
  '1106':[1,.2,2,.8],
  '1107':[2,5],
  '1108':[10,1,.25],
  '1109':[1,.5,3,.5],
  '1110':[2],
  '1111':[.5,1],
  '1112':[60,10000],
  '1201':[2],
  '1202':[50],
  '1203':null,
  '1204':[3],
  '1205':[.4,.2],
  '1206':[.8],
  '1207':[20,.35,2],
  '1208':[20,2],
  '1210':[.5,4,1],
  '1211':[2],
  '1212':[1,1,20,1,.8,15],
  '1213':[1,20,1.2],
  '1214':[.8],
  '1215':null,
  '1217':[1,.25,2,10],
  '1218':[1,15,1],
  '1220':[20,.5,2,1,1,10],
  '1221':[.8,20],
  '1222':[2], '1223':[20,.3,2], '1224':[3,30], '1225':[10,1,2,.4],
  '1301':[2,.5], '1302':[10,.8,15], '1303':[1,1,1,20],
  '1304':[.24,.36,.6,3], '1305':[10,1,.15,2], '1306':[3,20],
  '1307':[1.5,.5], '1308':[2,1], '1309':[15,5], '1310':[5,2,2], '1312':[15,2],
  '1313':[.5,2], '1314':[10,.5,15], '1315':[2], '1317':[20,2,1.8,10,30], '1321':[20,.6]
};
for(const [id,params] of Object.entries(techniques)){
  const skill=D.character_skills[id+'07'];
  assert.ok(D.characters[id].skills.includes(skill.id),id);
  assert.equal(skill.type,'Maze',id);
  assert.deepEqual(skill.params[0]??null,params,id);
}

const welt='1004';
const hole=fight(welt,{speed:1,effectHit:3},{energyPercent:100,toughness:100});
assert.deepEqual(events(hole,'Ульта Вельта').map(hit=>Math.round(hit.damage)),[151,1361]);
assert.deepEqual(events(hole,'Ульта Вельта').map(hit=>hit.toughness[0]),[98,80]);
assert.equal(events(hole,'Талант Вельта').length,0);
assert.deepEqual(events(fight(welt,{effectHit:3},{toughness:100}),'Навык Вельта').slice(0,3).map(hit=>hit.toughness[0]),[90,80,70]);

const arlan=fight('1008',{}, {initialSP:0,toughness:80});
assert.equal(events(arlan,'Арлан · навык без SP')[0].sp,0);
assert.equal(events(arlan,'Арлан · навык без SP')[0].toughness[0],60);
assert.equal(events(fight('1008',{speed:1},{energyPercent:100,toughness:80}),'Арлан · ульта')[0].toughness[0],60);
const seele=fight('1102',{policy:'basic',speed:100},{cycles:2});
assert.deepEqual(events(seele,'Базовая атака').map(hit=>Math.round(hit.time)),[100,180]);
assert.equal(events(fight('1102',{speed:1},{energyPercent:100,toughness:80}),'Ульта Зеле')[0].toughness[0],50);

const wolf=fight('1006',{speed:200,effectHit:3},{...boss,toughness:120});
assert.equal(events(wolf,'Имплант уязвимости')[0].element,'Quantum');
assert.equal(events(wolf,'Навык Серебряного Волка')[0].toughness[0],100);
const herta=fight('1013',{atk:20000,speed:200},{...boss,enemyHP:13000});
assert.ok(events(herta,'Герта · вращение').length);
const bronya=fight('1101',{policy:'basic'});
assert.equal(bronya.initialStats['1101'].def,T.defaults('1101',D).def*1.2);
assert.equal(events(bronya,'Базовая атака')[0].crits[0],true);

const march=fight('1001',{speed:150,def:1000});
assert.equal(march.breakdown[0].shield,1330);
const himeko=fight('1003',{speed:1,atk:10000},{...boss,energyPercent:100,enemyHP:20000});
assert.equal(himeko.breakdown[0].energy,15); // 5 from casting, 5 for each defeated guard.
const asta=fight('1009',{}, {targets:1});
assert.equal(events(asta,'Навык Асты').length,5);
const kafka='1005';
const squad={
  [dan]:{...T.defaults(dan,D),atk:100,speed:200,policy:'basic'},
  [kafka]:{...T.defaults(kafka,D),speed:1,effectHit:3}
};
const flank=T.simulate([dan,kafka],squad,{...settings,...boss,rotation:{actor:dan,enemy:'weakest'}},D,true);
const reply=events(flank,'Бонус-атака Кафки')[0];
assert.ok(reply.enemyHP[1]<reply.enemyHP[2]);
assert.equal(reply.enemyHP[0],100000);
const hookTechnique=D.character_skills['110907'].desc;
assert.match(hookTechnique,/урон, равный #4\[i\]%.*базовый шанс #1\[i\]%/);
assert.equal(events(fight('1109',{speed:1},{energyPercent:100,toughness:80}),'Ульта Хук')[0].toughness[0],50);

const pela=fight('1106',{policy:'basic'},{externalDebuffs:1});
assert.equal(pela.breakdown[0].energy,30);
assert.equal(events(pela,'Базовая атака')[0].damage,1200);
assert.equal(fight('1106',{policy:'basic'}).breakdown[0].energy,20);

const serval=fight('1103',{effectHit:3},{toughness:100});
assert.equal(events(serval,'Навык Сервал')[0].toughness[0],80);
assert.equal(events(serval,'Талант Сервал')[0].toughness[0],80);
const revived=fight('1104',{speed:1,hp:10,def:0},{...boss,cycles:3});
assert.equal(events(revived,'Несгибаемая воля').length,1);
assert.equal(events(revived,'Несгибаемая воля')[0].energy,D.characters['1104'].max_sp);
const archer='1015';
const archerFlank=T.simulate([dan,archer],{[dan]:squad[dan],[archer]:{...T.defaults(archer,D),speed:1,atk:100}},{...settings,...boss,rotation:{actor:dan,enemy:'weakest'}},D,true);
assert.ok(events(archerFlank,'Арчер · бонус-атака')[0].enemyHP[1]<events(archerFlank,'Арчер · бонус-атака')[0].enemyHP[2]);
assert.equal(events(archerFlank,'Арчер · бонус-атака')[0].enemyHP[0],100000);
const luka=fight('1111',{effectHit:3},{...boss,enemyHP:2000});
assert.equal(events(luka,'Тик DoT')[0].damage,480);
const topaz='1112';
const marked=fight(topaz,{speed:170,atk:100},boss);
const topazSkill=events(marked,'Навык Топаз')[0];
assert.ok(topazSkill.enemyHP[0]<100000);
assert.equal(topazSkill.enemyHP[1],topazSkill.enemyHP[2]);
assert.ok(events(marked,'Счетовод · атака')[0].enemyHP[0]<topazSkill.enemyHP[0]);

const stanceRolls=Array.from({length:32},(_,index)=>events(fight('1206',{}, {seed:index+1}),'Стойка меча').length);
assert.ok(stanceRolls.some(n=>n===0)&&stanceRolls.some(n=>n>0));
const fu='1208';
const protectedTeam=T.simulate([dan,fu],{
  [dan]:{...T.defaults(dan,D),hp:25000,def:0,speed:60,policy:'basic'},
  [fu]:{...T.defaults(fu,D),hp:25000,def:0,speed:180,policy:'skill'}
},{...settings,...boss,cycles:3},D,true);
const redirected=protectedTeam.events.find(event=>event.kind==='redirected');
const direct=protectedTeam.events.find(event=>event.kind==='incoming'&&event.time===redirected.time&&event.recipient===dan);
assert.ok(Math.abs(redirected.hpLoss/direct.hpLoss-.65/.35)<1e-8);
const quantumBreak=fight('1214',{speed:1},{...boss,energyPercent:100,toughness:40});
assert.equal(events(quantumBreak,'Ульта Сюэи')[0].toughness[0],0);
assert.ok(events(quantumBreak,'Пробитие').some(event=>event.actor==='1214'));

const bailu='1211';
const rescue=T.simulate([dan,bailu],{
  [dan]:{...T.defaults(dan,D),hp:20,def:0,speed:1},
  [bailu]:{...T.defaults(bailu,D),hp:20000,def:0,speed:1}
},{...settings,...boss,cycles:4},D,true);
assert.equal(events(rescue,'Байлу · спасение от смертельного удара').length,1);
assert.equal(events(rescue,'Байлу · спасение от смертельного удара')[0].recipient,dan);
const vigor=fight(bailu,{speed:1,hp:20000,def:0},{...boss,energyPercent:100});
assert.ok(vigor.events.some(event=>event.kind==='incoming'&&Math.abs(event.hpLoss-1800*.9)<1e-8));
assert.ok(events(vigor,'Лечение Байлу').some(event=>event.time>0));

const feixiao='1220';
const feixiaoFlank=T.simulate([dan,feixiao],{[dan]:squad[dan],[feixiao]:{...T.defaults(feixiao,D),speed:1,atk:100}},{...settings,...boss,rotation:{actor:dan,enemy:'weakest'}},D,true);
assert.equal(events(feixiaoFlank,'Бонус-атака Фэйсяо')[0].enemyHP[0],100000);
assert.ok(events(feixiaoFlank,'Бонус-атака Фэйсяо')[0].enemyHP[1]<events(feixiaoFlank,'Бонус-атака Фэйсяо')[0].enemyHP[2]);
const fugueUlt=fight('1225',{speed:1},{...boss,energyPercent:100,toughness:100});
assert.equal(events(fugueUlt,'Ульта Фуги')[0].toughness[0],80);

const ratio='1305';
const ratioTeam={
  [dan]:{...T.defaults(dan,D),speed:200,policy:'basic'},
  [ratio]:{...T.defaults(ratio,D),speed:1}
};
const ratioScenario={...settings,...boss,energyPercent:100};
const ratioMain=T.simulate([ratio,dan],ratioTeam,ratioScenario,D,true);
const ratioFlank=T.simulate([ratio,dan],ratioTeam,{...ratioScenario,rotation:{actor:dan,enemy:'weakest'}},D,true);
assert.ok(events(ratioMain,'Бонус-атака Рацио').length>0);
assert.equal(events(ratioFlank,'Бонус-атака Рацио').length,0);

assert.equal(events(fight('1223'),'Моцзэ · навык').length,0);
const breakBoss={...boss,toughness:100,energyPercent:100};
const firefly=fight('1310',{speed:80,atk:100},breakBoss);
assert.deepEqual(events(firefly,'Светлячок · усиленный навык')[0].toughness,[55,100,100]);
assert.equal(events(fight('1315',{speed:1,atk:100},breakBoss),'Ульта Бутхилла')[0].toughness[0],70);

const rappa=fight('1317',{speed:1,atk:100},breakBoss);
const rappaHit=events(rappa,'Раппа · соседние лепестки')[0];
assert.deepEqual(rappaHit.toughness,[85,96.25,96.25]);
assert.equal(rappaHit.energy,5);
assert.equal(events(rappa,'Раппа · брейк таланта · цель 2')[0].toughness[1],85.75);

const dahlia=fight('1321',{speed:1,atk:100},breakBoss);
assert.deepEqual(events(dahlia,'Ульта Георгины')[0].toughness,[80,80,80]);

const robin='1309';
const flankConcert=T.simulate([robin,dan],{[dan]:ratioTeam[dan],[robin]:{...T.defaults(robin,D),speed:1}},
  {...ratioScenario,rotation:{actor:dan,enemy:'weakest'}},D,true);
const concertHit=events(flankConcert,'Концерт · дополнительный урон')[0];
assert.equal(concertHit.enemyHP[0],100000);
assert.ok(concertHit.enemyHP[1]<concertHit.enemyHP[2]);

const laterKits={
  '1401':[[1,3,1,0.3],[0.7,1],[2,2,1,0.8,3,4],[0.08,0.04,42,1,42,25],[0.6,2,3,0.99,0.3,25]],
  '1402':[[1,1],[0.5,0,5],[0.15,0,0,100,0,0],[0.3,0,0,0.35,0.66,720],[1,30]],
  '1403':[[0.3,0.15],[0.24,3],[0.3,0.3,0.12,2],[0.18],[3]],
  '1404':[[0.5],[0.9,0.5,0.5],[1.6,1,0.2,2,20],[0.25,0,150,0.5,0.5],[10,0.8,1,1,50]],
  '1405':[[1],[0.7,4,0.2],[1.6],[0.3,3,5],[10,3]],
  '1406':[[1],[2,1,0.1,2,0.3,1.2],[1.2,0.25,0.75,0.4],[1.5,0.12,1,5],[15,2,1,50]],
  '1407':[[0.5],[0.3,0.5,0.3],[165,3,1,0.2,0],[0,0.2,3,3],[0.4,0.5,20,0.3]],
  '1408':[[1],[3,1.2,2],[9.6,12,0.6,8],[0.3,3,3,12],[2,2,25,1]],
  '1409':[[0.5],[0.08,160,0.1,200],[0.1,200,0.3,600,3,0.12,240],[0.5,1,0.8,2,3],[0.3,600,0.2,2]],
  '1410':[[1,1,3],[1.4,1,0.2,3],[2,3,0.25,0.8,8,0.15],[1,0.25,0.2,0.25,2],[20,1,2]],
  '1412':[[1],[0.72,1,8,6,0.1],[2.4,2],[1,0.24,0.6,20],undefined],
  '1413':[[0.5],[0.24,2,2,0.5,12,0.1],[2,2,0.6,0.3],[2,0.6,2,160,0.5,16,0.05],[1,1]],
  '1414':[[1],[0.2,400,3,3],[3,0.8,2,0.2,400,3,3,0.8],[0.1,200,3,3,165,1],[10]],
  '1415':[[0.5,1],[0.24,2,3],[1,24,0.5,12],[1,0.2,27,24,12],[30,0.5]],
  '1501':[[1],[20,28,3,7,4],[2,0.5,0.6],[0.2,0.48,0.4,0.2],[2,0.5,10]],
  '1502':[[0.9,0.3],[3,0.2,3],[5,0.2,3,20,1],[0.2],[8]],
  '1503':[[0.9],[15,0.12,240],[3,0.6,20,0.1,0.15,0.3,60,30],[0.5,0.6,50,0.3,200],[2,20]],
  '1504':[[1],[2,1,1,0.4,1],[4,3,4,2],[2,3,1,2,2,12,8],[10,1,1]],
  '1505':[[1],[1,3,1.5,10],[1.6,5,1.2,88],[1,0.25,240,10,0.2,0.24,0.16,0.28],[1,20]],
  '1506':[[1],[1.6,5],[60,0,0.9,0.2,0.2,3,2],[60,240,0.4,0.004,3,0.008],[99]],
  '1507':[[0.5],[0.72,4,0.24,0.1],[0.2,0.2,0.6,0.5,70,0.5,0.3,2],[9,25],[0.9,2]],
  '1508':[[1],[1.8],[6,2,12,1,0.2,3],[20,2,0.7,7,15,999],[10,2,2]],
  '1509':[[1],[2.8,1.4,0.2,10,0.3,3,2],[4,1,10],[3,10,0.4,0.1],[10,2,3]],
  '1510':[[1],[0.2,3],[0.32,1,0.2,1,0.3,3,0.8,3,7.62,2.52],[0.8,0.2,4],[30]],
  '1512':[[0.5],[1,6],[1,2,0.2,0],[0.7,1.8,0,0,50,6,12,0.15,0.005],[6,0.3,0.2]],
  '1513':[[1],[2.4,4,4],[4,8,6,0.3,4],[10,0.4,0.72,30,20,1,1],[1,2,20]],
  '8001':[[1],[1.25],[4.5,2.7,1.62],[0.2,2],[0.15]],
  '8003':[[1],[0.5,1,1],[1,1.5],[0.06,2,8,80],[0.3,384,1]],
  '8005':[[1],[0.5,2],[3,1,0.3],[10],[0.3,2]],
  '8007':[[1],[0.6,0.1],[2.4,0.4],[130,0.8,10,640],[10,0.5,1]]
};
for(const [id,expected] of Object.entries(laterKits)){
  const levels={ '01':5,'02':9,'03':9,'04':9,'07':0 };
  assert.deepEqual(Object.entries(levels).map(([skill,level])=>D.character_skills[id+skill].params[level]),expected,id);
  assert.ok(Number.isFinite(fight(id).total),id);
}

const anaxa='1405';
const firstBasic=fight(anaxa,{speed:100,policy:'basic',atk:100},{...boss,toughness:100});
assert.equal(events(firstBasic,'Анакса · попадание').length,0);
const afterUlt=fight(anaxa,{speed:100,policy:'basic',atk:100},breakBoss);
assert.equal(events(afterUlt,'Ульта Анаксы')[0].toughness[0],80);
assert.equal(events(afterUlt,'Анакса · попадание').length,5);

const cipher='1406';
const cipherFight=T.simulate([dan,cipher],{
  [dan]:{...T.defaults(dan,D),speed:100,atk:100,policy:'basic'},
  [cipher]:{...T.defaults(cipher,D),speed:1}
},{...settings,...boss},D,true);
assert.equal(events(cipherFight,'Цифер · бонус-атака').length,1);
assert.ok(events(cipherFight,'Цифер · бонус-атака')[0].enemyHP[0]<100000);

const incomingProfile={speed:1,hp:20000,def:0};
const baselineHit=fight(dan,incomingProfile,boss).events.find(event=>event.kind==='incoming');
const hysilensHit=fight('1410',incomingProfile,boss).events.find(event=>event.kind==='incoming');
assert.ok(Math.abs(hysilensHit.hpLoss-baselineHit.hpLoss*.85)<1e-8);

const ash='1504';
const ashTeam={
  [dan]:{...T.defaults(dan,D),speed:100,atk:100,policy:'basic'},
  [ash]:{...T.defaults(ash,D),speed:1,energyRegen:2}
};
const ashMain=T.simulate([dan,ash],ashTeam,{...settings,...boss},D,true);
const ashFlank=T.simulate([dan,ash],ashTeam,{...settings,...boss,rotation:{actor:dan,enemy:'weakest'}},D,true);
assert.equal(events(ashMain,'Эшвейл · бонус-атака').length,0);
const ashFollowup=events(ashFlank,'Эшвейл · бонус-атака')[0];
assert.deepEqual(ashFollowup.targets,[1]);
assert.equal(ashFollowup.energy,8);

const pearl='1503',sparxie='1501';
const pearlBattle=T.simulate([pearl,sparxie],{
  [pearl]:{...T.defaults(pearl,D),speed:1},
  [sparxie]:{...T.defaults(sparxie,D),speed:1}
},ratioScenario,D,true);
const lesson=events(pearlBattle,'Глубокое обучение')[0];
const archetypeUlt=events(pearlBattle,'Искра · Пока камера снимает')[0];
const refund=events(pearlBattle,'Жемчуг · 90 энергии');
assert.equal(refund.length,1);
assert.ok(pearlBattle.events.indexOf(refund[0])>pearlBattle.events.indexOf(archetypeUlt));
assert.equal(refund[0].energy-lesson.energy,90);
assert.equal(fight(pearl,{speed:1},{energyPercent:100}).breakdown[0].ults,0);

const evan=fight('1505',{speed:1,atk:100},{...boss,energyPercent:100});
const bounces=evan.events.filter(event=>/^Эванесса · отскок (Радости )?ульты$/.test(event.label));
assert.equal(bounces.length,12);
for(let i=0;i<bounces.length;i+=2)assert.deepEqual(bounces[i].targets,bounces[i+1].targets);


for(const id of ['8001','8003','8005','8007']){
  const alternate=String(+id+1);
  for(const [suffix,level] of Object.entries({'01':5,'02':9,'03':9,'04':9,'07':0})){
    assert.deepEqual(D.character_skills[alternate+suffix].params[level],D.character_skills[id+suffix].params[level],alternate);
  }
}
const gil=fight('1509',{speed:200,policy:'skill'});
assert.ok(gil.breakdown[0].turns>=2);
assert.equal(events(gil,'Гильгамеш · Сокровища короля').length,0);

const fireTB='8003',guard={speed:200,hp:20000,def:0,baseDef:0,atk:100};
const openHit=fight(fireTB,{...guard,policy:'basic'},boss).events.find(event=>event.kind==='incoming');
const guardedHit=fight(fireTB,{...guard,policy:'skill'},boss).events.find(event=>event.kind==='incoming');
assert.ok(Math.abs((guardedHit.hpLoss+80)-(openHit.hpLoss+80)*.85*.5)<1e-8);

const mort=fight('1507',{speed:1,hp:70,def:0},{...boss,energyPercent:100});
assert.equal(events(mort,'Безмерная ярость · спасение от смертельного удара').length,1);

const rin=fight('1508',{speed:100,atk:10000},{...boss,enemyHP:11000});
const gemBounce=events(rin,'Рин · отскок камня')[0];
assert.deepEqual(gemBounce.targets,[0]);
assert.deepEqual(gemBounce.enemyHP.slice(1),[0,0]);

for(const [id,expected] of Object.entries({
  [dan]:[[1],[2.6,.12,2,1],[4,1.2],[.36,2],[.4,3]],
  [yanqing]:[[1],[2.2],[.6,.5,3.5],[.2,.3,.6,.5,.5,.65],[.5,.3,2]],
  '8009':[[1],[.6,20],[.5,3,.5,10,20,5],[10,3,.3],[.3,.1,.2,.1,3],[8,.2,.6]],
  '8010':[[1],[.6,20],[.5,3,.5,10,20,5],[10,3,.3],[.3,.1,.2,.1,3],[8,.2,.6]]
})){
  const levels=[['01',5],['02',9],['03',9],['04',9],['07',0],['20',9]];
  assert.deepEqual(levels.slice(0,expected.length).map(([suffix,level])=>D.character_skills[id+suffix].params[level]),expected,id);
}

const tb='8009',wave='1513';
const trailTeam={
  [tb]:{...T.defaults(tb,D),speed:100,policy:'skill'},
  [wave]:{...T.defaults(wave,D),speed:1}
};
const trailBattle=T.simulate([tb,wave],trailTeam,{...settings,energyPercent:100,focus:wave},D,true);
const elationUlt=trailBattle.events.find(event=>event.kind==='wave-skill');
assert.equal(elationUlt.punchlineUsed,20);
assert.equal(elationUlt.sp,settings.initialSP+1);
assert.ok(events(trailBattle,'Первопроходец · Пусть бушует буря')[0].banger>=22);

const marchShield='1001';
const penetration=T.simulate([dan,marchShield],{
  [dan]:{...T.defaults(dan,D),atk:1000,speed:180,crit:0,policy:'basic'},
  [marchShield]:{...T.defaults(marchShield,D),speed:300,policy:'skill'}
},{...settings,initialSP:5,focus:dan},D,true);
const basics=events(penetration,'Базовая атака').filter(event=>event.actor===dan);
assert.deepEqual(basics.slice(0,4).map(event=>Math.round(event.damage)),[612,748,450,550]);

const yanBattle=Array.from({length:8},(_,index)=>fight(yanqing,{}, {seed:index+1}))
  .find(battle=>events(battle,'Яньцин · бонус-атака').length===2);
assert.ok(yanBattle);
const yanFollow=events(yanBattle,'Яньцин · бонус-атака');
assert.equal(yanFollow.length,2);
assert.equal(yanFollow[0].action,yanFollow[1].action);
assert.notEqual(yanFollow[0].action,events(yanBattle,'Навык Яньцина')[0].action);

const aliases={'8002':'8001','8004':'8003','8006':'8005','8008':'8007','8010':'8009'};
const audited=new Set([...Object.keys(maxLevel),...Object.keys(laterKits),dan,yanqing,tb]);
assert.deepEqual([...audited].sort(),Object.keys(D.characters).filter(id=>!aliases[id]).sort());
assert.equal(audited.size+Object.keys(aliases).length,98);

const sparkle='1306';
const sparkleBattle=fight(sparkle,{novaflare:true,speed:150},{energyPercent:100});
assert.equal(events(sparkleBattle,'Искорка · +6 SP и Шифр')[0].sp,7);
assert.ok(events(sparkleBattle,'Искорка · SP из резерва').length);
assert.equal(events(fight(sparkle,{speed:1},{energyPercent:100}),'Искорка · +4 SP и Шифр').length,1);

const upgradedFirefly=fight('1310',{novaflare:true,speed:1,atk:100,breakEffect:1.5},{energyPercent:100,toughness:40});
assert.equal(events(upgradedFirefly,'Полное сгорание · продление на 10%').length,1);
assert.ok(events(upgradedFirefly,'Суперпробитие · Светлячок').length);
assert.equal(events(fight('1310',{speed:1,atk:100,breakEffect:1.5},{energyPercent:100,toughness:40}),'Суперпробитие · Светлячок').length,0);

const swan='1307',swanTeam={
  [dan]:{...T.defaults(dan,D),speed:180,atk:1000,crit:0,policy:'basic'},
  [swan]:{...T.defaults(swan,D),speed:1,crit:0,effectHit:1.2,novaflare:true}
};
const swanBattle=T.simulate([dan,swan],swanTeam,settings,D,true);
assert.equal(Math.round(events(swanBattle,'Базовая атака')[0].damage),774);
assert.ok(events(swanBattle,'Тик Аркана').some(event=>event.actor===swan));

const novaHP={novaflare:true,hp:6000,crit:0};
for(const [id,label] of [['1212','Непостижимая Зарница'],['1205','Частокол мечей']]){
  const damage=atk=>events(fight(id,{...novaHP,atk}),label)[0].damage;
  assert.equal(damage(150),damage(2000),id);
  assert.ok(events(fight(id,{...novaHP,hp:9000,atk:150}),label)[0].damage>damage(150),id);
}
const jingliu='1212';
const moonBattle=T.simulate([jingliu,dan],{
  [jingliu]:{...T.defaults(jingliu,D),...novaHP,speed:300,policy:'skill'},
  [dan]:{...T.defaults(dan,D),speed:1,hp:6000}
},{...settings,energyPercent:100,focus:jingliu},D,true);
assert.equal(events(moonBattle,'Спектральная трансмиграция · продвижение')[0].resource,3);
assert.ok(events(moonBattle,'Луна на застывшей реке').length>=3);
assert.ok(moonBattle.breakdown.find(row=>row.id===dan).currentHP<=5100);

const wolfId='1006',wolfProfiles={
  [dan]:{...T.defaults(dan,D),speed:1},
  [wolfId]:{...T.defaults(wolfId,D),novaflare:true,speed:120,effectHit:1,policy:'skill'}
};
const wolfScene={...settings,...boss,toughness:100,focus:wolfId};
const wolfSkill=T.simulate([dan,wolfId],wolfProfiles,wolfScene,D,true);
assert.equal(events(wolfSkill,'Имплант уязвимости')[0].element,'Wind');
assert.equal(events(wolfSkill,'Навык Серебряного Волка')[0].energy,55);
const wolfUlt=T.simulate([dan,wolfId],wolfProfiles,{...wolfScene,energyPercent:100},D,true);
assert.deepEqual(events(wolfUlt,'Ульта Серебряного Волка')[0].targets,[0,1,2]);
assert.deepEqual(events(wolfUlt,'Ульта Серебряного Волка')[0].toughness,[100,80,80]);
const wolfTransfer=T.simulate([dan,wolfId],{...wolfProfiles,[wolfId]:{...wolfProfiles[wolfId],atk:4000}},
  {...wolfScene,enemyHP:1000},D,true);
assert.deepEqual(events(wolfTransfer,'Серебряный Волк · перенос уязвимости')[0].targets,[1]);

const kafkaId='1005', huohuoId='1217', seeleId='1102', weltId='1004';
for(const id of [kafkaId,huohuoId,seeleId,weltId]){
  assert.ok(T.novaflareModels.has(id)&&T.catalogNovaflare.has(id));
}
const kafkaBattle=T.simulate([kafkaId,dan],{
  [kafkaId]:{...T.defaults(kafkaId,D),novaflare:true,atk:1000,crit:0,speed:90,policy:'skill'},
  [dan]:{...T.defaults(dan,D),effectHit:.75,crit:0,speed:130,policy:'skill'}
},{...settings,targets:3,energyPercent:100,focus:kafkaId},D,true);
assert.equal(kafkaBattle.initialStats[dan].atk,2*T.defaults(dan,D).atk);
const kafkaSkill=events(kafkaBattle,'Навык Кафки')[0];
const kafkaFollowups=events(kafkaBattle,'Бонус-атака Кафки');
assert.deepEqual(kafkaFollowups.map(e=>e.resource),[1,0,0]);
const kafkaDetonations=events(kafkaBattle,'Подрыв DoT');
assert.deepEqual(kafkaDetonations.filter(e=>e.time===kafkaSkill.time).map(e=>e.damage),[2175,1450,1450]);
assert.equal(kafkaDetonations.find(e=>e.action===kafkaFollowups[0].action).damage,2320);

const huohuoStart=fight(huohuoId,{novaflare:true,speed:1},{energyPercent:79});
assert.equal(events(huohuoStart,'Хохо · Жертвенность жизни')[0].energy,140);
assert.equal(events(huohuoStart,'Хохо · энергия и ATK команды')[0].time,0);
const huohuoSave=fight(huohuoId,{novaflare:true,speed:1,hp:100,def:0,eidolon:2},boss);
assert.equal(events(huohuoSave,'Хохо E2 · спасение от смертельного удара').length,2);

const seeleScene={...boss,enemyHP:5200,cycles:2};
const seeleStats={novaflare:true,speed:140};
const seeleNova=fight(seeleId,seeleStats,seeleScene);
const firstSeeleSkill=events(seeleNova,'Навык Зеле')[0];
const automatic=events(seeleNova,'Зеле · автоматический навык')[0];
assert.equal(automatic.time,firstSeeleSkill.time);
assert.equal(automatic.sp,firstSeeleSkill.sp);
assert.equal(automatic.energy,firstSeeleSkill.energy);
const resurgence=events(seeleNova,'Зеле · Повторное появление')[0];
assert.equal(resurgence.time,automatic.time);
assert.ok(events(seeleNova,'Навык Зеле').some(e=>e!==firstSeeleSkill&&e.time===resurgence.time));
assert.equal(events(fight(seeleId,seeleStats),'Зеле · автоматический навык').length,0);
const seeleE6=fight(seeleId,{...seeleStats,eidolon:6},{...boss,energyPercent:100});
const flurry=events(seeleE6,'Зеле E6 · Вихрь бабочек')[0];
assert.equal(flurry.damage,events(seeleE6,'Ульта Зеле')[0].damage*.3);

const weltScene={energyPercent:75,toughness:150};
const weltStats={novaflare:true,effectHit:.8};
const weltNova=fight(weltId,weltStats,weltScene);
assert.equal(HSR_OPT.level80TraceProfile(weltId,D).effectHit,.28);
assert.ok(Math.abs(weltNova.initialStats[weltId].atk-(1000+.8*T.defaults(weltId,D).baseAtk))<1e-9);
assert.equal(events(weltNova,'Вельт · Невесомость')[0].time,0);
const weltBounces=events(weltNova,'Навык Вельта · попадание');
assert.equal(weltBounces.length,5);
assert.equal(weltBounces[4].toughness[0],80);
assert.equal(events(weltNova,'Вельт · Суждение').length,1);
assert.equal(events(weltNova,'Вельт E1 · Невесомость').length,0);
assert.equal(events(fight(weltId,{...weltStats,eidolon:1},weltScene),'Вельт E1 · Невесомость').length,1);

console.log('Kit audit fixtures verified: 93 canonical combat forms, Trailblazer aliases and Novaflare regressions.');
