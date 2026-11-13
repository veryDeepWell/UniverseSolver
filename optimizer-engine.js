/* Deterministic single-hit model. No build rankings or preferred relics. */
(function(root){
  const slots=['HEAD','HAND','BODY','FOOT','NECK','OBJECT'];
  const affixCache=new WeakMap(),itemCache=new WeakMap(),actionCache=new WeakMap();
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const supportedSets=new Set(['101','102','103','104','105','106','108','109','110','111','112','116','301','302','303','304','306','307','308','309','310','311','312']);
  const supportedCones=new Set(['20000','21003','23001','24001']);
  function representative(data,slot,setId){return Object.values(data.relics).find(r=>r.type===slot&&r.rarity===5&&(!setId||r.set_id===setId));}
  function mainAffixes(data,slot){if(!affixCache.has(data))affixCache.set(data,{});const cache=affixCache.get(data);if(!cache[slot]){const piece=representative(data,slot);cache[slot]=Object.values(data.relic_main_affixes[piece.main_affix_id].affixes);}return cache[slot];}
  function subAffixes(data){return Object.values(data.relic_sub_affixes['5'].affixes);}
  function validateItem(item,data){
    if(!item||typeof item!=='object')throw new Error('Некорректная реликвия.');
    if(typeof item.id!=='string'||!item.id||item.id.length>100)throw new Error('Некорректный ID реликвии.');
    if(typeof item.setId!=='string'||!data.relic_sets[item.setId]||!slots.includes(item.slot)||!representative(data,item.slot,item.setId))throw new Error('Набор не содержит выбранный слот 5★.');
    if(!Number.isInteger(item.level)||item.level<0||item.level>15)throw new Error('Уровень реликвии: целое число от 0 до 15.');
    if(!mainAffixes(data,item.slot).some(a=>a.property===item.main))throw new Error('Основная характеристика недоступна в этом слоте.');
    if(!Array.isArray(item.subs)||item.subs.length>4)throw new Error('Не более четырёх дополнительных характеристик.');
    const seen=new Set([item.main]);
    for(const sub of item.subs){const affix=subAffixes(data).find(a=>a.property===sub.type);if(!affix||seen.has(sub.type))throw new Error('Дополнительные характеристики не должны повторяться или совпадать с основной.');seen.add(sub.type);const tolerance=data.properties[sub.type]?.percent ? .00051 : .51;if(!Number.isFinite(sub.value)||sub.value<=0||sub.value>(affix.base+affix.step*affix.step_num)*(1+Math.floor(item.level/3))+tolerance)throw new Error('Значение дополнительной характеристики вне диапазона 5★ реликвии этого уровня.');}
    return {id:item.id,slot:item.slot,setId:item.setId,level:item.level,main:item.main,subs:item.subs.map(s=>({type:s.type,value:s.value})),demo:Boolean(item.demo)};
  }
  function properties(item,data){if(!itemCache.has(item)){const affix=mainAffixes(data,item.slot).find(a=>a.property===item.main);itemCache.set(item,[{type:item.main,value:affix.base+affix.step*item.level},...item.subs]);}return itemCache.get(item);}
  function actionProfiles(character,data){
    if(actionCache.has(character))return actionCache.get(character);
    // Only the first unenhanced Basic ATK whose entire damage expression is
    // one coefficient and one stat is eligible for automatic mapping.
    const basic=character.skills.map(id=>data.character_skills[id]).find(s=>s.type==='Normal');
    const result=[];
    if(basic&&basic.params.length&&/^Наносит .*#1\[i\]% от (силы атаки|макс\. НР|защиты)[^.]*\.$/.test(basic.desc)&&!/#(?:[2-9]|\d{2})\[/.test(basic.desc)){
      const scaling=basic.desc.includes('макс. НР')?'hp':basic.desc.includes('от защиты')?'def':'atk';
      result.push({id:basic.id,name:`${basic.name} · базовая атака`,skillId:basic.id,scaling,kind:'basic'});
    }
    if(character.id==='1102'){
      result.push({id:'110202',name:'Лезвие в ножнах · навык (исходный кит)',skillId:'110202',scaling:'atk',kind:'skill'});
      result.push({id:'110203',name:'Вихрь бабочек · сверхспособность (исходный кит)',skillId:'110203',scaling:'atk',kind:'ultimate'});
    }
    result.push({id:'custom',name:'Задать прямой удар вручную',scaling:'atk',kind:'skill'});
    for(const action of result)if(action.skillId){const trace=character.skill_trees.map(id=>data.character_skill_trees[id]).find(t=>t.level_up_skills.some(s=>s.id===action.skillId));action.maxLevel=trace?.max_level||(action.kind==='basic'?6:10);}
    actionCache.set(character,result);return result;
  }
  function validateConfig(config,data){
    const c=data.characters[config.characterId];if(!c)throw new Error('Выбери персонажа.');
    for(const [key,min,max] of [['level',1,80],['coneLevel',1,80],['rank',1,5],['skillLevel',1,15],['enemyLevel',1,100],['targets',1,5],['debuffs',0,5],['dots',0,3],['boxerStacks',0,5]])if(!Number.isInteger(config[key])||config[key]<min||config[key]>max)throw new Error(`Некорректное поле: ${key}.`);
    const cone=config.coneId?data.light_cones[config.coneId]:null;if(config.coneId&&(!cone||cone.path!==c.path))throw new Error('Конус должен соответствовать Пути персонажа.');
    const action=actionProfiles(c,data).find(a=>a.id===config.actionId);if(!action)throw new Error('Выбери поддерживаемое действие.');
    if(!['atk','hp','def'].includes(config.scaling)||!['basic','skill','ultimate','followup'].includes(config.kind))throw new Error('Некорректная модель удара.');
    if(action.skillId&&config.skillLevel>action.maxLevel)throw new Error('Уровень действия превышает доступный в этой модели E0.');
    for(const [key,min,max] of [['coefficient',0,100],['resistance',-1,0.9],['resPen',0,2],['defReduction',0,1],['vulnerability',0,10],['damageBonus',0,20],['atkBonus',0,20],['hpBonus',0,20],['defBonus',0,20],['critBonus',0,2],['critDamageBonus',0,10],['speedFlat',0,500],['minSpeed',0,1000],['minCrit',0,1],['boxerStacks',0,5]])if(!Number.isFinite(config[key])||config[key]<min||config[key]>max)throw new Error(`Некорректное поле: ${key}.`);
    return config;
  }
  function minPromotion(level){return Math.max(0,Math.min(6,Math.ceil((level-20)/10)));}
  function baseStats(record,level){return Object.fromEntries(Object.entries(record.values[minPromotion(level)]).map(([key,v])=>[key,v.base+v.step*(level-1)]));}
  function evaluate(items,config,data){
    const c=data.characters[config.characterId],action=actionProfiles(c,data).find(a=>a.id===config.actionId),kind=action.id==='custom'?config.kind:action.kind,scaling=action.id==='custom'?config.scaling:action.scaling;
    const base=baseStats(data.character_promotions[c.id],config.level);
    if(config.coneId){const coneBase=baseStats(data.light_cone_promotions[config.coneId],config.coneLevel);for(const key of ['hp','atk','def'])base[key]+=coneBase[key];}
    const p={},add=(type,value)=>{p[type]=(p[type]||0)+value;},addAll=list=>{for(const property of list||[])add(property.type,property.value);};
    for(const item of items)addAll(properties(item,data));
    if(config.traces)for(const id of c.skill_trees.filter(id=>id.startsWith(c.id))){const trace=data.character_skill_trees[id];for(const level of trace.levels||[])if(level.promotion<=minPromotion(config.level)&&level.level<=config.level)addAll(level.properties);}
    const counts={};for(const item of items)counts[item.setId]=(counts[item.setId]||0)+1;
    for(const [id,count] of Object.entries(counts)){if(count>=2)addAll(data.relic_sets[id].properties[0]);if(count>=4)addAll(data.relic_sets[id].properties[1]);}
    const cone=config.coneId?data.light_cone_ranks[config.coneId]:null,cp=cone?.params[config.rank-1]||[];if(cone)addAll(cone.properties[config.rank-1]);
    add('AttackAddedRatio',config.atkBonus);add('HPAddedRatio',config.hpBonus);add('DefenceAddedRatio',config.defBonus);add('CriticalChanceBase',config.critBonus);add('CriticalDamageBase',config.critDamageBonus);add('SpeedDelta',config.speedFlat);
    const has=(id,n=2)=>(counts[id]||0)>=n;
    if(has('105',4))add('AttackAddedRatio',.05*config.boxerStacks);
    if(has('109',4)&&config.afterSkill)add('AttackAddedRatio',.2);
    if(has('104',4)&&config.afterUltimate)add('CriticalDamageBase',.25);
    if(has('112',4)){if(config.debuffs>0)add('CriticalChanceBase',.1);if(config.imprisoned)add('CriticalDamageBase',.2);}
    if(config.coneId==='20000'&&config.opening)add('CriticalChanceBase',cp[0]);
    if(config.coneId==='21003'&&config.targets<=2)add('CriticalChanceBase',cp[1]);
    if(config.coneId==='24001'){if(config.lowHp)add('CriticalChanceBase',cp[2]);if(config.afterKill)add('AttackAddedRatio',cp[3]);}
    // In this first model only Seele's original E0 major combat modifiers are automated.
    const seele=c.id==='1102'&&action.id!=='custom';
    if(seele&&(config.afterSkill||kind==='skill'))add('SpeedAddedRatio',.25);
    let damageBonus=config.damageBonus,defIgnore=config.defReduction,resPen=config.resPen,conditionalCritDamage=0;
    if(seele&&(config.resurgence||kind==='ultimate')){damageBonus+=data.character_skills['110204'].params[9][0];if(config.traces&&minPromotion(config.level)>=data.character_skill_trees['1102102'].levels[0].promotion)resPen+=.2;}
    const totals=()=>({hp:base.hp*(1+(p.HPAddedRatio||0))+(p.HPDelta||0),atk:base.atk*(1+(p.AttackAddedRatio||0))+(p.AttackDelta||0),def:base.def*(1+(p.DefenceAddedRatio||0))+(p.DefenceDelta||0),spd:base.spd*(1+(p.SpeedAddedRatio||0))+(p.SpeedDelta||0),crit:base.crit_rate+(p.CriticalChanceBase||0),critDmg:base.crit_dmg+(p.CriticalDamageBase||0),breakEffect:p.BreakDamageAddedRatioBase||0});
    let stats=totals();
    if(has('301')&&stats.spd>=120)add('AttackAddedRatio',.12);
    if(has('302')&&stats.spd>=120)add('AttackAddedRatio',.08);
    if(has('303'))add('AttackAddedRatio',Math.min(.25,(p.StatusProbabilityBase||0)*.25));
    if(has('304')&&(p.StatusProbabilityBase||0)>=.5)add('DefenceAddedRatio',.15);
    if(has('307')&&stats.spd>=145)add('BreakDamageAddedRatioBase',.2);
    if(has('310')&&(p.StatusResistanceBase||0)>=.3)add('CriticalDamageBase',.1);
    if(has('311'))damageBonus+=stats.spd>=160?.18:stats.spd>=135?.12:0;
    stats=totals();
    if(has('102',4)&&kind==='basic')damageBonus+=.1;
    if(has('108',4))defIgnore+=config.elementWeakness?.2:.1;
    if(has('116',4))defIgnore+=.06*Math.min(3,config.dots||0);
    if(has('306')&&stats.crit>=.5&&['ultimate','followup'].includes(kind))damageBonus+=.15;
    if(has('309')&&stats.crit>=.7&&['basic','skill'].includes(kind))damageBonus+=.2;
    if(config.coneId==='23001'){const stacks=clamp(Math.floor((stats.spd-100+1e-9)/cp[1]),0,cp[4]);if(['basic','skill'].includes(kind))damageBonus+=stacks*cp[2];if(kind==='ultimate')conditionalCritDamage+=stacks*cp[3];}
    damageBonus+=(p[`${c.element}AddedRatio`]||0)+(p.AllDamageTypeAddedRatio||0);
    const coefficient=action.skillId?data.character_skills[action.skillId].params[config.skillLevel-1][0]:config.coefficient;
    const critChance=clamp(stats.crit,0,1),critDamage=Math.max(0,stats.critDmg+conditionalCritDamage),critMultiplier=config.canCrit?1+critChance*critDamage:1;
    const defMultiplier=(config.level+20)/((config.enemyLevel+20)*Math.max(0,1-defIgnore)+config.level+20),resMultiplier=1-clamp(config.resistance-resPen,-1,.9),toughness=config.broken?1:.9;
    const factors={base:stats[scaling]*coefficient,damage:1+damageBonus,crit:critMultiplier,def:defMultiplier,res:resMultiplier,vulnerability:1+config.vulnerability,toughness};
    const score=Object.values(factors).reduce((a,b)=>a*b,1);
    return {score,stats,factors,items:items.map(i=>i.id),sets:counts,feasible:stats.spd+1e-8>=config.minSpeed&&critChance+1e-8>=config.minCrit};
  }
  function limitations(items,config,data){
    const warnings=[];
    if(config.characterId!=='1102'||config.actionId==='custom')warnings.push('Особые пассивные эффекты, эйдолоны и состояния персонажа автоматически не применяются. Задай их через дополнительные бонусы, если они выражаются этой моделью.');
    else warnings.push('Зеле: исходный кит E0, талант ур. 10. Автоматически учитываются усиленное состояние и его пробивание сопротивления при открытых следах. Новое усиление кита и эйдолоны не моделируются.');
    if(config.coneId&&!supportedCones.has(config.coneId))warnings.push(`«${data.light_cones[config.coneId].name}»: учтены базовые статы и постоянные бонусы из базы; остальные эффекты конуса нужно задать вручную.`);
    for(const id of new Set(items.map(i=>i.setId)))if(!supportedSets.has(id))warnings.push(`«${data.relic_sets[id].name}»: учтены постоянные бонусы характеристик из базы. Условные эффекты не реализованы; результат для этого набора частичный.`);
    warnings.push('Цель — один прямой удар по основной цели. Ротация, энергия, дополнительные атаки, периодический урон, пробитие и сверхпробитие здесь не рассчитываются.');
    return warnings;
  }
  function createSearch(inventory,config,data){
    validateConfig(config,data);const ids=new Set();const valid=inventory.map(i=>{const item=validateItem(i,data);if(ids.has(item.id))throw new Error('ID предметов повторяются.');ids.add(item.id);return item;});
    const pools=slots.map(slot=>valid.filter(i=>i.slot===slot));if(pools.some(p=>!p.length))throw new Error('Добавь хотя бы одну реликвию в каждый из шести слотов.');
    const total=pools.reduce((n,p)=>n*p.length,1);if(!Number.isSafeInteger(total))throw new Error('Слишком большой инвентарь для точного счётчика.');
    const indices=Array(6).fill(0),top=[];let checked=0,feasible=0,done=false;
    return {total,step(batch=500){for(let iteration=0;iteration<batch&&!done;iteration++){
      const items=pools.map((pool,i)=>pool[indices[i]]),result=evaluate(items,config,data);checked++;
      if(result.feasible){feasible++;if(top.length<10||result.score>top.at(-1).score){top.push(result);top.sort((a,b)=>b.score-a.score);if(top.length>10)top.pop();}}
      for(let i=5;i>=0;i--){indices[i]++;if(indices[i]<pools[i].length)break;indices[i]=0;if(i===0)done=true;}
    }return {total,checked,feasible,done,top};}};
  }
  function sheetWithoutSets(items,config,data,referenceRatios){
    validateConfig(config,data);items.forEach(item=>validateItem(item,data));const c=data.characters[config.characterId],base=baseStats(data.character_promotions[c.id],config.level),p={};
    const add=list=>{for(const prop of list||[])p[prop.type]=(p[prop.type]||0)+prop.value;};
    if(config.coneId){const values=baseStats(data.light_cone_promotions[config.coneId],config.coneLevel);for(const key of ['hp','atk','def'])base[key]+=values[key];add(data.light_cone_ranks[config.coneId].properties[config.rank-1]);}
    items.forEach(item=>add(properties(item,data)));
    if(config.traces)for(const id of c.skill_trees.filter(id=>id.startsWith(c.id)))for(const node of data.character_skill_trees[id].levels)if(node.promotion<=minPromotion(config.level)&&node.level<=config.level)add(node.properties);
    if(referenceRatios)Object.assign(referenceRatios,{hp:p.HPAddedRatio||0,atk:p.AttackAddedRatio||0,def:p.DefenceAddedRatio||0});
    return {hp:base.hp*(1+(p.HPAddedRatio||0))+(p.HPDelta||0),baseHP:base.hp,atk:base.atk*(1+(p.AttackAddedRatio||0))+(p.AttackDelta||0),baseAtk:base.atk,def:base.def*(1+(p.DefenceAddedRatio||0))+(p.DefenceDelta||0),baseDef:base.def,speed:base.spd*(1+(p.SpeedAddedRatio||0))+(p.SpeedDelta||0),baseSpeed:base.spd,crit:base.crit_rate+(p.CriticalChanceBase||0),critDamage:base.crit_dmg+(p.CriticalDamageBase||0),damageBonus:p.AllDamageTypeAddedRatio||0,elementBonus:p[c.element+'AddedRatio']||0,effectHit:p.StatusProbabilityBase||0,effectRes:p.StatusResistanceBase||0,breakEffect:p.BreakDamageAddedRatioBase||0,elation:p.ElationDamageAddedRatioBase||0,energyRegen:1+(p.SPRatioBase||0),policy:'auto'};
  }
  function level80Config(id){
    return {characterId:id,coneId:'',level:80,coneLevel:80,rank:1,actionId:'custom',
      skillLevel:10,scaling:'atk',kind:'skill',coefficient:1,enemyLevel:95,targets:1,
      debuffs:0,dots:0,resistance:0,resPen:0,defReduction:0,vulnerability:0,damageBonus:0,
      atkBonus:0,hpBonus:0,defBonus:0,critBonus:0,critDamageBonus:0,speedFlat:0,minSpeed:0,
      minCrit:0,boxerStacks:0,traces:true};
  }
  function level80TraceProfile(id,data){
    return sheetWithoutSets([],level80Config(id),data);
  }
  function farmReference(id,archetype,data,includeCone=true,boots='speed',speedBudget){
    if(speedBudget!==undefined&&(!Number.isInteger(speedBudget)||speedBudget<0||speedBudget>12))
      throw Error('Бюджет скорости должен быть от 0 до 12 роллов.');
    const character=data.characters[id];
    const critBuild=['atk','hp','def'].includes(archetype);
    const scale={hp:'HPAddedRatio',def:'DefenceAddedRatio'}[archetype]||'AttackAddedRatio';
    const critSupport=['1101','1306','1313','1511'].includes(id);
    const attackSupport=['1202','1203','1309'].includes(id);
    const mains=['HPDelta','AttackDelta',
      critBuild?'CriticalChanceBase':critSupport?'CriticalDamageBase':archetype==='dot'?'StatusProbabilityBase':attackSupport?scale:'HPAddedRatio',
      (critBuild||speedBudget!==undefined)&&boots==='scaling'?scale:'SpeedDelta',
      critBuild?character.element+'AddedRatio':archetype==='dot'||attackSupport?scale:'HPAddedRatio',
      critBuild||archetype==='dot'?scale:archetype==='break'?'BreakDamageAddedRatioBase':id==='1511'?'HPAddedRatio':'SPRatioBase'];
    const priority=critBuild?['CriticalChanceBase','CriticalDamageBase',scale,'HPAddedRatio']:
      archetype==='break'?['BreakDamageAddedRatioBase','SpeedDelta',scale,'HPAddedRatio']:
      archetype==='dot'?['AttackAddedRatio','StatusProbabilityBase','SpeedDelta','HPAddedRatio']:
      [critSupport?'CriticalDamageBase':attackSupport?scale:'HPAddedRatio','SpeedDelta','DefenceAddedRatio','AttackAddedRatio'];
    const affixes=subAffixes(data);
    const speedRoll=affixes.find(affix=>affix.property==='SpeedDelta');
    const speedMain=mainAffixes(data,'FOOT').find(affix=>affix.property==='SpeedDelta');
    let speedSlots=critBuild&&boots==='speed'?Math.max(0,Math.ceil(
      (134-baseStats(data.character_promotions[id],80).spd-speedMain.base-15*speedMain.step)/
      (speedRoll.base+speedRoll.step)
    )):0;
    let remaining=speedBudget;
    const items=slots.map((slot,index)=>{
      const main=mains[index];
      const types=[...new Set([...priority,'HPAddedRatio','DefenceAddedRatio','StatusResistanceBase','HPDelta','DefenceDelta'])]
        .filter(type=>type!==main&&(speedBudget===undefined||type!=='SpeedDelta')).slice(0,4);
      if(speedBudget===undefined&&speedSlots>0&&main!=='SpeedDelta'){
        types[3]='SpeedDelta';
        speedSlots--;
      }
      const rolls=[3,3,1,1];
      if(speedBudget!==undefined){
        if(remaining>0&&main!=='SpeedDelta'){
          types.splice(3,1,'SpeedDelta');
          const count=Math.min(3,remaining);
          rolls[3]=count;
          rolls[1]-=count-1;
          remaining-=count;
        }
      }
      return {id:'farm-'+slot,slot,setId:representative(data,slot).set_id,level:15,main,
        subs:types.map((type,line)=>{
          const affix=affixes.find(a=>a.property===type);
          return {type,value:(affix.base+affix.step)*rolls[line]};
        })};
    });
    const ratios={};
    const config=level80Config(id);
    const profile=sheetWithoutSets(items,config,data,ratios);
    const referenceCone=includeCone&&Object.values(data.light_cones)
      .find(cone=>cone.path===character.path&&cone.rarity===4);
    if(referenceCone){
      const stats=baseStats(data.light_cone_promotions[referenceCone.id],80);
      for(const [stat,base] of [['hp','baseHP'],['atk','baseAtk'],['def','baseDef']]){
        profile[base]+=stats[stat];
        profile[stat]+=stats[stat]*(1+ratios[stat]);
      }
    }
    return {profile,ratios,items,config};
  }
  function* slotReplacements(primary,secondary=[]){
    for(const item of primary)yield [item];
    for(const item of secondary)yield [item];
    for(const first of primary)for(const second of secondary){
      if(first.slot!==second.slot)yield [first,second];
    }
  }
  root.HSR_OPT={slots,mainAffixes,subAffixes,validateItem,properties,actionProfiles,validateConfig,evaluate,limitations,createSearch,sheetWithoutSets,level80TraceProfile,farmReference,slotReplacements};
})(typeof window==='undefined'?globalThis:window);
