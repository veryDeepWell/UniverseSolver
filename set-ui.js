(function(){
  const D=window.HSR_DATA,H=window.HSR,T=window.HSR_TEAM,G=window.HSR_EQUIPMENT,E=window.HSR_SETS,$=s=>document.querySelector(s),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const name=id=>H.characterName(D.characters[id],D.paths),asset=path=>D.meta.asset_base+path;
  let state={version:1,characterId:'1220',profiles:{},allies:{},context:[],position:0,focus:'1220',caverns:Object.keys(D.relic_sets).filter(id=>/^1\d\d$/.test(id)),planars:[...G.planar],mixed:false,stableRanking:true,scenario:{enemyLevel:95,targets:1,cycles:3,initialSP:3,energyPercent:50,seed:42,toughness:120,sparxieRefundPercent:20,wolfBoxGift:'cycle',novaAssistPolicy:'crew',externalDebuffs:0,enemyAttacks:'training'}},initialized=false,last=null,worker=null,generation=0,allyEditing=null;
  try{const saved=JSON.parse(localStorage.getItem('universesolver.set-search')||'null');if(saved?.version===1&&T.models[saved.characterId]&&Array.isArray(saved.caverns)&&Array.isArray(saved.planars)&&Array.isArray(saved.context)){state={...state,...saved,scenario:{...state.scenario,...saved.scenario}};}}catch{}
  state.savedBuilds??={};
  state.coneChoices??={};
  state.referenceRatios??={};
  function savedBuilds(){return structuredClone(state.savedBuilds);}
  function removeBuild(characterId,buildId){
    state.savedBuilds[characterId]=(state.savedBuilds[characterId]||[]).filter(build=>build.id!==buildId);
    save();
    document.dispatchEvent(new Event('build-candidates-change'));
  }
  function saveBuild(input,result){
    const profile=E.buildProfile(input,result.pack,result.cone,D);
    const builds=state.savedBuilds[input.characterId]??=[];
    const key=JSON.stringify(profile);
    if(builds.some(build=>JSON.stringify(build.profile)===key))return 'Кандидат уже сохранён.';
    if(builds.length>=8)throw Error('Сохранено 8 кандидатов. Удали лишние в разделе «Команды».');
    builds.push({id:crypto.randomUUID(),profile});
    save();
    document.dispatchEvent(new Event('build-candidates-change'));
    return 'Кандидат доступен в командном поиске.';
  }
  const fields=[['hp','HP без бонусов наборов',1,1000000],['baseHP','Базовое HP (герой + конус)',1,100000],['atk','ATK без бонусов наборов',1,100000],['baseAtk','Базовая ATK (герой + конус)',1,100000],['def','DEF без бонусов наборов',0,100000],['baseDef','Базовая DEF (герой + конус)',1,100000],['speed','Скорость без наборов',1,1000],['baseSpeed','Базовая скорость героя',1,500],['crit','Крит. шанс, %',0,300],['critDamage','Крит. урон, %',0,2000],['damageBonus','Общий бонус урона, %',0,2000],['elementBonus','Бонус своего элемента, %',0,2000],['effectHit','Шанс попадания, %',0,1000],['effectRes','Сопротивление эффектам, %',0,2000],['energyRegen','Восстановление энергии, %',10,1000]];
  fields.push(['breakEffect','Эффект пробития, %',0,2000]);
  fields.push(['elation','Радость до боевых бафов, %',0,2000]);
  const percents=new Set(['crit','critDamage','damageBonus','elementBonus','effectHit','effectRes','energyRegen','breakEffect','elation']);
  function blank(id){const p=T.defaults(id,D);return {...p,baseHP:p.hp,baseDef:p.def,elementBonus:0,effectRes:0};}
  state.referenceMode??={};
  state.farmBoots??={};
  function usesFarm(id){
    const mode=state.referenceMode[id];
    if(mode)return mode==='farm';
    const saved=state.profiles[id];
    return !saved||fields.every(([key])=>Math.abs((saved[key]??0)-(blank(id)[key]??0))<.001);
  }
  const farmCache=new Map();
  function farm(id,includeCone=true,boots='speed'){
    const key=id+':'+includeCone+':'+boots;
    if(!farmCache.has(key))farmCache.set(key,window.HSR_OPT.farmReference(id,window.HSR_RELIC.archetype(id,D),D,includeCone,boots));
    return farmCache.get(key);
  }
  function profile(id){
    if(usesFarm(id))return {...farm(id,!selectedCones().length,state.farmBoots[id]).profile,policy:state.profiles[id]?.policy||'auto'};
    return {...blank(id),...state.profiles[id]};
  }
  function allyProfile(id){let saved={};try{saved=JSON.parse(localStorage.getItem('universesolver.teams')||'{}').profiles?.[id]||{};}catch{}return {...farm(id).profile,...saved,...state.allies[id]};}
  function save(){try{localStorage.setItem('universesolver.set-search',JSON.stringify(state));}catch{const status=$('#set-status');if(status)status.textContent='Не удалось сохранить настройки. Разреши локальное хранение.';}}
  function inputs(ally=false){return fields.map(([key,label,min,max])=>`<label>${ally?label.replace('без бонусов наборов','до боевых бафов').replace('без наборов','до боевых бафов'):label}<input name="${key}" type="number" min="${min}" max="${max}" step=".001" required></label>`).join('');}
  function fill(form,p){for(const [key] of fields)form.elements[key].value=Number(((p[key]??0)*(percents.has(key)?100:1)).toFixed(3));if(form.elements.policy)form.elements.policy.value=p.policy||'auto';}
  function read(form){const p={policy:form.elements.policy?.value||'auto'};for(const [key] of fields)p[key]=Number(form.elements[key].value)/(percents.has(key)?100:1);return p;}
  function init(){
    if(initialized)return;initialized=true;
    $('#set-mode').innerHTML=`<div class="opt-heading"><h1>Кандидаты для билда</h1><span class="opt-mode">Сеты и конусы</span></div><p class="opt-scope">Сравни наборы и конусы на одном эталоне статов. Сохрани несколько подходящих вариантов для командного поиска. Итоговую экипировку каждого героя выберет симуляция состава.</p>
      <section class="opt-panel"><h2>Персонаж и эталонные характеристики</h2><div class="opt-fields"><label>Персонаж<select id="set-character"></select></label><label>Политика действий<select id="set-policy"><option value="auto">По модели персонажа</option><option value="basic">Приоритет базовых атак</option><option value="skill">Навык при наличии SP</option></select></label></div><div class="opt-actions"><button id="set-import-items" type="button">Вычислить статы из текущих предметов</button><button id="set-farm-stats" type="button">Эталон фарма</button><button id="set-reset-stats" type="button">Базовые статы ур. 80</button></div><div class="opt-fields"><label id="set-farm-boots-field">Обувь в эталоне<select id="set-farm-boots"><option value="speed">Скорость</option><option value="scaling">Основной стат урона</option></select></label></div><p id="set-import-note" class="data-meta">Эталон задаёт одинаковые основные и дополнительные статы реликвий для всех пакетов. Перенос из текущих предметов исключает бонусы наборов и, если выбраны конусы-кандидаты, также исключает текущий конус.</p><details class="opt-advanced" open><summary>Характеристики без бонусов наборов</summary><form id="set-stats" class="opt-fields">${inputs()}</form></details></section>
      <section class="opt-panel"><h2>Наборы-кандидаты</h2><div class="opt-checks"><label class="opt-check"><input id="set-mixed" type="checkbox"> Сравнивать также 2+2 пещерных набора</label></div><p class="data-meta">Наборы с меткой «2+2» доступны только как два предмета. Четыре предмета и планарки с нереализованными условиями исключены из рейтинга. Все допустимые выбранные сочетания перебираются без предпочтений по персонажам.</p><div class="opt-section-row"><h3>Пещерные реликвии</h3><div class="opt-actions"><button type="button" data-select-sets="caverns">Все</button><button type="button" data-clear-sets="caverns">Снять выбор</button></div></div><div id="set-caverns" class="set-candidate-grid"></div><div class="opt-section-row"><h3>Планарные украшения</h3><div class="opt-actions"><button type="button" data-select-sets="planars">Все поддержанные</button><button type="button" data-clear-sets="planars">Снять выбор</button></div></div><div id="set-planars" class="set-candidate-grid"></div></section>
      <section class="opt-panel"><h2>Контекст боя</h2><p class="data-meta">Без союзников оценивается сольный урон. Для сетов саппорта добавь фиксированную команду: целью станет её общий урон. Статы союзников можно изменить по кнопке рядом с портретом; первоначально они берутся из раздела «Команды».</p><div id="set-allies" class="set-allies-grid"></div><div class="opt-fields"><label>Позиция героя в команде<select id="set-position"></select></label></div><div id="set-focus" class="team-role-buttons" role="group" aria-label="Получатель адресных бафов"></div><form id="set-scenario" class="opt-fields"><label>Атаки болванок<select name="enemyAttacks"><option value="training">Тренировочные · без потери HP</option><option value="off">Отключены</option></select></label><label>Уровень цели (0 — без DEF)<input name="enemyLevel" type="number" min="0" max="100" step="1" required></label><label>Стойкость каждой болванки<input name="toughness" type="number" min="0" max="1000" step="1" required></label><label>Болванок<input name="targets" type="number" min="1" max="5" step="1" required></label><label>Циклов<input name="cycles" type="number" min="1" max="20" step="1" required></label><label>Начальный SP<input name="initialSP" type="number" min="0" max="5" step="1" required></label><label>Начальная энергия, %<input name="energyPercent" type="number" min="0" max="100" step="1" required></label><label>Коробочка Волка 999<select name="wolfBoxGift"><option value="cycle">Меч → SP → Юмор (сценарий)</option><option value="sword">Всегда меч</option><option value="sp">Всегда возврат SP</option><option value="punchline">Всегда Юмор</option></select></label><label>Поддержка Химеко: Новы<select name="novaAssistPolicy"><option value="crew">Компаньоны Освоения</option><option value="all">Все союзники</option><option value="off">Только сама Химеко</option></select></label><label>Подарок Искры: шанс возврата SP, %<input name="sparxieRefundPercent" type="number" min="0" max="100" step="1" value="20"></label><label>Seed<input name="seed" type="number" min="1" max="2147483647" step="1" required></label><label>Постоянных внешних ослаблений<input name="externalDebuffs" type="number" min="0" max="5" step="1" required></label></form><p class="data-meta">Болванки: бесконечный HP, DEF по уровню, RES 0%, все уязвимости, настраиваемая стойкость с восстановлением и пробитием. 0 стойкости отключает брейк. Тренировочные атаки дают энергию и включают контратаки Клары и Юньли, не расходуя HP и щиты. В расчёт DEF входят поддержанные ослабления и игнорирование защиты от наборов. При уровне 0 защита отключена. Внешние ослабления существуют весь бой, не наносят урон и не считаются DoT.</p></section>
      <section class="opt-panel"><div class="opt-section-row"><h2>Результаты по эталону</h2><span id="set-count"></span></div><label class="opt-check"><input id="set-stable" type="checkbox"> Усреднять урон на соседних длинах боя</label><div class="opt-actions"><button id="set-start" type="button" class="primary">Найти кандидатов</button><button id="set-stop" type="button" disabled>Остановить</button><a href="#teams">К поиску команды →</a></div><progress id="set-progress" value="0" max="1"></progress><p id="set-status" role="status" aria-live="polite"></p><div id="set-results"></div></section>
      <dialog id="set-ally-dialog" aria-labelledby="set-ally-name"><div class="dialog-top"><h2 id="set-ally-name"></h2><button type="button" id="set-close-ally" aria-label="Закрыть статы союзника">✕</button></div><p class="data-meta">Статы союзника фиксированы во всех сравнениях. Его наборы не меняются; введи их постоянные бонусы в характеристики.</p><form id="set-ally-stats"><div class="opt-fields">${inputs(true)}</div><p id="set-ally-error" role="status"></p><button type="submit" class="primary">Сохранить статы союзника</button></form></dialog>`;
    const conePanel=document.createElement('section');
    conePanel.className='opt-panel';
    conePanel.innerHTML='<h2>Конусы-кандидаты</h2><p class="data-meta">Выбери наложение для каждого конуса, который хочешь сравнить. Все конусы ур. 80. При выборе конусов укажи эталонные статы без конуса и бонусов наборов. Процентные бонусы HP, ATK и DEF уже должны входить в итоговые статы эталона. Здесь они нужны, чтобы пересчитать вклад нового конуса.</p><div id="set-cones" class="opt-fields"></div><form id="set-cone-ratios" class="opt-fields"></form>';
    $('#set-planars').closest('section').after(conePanel);
    $('#set-cone-ratios').innerHTML=['hp','atk','def'].map(stat=>
      `<label>Бонус ${stat.toUpperCase()} без конуса, %<input name="${stat}" type="number" min="0" max="1000" step="any" required></label>`
    ).join('');
    $('#set-cone-ratios').addEventListener('change',event=>{
      if(!event.currentTarget.reportValidity())return;
      state.referenceMode[state.characterId]='manual';
      state.referenceRatios[state.characterId]=readConeRatios();
      changed();
    });
    const orderLabel=document.createElement('label');orderLabel.className='character-order';orderLabel.innerHTML='Сортировка<select id="set-ally-order" aria-label="Сортировка союзников">'+window.IconPicker.orderOptions()+'</select>';$('#set-allies').before(orderLabel);$('#set-ally-order').value=window.IconPicker.getCharacterOrder();$('#set-ally-order').addEventListener('change',event=>window.IconPicker.setCharacterOrder(event.target.value));document.addEventListener('character-order-change',()=>{$('#set-ally-order').value=window.IconPicker.getCharacterOrder();render();});
    const modelNote=document.createElement('p');modelNote.id='set-character-notes';modelNote.className='data-meta';$('#set-import-note').before(modelNote);
    for(const id of Object.keys(T.models))$('#set-character').add(new Option(name(id),id));$('#set-character').value=state.characterId;
    fillReference();$('#set-mixed').checked=state.mixed;for(const input of $('#set-scenario').elements)if(input.name)input.value=state.scenario[input.name];
    $('#set-character').addEventListener('change',()=>{state.characterId=$('#set-character').value;state.context=state.context.filter(id=>id!==state.characterId);state.focus=state.characterId;state.position=Math.min(state.position,state.context.length);fillReference();changed();window.USJourney?.render();});
    $('#set-stats').addEventListener('change',()=>{state.referenceMode[state.characterId]='manual';state.profiles[state.characterId]={...read($('#set-stats')),policy:$('#set-policy').value};changed();});$('#set-policy').addEventListener('change',()=>{state.profiles[state.characterId]={...read($('#set-stats')),policy:$('#set-policy').value};changed();});
    $('#set-scenario').addEventListener('change',()=>{for(const input of $('#set-scenario').elements)if(input.name)state.scenario[input.name]=input.tagName==='SELECT'?input.value:Number(input.value);changed();});
    $('#set-position').addEventListener('change',()=>{state.position=Number($('#set-position').value);changed();});$('#set-mixed').addEventListener('change',()=>{state.mixed=$('#set-mixed').checked;changed();});
    for(const button of document.querySelectorAll('[data-select-sets]'))button.addEventListener('click',()=>{const key=button.dataset.selectSets;state[key]=key==='caverns'?Object.keys(D.relic_sets).filter(id=>/^1\d\d$/.test(id)):[...G.planar];changed();});for(const button of document.querySelectorAll('[data-clear-sets]'))button.addEventListener('click',()=>{state[button.dataset.clearSets]=[];changed();});
    $('#set-farm-boots').onchange=event=>{
      state.farmBoots[state.characterId]=event.target.value;
      fillReference();
      changed();
    };
    $('#set-stable').checked=state.stableRanking;
    $('#set-stable').onchange=event=>{state.stableRanking=event.target.checked;changed();};
    $('#set-start').addEventListener('click',start);$('#set-stop').addEventListener('click',()=>cancel(true));$('#set-import-items').addEventListener('click',importItems);$('#set-farm-stats').onclick=()=>{state.referenceMode[state.characterId]='farm';fillReference();changed();};$('#set-reset-stats').addEventListener('click',()=>{state.referenceMode[state.characterId]='manual';state.profiles[state.characterId]=blank(state.characterId);state.referenceRatios[state.characterId]={};fill($('#set-stats'),state.profiles[state.characterId]);changed();});
    $('#set-close-ally').addEventListener('click',()=>$('#set-ally-dialog').close());$('#set-ally-stats').addEventListener('submit',event=>{event.preventDefault();try{const p=read(event.target);p.policy=allyProfile(allyEditing).policy;T.validateStats(p);state.allies[allyEditing]=p;$('#set-ally-dialog').close();changed();}catch(error){$('#set-ally-error').textContent=error.message;}});
    const jumps=document.createElement('div');jumps.className='opt-actions opt-jumps';jumps.innerHTML='<button type="button" data-set-jump="set-caverns">К наборам ↓</button><button type="button" data-set-jump="set-cones">К конусам ↓</button><button type="button" data-set-jump="set-allies">К контексту боя ↓</button><button type="button" data-set-jump="set-start">К результатам ↓</button>';$('#set-mode').querySelector('.opt-scope').after(jumps);for(const button of jumps.children)button.addEventListener('click',()=>$('#'+button.dataset.setJump).scrollIntoView({block:'start'}));
    render();window.IconPicker.refreshAll();
  }
  function fillReference(){
    const id=state.characterId,p=profile(id);
    if(usesFarm(id)){
      state.referenceMode[id]='farm';
      state.referenceRatios[id]={...farm(id,false,state.farmBoots[id]).ratios};
    }
    fill($('#set-stats'),p);
    $('#set-policy').value=p.policy;
  }
  function render(){
    const farmMode=usesFarm(state.characterId);
    $('#set-farm-boots-field').hidden=!farmMode||!['atk','hp','def'].includes(window.HSR_RELIC.archetype(state.characterId,D));
    $('#set-farm-boots').value=state.farmBoots[state.characterId]||'speed';
    $('#set-farm-stats').setAttribute('aria-pressed',String(farmMode));
    $('#set-import-note').textContent=farmMode
      ?'Эталон фарма: реликвии 5★ +15, по восемь средних роллов на предмет, малые следы и основные статы по роли. Если конусы не выбраны, используются базовые статы конуса 4★ без пассива. Для союзников без заданных статов применяется тот же принцип.'
      :'Ручной эталон. Если сравниваешь конусы, введи статы без конуса и бонусов наборов.';
    $('#set-character-notes').textContent=T.models[state.characterId].notes;
    const coneGrid=$('#set-cones');
    coneGrid.replaceChildren();
    const compatibleCones=G.cones.filter(id=>D.light_cones[id].path===D.characters[state.characterId].path);
    for(const id of compatibleCones){
      const label=document.createElement('label');
      label.textContent=D.light_cones[id].name;
      const select=document.createElement('select');
      select.add(new Option('Пропустить','0'));
      for(let rank=1;rank<=5;rank++)select.add(new Option('S'+rank,String(rank)));
      select.value=String(state.coneChoices[state.characterId]?.[id]||0);
      select.onchange=()=>{
        state.coneChoices[state.characterId]??={};
        state.coneChoices[state.characterId][id]=Number(select.value);
        if(usesFarm(state.characterId))fillReference();
        changed();
      };
      label.append(select);
      coneGrid.append(label);
    }
    if(!compatibleCones.length)coneGrid.textContent='Для этого Пути пока доступны кандидаты по сетам.';
    for(const field of $('#set-cone-ratios').elements)
      field.value=(state.referenceRatios[state.characterId]?.[field.name]||0)*100;
    for(const key of ['caverns','planars']){const container=$('#set-'+key);container.replaceChildren();for(const set of Object.values(D.relic_sets).filter(s=>key==='caverns'?/^1\d\d$/.test(s.id):/^3\d\d$/.test(s.id))){const allowed=key==='caverns'||G.planar.includes(set.id),button=document.createElement('button');button.type='button';button.className='set-candidate';button.disabled=!allowed;button.setAttribute('aria-label',`${key==='caverns'?'Пещерный':'Планарный'}: ${set.name}`);button.setAttribute('aria-pressed',String(state[key].includes(set.id)));button.title=set.desc.join('\n');button.innerHTML=`<img src="${esc(asset(set.icon))}" alt="" loading="lazy"><span>${esc(set.name)}</span><small>${!allowed?'Нет модели':key==='caverns'&&!G.supportsFour(set.id,state.characterId)?'2+2':key==='caverns'?'4 / 2+2':'2 предмета'}</small>`;button.addEventListener('click',()=>{state[key]=state[key].includes(set.id)?state[key].filter(id=>id!==set.id):[...state[key],set.id];changed();});container.append(button);}}
    const allies=$('#set-allies');allies.replaceChildren();for(const id of window.IconPicker.sortCharacters(Object.keys(T.models).filter(id=>id!==state.characterId))){const card=document.createElement('div'),p=allyProfile(id);card.className='set-ally';card.innerHTML=`<button type="button" class="set-ally-select" aria-label="Союзник: ${esc(name(id))}" aria-pressed="${state.context.includes(id)}"><img src="${esc(asset(D.characters[id].icon))}" alt="" loading="lazy"><span>${esc(name(id))}</span></button><small>ATK ${H.number(p.atk)} · SPD ${H.number(p.speed)}</small><button type="button" class="set-ally-edit" aria-label="Статы союзника: ${esc(name(id))}">Статы</button>`;card.querySelector('.set-ally-select').addEventListener('click',()=>{if(state.context.includes(id))state.context=state.context.filter(x=>x!==id);else{if(state.context.length===3){$('#set-status').textContent='Можно добавить не более трёх фиксированных союзников.';return;}state.context.push(id);}state.position=Math.min(state.position,state.context.length);changed();});card.querySelector('.set-ally-edit').addEventListener('click',()=>{allyEditing=id;$('#set-ally-name').textContent=name(id);fill($('#set-ally-stats'),allyProfile(id));$('#set-ally-error').textContent='';$('#set-ally-dialog').showModal();});allies.append(card);}
    $('#set-position').replaceChildren();for(let i=0;i<=state.context.length;i++)$('#set-position').add(new Option(String(i+1),String(i)));$('#set-position').value=state.position;
    const ids=[...state.context];ids.splice(state.position,0,state.characterId);if(!ids.includes(state.focus))state.focus=state.characterId;$('#set-focus').replaceChildren();for(const id of ids){const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed',String(id===state.focus));button.innerHTML=`<img src="${esc(asset(D.characters[id].icon))}" alt=""> Бафы → ${esc(name(id))}`;button.addEventListener('click',()=>{state.focus=id;changed();});$('#set-focus').append(button);}
    const patterns=state.caverns.filter(id=>G.supportsFour(id,state.characterId)).length+(state.mixed?state.caverns.length*(state.caverns.length-1)/2:0);$('#set-count').textContent=`${H.number(patterns*state.planars.length*Math.max(1,selectedCones().length),0)} сочетаний`;
  }
  function selectedCones(){
    return Object.entries(state.coneChoices[state.characterId]||{})
      .filter(([id,rank])=>rank&&G.cones.includes(id))
      .map(([id,rank])=>({id,rank}));
  }
  function readConeRatios(){
    return Object.fromEntries([...$('#set-cone-ratios').elements].map(field=>[field.name,Number(field.value)/100]));
  }
  function importItems(){try{const snapshot=JSON.parse(localStorage.getItem('universesolver.optimizer')||'null');if(!snapshot)throw Error('Сначала отметь текущие предметы в режиме «Комбинация».');if(snapshot.config.characterId!==state.characterId)throw Error('Выбранный персонаж не совпадает с персонажем режима «Комбинация».');if(snapshot.config.level!==80)throw Error('Модель боя сейчас рассчитана для персонажа ур. 80.');const items=window.HSR_OPT.slots.map(slot=>snapshot.inventory.find(i=>i.id===snapshot.equipped[slot]&&i.slot===slot));if(items.some(i=>!i))throw Error('Нужны шесть текущих реликвий, по одной на каждый слот.');const compareCones=selectedCones().length>0;const ratios={};const config=compareCones?{...snapshot.config,coneId:''}:snapshot.config;state.referenceMode[state.characterId]='manual';state.profiles[state.characterId]=window.HSR_OPT.sheetWithoutSets(items,config,D,ratios);state.referenceRatios[state.characterId]=ratios;fill($('#set-stats'),state.profiles[state.characterId]);changed();$('#set-import-note').textContent=compareCones?'Перенесены статы реликвий и следов без конуса и бонусов наборов.':'Перенесены статы реликвий, следов и постоянные свойства конуса без бонусов наборов.';}catch(error){$('#set-import-note').textContent=error.message;}}
  function snapshot(){state.profiles[state.characterId]={...read($('#set-stats')),policy:$('#set-policy').value};return {...structuredClone(state),profile:structuredClone(state.profiles[state.characterId]),cones:selectedCones(),coneRatios:readConeRatios(),contextProfiles:Object.fromEntries(state.context.map(id=>[id,allyProfile(id)]))};}
  function cancel(user=false){generation++;if(worker){worker.terminate();worker=null;}if($('#set-start')){$('#set-start').disabled=false;$('#set-stop').disabled=true;}if(user){last=null;$('#set-results').replaceChildren();$('#set-status').textContent='Поиск остановлен. Все сеты не проверены.';}}
  function changed(){cancel();last=null;$('#set-results').replaceChildren();$('#set-progress').value=0;$('#set-status').textContent='Параметры изменены. Запусти сравнение.';save();render();}
  function start(){if(!$('#set-stats').reportValidity()||!$('#set-scenario').reportValidity()||!$('#set-cone-ratios').reportValidity())return;cancel();const input=snapshot();try{E.createSearch(input,D);}catch(error){$('#set-status').textContent=error.message;return;}save();const token=generation;let fallbackStarted=false;$('#set-start').disabled=true;$('#set-stop').disabled=false;$('#set-results').replaceChildren();$('#set-status').textContent='Повторяю бой для каждого сочетания наборов…';
    function receive(progress){if(token!==generation)return;if(progress.error){cancel();$('#set-status').textContent=progress.error;return;}$('#set-progress').max=progress.total;$('#set-progress').value=progress.checked;$('#set-status').textContent=`Симулировано ${progress.checked} / ${progress.total}`;if(progress.done){if(worker){worker.terminate();worker=null;}$('#set-start').disabled=false;$('#set-stop').disabled=true;last={...progress,input};results();}}
    function fallback(){if(fallbackStarted||token!==generation)return;fallbackStarted=true;if(worker){worker.terminate();worker=null;}const search=E.createSearch(input,D);function step(){if(token!==generation)return;try{const progress=search.step(1);receive(progress);if(!progress.done)setTimeout(step,0);}catch(error){receive({error:error.message});}}setTimeout(step,0);}
    try{worker=new Worker('set-worker.js');worker.onmessage=event=>receive(event.data);worker.onerror=event=>{event.preventDefault();fallback();};worker.postMessage(input);}catch{fallback();}
  }
  function results(){const container=$('#set-results');container.innerHTML=`<div class="opt-result-summary"><strong>Кандидаты по эталонному бою</strong><span>Эталон без выбранных бонусов: ${H.number(last.baseline)}. ${last.input.context.length?'Сравнивается общий урон фиксированной команды.':'Сольный тест. Для фарма проверь кандидатов с союзниками.'} Проверены все ${last.total} сочетаний выбранной области. Сохрани варианты, которые хочешь перепроверить с другими союзниками. ${last.input.stableRanking?'Порядок по среднему урону на 100 AV на сроках, указанных под каждым результатом.':''}</span></div>`;
    const shown=[...new Set([...last.top,...last.bestByCone])];
    for(const [index,result] of shown.entries()){const ids=[...new Set(result.pack.cavern),result.pack.planar],counts=G.counts(result.pack),block=document.createElement('details');block.className='set-result';block.open=index===0;block.innerHTML=`<summary>${index<last.top.length?'#'+(index+1):'Лучший для конуса'} · ${result.checkpoints?H.number(result.score)+' / 100 AV · ':''}${H.number(result.total)} урона${!result.checkpoints&&last.baseline>0?` · +${H.number((result.total/last.baseline-1)*100)}% к эталону`:''}</summary>${result.checkpoints?`<p class="data-meta">Среднее за 100 AV: ${H.number(result.score)} · отставание ${H.number(last.top[0].score>0?100*(1-result.score/last.top[0].score):0,1)}% · ${result.checkpoints.map(s=>s.cycles+' ц. — '+H.number(s.total)).join(' / ')}</p>`:''}<p>${result.cone?escapeCone(result.cone):'Статы конуса берутся из эталона'}</p><div class="set-result-icons">${ids.map(id=>`<div><img src="${esc(asset(D.relic_sets[id].icon))}" alt=""><span>${esc(D.relic_sets[id].name)}</span><small>${counts[id]} предмета</small></div>`).join('')}</div><p class="data-meta">На старте боя: HP ${H.number(result.initialStats.hp)} · ATK ${H.number(result.initialStats.atk)} · SPD ${H.number(result.initialStats.speed)} · КШ ${H.number(result.initialStats.crit*100)}% · КУ ${H.number(result.initialStats.critDamage*100)}%. Пороговые и временные эффекты пересчитываются в ходе боя.</p><details><summary>Эффекты наборов</summary>${ids.map(id=>`<p class="game-text"><strong>${esc(D.relic_sets[id].name)}</strong><br>${D.relic_sets[id].desc.slice(0,counts[id]===4?2:1).map(esc).join('<br>')}</p>`).join('')}</details><button type="button" class="set-save-build">Сохранить кандидата для команды</button><p class="data-meta set-build-status" role="status"></p><button type="button" class="set-show-log">Журнал этого варианта</button><button type="button" class="set-to-relics">Оценить реликвии этого набора →</button><div class="set-log" hidden></div>`;block.querySelector('.set-show-log').addEventListener('click',()=>{const box=block.querySelector('.set-log');if(!box.hidden){box.hidden=true;return;}const battle=E.run(last.input,result.pack,D,true,result.cone);box.innerHTML=`<div class="table-wrap"><table><thead><tr><th>AV</th><th>Персонаж</th><th>Действие</th><th>Урон</th><th>SP</th><th>Энергия / ресурс</th><th>Стойкость · экзо</th><th>Духи / состояние</th></tr></thead><tbody>${battle.events.map(event=>`<tr><td>${H.number(event.time)}</td><td>${event.actor==='dummy'?(event.label.startsWith('Аха')?'Аха':event.label.startsWith('Юмор')?'Команда':'Болванки'):esc(name(event.actor))}</td><td>${esc(event.label)}</td><td>${H.number(event.damage)}</td><td>${event.sp}</td><td>${H.number(['1220','1308','1407','1408','1415','1506'].includes(event.actor)?event.resource:event.energy)}${['1014','1015','1404','1412','1223','1224','1413','1504','1512','1513'].includes(event.actor)?' / '+H.number(event.special??event.resource):''}</td><td>${(event.toughness||[]).map((v,i)=>`${i+1}: ${H.number(v)}${event.exo?.[i]?` + ${H.number(event.exo[i])}`:''}`).join(' · ')}</td><td>${esc(event.memory||'')}</td></tr>`).join('')}</tbody></table></div>`;box.hidden=false;});block.querySelector('.set-to-relics').addEventListener('click',()=>window.USJourney.openRelics(last.input.characterId,result.pack));block.querySelector('.set-save-build').onclick=()=>{const status=block.querySelector('.set-build-status');try{status.textContent=saveBuild(last.input,result);}catch(error){status.textContent=error.message;}};container.append(block);}
  }
  function escapeCone(cone){return esc(D.light_cones[cone.id].name)+' · S'+cone.rank;}
  let mode='sets',mounted=false;try{mode=localStorage.getItem('universesolver.build-mode')==='combination'?'combination':'sets';}catch{}
  function switchMode(next){mode=next;try{localStorage.setItem('universesolver.build-mode',next);}catch{}if(!mounted)return;$('#combination-mode').hidden=next!=='combination';$('#set-mode').hidden=next!=='sets';for(const button of document.querySelectorAll('[data-build-mode]'))button.setAttribute('aria-pressed',String(button.dataset.buildMode===next));if(next==='sets')init();}
  window.SetOptimizer={savedBuilds,removeBuild,chooseContext(id,context){init();state.characterId=id;state.context=context.ids.filter(x=>x!==id);state.position=context.ids.indexOf(id);state.focus=context.ids[0];state.scenario={...state.scenario,...context.scenario};state.allies={...state.allies,...structuredClone(context.profiles)};if(context.profiles[id]&&!context.profiles[id].cone&&!selectedCones().length){state.profiles[id]=structuredClone(context.profiles[id]);delete state.referenceMode[id];state.referenceRatios[id]={};}$('#set-character').value=id;fillReference();for(const input of $('#set-scenario').elements)if(input.name)input.value=state.scenario[input.name];changed();window.IconPicker.refreshAll();},snapshot};
  window.BuildModes={mount(){const requested=location.hash.split('/')[1];if(mounted){if(['sets','combination'].includes(requested))switchMode(requested);return;}mounted=true;const root=$('#optimizer'),original=document.createElement('div');original.id='combination-mode';while(root.firstChild)original.append(root.firstChild);root.append(original);const tabs=document.createElement('div');tabs.className='build-mode-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Режим оптимизации');tabs.innerHTML='<button type="button" data-build-mode="combination">Комбинация <small>Свои предметы</small></button><button type="button" data-build-mode="sets">Кандидаты <small>Сеты и конусы</small></button>';root.prepend(tabs);const target=document.createElement('section');target.id='set-mode';root.append(target);for(const button of tabs.children)button.addEventListener('click',()=>{switchMode(button.dataset.buildMode);location.hash='optimizer/'+button.dataset.buildMode;});switchMode(['sets','combination'].includes(requested)?requested:mode);},activateCombination(){switchMode('combination');}};
})();
