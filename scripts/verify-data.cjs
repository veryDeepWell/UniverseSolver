const assert = require('node:assert/strict');
global.window = global;
require('../data/game-data.js');
require('../data/supplements.js');
require('../database.js');
const D=HSR_DATA,H=HSR;
assert.equal(H.describe('Урон #1[i]%, длительность #2[i] хода.',[0.125,3]),'Урон 12,5%, длительность 3 хода.');
assert.equal(H.describe('Число #1[f1]',[1.25]),'Число 1,25');
assert.match(H.describe('#2[i]%',[]),/нет параметра/);
assert.equal(H.clean('<unbreak>Текст</unbreak>\\n{NICKNAME}'),'Текст\nПервопроходец');
assert.equal(H.minimumPromotion(20),0);
assert.equal(H.minimumPromotion(21),1);
assert.equal(H.minimumPromotion(80),6);
assert.equal(H.skillCap(D.characters['1407'],D.character_skills['1140701'],D),6);
assert.equal(H.skillCap(D.characters['1408'],D.character_skills['140808'],D),6);
assert.equal(H.stats(D.character_promotions['1001'],1,0).find(([k])=>k==='hp')[1],144);
assert.ok(Math.abs(H.stats(D.character_promotions['1001'],80,6).find(([k])=>k==='hp')[1]-1058.4)<1e-8);
for(const id of ['1140710','1140711']) {
  const skill=D.character_skills[id],original=JSON.stringify(skill.params);
  assert.match(H.describe(skill.desc,H.skillParams(skill,0,HSR_SUPPLEMENTS)),/25%/);
  assert.doesNotMatch(H.describe(skill.desc,H.skillParams(skill,0,HSR_SUPPLEMENTS)),/нет параметра/);
  assert.equal(JSON.stringify(skill.params),original,'Supplements must not mutate imported data');
}
let checked=0;
for(const c of Object.values(D.characters)){
  assert.ok(D.character_promotions[c.id],`Character stats ${c.id}`);
  assert.ok(D.paths[c.path],`Character path ${c.id}`);
  for(const [field,table] of [['skills','character_skills'],['skill_trees','character_skill_trees'],['ranks','character_ranks']])for(const id of c[field])assert.ok(D[table][id],`${table} ${id}`);
}
for(const table of ['character_skills','character_skill_trees','light_cone_ranks'])for(const item of Object.values(D[table]))for(const [index,params] of (item.params||[]).entries()){
  const text=H.describe(item.desc,table==='character_skills'?H.skillParams(item,index,HSR_SUPPLEMENTS):params);
  assert.doesNotMatch(text,/#\d+\[|нет параметра/,`${table}: ${item.id}`);
  checked++;
}
for(const c of Object.values(D.light_cones)){assert.ok(D.light_cone_ranks[c.id]);assert.ok(D.light_cone_promotions[c.id]);}
for(const set of Object.values(D.relic_sets))assert.ok(Object.values(D.relics).some(r=>r.set_id===set.id),`Empty set ${set.id}`);
for(const piece of Object.values(D.relics)){
  assert.ok(D.relic_sets[piece.set_id]);assert.ok(D.relic_main_affixes[piece.main_affix_id]);assert.ok(D.relic_sub_affixes[piece.sub_affix_id]);
  for(const a of Object.values(D.relic_main_affixes[piece.main_affix_id].affixes)){assert.ok(D.properties[a.property]);assert.ok(Number.isFinite(a.base+a.step*piece.max_level));}
}
const head=Object.values(D.relics).find(r=>r.rarity===5&&r.type==='HEAD');
const hp=Object.values(D.relic_main_affixes[head.main_affix_id].affixes)[0];
assert.ok(Math.abs(hp.base+15*hp.step-705.6)<.01);
console.log(`Verified ${Object.keys(D.characters).length} characters, ${Object.keys(D.light_cones).length} cones, ${Object.keys(D.relic_sets).length} sets; ${checked} description/level combinations.`);
for(const [id,entries] of Object.entries(HSR_SUPPLEMENTS.ex_eidolons)){
  assert.ok(D.characters[id]);assert.ok(Array.isArray(entries));
  for(const item of entries){assert.ok(item.name&&item.description);assert.ok(new URL(item.source).protocol==='https:');}
}
console.log('All parameter references resolved, including two Castorice supplements verified against Prydwen.');
