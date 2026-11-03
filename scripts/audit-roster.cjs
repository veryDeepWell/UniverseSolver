/* Offline, reproducible comparison against the external lists manually reviewed
   on the fixture date. It does not claim to fetch a live roster on later runs. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');global.window=global;
require('../data/game-data.js');require('../equipment-effects.js');require('../team-engine.js');
const D=HSR_DATA,T=HSR_TEAM,F=require('./fixtures/roster-2026-11-03.json');
const entries=Object.entries(D.characters),tags=new Set(entries.map(([,c])=>c.tag.toLowerCase())),external=new Set(F.stationTags);
assert.equal(external.size,F.stationCount,'External fixture has duplicate tags');
const missingFromCatalog=F.stationTags.filter(tag=>!tags.has(tag)),extraInCatalog=entries.filter(([,c])=>!external.has(c.tag.toLowerCase())).map(([id])=>id),withoutBattleModel=entries.filter(([id])=>!T.models[id]).map(([id])=>id),unknownModels=Object.keys(T.models).filter(id=>!D.characters[id]),brokenReferences=[];
for(const [id,c] of entries){
 if(!D.character_promotions[id]?.values?.[6])brokenReferences.push(id+': level 80 stats');
 for(const key of c.skills)if(!D.character_skills[key])brokenReferences.push(id+': skill '+key);
 for(const key of c.skill_trees)if(!D.character_skill_trees[key])brokenReferences.push(id+': trace '+key);
 for(const key of c.ranks)if(!D.character_ranks[key])brokenReferences.push(id+': eidolon '+key);
 for(const key of ['icon','preview','portrait'])if(!c[key])brokenReferences.push(id+': '+key);
}
const mechanics=new Set(entries.map(([id])=>T.canonical(id))),report={checkedAgainstSourcesAt:F.checkedAt,snapshot:D.meta,entries:entries.length,mechanicsWithoutGenderDuplicates:mechanics.size,genderAliases:T.aliases,externalStationEntries:F.stationCount,externalPrydwenEntries:F.prydwenCount,prydwenPreviewsOutsideSnapshot:F.prydwenPreviewsOutsideSnapshot,missingFromCatalog,extraInCatalog,withoutBattleModel,unknownModels,brokenReferences,rows:entries.map(([id,c])=>({id,name:c.name,tag:c.tag,path:c.path,element:c.element,rarity:c.rarity,mechanic:T.canonical(id),model:!!T.models[id],skills:c.skills.length,traces:c.skill_trees.length,eidolons:c.ranks.length}))};
fs.writeFileSync(path.join(__dirname,'../artifacts/roster-audit.json'),JSON.stringify(report,null,2)+'\n');
for(const [label,list] of Object.entries({missingFromCatalog,extraInCatalog,withoutBattleModel,unknownModels,brokenReferences}))assert.deepEqual(list,[],label);
assert.equal(entries.length,F.stationCount);assert.equal(mechanics.size,F.prydwenPlayableFormsWithoutGenderDuplicates);assert.equal(mechanics.size+F.prydwenPreviewsOutsideSnapshot.length,F.prydwenCount);
console.log(`Roster audit (${F.checkedAt} source snapshot): ${entries.length}/${F.stationCount} catalog and battle entries; ${mechanics.size} forms without gender duplicates; 0 missing, 0 extra, 0 broken kit/stat/icon references. Prydwen: ${F.prydwenCount} = ${mechanics.size} forms + ${F.prydwenPreviewsOutsideSnapshot.length} unimplemented preview pages. Report: artifacts/roster-audit.json`);
