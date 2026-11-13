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
    if(!T.compatible(ids))throw Error('Доступен один Путь Первопроходца и одна форма Март 7.');return ids;
  }
  function buildProfile(input,pack,cone,data){
    const profile={...input.profile};
    delete profile.equipment;
    delete profile.cone;
    if(pack)profile.equipment=pack;
    return cone?G.coneProfile(input.characterId,profile,cone,input.coneRatios,data):profile;
  }
  function battleArguments(input,pack,data,cone=null){
    const ids=validate(input,data),profiles={...input.contextProfiles,[input.characterId]:buildProfile(input,pack,cone,data)};
    const scenario={...input.scenario,allowPartial:true,focus:input.focus};
    if(input.stableRanking){
      const first=Math.min(scenario.cycles,Math.max(2,scenario.cycles-2));
      scenario.sampleCycles=Array.from({length:scenario.cycles-first+1},(_,i)=>first+i);
    }
    return {ids,profiles,scenario};
  }
  function run(input,pack,data,keepLog=false,cone=null){
    const {ids,profiles,scenario}=battleArguments(input,pack,data,cone);
    return keepLog
      ? T.simulate(ids,profiles,{...scenario,rollCrits:scenario.trials!==undefined||scenario.rollCrits},data,true)
      : T.evaluate(ids,profiles,scenario,data);
  }
  function createSearch(input,data){
    validate(input,data);
    const choices=packs(input.caverns,input.planars,input.mixed,data,input.characterId);
    if(!choices.length)throw Error('В выбранной области поиска нет поддержанных сочетаний.');
    const cones=input.cones?.length?input.cones:[null];
    for(const cone of cones)buildProfile(input,null,cone,data);
    const baseline=run(input,null,data),top=[],bestByCone={};
    const total=choices.length*cones.length;
    let checked=0;
    return {total,baseline,step(batch=3){
      for(let n=0;n<batch&&checked<total;n++){
        const pack=choices[Math.floor(checked/cones.length)];
        const cone=cones[checked%cones.length];
        const simulation=run(input,pack,data,false,cone);
        const checkpoints=simulation.checkpoints;
        const score=checkpoints?checkpoints.reduce((sum,sample)=>sum+sample.total*100/sample.av,0)/checkpoints.length:simulation.total;
        const result={pack,cone,score,checkpoints,encounter:simulation.encounter,trials:simulation.trials,total:simulation.total,per100AV:simulation.per100AV,
          initialStats:simulation.initialStats[input.characterId],breakdown:simulation.breakdown,
          damageByTarget:simulation.damageByTarget};
        top.push(result);
        top.sort((a,b)=>a.encounter?T.compareResults(a,b):b.score-a.score);
        if(top.length>10)top.pop();
        if(cone&&(!bestByCone[cone.id]||(result.encounter?T.compareResults(result,bestByCone[cone.id])<0:result.score>bestByCone[cone.id].score)))bestByCone[cone.id]=result;
        checked++;
      }
      return {total,checked,done:checked===total,baseline:baseline.total,top,bestByCone:Object.values(bestByCone)};
    }};
  }
  function createLineupSearch(order,baseline,options,scenario,data,ids=order){
    if(order.length!==ids.length||new Set(order).size!==ids.length||order.some(id=>!ids.includes(id)||!options[id]?.length))
      throw Error('Для каждого героя состава нужен хотя бы один вариант сборки.');
    const profiles={...baseline},chosen={},ranking=T.compareResults;
    const before=T.evaluate(ids,baseline,scenario,data);
    let actorIndex=0,optionIndex=0,checked=0,best=null,current=before;
    const total=order.reduce((sum,id)=>sum+options[id].length,0);
    return {step(batch=1){
      for(let i=0;i<batch&&checked<total;i++){
        const id=order[actorIndex],option=options[id][optionIndex++];
        const candidate={...profiles,[id]:option.profile};
        const result=T.evaluate(ids,candidate,scenario,data);
        if(ranking(result,current)<0&&(!best||ranking(result,best.result)<0))best={option,result};
        checked++;
        if(optionIndex===options[id].length){
          if(best){
            profiles[id]=best.option.profile;
            chosen[id]=best.option;
            current=best.result;
          }
          actorIndex++;
          optionIndex=0;
          best=null;
        }
      }
      return {total,checked,done:checked===total,before,after:current,profiles,chosen};
    }};
  }
  root.HSR_SETS={packs,validate,run,createSearch,buildProfile,battleArguments,createLineupSearch};
})(typeof window==='undefined'?globalThis:window);
