/* Discrete-event training-dummy simulation. No team tier lists. */
(function(root){
  const G=root.HSR_EQUIPMENT;
  const models={
    '1004':{role:'dps',notes:'Исходный Вельт E0: три попадания навыка, Замедление, Заключение, задержка действия, уязвимость ульты, энергия и дополнительный урон таланта. Усиленный кит не используется.'},
    '1302':{role:'dps',notes:'Аргенти E0: AoE, энергия за каждую поражённую цель, Апофеоз и шесть отскоков полной ульты. Авто ждёт 180 энергии; убийств и низкого HP у болванок нет.'},
    '1212':{role:'dps',notes:'Исходная Цзинлю E0: Сизигия, трансмиграция с продвижением и крит. шансом, бесплатный усиленный навык, расход HP союзников и временная ATK от поглощённого HP. Усиленный HP-кит не используется.'},
    '1303':{role:'support',notes:'Жуань Мэй E0: скорость союзников, урон навыка с масштабированием от эффекта пробития, зона RES PEN, энергия следа. Эффект пробития задаётся в статах; без стойкости урон пробития не возникает.'},
    '1309':{role:'support',notes:'Зарянка E0: бафы команды, начальное продвижение, Концерт с отдельным отсчётом SPD 90 и продвижением союзников, энергия за атаки и дополнительный физический урон с фиксированными критами.'},
    '1306':{role:'support',notes:'Исходная Искорка E0: лимит SP 7, восстановление 4 SP, три уровня таланта, Шифр, крит. урон и продвижение кора на 50%, квантовый след. Усиленный кит не используется.'},
    '1203':{role:'sustain',notes:'Лоча E0: лечение от ATK, автоматический навык без SP с перезарядкой, Цветок Бездны, поле лечения атакующего и остальных союзников, AoE-ульт. У болванок нет усилений для снятия.'},
    '1211':{role:'sustain',notes:'Байлу E0: лечение от HP, два случайных отскока с ослаблением, командная ульта и повышение максимального HP при избыточном лечении. Бодрость и воскрешение не срабатывают без атак и смертей.'},
    '1104':{role:'sustain',notes:'Гепард E0: ATK от DEF, щит команды, навык с Заморозкой, дополнительный урон и продвижение цели после разморозки. Авто использует базовые; навык можно включить политикой. Без входящих атак щит не расходуется.'},
    '1208':{role:'sustain',notes:'Фу Сюань E0: Матрица с HP и крит. шансом команды, HP-масштабирование базовой и ульты, лечение союзников и собственное восстановление HP. Расход HP союзником не перенаправляется Матрицей.'},
    '1002':{role:'dps',notes:'Дань Хэн E0: замедление от критических попаданий навыка, усиление ульты по замедленной цели, скорость следа и пробитие RES следующей атаки от умений союзников. Криты урона усредняются, срабатывания эффектов воспроизводятся по seed.'},
    '1109':{role:'dps',notes:'Хук E0: Горение, дополнительный урон и энергия таланта, усиленный взрывной навык после ульты, лечение и продвижение действия следов.'},
    '1210':{role:'dps',notes:'Гуйнайфэнь E0: Горение навыком и базовой, подрыв всех Горений ультой, Огненный поцелуй до трёх уровней, начальное продвижение. Авто: навык при отсутствии собственного Горения, иначе базовая.'},
    '1102':{role:'dps',notes:'Исходная Зеле E0: навык, усиление от ульты, скорость и пробивание сопротивления. Убийств на бесконечном HP нет.'},
    '1220':{role:'dps',notes:'Фэйсяо E0: заряды от атак команды, бонус-атаки, усиление навыка и ульта. Болванки считаются без стойкости.'},
    '1101':{role:'support',notes:'Броня E0: продвижение кора, баф урона, командная ульта, продвижение после базовой и основные следы.'},
    '1202':{role:'support',notes:'Тинъюнь E0: Благословение со снимком ATK на применении, дополнительный урон, энергия и баф урона ульты.'},
    '1106':{role:'support',notes:'Пела E0: базовые атаки, ульта, энергия таланта. Снижение DEF не усиливает урон по болванкам с нулевой DEF.'},
    '1009':{role:'support',notes:'Аста E0: пять отскоков навыка, Заряд, командная скорость, Горение и основные следы. Отскоки воспроизводятся по seed.'},
    '1103':{role:'dps',notes:'Сервал E0: взрывной навык, Шок, продление Шока ультой, дополнительный урон таланта и начальная энергия.'},
    '1013':{role:'dps',notes:'Герта E0: AoE-навык с бонусом по высокому HP и ульта. Порог HP не пересекается: бонус-атаки не запускаются.'},
    '1105':{role:'sustain',notes:'Наташа E0: базовые атаки и генерация SP, лечение навыком и ультой при потере HP союзниками, периодическое исцеление и следы.'},
    '1003':{role:'dps',notes:'Химеко E0: навык, AoE-ульт, Горение, крит. шанс при высоком HP. Без полоски стойкости заряды таланта не пополняются.'},
    '1005':{role:'dps',notes:'Исходная Кафка E0: отдельный Шок, подрыв DoT навыком и ультой, бонус-атака после базовых союзников.'},
    '1204':{role:'dps',notes:'Цзин Юань E0: Повелитель молний с собственной шкалой, скоростью и количеством ударов; навык и ульта AoE.'},
    '1305':{role:'dps',notes:'Рацио E0: собственное ослабление, шанс бонус-атаки от числа ослаблений, усиления следов и две активации метки ульты.'},
    '1205':{role:'dps',notes:'Исходный Блэйд E0: HP и ATK-масштабирование, расход и восстановление HP, усиленная базовая, накопление заряда, бонус-атака и ульта. Усиленная версия кита не моделируется.'}
  };
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function defaults(id,data){const v=data.character_promotions[id].values[6],get=key=>v[key].base+79*v[key].step;return {hp:get('hp'),atk:get('atk'),def:get('def'),baseHP:get('hp'),baseDef:get('def'),baseAtk:get('atk'),baseSpeed:get('spd'),speed:get('spd'),crit:get('crit_rate'),critDamage:get('crit_dmg'),damageBonus:0,elementBonus:0,effectHit:0,effectRes:0,breakEffect:0,energyRegen:1,policy:'auto'};}
  function validateStats(stats){
    if(stats.breakEffect!==undefined&&(!Number.isFinite(stats.breakEffect)||stats.breakEffect<0||stats.breakEffect>20))throw Error('Некорректный эффект пробития.');
    for(const [key,min,max] of [['hp',1,1000000],['atk',1,100000],['def',0,100000],['baseAtk',1,100000],['baseSpeed',1,500],['speed',1,1000],['crit',0,3],['critDamage',0,20],['damageBonus',0,20],['effectHit',0,10],['energyRegen',.1,10]])if(!Number.isFinite(stats[key])||stats[key]<min||stats[key]>max)throw Error(`Некорректная характеристика ${key}.`);
    if(!['auto','basic','skill'].includes(stats.policy))throw Error('Неизвестная политика действий.');return stats;
  }
  function validateScenario(s){for(const [key,min,max] of [['targets',1,5],['cycles',1,20],['initialSP',0,5],['energyPercent',0,100],['seed',1,2147483647]])if(!Number.isInteger(s[key])||s[key]<min||s[key]>max)throw Error(`Некорректное поле боя: ${key}.`);}
  function simulate(ids,profiles,scenario,data,keepLog=false){
    validateScenario(scenario);if((!scenario.allowPartial&&ids.length!==4)||ids.length<1||ids.length>4||new Set(ids).size!==ids.length)throw Error('В команде должны быть четыре разных персонажа.');
    for(const id of ids){if(!models[id])throw Error('Нет модели боя для '+(data.characters[id]?.name||id));validateStats(profiles[id]||defaults(id,data));}
    const dotKeys=['shock','kafkaShock','burn','himekoBurn','hookBurn','guiBurn'],burnKeys=['burn','himekoBurn','hookBurn','guiBurn'];
    const horizon=150+100*(scenario.cycles-1),events=[],damageByTarget=Array(scenario.targets).fill(0),dummies=Array.from({length:scenario.targets},()=>({turn:0,distance:10000,slowUntil:0,firekiss:0,firekissUntil:0,shock:null,kafkaShock:null,burn:null,himekoBurn:null,ratioDebuff:0,exposed:0}));
    const maxSP=ids.includes('1306')?7:5;
    let now=0,sp=scenario.initialSP,seed=scenario.seed>>>0,steps=0,attacks=0;
    const rng=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
    const actors=ids.map(id=>({id,s:{...(profiles[id]||defaults(id,data))},distance:10000,turn:0,buffs:[],energy:id==='1220'?0:(data.characters[id].max_sp||0)*scenario.energyPercent/100,resource:id==='1220'?3:0,fuaReady:true,fuaSinceTurn:true,charges:0,blessing:null,total:0,normal:0,ults:0,followups:0,actionKind:'basic',currentHP:(profiles[id]||defaults(id,data)).hp,hpLost:0,bladeCharges:0,ratioStacks:0,ratioMarks:0}));
    actors.forEach(a=>{const d=defaults(a.id,data);a.s.baseHP??=d.hp;a.s.baseDef??=d.def;a.s.breakEffect??=0;if(G)G.init(a,data);});
    const lord=ids.includes('1204')?{distance:10000,hits:3}:null;
    const find=id=>actors.find(a=>a.id===id),core=find(scenario.focus)||actors[0],skill=(id,suffix)=>data.character_skills[id+suffix],params=(id,suffix)=>skill(id,suffix)?.params[suffix==='01'?5:9]||[];
    const focusFor=actor=>core!==actor?core:actors.filter(a=>a!==actor).sort((a,b)=>(models[b.id].role==='dps')-(models[a.id].role==='dps')||b.s.atk-a.s.atk)[0]||actor;
    function buff(target,source,key,values,duration){target.buffs=target.buffs.filter(b=>!(b.source===source&&b.key===key));target.buffs.push({source,key,values,expires:target.turn+duration});}
    function stat(actor){
      const bonus={atk:0,hp:0,def:0,flatHP:0,flatAtk:0,speed:0,speedPct:0,crit:0,critDamage:0,damage:0,resPen:0};for(const b of actor.buffs)for(const [k,v] of Object.entries(b.values))bonus[k]=(bonus[k]||0)+v;
      const eq=G?G.modifiers(actor,actors,data):{};for(const key of ['atk','hp','def','speed','speedPct','crit','critDamage','damage'])bonus[key]+=(eq[key]||0);
      const asta=find('1009');if(asta)bonus.atk+=asta.charges*params('1009','04')[0];
      if(find('1101'))bonus.damage+=.1;if(asta&&data.characters[actor.id].element==='Fire')bonus.damage+=.18;
      const ruan=find('1303'),robin=find('1309'),sparkle=find('1306'),fu=find('1208');
      if(ruan){if(ruan.meiSkillUntil>ruan.turn)bonus.damage+=params('1303','02')[0]+Math.min(.36,Math.max(0,breakValue(ruan)-1.2)*.6);if(ruan.meiUltUntil>ruan.turn)bonus.resPen+=params('1303','03')[0];}
      if(robin){bonus.critDamage+=params('1309','04')[0];if(robin.robinSkillUntil>robin.turn)bonus.damage+=params('1309','02')[0];if(robin.concertoUntil>now)bonus.flatAtk+=robin.concertoATK;}
      if(sparkle){const n=actors.filter(a=>data.characters[a.id].element==='Quantum').length;bonus.atk+=.15;if(data.characters[actor.id].element==='Quantum')bonus.atk+=n>=3?.3:n===2?.15:.05;const stacks=actor.buffs.find(b=>b.source==='1306'&&b.key==='sparkleTalent')?.values.stacks||0;bonus.damage+=stacks*(.06+(actor.buffs.some(b=>b.source==='1306'&&b.key==='cipher')?.1:0));}
      if(fu&&fu.matrixUntil>fu.turn){bonus.crit+=params('1208','02')[4];bonus.flatHP+=fu.matrixHP;}
      let r={hp:actor.s.hp+actor.s.baseHP*bonus.hp+bonus.flatHP,def:actor.s.def+actor.s.baseDef*bonus.def,atk:actor.s.atk+actor.s.baseAtk*bonus.atk+bonus.flatAtk,speed:actor.s.speed+actor.s.baseSpeed*bonus.speedPct+bonus.speed,crit:actor.s.crit+bonus.crit,critDamage:actor.s.critDamage+bonus.critDamage,damage:actor.s.damageBonus+bonus.damage,resPen:bonus.resPen,energyRegen:actor.s.energyRegen+(eq.energyRegen||0),effectHit:actor.s.effectHit+(eq.effectHit||0)};
      if(actor.id==='1302')r.crit+=Math.min(10,actor.apotheosis||0)*.025;
      if(actor.id==='1212'&&actor.transmigration)r.crit+=.5;
      if(actor.id==='1104')r.atk+=actor.gepardATK||0;
      if(actor.id==='1003'&&actor.currentHP>=r.hp*.8)r.crit+=.15;
      if(actor.id==='1305'){r.crit+=actor.ratioStacks*.025;r.critDamage+=actor.ratioStacks*.05;}
      if(G){const extra=G.conditional(actor,r);r.crit+=extra.crit;r.critDamage+=extra.critDamage;r.damage+=extra.damage;r.atk+=actor.s.baseAtk*extra.atk;}if(!Number.isFinite(r.speed)||r.speed<=0)throw Error('После бонусов наборов скорость должна оставаться положительной.');return r;
    }
    function record(actor,label,damage=0,kind='effect'){if(keepLog)events.push({time:now,actor:actor?.id||'dummy',label,damage,kind,sp,energy:actor?.energy||0,resource:actor?.resource||0});}
    function breakValue(actor){const eq=G?G.modifiers(actor,actors,data):{},speed=actor.s.speed+actor.s.baseSpeed*(eq.speedPct||0)+(eq.speed||0)+actor.buffs.reduce((n,b)=>n+(b.values.speed||0)+actor.s.baseSpeed*(b.values.speedPct||0),0);return actor.s.breakEffect+(actor.eq?.p.BreakDamageAddedRatioBase||0)+(eq.breakEffect||0)+(find('1303')?.2:0)+(G?.has(actor,'307')&&speed>=145?.2:0);}
    function slowed(index){const d=dummies[index];return d.slowUntil>d.turn||d.weltSlowUntil>d.turn||d.imprisonedUntil>d.turn;}
    function targetSpeed(index){const d=dummies[index];return Math.max(1,100*(1-(d.slowUntil>d.turn?.12:0)-(d.weltSlowUntil>d.turn?.1:0)-(d.imprisonedUntil>d.turn?.1:0)));}
    function spendSP(){sp--;const sparkle=find('1306');if(sparkle)for(const a of actors){const count=a.buffs.find(b=>b.source==='1306'&&b.key==='sparkleTalent')?.values.stacks||0;buff(a,'1306','sparkleTalent',{stacks:Math.min(3,count+1)},2);}}
    function argentiTalent(actor,count){actor.apotheosis=Math.min(10,(actor.apotheosis||0)+count);energy(actor,params('1302','04')[0]*count);}
    function weltTalent(actor,targets){for(const i of targets)if(slowed(i))hit(actor,params('1004','04')[0],[i],'Талант Вельта',{kind:'additional',bonus:.2});}
    function jingliuGain(actor,amount){actor.syzygy=Math.min(3,(actor.syzygy||0)+amount);actor.resource=actor.syzygy;if(!actor.transmigration&&actor.syzygy>=2){actor.transmigration=true;actor.distance=0;record(actor,'Спектральная трансмиграция · продвижение 100%');}}
    function jingliuSnapshot(actor){if(!actor.transmigration)return stat(actor);let lost=0;for(const a of actors)if(a!==actor){const before=a.currentHP;loseHP(a,stat(a).hp*.04);lost+=before-a.currentHP;}const s=stat(actor);s.atk+=Math.min(actor.s.baseAtk*1.8,lost*5.4);record(actor,'Цзинлю · поглощено HP '+lost.toFixed(2));return s;}
    function jingliuEnhanced(actor){const p=data.character_skills['121209'].params[9];actor.actionKind='skill';if(G)G.beforeSkill(actor);energy(actor,30);const s=jingliuSnapshot(actor);hit(actor,p[0],[0],'Луна на застывшей реке',{statSnapshot:s});if(dummies.length>1)hit(actor,p[2],allTargets().slice(1,3),'Луна на застывшей реке · соседние цели',{statSnapshot:s});actor.syzygy--;actor.resource=actor.syzygy;if(!actor.syzygy){actor.transmigration=false;record(actor,'Спектральная трансмиграция · окончание');}afterAttack(actor);if(G)G.afterSkill(actor);settleHP();}
    function luochaFlower(actor){if(actor.fieldUntil>actor.turn)return;actor.flowers=(actor.flowers||0)+1;if(actor.flowers>=2){actor.flowers=0;actor.fieldUntil=actor.turn+2;record(actor,'Поле Цветка Бездны · начало');}}
    function settleHP(){const luocha=find('1203'),fu=find('1208');if(luocha&&luocha.turn>=(luocha.autoHealReady||0)){const patient=actors.find(a=>a.currentHP<=stat(a).hp*.5);if(patient){luocha.autoHealReady=luocha.turn+2;const p=params('1203','02');heal(patient,stat(luocha).atk*p[0]+p[1],luocha);energy(luocha,30);assist(patient,luocha);luochaFlower(luocha);record(luocha,'Автоматическое лечение → '+data.characters[patient.id].name);}}if(fu&&(fu.reversals||0)>0&&fu.currentHP<=stat(fu).hp*.5){fu.reversals--;fu.currentHP+=(stat(fu).hp-fu.currentHP)*.9;record(fu,'Фу Сюань · восстановление HP');}const blade=find('1205');if(blade?.bladeCharges>=5)bladeFollow(blade);}
    function burning(index){const d=dummies[index];return burnKeys.some(key=>d[key]&&d[key].expires>=d.turn);}
    function effectChance(actor,base,index){return clamp(base*(1+stat(actor).effectHit+(find('1106')?.1:0))*(dummies[index].ratioDebuff>dummies[index].turn?1.1:1),0,1);}
    function assist(target,source){if(G)G.assist(target);if(target.id==='1002'&&target!==source&&target.turn>=(target.danReadyTurn||0)){target.danPen=true;target.danReadyTurn=target.turn+params('1002','04')[1];record(target,'Превосходство досягаемости · следующая атака');}}
    function applyBurn(actor,key,targets,chance,coefficient,duration){for(const i of targets)if(rng()<effectChance(actor,chance,i)){dummies[i][key]={owner:actor.id,expires:dummies[i].turn+duration,coefficient};if(G)G.debuff(actor);}}
    function firekiss(index){const gui=find('1210');if(!gui)return;const p=params('1210','04'),d=dummies[index];if(rng()<effectChance(gui,p[0],index)){d.firekiss=Math.min(p[5],(d.firekissUntil>d.turn?d.firekiss:0)+1);d.firekissUntil=d.turn+p[4];if(G)G.debuff(gui);record(gui,'Огненный поцелуй · '+d.firekiss+' ур.');}}
    function dotHit(index,key,multiplier=1,label='Тик DoT'){const dot=dummies[index][key];hit(find(dot.owner),dot.coefficient*multiplier,[index],label,{dot:true});if(burnKeys.includes(key))firekiss(index);}
    function energy(actor,amount){if(actor.id==='1220')return;actor.energy=Math.min(data.characters[actor.id].max_sp,actor.energy+amount*stat(actor).energyRegen);}
    function hit(actor,coefficient,targets,label,options={}){
      const kind=options.dot?'dot':options.kind||(options.followup?'followup':actor.actionKind),followup=Boolean(options.followup),ultimate=kind==='ultimate'||Boolean(options.ultimate);
      if(G&&followup&&!options.group)G.followupStart(actor);
      const s=options.statSnapshot||stat(actor),bonus=options.bonus||0;let total=0;
      for(const target of targets){const gear=G?G.damage(actor,s,{kind,followup,ultimate,dot:options.dot,element:options.element},{debuffs:debuffCount(target),imprisoned:scenario.imprisoned||dummies[target].imprisonedUntil>dummies[target].turn,element:data.characters[actor.id].element}):{damage:0,crit:0,critDamage:0};
        const critical=options.fixedCritical??(options.dot?1:1+(options.guaranteedCrit?1:clamp(s.crit+gear.crit,0,1))*(s.critDamage+(options.extraCritDamage||0)+gear.critDamage+(followup&&find('1309')?.concertoUntil>now?.25:0))),native=(!options.element||options.element===data.characters[actor.id].element)?(actor.s.elementBonus||0):0;
        const ratioBonus=actor.id==='1305'&&debuffCount(target)>=3?Math.min(.5,debuffCount(target)*.1):0,himekoBonus=actor.id==='1003'&&(dummies[target].burn||dummies[target].himekoBurn)?.2:0;
        const guiBonus=actor.id==='1210'&&burning(target)?.2:0,danBonus=actor.id==='1002'&&kind==='basic'&&slowed(target)?.4:0,danPen=actor.id==='1002'&&actor.danPen?params('1002','04')[0]:0,d=dummies[target],vulnerability=d.firekissUntil>d.turn?d.firekiss*params('1210','04')[3]:0;
        const weltVulnerability=d.weltVulnUntil>d.turn?.12:0;
        const damage=Math.max(0,(options.baseDamage??coefficient*s.atk)*(1+s.damage+native+bonus+gear.damage+ratioBonus+himekoBonus+guiBonus+danBonus+(options.pelaTrace&&isExposed(target)?.2:0))*critical*(1+clamp(s.resPen+danPen,0,1))*(1+vulnerability+weltVulnerability));actor.total+=damage;damageByTarget[target]+=damage;total+=damage;}
      if(G)G.hitEnd(actor,targets.length,followup);if(G&&followup&&!options.group)G.followupEnd(actor,actors);record(actor,label,total,options.dot?'dot':followup?'followup':'attack');return total;
    }
    function debuffCount(index=0){const d=dummies[index];return (scenario.externalDebuffs||0)+(d.exposed>d.turn?1:0)+(d.ratioDebuff>d.turn?1:0)+(d.slowUntil>d.turn?1:0)+(d.weltSlowUntil>d.turn?1:0)+(d.imprisonedUntil>d.turn?1:0)+(d.weltVulnUntil>d.turn?1:0)+(d.freeze?1:0)+(d.firekissUntil>d.turn?1:0)+dotKeys.filter(k=>d[k]&&d[k].expires>=d.turn).length;}
    function isExposed(index=0){return debuffCount(index)>0;}
    function addBlessingDamage(attacker){const ty=find('1202');if(ty?.blessing&&ty.blessing.target===attacker.id&&attacker.buffs.some(b=>b.source==='1202'&&b.key==='benediction'))hit(attacker,params('1202','02')[0],[0],'Благословение · доп. урон',{kind:'additional',element:'Thunder'});}
    function feixiaoFollow(actor){actor.followups++;actor.fuaSinceTurn=true;buff(actor,actor.id,'fuaDamage',{damage:params('1220','04')[4]},2);hit(actor,params('1220','04')[0],[0],'Бонус-атака Фэйсяо',{followup:true,extraCritDamage:.36});afterAttack(actor,false,'followup');}
    function ratioFollow(actor){actor.followups++;energy(actor,5);hit(actor,params('1305','04')[0],[0],'Бонус-атака Рацио',{followup:true});afterAttack(actor,false,'followup');}
    function kafkaFollow(actor){actor.followups++;actor.fuaReady=false;energy(actor,10);hit(actor,params('1005','04')[0],[0],'Бонус-атака Кафки',{followup:true});dummies[0].kafkaShock={owner:actor.id,expires:dummies[0].turn+params('1005','03')[2],coefficient:params('1005','03')[3]};if(G)G.debuff(actor);afterAttack(actor,false,'followup');}
    function detonate(targets,multiplier,onlyBurn=false){for(const i of targets)for(const key of onlyBurn?burnKeys:dotKeys){const dot=dummies[i][key];if(dot&&dot.expires>dummies[i].turn)dotHit(i,key,multiplier,onlyBurn?'Подрыв Горения':'Подрыв DoT');}}
    function heal(actor,amount,healer=actor){const max=stat(actor).hp,before=actor.currentHP,fraction=before/max,incoming=actor.id==='1205'&&fraction<=.5?.2:0,outgoing=(healer.eq?.p.HealRatioBase||0)+(healer.id==='1105'?.1:0)+(healer.id==='1105'&&fraction<=.3?.5:0),value=amount*(1+incoming)*(1+outgoing);if(healer.id==='1211'&&before+value>max)buff(actor,healer.id,'bailuHP',{hp:.1},2);actor.currentHP=Math.min(stat(actor).hp,before+value);if(actor.currentHP>before)record(healer,'Лечение '+data.characters[actor.id].name+' · '+(actor.currentHP-before).toFixed(2)+' HP');}
    function loseHP(actor,amount){const lost=Math.min(amount,Math.max(0,actor.currentHP-1));actor.currentHP-=lost;if(lost>0){actor.hpLost=Math.min(stat(actor).hp*.9,actor.hpLost+lost);actor.bladeCharges=Math.min(5,actor.bladeCharges+1);if(G)G.hpLoss(actor);}}
    function bladeFollow(actor){if(actor.bladeCharges<5)return;actor.bladeCharges=0;actor.followups++;const p=params('1205','04'),s=stat(actor);hit(actor,0,dummies.map((_,i)=>i),'Бонус-атака Блэйда',{followup:true,baseDamage:s.atk*p[1]+s.hp*p[3],bonus:.2});heal(actor,s.hp*p[2]);energy(actor,10);afterAttack(actor,false,'followup');}
    function himekoBurn(actor,targets){for(const i of targets)if(rng()<clamp(.5*(1+stat(actor).effectHit+(find('1106')?.1:0)),0,1)){dummies[i].himekoBurn={owner:actor.id,expires:dummies[i].turn+2,coefficient:.3};if(G)G.debuff(actor);}}
    function afterAttack(attacker,isUltimate=false,kind=attacker.actionKind){
      if(attacker.id==='1002'){attacker.danPen=false;if(rng()<.5)buff(attacker,attacker.id,'danSpeed',{speedPct:.2},2);}
      if(G)G.afterAttack(attacker);
      const robin=find('1309');if(robin){energy(robin,2);if(robin.concertoUntil>now&&attacker!==robin)hit(robin,params('1309','03')[3],[0],'Концерт · дополнительный урон',{kind:'additional',fixedCritical:2.5});}
      const luocha=find('1203');if(luocha&&luocha.fieldUntil>luocha.turn){const atk=stat(luocha).atk;for(const a of actors)heal(a,a===attacker?atk*.18+240:atk*.07+93,luocha);}
      const fx=find('1220');if(fx&&!(attacker.id==='1220'&&isUltimate)){attacks++;if(attacks%2===0)fx.resource=Math.min(12,fx.resource+1);}
      addBlessingDamage(attacker);
      if(fx&&attacker!==fx&&fx.fuaReady){fx.fuaReady=false;feixiaoFollow(fx);}
      const kafka=find('1005');if(kafka&&attacker!==kafka&&kind==='basic'&&kafka.fuaReady)kafkaFollow(kafka);
      const ratio=find('1305');if(ratio&&attacker!==ratio&&ratio.ratioMarks>0){ratio.ratioMarks--;ratioFollow(ratio);}
    }
    function servalTalent(actor){const targets=dummies.map((d,i)=>d.shock&&d.shock.expires>d.turn?i:-1).filter(i=>i>=0);if(targets.length)hit(actor,params('1103','04')[0],targets,'Талант Сервал');}
    function ult(actor){
      const p=params(actor.id,'03'),all=dummies.map((_,i)=>i);actor.ults++;
      if(actor.id==='1220'){actor.resource-=6;const strike=data.character_skills['122008'].params[9];if(G)G.followupStart(actor);for(let i=0;i<p[2];i++)hit(actor,strike[0]+strike[1],[0],'Ульта Фэйсяо · удар',{extraCritDamage:.36,followup:true,ultimate:true,group:true});hit(actor,p[0],[0],'Ульта Фэйсяо · завершение',{extraCritDamage:.36,followup:true,ultimate:true,group:true});if(G)G.followupEnd(actor,actors);afterAttack(actor,true);return;}
      actor.energy=0;energy(actor,5);
      if(actor.id==='1004'){hit(actor,p[0],all,'Ульта Вельта',{bonus:.2});weltTalent(actor,all);for(const i of all){const d=dummies[i];if(rng()<effectChance(actor,p[2],i)){d.imprisonedUntil=d.turn+1;d.distance+=10000*p[1];if(G)G.debuff(actor);}if(rng()<effectChance(actor,1,i)){d.weltVulnUntil=d.turn+2;if(G)G.debuff(actor);}}energy(actor,10);afterAttack(actor,true);}
      else if(actor.id==='1302'){const q=data.character_skills['130214'].params[9];hit(actor,q[0],all,'Аргенти · полная ульта');argentiTalent(actor,all.length);for(let i=0;i<q[1];i++){hit(actor,q[2],[Math.floor(rng()*dummies.length)],'Аргенти · отскок ульты');argentiTalent(actor,1);}afterAttack(actor,true);}
      else if(actor.id==='1212'){const enhanced=actor.transmigration,s=jingliuSnapshot(actor);hit(actor,p[0],[0],'Ульта Цзинлю',{statSnapshot:s,bonus:enhanced?.2:0});if(all.length>1)hit(actor,p[2],all.slice(1,3),'Ульта Цзинлю · соседние цели',{statSnapshot:s,bonus:enhanced?.2:0});jingliuGain(actor,p[1]);afterAttack(actor,true);settleHP();}
      else if(actor.id==='1303'){actor.meiUltUntil=actor.turn+p[1];for(const a of actors)assist(a,actor);record(actor,'Зона Жуань Мэй · пробитие RES');}
      else if(actor.id==='1309'){actor.concertoATK=stat(actor).atk*p[0]+p[2];actor.concertoUntil=now+10000/p[1];for(const a of actors){if(a!==actor)a.distance=0;assist(a,actor);}record(actor,'Концерт · продвижение команды и отсчёт SPD 90');}
      else if(actor.id==='1306'){sp=Math.min(maxSP,sp+p[1]);for(const a of actors){buff(a,actor.id,'cipher',{cipher:1},p[3]);assist(a,actor);}record(actor,'Искорка · +4 SP и Шифр');}
      else if(actor.id==='1203'){hit(actor,p[0],all,'Ульта Лочи');luochaFlower(actor);afterAttack(actor,true);}
      else if(actor.id==='1211'){for(const a of actors){heal(a,stat(actor).hp*p[0]+p[1],actor);assist(a,actor);}record(actor,'Ульта Байлу · лечение и Бодрость');}
      else if(actor.id==='1104'){const shield=(stat(actor).def*p[0]+p[2])*(G?.has(actor,'103',4)?1.2:1);for(const a of actors){a.shield={amount:shield,expires:a.turn+p[1]};assist(a,actor);}record(actor,'Щит Гепарда · '+shield.toFixed(2));}
      else if(actor.id==='1208'){hit(actor,0,all,'Ульта Фу Сюань',{baseDamage:stat(actor).hp*p[0]});actor.reversals=Math.min(2,(actor.reversals||0)+1);for(const a of actors)if(a!==actor){heal(a,stat(actor).hp*.05+133,actor);assist(a,actor);}afterAttack(actor,true);settleHP();}
      else if(actor.id==='1101'){const cd=stat(actor).critDamage;for(const target of actors){buff(target,actor.id,'bronyaUlt',{atk:p[0],critDamage:p[1]*cd+p[2]},p[3]);assist(target,actor);}record(actor,'Ульта Брони · баф команды');}
      else if(actor.id==='1202'){const target=focusFor(actor);energy(target,p[0]/stat(target).energyRegen);buff(target,actor.id,'tingyunUlt',{damage:p[2]},p[1]);assist(target,actor);record(actor,'Ульта Тинъюнь → '+data.characters[target.id].name);}
      else if(actor.id==='1009'){for(const target of actors){buff(target,actor.id,'astaUlt',{speed:p[0]},p[1]);assist(target,actor);}record(actor,'Ульта Асты · скорость');}
      else if(actor.id==='1106'){hit(actor,p[3],all,'Ульта Пелы',{pelaTrace:true});for(const d of dummies)d.exposed=d.turn+p[2];if(G)G.debuff(actor);energy(actor,params('1106','04')[0]);record(actor,'Ослабление DEF · у болванок DEF = 0');afterAttack(actor,true);}
      else if(actor.id==='1102'){buff(actor,actor.id,'seeleBoost',{damage:params('1102','04')[0],resPen:.2},1);hit(actor,p[0],[0],'Ульта Зеле');afterAttack(actor,true);}
      else if(actor.id==='1103'){hit(actor,p[0],all,'Ульта Сервал');for(const d of dummies)if(d.shock)d.shock.expires+=p[1];servalTalent(actor);afterAttack(actor,true);}
      else if(actor.id==='1013'){hit(actor,p[0],all,'Ульта Герты');afterAttack(actor,true);}
      else if(actor.id==='1003'){hit(actor,p[0],all,'Ульта Химеко');himekoBurn(actor,all);afterAttack(actor,true);}
      else if(actor.id==='1005'){hit(actor,p[0],all,'Ульта Кафки');for(const d of dummies)d.kafkaShock={owner:actor.id,expires:d.turn+p[2],coefficient:p[3]};if(G)G.debuff(actor);detonate(all,p[4]);afterAttack(actor,true);}
      else if(actor.id==='1204'){hit(actor,p[0],all,'Ульта Цзин Юаня');lord.hits=Math.min(10,lord.hits+p[1]);afterAttack(actor,true);}
      else if(actor.id==='1305'){hit(actor,p[0],[0],'Ульта Рацио');actor.ratioMarks=p[1];afterAttack(actor,true);}
      else if(actor.id==='1205'){const s=stat(actor),next=s.hp*.5;if(actor.currentHP>next)loseHP(actor,actor.currentHP-next);else actor.currentHP=next;const lost=actor.hpLost;hit(actor,0,[0],'Ульта Блэйда',{baseDamage:s.atk*p[0]+s.hp*p[1]+lost*p[4]});if(all.length>1)hit(actor,0,all.slice(1,3),'Ульта Блэйда · соседние цели',{baseDamage:s.atk*p[2]+s.hp*p[3]+lost*p[5]});actor.hpLost=0;afterAttack(actor,true);bladeFollow(actor);}
      else if(actor.id==='1002'){hit(actor,p[0]+(slowed(0)?p[1]:0),[0],'Ульта Дань Хэна');afterAttack(actor,true);}
      else if(actor.id==='1109'){hit(actor,p[0],[0],'Ульта Хук');hookTalent(actor,[0]);actor.hookEnhanced=true;actor.distance=Math.max(0,actor.distance-2000);energy(actor,5);afterAttack(actor,true);}
      else if(actor.id==='1210'){hit(actor,p[0],all,'Ульта Гуйнайфэнь');detonate(all,p[1],true);afterAttack(actor,true);}
      else if(actor.id==='1105'){for(const a of actors){heal(a,stat(actor).hp*p[0]+p[1],actor);assist(a,actor);}record(actor,'Ульта Наташи · лечение');}
    }
    function runUlts(){
      let fired=true,guard=0;
      while(fired&&guard++<100){fired=false;for(const actor of [...actors].sort((a,b)=>(models[b.id].role==='support')-(models[a.id].role==='support'))){if(actor.id==='1309'&&actor.concertoUntil>now)continue;if(actor.id==='1105'&&actors.every(a=>a.currentHP>=stat(a).hp*.7))continue;const ready=actor.id==='1220'?actor.resource>=6:actor.energy+1e-8>=data.characters[actor.id].max_sp;if(ready){const previous=actor.actionKind;actor.actionKind='ultimate';if(G)G.beforeUltimate(actor);ult(actor);if(G)G.afterUltimate(actor);actor.actionKind=previous;fired=true;}}}
      if(guard>=100)throw Error('Защита от бесконечной цепочки ульт.');
    }
    function regular(actor){
      actor.matrixWasActive=actor.matrixUntil>actor.turn;
      actor.turn++;actor.normal++;actor.distance=10000;if(G)G.startTurn(actor);if(actor.hot){heal(actor,actor.hot.amount,find(actor.hot.owner));if(--actor.hot.turns<=0)actor.hot=null;}
      actor.buffs=actor.buffs.filter(b=>!(b.key==='sparkleSkill'&&b.expires<=actor.turn));
      actor.currentHP=Math.min(actor.currentHP,stat(actor).hp);
      if(actor.id==='1302')actor.apotheosis=Math.min(10,(actor.apotheosis||0)+1);
      if(actor.id==='1303')energy(actor,5);
      if(actor.id==='1104')actor.gepardATK=stat(actor).def*.35;
      if(actor.id==='1212'&&actor.transmigration){jingliuEnhanced(actor);finishTurn(actor);return;}
      if(actor.id==='1005')actor.fuaReady=true;
      if(actor.id==='1220'){if(!actor.fuaSinceTurn){attacks++;if(attacks%2===0)actor.resource=Math.min(12,actor.resource+1);}actor.fuaSinceTurn=false;actor.fuaReady=true;}
      if(actor.id==='1202')energy(actor,5);
      if(actor.id==='1009'&&actor.turn>1)actor.charges=Math.max(0,actor.charges-params('1009','04')[2]);
      const target=focusFor(actor),p=params(actor.id,'02');let useSkill=false;
      if(actor.s.policy!=='basic'&&sp>0){
        if(actor.s.policy==='skill')useSkill=actor.id!=='1105';
        else if(actor.id==='1202')useSkill=!target.buffs.some(b=>b.source===actor.id&&b.key==='benediction');
        else if(actor.id==='1101')useSkill=true;
        else if(actor.id==='1009')useSkill=actor.charges<5;
        else if(actor.id==='1105')useSkill=actors.some(a=>a.currentHP<stat(a).hp*.5);
        else if(actor.id==='1303')useSkill=!(actor.meiSkillUntil>actor.turn);
        else if(actor.id==='1309')useSkill=!(actor.robinSkillUntil>actor.turn);
        else if(actor.id==='1306')useSkill=true;
        else if(actor.id==='1208')useSkill=!(actor.matrixUntil>actor.turn);
        else if(actor.id==='1203'||actor.id==='1211')useSkill=actors.some(a=>a.currentHP<stat(a).hp*.5);
        else if(actor.id==='1210')useSkill=allTargets().slice(0,3).some(i=>!dummies[i].guiBurn);
        else if(models[actor.id].role==='dps')useSkill=true;
      }
      if(actor.id==='1205'&&actor.bladeUntil>actor.turn)useSkill=false;
      actor.actionKind=useSkill?'skill':'basic';
      if(useSkill){spendSP();if(G)G.beforeSkill(actor);if(actor.id!=='1205')energy(actor,actor.id==='1212'?20:30);
        if(actor.id==='1004'){for(let n=0;n<3;n++){const i=n?Math.floor(rng()*dummies.length):0;hit(actor,p[0],[i],'Навык Вельта · попадание',{bonus:.2});if(rng()<effectChance(actor,p[1],i)){dummies[i].weltSlowUntil=dummies[i].turn+p[3];if(G)G.debuff(actor);}weltTalent(actor,[i]);}afterAttack(actor);}
        else if(actor.id==='1302'){hit(actor,p[0],allTargets(),'Навык Аргенти');argentiTalent(actor,dummies.length);afterAttack(actor);}
        else if(actor.id==='1212'){hit(actor,p[0],[0],'Непостижимая Зарница');jingliuGain(actor,p[1]);if(!actor.transmigration)actor.distance=Math.max(0,actor.distance-1000);afterAttack(actor);}
        else if(actor.id==='1303'){actor.meiSkillUntil=actor.turn+p[2];for(const a of actors)assist(a,actor);record(actor,'Обертон Жуань Мэй · баф урона');}
        else if(actor.id==='1309'){actor.robinSkillUntil=actor.turn+p[1];energy(actor,5);for(const a of actors)assist(a,actor);record(actor,'Навык Зарянки · баф урона');}
        else if(actor.id==='1306'){buff(target,actor.id,'sparkleSkill',{critDamage:stat(actor).critDamage*p[0]+p[1]},target===actor?1:2);if(target!==actor)target.distance=Math.max(0,target.distance-10000*p[3]);assist(target,actor);record(actor,'Навык Искорки → '+data.characters[target.id].name);}
        else if(actor.id==='1203'){const patient=[...actors].sort((a,b)=>a.currentHP/stat(a).hp-b.currentHP/stat(b).hp)[0];heal(patient,stat(actor).atk*p[0]+p[1],actor);assist(patient,actor);luochaFlower(actor);record(actor,'Навык Лочи → '+data.characters[patient.id].name);}
        else if(actor.id==='1211'){const patient=[...actors].sort((a,b)=>a.currentHP/stat(a).hp-b.currentHP/stat(b).hp)[0],amount=stat(actor).hp*p[0]+p[1];heal(patient,amount,actor);assist(patient,actor);for(let n=1;n<=p[3];n++){const other=actors[Math.floor(rng()*actors.length)];heal(other,amount*Math.pow(1-p[2],n),actor);assist(other,actor);}record(actor,'Навык Байлу · лечение с отскоками');}
        else if(actor.id==='1104'){hit(actor,p[0],[0],'Навык Гепарда');if(rng()<effectChance(actor,p[1],0)){dummies[0].freeze={owner:actor.id,coefficient:p[3]};if(G)G.debuff(actor);record(actor,'Заморозка');}afterAttack(actor);}
        else if(actor.id==='1208'){const active=actor.matrixUntil>actor.turn,before=actors.map(a=>stat(a).hp);if(actor.matrixWasActive)energy(actor,20);const hp=stat(actor).hp-(active?actor.matrixHP:0);actor.matrixHP=hp*p[3];actor.matrixUntil=actor.turn+p[2];for(const [i,a] of actors.entries()){a.currentHP+=Math.max(0,stat(a).hp-before[i]);assist(a,actor);}record(actor,'Матрица предвидения · HP и крит. шанс');}
        else if(actor.id==='1101'){buff(target,actor.id,'bronyaSkill',{damage:p[0]},p[2]);if(target!==actor)target.distance=0;assist(target,actor);record(actor,'Навык Брони → '+data.characters[target.id].name);}
        else if(actor.id==='1202'){const flat=Math.min(target.s.baseAtk*p[1],stat(actor).atk*p[3]);buff(target,actor.id,'benediction',{flatAtk:flat},p[2]);actor.blessing={target:target.id,expires:target.turn+p[2]};buff(actor,actor.id,'tySpeed',{speedPct:.2},1);if(target!==actor)assist(target,actor);record(actor,'Благословение → '+data.characters[target.id].name);}
        else if(actor.id==='1106'){hit(actor,p[0],[0],'Навык Пелы',{pelaTrace:true});if(isExposed())energy(actor,params('1106','04')[0]);afterAttack(actor);}
        else if(actor.id==='1009'){const struck=new Set([0]);hit(actor,p[0],[0],'Навык Асты · первый удар');for(let n=0;n<4;n++){const index=Math.floor(rng()*dummies.length);struck.add(index);hit(actor,p[0],[index],'Навык Асты · отскок');}actor.charges=Math.min(p.length?params('1009','04')[1]:5,actor.charges+struck.size*2);afterAttack(actor);}
        else if(actor.id==='1102'){buff(actor,actor.id,'seeleSpeed',{speedPct:p[1]},p[2]);hit(actor,p[0],[0],'Навык Зеле');afterAttack(actor);}
        else if(actor.id==='1220'){buff(actor,actor.id,'fxAttack',{atk:.48},3);hit(actor,p[0],[0],'Навык Фэйсяо');afterAttack(actor);feixiaoFollow(actor);}
        else if(actor.id==='1013'){hit(actor,p[0],dummies.map((_,i)=>i),'Навык Герты',{bonus:.45});afterAttack(actor);}
        else if(actor.id==='1103'){hit(actor,p[0],[0],'Навык Сервал');const adjacent=Array.from({length:Math.min(2,dummies.length-1)},(_,i)=>i+1);if(adjacent.length)hit(actor,p[1],adjacent,'Навык Сервал · соседние цели');for(let i=0;i<Math.min(3,dummies.length);i++)dummies[i].shock={owner:actor.id,expires:dummies[i].turn+p[3],coefficient:p[4]};if(G)G.debuff(actor);servalTalent(actor);afterAttack(actor);}
        else if(actor.id==='1003'){hit(actor,p[0],[0],'Навык Химеко');if(dummies.length>1)hit(actor,p[1],allTargets().slice(1,3),'Навык Химеко · соседние цели');himekoBurn(actor,allTargets().slice(0,3));afterAttack(actor);}
        else if(actor.id==='1005'){hit(actor,p[0],[0],'Навык Кафки');if(dummies.length>1)hit(actor,p[2],allTargets().slice(1,3),'Навык Кафки · соседние цели');detonate([0],p[1]);afterAttack(actor);}
        else if(actor.id==='1204'){buff(actor,actor.id,'jingCrit',{crit:.1},2);hit(actor,p[0],allTargets(),'Навык Цзин Юаня');lord.hits=Math.min(10,lord.hits+p[1]);afterAttack(actor);}
        else if(actor.id==='1305'){actor.ratioStacks=Math.min(6,actor.ratioStacks+debuffCount());hit(actor,p[0],[0],'Навык Рацио');dummies[0].ratioDebuff=dummies[0].turn+2;if(G)G.debuff(actor);afterAttack(actor);if(rng()<Math.min(1,params('1305','04')[1]+params('1305','04')[2]*debuffCount()))ratioFollow(actor);}
        else if(actor.id==='1205'){loseHP(actor,stat(actor).hp*p[0]);buff(actor,actor.id,'hellscape',{damage:p[3]},p[1]-1);actor.bladeUntil=actor.turn+p[1];record(actor,'Адский пейзаж · расход HP');if(G)G.afterSkill(actor);bladeFollow(actor);bladeEnhanced(actor);}
        else if(actor.id==='1002'){hit(actor,p[0],[0],'Навык Дань Хэна');const s=stat(actor),gear=G?G.damage(actor,s,{kind:'skill',followup:false,ultimate:false,dot:false},{debuffs:debuffCount(),element:'Wind'}):{crit:0},chance=1-Math.pow(1-clamp(s.crit+gear.crit,0,1)*effectChance(actor,p[3],0),4);if(rng()<chance){dummies[0].slowUntil=dummies[0].turn+p[2];if(G)G.debuff(actor);record(actor,'Замедление · скорость болванки −12%');}afterAttack(actor);}
        else if(actor.id==='1109'){const enhanced=actor.hookEnhanced,q=enhanced?data.character_skills['110909'].params[9]:p;actor.hookEnhanced=false;hit(actor,q[0],[0],enhanced?'Усиленный навык Хук':'Навык Хук');if(enhanced&&dummies.length>1)hit(actor,q[4],allTargets().slice(1,3),'Усиленный навык Хук · соседние цели');applyBurn(actor,'hookBurn',[0],q[1],q[3],q[2]);hookTalent(actor,enhanced?allTargets().slice(0,3):[0]);afterAttack(actor);}
        else if(actor.id==='1210'){hit(actor,p[0],[0],'Навык Гуйнайфэнь');if(dummies.length>1)hit(actor,p[1],allTargets().slice(1,3),'Навык Гуйнайфэнь · соседние цели');applyBurn(actor,'guiBurn',allTargets().slice(0,3),p[2],p[3],p[4]);afterAttack(actor);}
        else if(actor.id==='1105'){const patient=[...actors].sort((a,b)=>a.currentHP/stat(a).hp-b.currentHP/stat(b).hp)[0];heal(patient,stat(actor).hp*p[0]+p[3],actor);patient.hot={owner:actor.id,amount:stat(actor).hp*p[1]+p[4],turns:p[2]+1};if(patient!==actor)assist(patient,actor);record(actor,'Лечение → '+data.characters[patient.id].name);}
      }else{
        if(actor.id==='1205'&&actor.bladeUntil>actor.turn){bladeEnhanced(actor);runUlts();actor.buffs=actor.buffs.filter(b=>b.expires>actor.turn);if(G)G.endTurn(actor);return;}
        sp=Math.min(maxSP,sp+1);energy(actor,actor.id==='1306'?30:20);const bonus=actor.id==='1202'?.4:actor.id==='1004'?.2:0;
        hit(actor,params(actor.id,'01')[0],[0],'Базовая атака',{bonus,baseDamage:actor.id==='1208'?params(actor.id,'01')[0]*stat(actor).hp:undefined,guaranteedCrit:actor.id==='1101',pelaTrace:actor.id==='1106'});
        if(actor.id==='1004')weltTalent(actor,[0]);if(actor.id==='1302')argentiTalent(actor,1);
        if(actor.id==='1101')actor.distance=Math.max(0,actor.distance-10000*params('1101','04')[0]);
        if(actor.id==='1009'){actor.charges=Math.min(5,actor.charges+2);if(rng()<clamp(.8*(1+actor.s.effectHit+(find('1106') ? .1 : 0)),0,1))dummies[0].burn={owner:actor.id,expires:dummies[0].turn+3,coefficient:.5};}
        if(actor.id==='1106'&&isExposed())energy(actor,params('1106','04')[0]);
        if(actor.id==='1103')servalTalent(actor);
        if(actor.id==='1003')himekoBurn(actor,[0]);
        if(actor.id==='1109')hookTalent(actor,[0]);
        if(actor.id==='1210'){const p=params(actor.id,'02');applyBurn(actor,'guiBurn',[0],.8,p[3],p[4]);}
        if(actor.id==='1202'&&actor.blessing){const blessed=find(actor.blessing.target);if(blessed.buffs.some(b=>b.source===actor.id&&b.key==='benediction')){const scale=stat(blessed).atk/stat(actor).atk;hit(actor,params('1202','04')[0]*scale,[0],'Талант Тинъюнь');}}
        afterAttack(actor);
      }
      if(G){if(useSkill&&actor.id!=='1205')G.afterSkill(actor);else if(!useSkill)G.afterBasic(actor);}finishTurn(actor);
    }
    function finishTurn(actor){settleHP();runUlts();actor.buffs=actor.buffs.filter(b=>b.expires>actor.turn);actor.currentHP=Math.min(actor.currentHP,stat(actor).hp);if(actor.shield?.expires<=actor.turn)actor.shield=null;if(G)G.endTurn(actor);}
    function allTargets(){return dummies.map((_,i)=>i);}
    function hookTalent(actor,targets){const burned=targets.filter(burning);if(!burned.length)return;hit(actor,params('1109','04')[0],burned,'Талант Хук · дополнительный урон',{kind:'additional'});energy(actor,params('1109','04')[1]);heal(actor,stat(actor).hp*.05);}
    function bladeEnhanced(actor){actor.actionKind='basic';const p=data.character_skills['120508'].params[5];loseHP(actor,stat(actor).hp*p[0]);energy(actor,30);const s=stat(actor);hit(actor,0,[0],'Частокол мечей',{baseDamage:s.atk*p[1]+s.hp*p[3]});if(dummies.length>1)hit(actor,0,allTargets().slice(1,3),'Частокол мечей · соседние цели',{baseDamage:s.atk*p[2]+s.hp*p[4]});afterAttack(actor);if(G)G.afterBasic(actor);heal(actor,s.hp*.05+100);bladeFollow(actor);}
    function lordTurn(){const actor=find('1204'),p=params('1204','04'),hits=lord.hits;actor.followups++;if(G)G.followupStart(actor);for(let i=0;i<hits;i++){const index=Math.floor(rng()*dummies.length),snapshot=stat(actor);hit(actor,p[1],[index],'Повелитель молний · удар',{followup:true,group:true,statSnapshot:snapshot,extraCritDamage:hits>=6?.25:0});const adjacent=[index-1,index+1].filter(j=>j>=0&&j<dummies.length);if(adjacent.length)hit(actor,p[1]*p[4],adjacent,'Повелитель молний · соседние цели',{followup:true,group:true,statSnapshot:snapshot,extraCritDamage:hits>=6?.25:0});}if(G)G.followupEnd(actor,actors);afterAttack(actor,false,'followup');lord.hits=3;lord.distance=10000;runUlts();}
    // Standing dummies are always at 100% HP. They have no toughness bar,
    // take turns for DoT/debuff durations, and never attack or die.
    if(find('1303'))for(const actor of actors)if(actor.id!=='1303')buff(actor,'1303','ruanSpeed',{speedPct:params('1303','04')[0]},100000);
    if(G)for(const actor of actors){const s=stat(actor);actor.currentHP=s.hp;actor.eq.startSpeed=s.speed;actor.eq.startCritDamage=s.critDamage;if(G.has(actor,'308')&&s.speed>=120)actor.distance-=4000;if(G.has(actor,'101',4))sp=Math.min(maxSP,sp+1);}
    if(find('1104'))find('1104').gepardATK=stat(find('1104')).def*.35;
    if(find('1208'))find('1208').reversals=1;
    if(find('1302'))energy(find('1302'),2*dummies.length);
    if(find('1309'))find('1309').distance=Math.max(0,find('1309').distance-2500);
    if(find('1210'))find('1210').distance=Math.max(0,find('1210').distance-2500);
    if(find('1103'))energy(find('1103'),15);if(find('1204'))energy(find('1204'),15);
    const initialStats=Object.fromEntries(actors.map(a=>[a.id,stat(a)]));runUlts();
    while(now<horizon-1e-9&&steps++<10000){
      let next=actors[0],delta=Infinity;
      for(const actor of actors){const dt=actor.id==='1309'&&actor.concertoUntil>now?Infinity:actor.distance/stat(actor).speed;if(dt<delta-1e-9){delta=dt;next=actor;}}
      const lordDelta=lord?lord.distance/(60+10*(lord.hits-3)):Infinity,lordNext=lordDelta<delta-1e-9;if(lordNext)delta=lordDelta;
      const robin=find('1309'),concertDelta=robin?.concertoUntil>now?robin.concertoUntil-now:Infinity,concertNext=concertDelta<delta-1e-9;if(concertNext)delta=concertDelta;
      const dummySpeed=targetSpeed;let dummyIndex=0;for(let i=1;i<dummies.length;i++)if(dummies[i].distance/dummySpeed(i)<dummies[dummyIndex].distance/dummySpeed(dummyIndex)-1e-9)dummyIndex=i;
      const dummyDelta=dummies[dummyIndex].distance/dummySpeed(dummyIndex);const dummyNext=dummyDelta<delta-1e-9;if(dummyNext)delta=dummyDelta;
      if(now+delta>horizon+1e-8)break;
      for(const actor of actors)if(!(actor.id==='1309'&&actor.concertoUntil>now))actor.distance=Math.max(0,actor.distance-delta*stat(actor).speed);if(lord)lord.distance=Math.max(0,lord.distance-delta*(60+10*(lord.hits-3)));for(let i=0;i<dummies.length;i++)dummies[i].distance=Math.max(0,dummies[i].distance-delta*dummySpeed(i));now+=delta;
      if(dummyNext){const d=dummies[dummyIndex];d.distance=10000;for(const key of dotKeys)if(d[key])dotHit(dummyIndex,key,1,burnKeys.includes(key)?'Тик Горения':'Тик Шока');if(d.freeze){hit(find(d.freeze.owner),d.freeze.coefficient,[dummyIndex],'Заморозка · урон',{kind:'additional',fixedCritical:1});d.freeze=null;d.distance=5000;record(null,'Разморозка · продвижение 50%');}d.turn++;for(const key of dotKeys)if(d[key]?.expires<=d.turn)d[key]=null;record(null,'Ход болванки '+(dummyIndex+1));runUlts();}
      else if(concertNext){robin.concertoUntil=0;robin.distance=0;record(robin,'Концерт · окончание');runUlts();}
      else if(lordNext)lordTurn();
      else regular(next);
    }
    if(steps>=10000)throw Error('Слишком много событий: проверь скорость и продвижение действий.');
    const total=actors.reduce((sum,a)=>sum+a.total,0);
    return {ids:[...ids],total,per100AV:total/horizon*100,horizon,damageByTarget,initialStats,breakdown:actors.map(a=>({id:a.id,damage:a.total,turns:a.normal,ults:a.ults,followups:a.followups,energy:a.energy,resource:a.resource,currentHP:Math.min(a.currentHP,stat(a).hp),maxHP:stat(a).hp,shield:a.shield?.amount||0})),events,finalSP:sp,maxSP};
  }
  function combinations(values,k){if(!Number.isInteger(k)||k<0||k>values.length)return [];const result=[];function visit(start,current){if(current.length===k){result.push(current);return;}for(let i=start;i<=values.length-(k-current.length);i++)visit(i+1,[...current,values[i]]);}visit(0,[]);return result;}
  function createSearch(core,pool,profiles,scenario,data){
    validateScenario(scenario);if(!Array.isArray(core)||core.length<1||core.length>4||new Set(core).size!==core.length)throw Error('Зафиксируй от 1 до 4 разных персонажей в коре.');
    if(!Array.isArray(pool)||new Set(pool).size!==pool.length)throw Error('В пуле есть повторяющиеся персонажи.');
    for(const id of [...core,...pool])if(!models[id])throw Error('Персонаж пока не поддержан симулятором: '+(data.characters[id]?.name||id));
    const available=(pool.length?pool:Object.keys(models)).filter(id=>!core.includes(id)).sort(),choices=combinations(available,4-core.length);if(!choices.length)throw Error('В пуле недостаточно персонажей для команды из четырёх.');
    const used=[...new Set([...core,...available])];for(const id of used)validateStats(profiles[id]||defaults(id,data));
    let checked=0;const top=[];
    return {total:choices.length,step(batch=2){for(let i=0;i<batch&&checked<choices.length;i++){const ids=[...core,...choices[checked]],result=simulate(ids,profiles,{...scenario,focus:core[0]},data);checked++;top.push(result);top.sort((a,b)=>b.total-a.total);if(top.length>10)top.pop();}return {total:choices.length,checked,done:checked===choices.length,top};}};
  }
  root.HSR_TEAM={models,defaults,validateStats,validateScenario,simulate,combinations,createSearch};
})(typeof window==='undefined'?globalThis:window);
