(function(root){
  const T=root.HSR_TEAM,G=root.HSR_EQUIPMENT;
  function packs(caverns,planars,mixed,data,characterId){
    if(!Array.isArray(caverns)||!Array.isArray(planars)||!caverns.length||!planars.length)throw Error('Выбери пещерные и планарные наборы.');
    if(new Set(caverns).size!==caverns.length||new Set(planars).size!==planars.length)throw Error('Наборы в списках не должны повторяться.');
    if(caverns.some(id=>!/^1\d\d$/.test(id)||!data.relic_sets[id])||planars.some(id=>!G.planar.includes(id)))throw Error('В список попал неподдержанный набор.');
    const patterns=caverns.filter(id=>G.supportsFour(id,characterId)).map(id=>[id,id,id,id]);
    if(mixed)for(let i=0;i<caverns.length;i++)for(let j=i+1;j<caverns.length;j++)patterns.push([caverns[i],caverns[i],caverns[j],caverns[j]]);
    const result=[];for(const cavern of patterns)for(const planar of planars)result.push({cavern,planar});return result;
  }
  function validate(input,data){
    if(!T.models[input.characterId])throw Error('Для этого персонажа ещё нет модели боя.');
    T.validateStats(input.profile);T.validateScenario(input.scenario);
    for(const key of ['baseHP','baseDef'])if(!Number.isFinite(input.profile[key])||input.profile[key]<=0)throw Error('Введи базовые HP и DEF.');
    for(const key of ['elementBonus','effectRes'])if(!Number.isFinite(input.profile[key])||input.profile[key]<0||input.profile[key]>20)throw Error('Некорректный бонус: '+key);
    if(!Number.isInteger(input.scenario.externalDebuffs)||input.scenario.externalDebuffs<0||input.scenario.externalDebuffs>5)throw Error('Внешних ослаблений: от 0 до 5.');
    if(!Array.isArray(input.context)||input.context.length>3||new Set(input.context).size!==input.context.length||input.context.includes(input.characterId)||input.context.some(id=>!T.models[id]))throw Error('Некорректный состав фиксированных союзников.');
    if(!Number.isInteger(input.position)||input.position<0||input.position>input.context.length)throw Error('Некорректная позиция персонажа.');
    const ids=[...input.context];ids.splice(input.position,0,input.characterId);if(!ids.includes(input.focus))throw Error('Выбери получателя адресных бафов.');
    return ids;
  }
  function run(input,pack,data,keepLog=false){
    const ids=validate(input,data),profiles={...input.contextProfiles,[input.characterId]:{...input.profile}};
    delete profiles[input.characterId].equipment;if(pack)profiles[input.characterId].equipment=pack;
    return T.simulate(ids,profiles,{...input.scenario,allowPartial:true,focus:input.focus},data,keepLog);
  }
  function createSearch(input,data){
    validate(input,data);const choices=packs(input.caverns,input.planars,input.mixed,data,input.characterId);if(!choices.length)throw Error('В выбранной области поиска нет поддержанных сочетаний.');
    const baseline=run(input,null,data),top=[];let checked=0;
    return {total:choices.length,baseline,step(batch=3){for(let n=0;n<batch&&checked<choices.length;n++){const pack=choices[checked++],simulation=run(input,pack,data),result={pack,total:simulation.total,per100AV:simulation.per100AV,initialStats:simulation.initialStats[input.characterId],breakdown:simulation.breakdown,damageByTarget:simulation.damageByTarget};top.push(result);top.sort((a,b)=>b.total-a.total);if(top.length>10)top.pop();}return {total:choices.length,checked,done:checked===choices.length,baseline:baseline.total,top};}};
  }
  root.HSR_SETS={packs,validate,run,createSearch};
})(typeof window==='undefined'?globalThis:window);
