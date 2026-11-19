/* Explicit equipment rules. Unknown 4-piece/planar effects fail closed. */
(function installEquipment(root){
  const cavern4=['101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119','120','121','122','123','124','125','127','126','128','129','130','131','132','133','134'];
  const planar=['301','302','303','304','305','306','307','308','309','310','311','312','313','314','315','316','317','318','319','320','321','322','323','324','325','326','327','328','329','330'];
  const supportsFour=id=>cavern4.includes(id);
  const dukeHitCoverage=new Set(['1005','1205','1112','1209','1314','1221','1222','1403','1406','1015','1223','1414']);
  const approximateDuke=(pack,actorId)=>counts(pack)['115']===4&&dukeHitCoverage.has(actorId);
  const cones=['20000','20002','20005','20006','20009','21001','21003','21008','21022','21029','22009','23001','23024','23065','24001','24003'];
  function coneProfile(characterId, reference, cone, ratios, data){
    const character=data.characters[characterId];
    if((!cone.baseOnly&&!cones.includes(cone.id))||data.light_cones[cone.id]?.path!==character.path||
       !Number.isInteger(cone.rank)||cone.rank<1||cone.rank>5)throw Error('Выбери поддержанный конус Пути персонажа и наложение S1–S5.');
    const profile={...reference};
    if(!cone.baseOnly)profile.cone={...cone};
    const characterBase=data.character_promotions[characterId].values[6];
    const coneBase=data.light_cone_promotions[cone.id].values[6];
    const properties=Object.fromEntries(data.light_cone_ranks[cone.id].properties[cone.rank-1].map(p=>[p.type,p.value]));
    for(const [stat,base,property] of [['hp','baseHP','HPAddedRatio'],['atk','baseAtk','AttackAddedRatio'],['def','baseDef','DefenceAddedRatio']]){
      const expected=characterBase[stat].base+79*characterBase[stat].step;
      if(Math.abs(reference[base]-expected)>.001)throw Error('Для сравнения конусов укажи базовые HP, ATK и DEF героя ур. 80 без конуса.');
      const ratio=ratios?.[stat]??0;
      if(!Number.isFinite(ratio)||ratio<0||ratio>10)throw Error('Процентные бонусы HP, ATK и DEF должны быть от 0 до 1000%.');
      const added=coneBase[stat].base+79*coneBase[stat].step;
      profile[base]=expected+added;
      profile[stat]+=added*(1+ratio)+profile[base]*(properties[property]||0);
    }
    const speedRatio=ratios?.speed??0;
    const addedBaseSpeed=properties.BaseSpeed||0;
    if(!Number.isFinite(speedRatio)||speedRatio<0||speedRatio>10)throw Error('Процентный бонус скорости должен быть от 0 до 1000%.');
    profile.baseSpeed=(reference.baseSpeed??(characterBase.spd.base+79*characterBase.spd.step))+addedBaseSpeed;
    profile.speed+=addedBaseSpeed*(1+speedRatio)+profile.baseSpeed*(properties.SpeedAddedRatio||0);
    for(const [stat,property] of [
      ['crit','CriticalChanceBase'],['critDamage','CriticalDamageBase'],
      ['effectHit','StatusProbabilityBase'],['effectRes','StatusResistanceBase'],
      ['breakEffect','BreakDamageAddedRatioBase'],['damageBonus','AllDamageTypeAddedRatio'],
      ['healingBonus','HealRatioBase'],['healingTaken','HealTakenRatio'],
      ['energyRegen','SPRatioBase'],['elation','ElationDamageAddedRatioBase']
    ])if(properties[property])profile[stat]=(profile[stat]||0)+properties[property];
    return profile;
  }
  function counts(pack){const result={};if(!pack)return result;for(const id of [...pack.cavern,...(pack.planars||[pack.planar,pack.planar])])result[id]=(result[id]||0)+1;return result;}
  function validate(pack,data){if(!pack)return;
    if(pack.partial===true&&!pack.planars){
      if(!Array.isArray(pack.cavern)||pack.cavern.length!==4||pack.cavern.some(id=>!/^1\d\d$/.test(id)||!data.relic_sets[id])||
         !/^3\d\d$/.test(pack.planar)||!data.relic_sets[pack.planar]||Object.values(counts(pack)).some(count=>count!==2&&count!==4))throw Error('Некорректное сочетание наборов.');
      return;
    }
    if(pack.planars!==undefined){
      if(!Array.isArray(pack.cavern)||pack.cavern.length!==4||pack.cavern.some(id=>!/^1\d\d$/.test(id)||!data.relic_sets[id])||!Array.isArray(pack.planars)||pack.planars.length!==2||pack.planars.some(id=>!/^3\d\d$/.test(id)||!data.relic_sets[id]))throw Error('Некорректные наборы шести предметов.');
      for(const [id,n] of Object.entries(counts(pack))){if(n>=2&&/^3/.test(id)&&!planar.includes(id))throw Error('Эффект этих планарок пока не моделируется.');if(n===4&&!cavern4.includes(id))throw Error('Четыре предмета этого набора пока не моделируются.');}return;
    }
    if(!Array.isArray(pack.cavern)||pack.cavern.length!==4||!planar.includes(pack.planar))throw Error('Некорректная или неподдержанная комбинация наборов.');for(const [id,n] of Object.entries(counts(pack))){if(!data.relic_sets[id])throw Error('Неизвестный набор '+id);if(id===pack.planar)continue;if(!/^1\d\d$/.test(id)||!([2,4].includes(n)))throw Error('Пещерные наборы: 4 предмета либо 2+2.');if(n===4&&!cavern4.includes(id))throw Error('Четыре предмета этого набора пока не моделируются.');}}
  const has=(actor,id,n=2)=>(actor.eq?.counts[id]||0)>=n;
  const active=(actor,key)=>(actor.eq?.timed[key]?.expires??-1)>=(actor.turn||0);
  function timed(actor,key,values,turns){actor.eq.timed[key]={...values,expires:actor.turn+turns};}
  function init(actor,data,targets){validate(actor.s.equipment,data);const c=counts(actor.s.equipment),p={};
    if(actor.s.equipment?.partial){
      for(const [id,n] of Object.entries(c))if(n===4&&!supportsFour(id))c[id]=2;
      if(!planar.includes(actor.s.equipment.planar))delete c[actor.s.equipment.planar];
    }
    for(const [id,n] of Object.entries(c)){if(n<2)continue;if(n===4&&!supportsFour(id))throw Error('Бонус четырёх предметов этого набора пока не моделируется.');const set=data.relic_sets[id];for(const bonus of set.properties[0]||[])p[bonus.type]=(p[bonus.type]||0)+bonus.value;if(n>=4)for(const bonus of set.properties[1]||[])p[bonus.type]=(p[bonus.type]||0)+bonus.value;}
    actor.eq={counts:c,p,timed:{},attacks:0,duran:0,duke:0,assist:0,longevous:0,firstAttack:true,skillReady:false,guide:hasCounts(c,'131',4)?1:0};
    const cone=actor.s.cone;
    if(cone){
      if(!cones.includes(cone.id)||data.light_cones[cone.id]?.path!==data.characters[actor.id].path||
         !Number.isInteger(cone.rank)||cone.rank<1||cone.rank>5)throw Error('Некорректный конус в боевом профиле.');
      actor.eq.cone={id:cone.id,params:data.light_cone_ranks[cone.id].params[cone.rank-1]};
      const {params}=actor.eq.cone;
      if(cone.id==='20000')timed(actor,'arrows',{crit:params[0]},params[1]);
      if(cone.id==='21003'&&targets<=2)p.CriticalChanceBase=(p.CriticalChanceBase||0)+params[1];
    }
  }
  function hasCounts(c,id,n){return (c[id]||0)>=n;}
  function modifiers(actor,actors,data,allyCount=actors.length,forMemo=false){
    const p=actor.eq?.p||{},r={atk:p.AttackAddedRatio||0,hp:p.HPAddedRatio||0,def:p.DefenceAddedRatio||0,speedPct:p.SpeedAddedRatio||0,speed:0,crit:p.CriticalChanceBase||0,critDamage:p.CriticalDamageBase||0,damage:p.AllDamageTypeAddedRatio||0,energyRegen:p.SPRatioBase||0,effectHit:p.StatusProbabilityBase||0,effectRes:p.StatusResistanceBase||0};
    if(actors.some(a=>a.id==='1106'))r.effectHit+=.1;
    if(actor.eq?.cone?.id==='22009'){
      const [perCharacter,aeonBonus]=actor.eq.cone.params;
      r.critDamage+=perCharacter*actors.filter(a=>data.characters[a.id].path==='Elation').length;
      if(actors.some(a=>a.id==='1511'&&!a.defeated&&!a.departed))r.critDamage+=aeonBonus;
    }
    for(const owner of actors)if(owner.eq?.cone?.id==='20005')
      r.chorus=Math.max(r.chorus||0,owner.eq.cone.params[0]);
    r.atk+=r.chorus||0;
    if(actor.avenShield?.expires>=actor.turn)r.effectRes+=.5;
    for(const value of Object.values(actor.eq?.timed||{}))if(value.expires>=actor.turn)for(const [key,amount] of Object.entries(value))if(key!=='expires'&&!(forMemo&&value===actor.eq.timed.memoryCrit))r[key]=(r[key]||0)+amount;
    if(has(actor,'123',4)&&actor.memoryActive)r.speedPct+=.06;if(has(actor,'127',4)&&actor.eq.saver)r.hp+=.24;
    if(has(actor,'303')||has(actor,'304')){
      const effectHit=(actor.s.effectHit||0)+r.effectHit+
        actor.buffs.reduce((sum,buff)=>sum+(buff.expires>=actor.turn?buff.values.effectHit||0:0),0);
      if(has(actor,'303'))r.atk+=Math.min(.25,effectHit*.25);
      if(has(actor,'304')&&effectHit>=.5)r.def+=.15;
    }
    if(has(actor,'124',4)&&actor.eq.startSpeed!==undefined)r.crit+=actor.eq.startSpeed<95?.32:actor.eq.startSpeed<110?.2:0;
    if(has(actor,'130',4)&&actor.eq.startSpeed!==undefined)r.crit+=actor.eq.startSpeed>=160?.18:actor.eq.startSpeed>=120?.1:0;
    if(has(actor,'314')&&actors.some(a=>a!==actor&&data.characters[a.id].path===data.characters[actor.id].path))r.crit+=.12;
    if(!forMemo&&has(actor,'318')&&(['1204','1112'].includes(actor.id)||(actor.id==='1222'&&actor.fuyuanActive)||(actor.id==='1414'&&actor.dragonActive)||actor.memoryActive))r.critDamage+=.32;
    if(has(actor,'321'))r.damage+=Math.min(3,Math.max(0,4-allyCount))*.12+Math.min(4,Math.max(0,allyCount-4))*.09;
    if(has(actor,'328'))r.damage+=Math.min(.32,Math.max(0,(data.characters[actor.id].max_sp||0)-200)*.002);
    if(active(actor,'pioneer'))r.crit+=.04;
    if(has(actor,'315')&&actor.eq.duran>=5)r.critDamage+=.25;
    if(has(actor,'327')&&actor.eq.trailblazePair)r.critDamage+=.32;
    if(has(actor,'325'))r.critDamage+=actor.eq.punklordeCrit||0;
    if(has(actor,'313'))r.critDamage+=(actor.eq.kills||0)*.04;
    const shields=[actor.shield,actor.avenShield,actor.marchShield,actor.trailShield,actor.dragonShield,actor.luochaShield];
    if(shields.some(shield=>shield?.amount>0&&shield.expires>=actor.turn&&
      actors.some(owner=>owner.id===shield.source&&has(owner,'128',4))))r.critDamage+=.15;
    if(actors.some(owner=>owner.eq?.cityVictory))r.critDamage+=.12;
    if(actors.some(owner=>!owner.defeated&&owner.memoryActive&&has(owner,'323')))r.speedPct+=.08;
    if(has(actor,'115',4)&&active(actor,'duke'))r.atk+=actor.eq.duke*.06;
    if(actors.some(owner=>has(owner,'125',4)&&active(owner,'healerRain')))r.critDamage+=.15;for(const owner of actors){if(has(owner,'127',4)&&owner.eq.saver)r.damage+=.15;
      if(has(owner,'312')&&!owner.defeated&&owner!==actor&&data.characters[owner.id].element===data.characters[actor.id].element)r.damage+=.1;
      if(has(owner,'317')&&actors[0]===actor&&owner!==actors[0])r.atk+=.12;
    }
    return r;
  }
  function thresholdModifiers(actor,actors,statsFor){
    const station=has(actor,'301')&&statsFor(actor).speed>=120?.12:0;
    let atk=station,critDamage=0;
    for(const owner of actors){
      if(owner.defeated)continue;
      if(has(owner,'302')&&statsFor(owner).speed>=120)atk+=.08;
      if(has(owner,'310')&&statsFor(owner).effectRes>=.3-1e-9)critDamage+=.1;
    }
    return {atk,critDamage};
  }
  function conditional(actor,stats,forMemo=false){const r={atk:0,crit:0,critDamage:0,damage:0};if(!forMemo&&has(actor,'311'))r.damage+=stats.speed>=160?.18:stats.speed>=135?.12:0;if(!forMemo&&has(actor,'319')&&stats.hp>=5000)r.critDamage+=.28;if(!forMemo&&has(actor,'305')&&actor.eq.firstAttack&&actor.eq.startCritDamage>=1.2)r.crit+=.6;return r;}
  function damage(actor,stats,options,context){
    const {kind,followup,ultimate,dot}=options,n=context.debuffs||0,r={damage:0,crit:0,critDamage:0};
    const cone=actor.eq?.cone;
    if(cone){
      const p=cone.params;
      if(cone.id==='20002'&&(kind==='basic'||kind==='skill'))r.damage+=p[0];
      if(cone.id==='20006'&&ultimate)r.damage+=p[0];
      if(cone.id==='20009')r.damage+=p[1]; // Training targets stay at full HP.
      if(cone.id==='21001')r.damage+=Math.min(n,p[1])*p[0];
      if(cone.id==='21008'&&dot)r.damage+=p[1];
      if(cone.id==='21022'&&context.shockOrWind)r.damage+=p[1];
      if(cone.id==='24003'&&dot&&active(actor,'solitaryHealing'))r.damage+=p[1];
      if(cone.id==='23024'&&context.mirage)r.damage+=p[1]+(ultimate?p[2]:0);
      if(cone.id==='23001'){
        const stacks=Math.max(0,Math.min(p[4],Math.floor((stats.speed-100+1e-9)/p[1])));
        if(kind==='basic'||kind==='skill')r.damage+=stacks*p[2];
        if(ultimate)r.critDamage+=stacks*p[3];
      }
    }
    r.damage+=actor.eq?.p[`${options.element||context.element}AddedRatio`]||0;
    if(has(actor,'102',4)&&kind==='basic')r.damage+=.1;
    if(has(actor,'107',4)){if(kind==='skill')r.damage+=.12;if(actor.eq.fireReady&&(options.element||context.element)==='Fire')r.damage+=.12;}
    if(has(actor,'112',4)){if(n)r.crit+=.1;if(context.imprisoned)r.critDamage+=.2;}
    if(has(actor,'115')&&followup)r.damage+=.2;
    if(has(actor,'117')){if(n)r.damage+=.12;if(has(actor,'117',4)){const doubled=active(actor,'pioneer');if(n>=2)r.critDamage+=(n>=3?.12:.08)*(doubled?2:1);}}
    if(has(actor,'120',4)&&ultimate&&active(actor,'valorous'))r.damage+=.36;
    if(has(actor,'122',4)){if(kind==='skill'||ultimate)r.damage+=.2;if(kind==='skill'&&actor.eq.scholarActive)r.damage+=.25;}
    if(has(actor,'131',4)&&(kind==='skill'||ultimate))r.damage+=actor.eq.guide*.18;
    if(has(actor,'132',4)&&context.defenseReduced)r.critDamage+=.28;
    if(has(actor,'134',4)&&kind==='basic')r.damage+=.36;
    if(has(actor,'306')&&stats.crit>=.5&&(ultimate||followup))r.damage+=.15;
    if(has(actor,'309')&&stats.crit>=.7&&(kind==='basic'||kind==='skill'))r.damage+=.2;
    if(has(actor,'315')&&followup)r.damage+=actor.eq.duran*.05;
    if(has(actor,'322')&&dot)r.damage+=stats.atk>=3600?.24:stats.atk>=2400?.12:0;
    return r;
  }
  function startTurn(actor){if(has(actor,'131',4))actor.eq.guide=Math.max(0,actor.eq.guide-1);}
  function beforeSkill(actor){if(has(actor,'109',4))timed(actor,'lightning',{atk:.2},1);if(has(actor,'122',4)){actor.eq.scholarActive=actor.eq.skillReady;actor.eq.skillReady=false;}if(has(actor,'131',4))actor.eq.guide=Math.min(3,actor.eq.guide+1);}
  function afterSkill(actor){if(has(actor,'127',4))actor.eq.saver=Boolean(actor.memoryActive);actor.eq.scholarActive=false;}
  function beforeBasic(actor){
    if(has(actor,'134',4)&&actor.eq.basicAttackKey!==actor.actionKey){
      actor.eq.basicAttackKey=actor.actionKey;
      timed(actor,'basicAtk',{atk:.2},2);
    }
  }
  function afterBasic(actor){if(has(actor,'127',4))actor.eq.saver=Boolean(actor.memoryActive);}
  function beforeUltimate(actor){if(has(actor,'126',4)&&actor.eq.assist>=2){actor.eq.assist=0;timed(actor,'captain',{atk:.48},1);}}
  function afterUltimate(actor){if(actor.eq?.cone?.id==='24003')timed(actor,'solitaryHealing',{},actor.eq.cone.params[2]-1);if(has(actor,'104',4))timed(actor,'ice',{critDamage:.25},2);if(has(actor,'107',4))actor.eq.fireReady=true;if(has(actor,'110',4))actor.distance=Math.max(0,actor.distance-2500);if(has(actor,'122',4))actor.eq.skillReady=true;if(has(actor,'131',4))actor.eq.guide=Math.max(0,actor.eq.guide-1);}
  function boxerStack(actor){if(has(actor,'105',4)){actor.eq.attacks=Math.min(5,actor.eq.attacks+1);timed(actor,'boxer',{atk:actor.eq.attacks*.05},Infinity);}}
  function receivedAttack(actor){boxerStack(actor);}
  function afterAttack(actor){boxerStack(actor);actor.eq.firstAttack=false;actor.eq.fireReady=false;}
  function enemyDefeated(actors){
    for(const actor of actors){
      if(has(actor,'313'))actor.eq.kills=Math.min(10,(actor.eq.kills||0)+1);
      if(has(actor,'326'))actor.eq.cityVictory=true;
    }
  }
  function followupStart(actor,actors=[]){
    // A grouped FUA may reach this hook both from its handler and from hit().
    // One action must reset Duke and credit Duran only once.
    if(actor.actionKey!==undefined){
      actor.eq.followupActions??=new Set();
      if(actor.eq.followupActions.has(actor.actionKey))return;
      actor.eq.followupActions.add(actor.actionKey);
    }
    if(has(actor,'115',4))actor.eq.duke=0;
    followupDamageStart(actor);
    for(const owner of actors)if(has(owner,'315'))owner.eq.duran=Math.min(5,owner.eq.duran+1);
  }
  function hitStart(actor,fireWeak){if(fireWeak&&has(actor,'316'))timed(actor,'forgeBE',{breakEffect:.4},1);}
  function hitEnd(actor,hits,followup){if(followup&&has(actor,'115',4)){actor.eq.duke=Math.min(8,actor.eq.duke+hits);timed(actor,'duke',{},3);}}
  function followupDamageStart(actor){if(has(actor,'326'))timed(actor,'city',{atk:.24},2);}
  function followupEnd(actor){if(has(actor,'120',4))timed(actor,'valorous',{},1);}
  function hpLoss(actor){if(has(actor,'113',4)){actor.eq.longevous=Math.min(2,active(actor,'longevous')?actor.eq.longevous+1:1);timed(actor,'longevous',{crit:actor.eq.longevous*.08},2);}}
  function debuff(actor){if(has(actor,'117',4))timed(actor,'pioneer',{},1);}
  function assist(actor,source,action=source.actionKey){
    if(actor===source||!has(actor,'126',4))return;
    if(action!==undefined){
      actor.eq.assistActions??=new Map();
      if(actor.eq.assistActions.get(source.id)===action)return;
      actor.eq.assistActions.set(source.id,action);
    }
    actor.eq.assist=Math.min(2,actor.eq.assist+1);
  }
  function skillPointSpent(actors,count){if(count===3)for(const actor of actors)if(has(actor,'324'))timed(actor,'livestream',{critDamage:.32},3);}
  function endTurn(actor){
    if(actor.seeleExtraPending||actor.seeleExtraActive||actor.extraTurnActive)return;
    for(const [key,value] of Object.entries(actor.eq.timed))if(value.expires<=actor.turn)delete actor.eq.timed[key];
  }
  function memoryAttack(actor){if(has(actor,'123',4))timed(actor,'memoryCrit',{critDamage:.3},2);}
  function healing(actor,target){if(has(actor,'125',4)&&target!==actor&&target._memo?.owner!==actor&&actor.eq.healTurn!==actor.turn){actor.eq.healTurn=actor.turn;timed(actor,'healerRain',{speedPct:.06},2);}}
  root.HSR_EQUIPMENT={rulesSource:()=>installEquipment.toString(),cavern4,planar,cones,coneProfile,supportsFour,approximateDuke,counts,validate,init,modifiers,thresholdModifiers,conditional,damage,startTurn,beforeBasic,beforeSkill,afterSkill,beforeUltimate,afterUltimate,afterBasic,afterAttack,followupStart,followupDamageStart,hitStart,hitEnd,followupEnd,receivedAttack,enemyDefeated,hpLoss,debuff,assist,skillPointSpent,endTurn,has,memoryAttack,healing};
})(typeof window==='undefined'?globalThis:window);
