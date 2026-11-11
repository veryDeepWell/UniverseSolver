(function (root) {
  const data = root.HSR_DATA;
  const entry = root.HSR_SUPPLEMENTS.preview_characters.find(character => character.id === '1511');
  if (data.characters[entry.id]) return;

  // The planner uses level 80. The supplemental card shows the same snapshot.
  data.characters[entry.id] = {...entry, max_sp:8, skills:[], skill_trees:['1511101']};
  data.english_names[entry.id] = entry.englishName;
  data.character_promotions[entry.id] = {
    values:{6:Object.fromEntries(Object.entries(entry.combatStats).map(([key,base]) => [key,{base,step:0}]))}
  };
  data.character_skill_trees['1511101'] = {
    levels:[{promotion:6,level:80,properties:[
      {type:'SpeedDelta',value:5}, {type:'CriticalChanceBase',value:.12}, {type:'CriticalDamageBase',value:.373}
    ]}]
  };
})(typeof window === 'undefined' ? globalThis : window);
