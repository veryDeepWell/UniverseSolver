(function () {
  const D = window.HSR_DATA, H = window.HSR, T = window.HSR_TEAM;
  const O = window.HSR_OPT, R = window.HSR_RELIC, G = window.HSR_EQUIPMENT, S = window.HSR_SETS;
  const root = document.querySelector('#plan');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
  const name = id => H.characterName(D.characters[id], D.paths);
  const asset = path => esc(D.meta.asset_base + path);
  const number = (value, digits = 2) => H.number(value, digits);
  const steps = {
    team: ['Кого взять к персонажу?', 'Собери команду вокруг героя.'],
    build: ['Как собрать героя в этой команде?', 'Сравни сеты и конусы в выбранном составе.'],
    relics: ['К каким статам стремиться?', 'Определи приоритеты и проверь свои реликвии.'],
    improve: ['Где докачать готовую команду?', 'Найди ближайшее улучшение для выбранного уровня.']
  };
  const slots = ['Голова', 'Руки', 'Тело', 'Ноги', 'Сфера', 'Верёвка'];
  const coneSources = {
    'Боевой пропуск': '21028 21029 21030 21031 21032 21033 21034 21052 21055 21056 21057 21058 21060 21061 21062 21065',
    'Магазин Герты': '24000 24001 24002 24003 24004 24005 24006',
    'Магазин зеркала': '21021 21022 21023 21024 21025 21026 21027 21035 21036 21037 21038 21039 21040 21041 21050 21064'
  };
  const signatures = {
    1102:'23001', 1003:'23000', 1101:'23003', 1004:'23004', 1104:'23005', 1005:'23006', 1006:'23007',
    1203:'23008',1205:'23009',1204:'23010',1208:'23011',1107:'23002',1209:'23012',1211:'23013',1212:'23014',
    1213:'23015',1112:'23016',1217:'23017',1302:'23018',1303:'23019',1305:'23020',1306:'23021',
    1307:'23022',1304:'23023',1308:'23024',1310:'23025',1309:'23026',1315:'23027',1314:'23028',
    1218:'23029',1221:'23030',1220:'23031',1222:'23032',1317:'23033',1313:'23034',1225:'23035',
    1402:'23036',1401:'23037',1403:'23038',1404:'23039',1407:'23040',1405:'23041',1409:'23042',
    1406:'23043',1408:'23044',1014:'23045',1015:'23046',1410:'23047',1412:'23048',1413:'23049',1321:'23050',
    1414:'23051',1415:'23052',1502:'23053',1501:'23054',1505:'23055',1504:'23056'
  };
  const tiers = [
    ['early', 'Ранний · сюжет и мир'],
    ['initial', 'Начальный · MoC 36 / PF 12 / AS 12'],
    ['mid', 'Средний · Starward'],
    ['high', 'Высший · Арбитраж аномалий 12']
  ];
  const statFields = {
    hp: ['HP', 1], atk: ['Сила атаки', 1], def: ['Защита', 1], speed: ['Скорость', 1],
    crit: ['Крит. шанс', 100], critDamage: ['Крит. урон', 100],
    effectHit: ['Шанс попадания эффектов', 100], breakEffect: ['Эффект пробития', 100],
    energyRegen: ['Восстановление энергии', 100]
  };
  const subFields = {
    HPDelta:['hp'], HPAddedRatio:['hp','baseHP'], AttackDelta:['atk'], AttackAddedRatio:['atk','baseAtk'],
    DefenceDelta:['def'], DefenceAddedRatio:['def','baseDef'], SpeedDelta:['speed'],
    CriticalChanceBase:['crit'], CriticalDamageBase:['critDamage'], StatusProbabilityBase:['effectHit'],
    StatusResistanceBase:['effectRes'], BreakDamageAddedRatioBase:['breakEffect']
  };
  const references = new Map();
  function reference(id, includeCone = true, boots = 'speed', speedBudget) {
    const key = id+'-'+includeCone+'-'+boots+'-'+speedBudget;
    if (!references.has(key)) references.set(key,O.farmReference(id,R.archetype(id,D),D,includeCone,boots,speedBudget));
    return references.get(key);
  }
  const scenarioDefaults = {
    targets:1, cycles:3, enemyLevel:95, toughness:120, initialSP:3, energyPercent:50,
    seed:42, trials:3, externalDebuffs:0, enemyAttacks:'training', requireSustain:true, encounter:'dummy', enemyHP:100000
  };
  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  const oldJourney = read('universesolver.journey');
  const oldInventory = read('universesolver.optimizer');
  const supported = Object.keys(T.models).sort((a,b) => name(a).localeCompare(name(b),'ru'));
  const legacyIds = (oldJourney?.context?.ids || []).filter(id => T.models[id]);
  const state = {
    members: legacyIds, hero: legacyIds.includes(oldJourney?.characterId) ? oldJourney.characterId : legacyIds[0],
    scenario: {...scenarioDefaults, ...oldJourney?.context?.scenario},
    tier: oldJourney?.stage || 'initial', pool:[], builds:{}, actual:{}, boots:{}, eidolons:{}, ex:{},
    inventory:oldInventory?.inventory || [],
    equipped:Object.fromEntries(Object.entries(oldInventory?.builds || {}).map(([id, build]) => [id, build.equipped])),
    ...read('universesolver.plan.v1')
  };
  if (oldInventory?.config?.characterId && !state.equipped[oldInventory.config.characterId]) {
    state.equipped[oldInventory.config.characterId] = oldInventory.equipped || {};
  }
  state.members = [...new Set(state.members.filter(id => T.models[id]))];
  state.scenario = {...scenarioDefaults, ...state.scenario};
  let step, job = 0, report = null, itemSlot = 'HEAD', buildTab = 'sets';
  let storageError = false;
  function save() {
    try {
      localStorage.setItem('universesolver.plan.v1', JSON.stringify(state));
      storageError = false;
    } catch {
      storageError = true;
    }
  }
  const stop = () => { job++; };
  const members = () => state.members.filter(Boolean);
  const hero = () => members().includes(state.hero) ? state.hero : members()[0];
  const complete = () => members().length === 4;
  const live = message => {
    const status = root.querySelector('[data-status]');
    if (status) status.textContent = message;
  };
  const button = (label, action, primary = false) =>
    `<button type="button" data-action="${action}"${primary ? ' class="plan-primary"' : ''}>${label}</button>`;
  function go(to) {
    const hash = 'plan/' + to;
    if (location.hash === '#' + hash) show(to);
    else location.hash = hash;
  }
  function start(id) {
    if (!members().includes(id)) {
      state.members = [id];
      state.pool = state.pool.filter(member => member !== id);
    }
    state.hero = id;
    save();
    go('team');
  }
  function chooseMember(index, id) {
    const next = [...state.members];
    next[index] = id;
    const lineup = next.filter(Boolean);
    if (!T.compatible(lineup)) throw Error('Выбери одну форму каждого персонажа.');
    state.members = lineup;
    if (!members().includes(state.hero)) state.hero = members()[0];
    save();
    show(step);
  }
  function profile(id, useActual = true) {
    const planned = state.builds[id]?.profile || reference(id).profile;
    if (!useActual) return planned;
    if (state.actual[id]) return {...planned, ...state.actual[id]};
    const items = equippedItems(id);
    if (items.every(Boolean)) return itemProfile(id,items);
    return planned;
  }
  const withRanks = (id,profile) => ({...profile,eidolon:state.eidolons[id]||0,exEidolon:Boolean(state.ex[id])});
  const profiles = (ids, useActual = true) => Object.fromEntries(ids.map(id => [id, withRanks(id,profile(id, useActual))]));
  const teamProfiles = ids => Object.fromEntries(ids.map(id => [id,withRanks(id,O.level80TraceProfile(id,D))]));
  const spread = row => row.trials?.count>1 ? `<small>Мин. и макс. урон · ${number(row.trials.min,0)}–${number(row.trials.max,0)}</small>` : '';
  const eidolonModels = T.eidolonModels;
  const distinctForms = new Set(Object.keys(T.models).map(T.canonical)).size;
  const scenario = () => ({...state.scenario, focus:members()[0], allowPartial:true});
  const encounterNotes = settings => settings.encounter==='gepard'
    ? 'Гепард · три фазы, стражи и барьер. Числа и расписание атак пробные, сверка с записью игры ещё не выполнена.'
    : 'Болванки · бесконечное HP и все уязвимости. Параметры задаются в условиях боя.';
  const propertyName = key => esc(D.properties[key]?.name || key);
  const fieldValue = (key, value) => number(value * statFields[key][1]) + (statFields[key][1] === 100 ? '%' : '');
  const portrait = id => `<img src="${D.characters[id].previewSource?esc(D.characters[id].previewSource):asset(D.characters[id].icon)}" alt="" loading="lazy">`;
  function context() {
    const editing = step === 'team' || !complete();
    return `<section class="plan-panel plan-context" aria-labelledby="plan-lineup">
      <div class="plan-panel-head"><h2 id="plan-lineup">Состав команды</h2>${editing ? '' : '<a href="#plan/team">Изменить состав →</a>'}</div>
      <div class="plan-lineup">${Array.from({length:4}, (_, i) => {
        const id = state.members[i];
        if (!id && !editing) return '';
        const selected = id && hero() === id;
        return `<button type="button" class="plan-member" data-action="${editing ? 'slot-'+i : 'hero-'+id}"
          ${!editing ? `aria-pressed="${Boolean(selected)}"` : ''} aria-label="${editing ? 'Место '+(i+1)+': ' : 'Выбрать героя: '}${id ? esc(name(id)) : 'Добавить героя'}">
          ${id ? portrait(id) : '<span class="plan-empty-slot" aria-hidden="true">+</span>'}
          <strong>${id ? esc(name(id)) : 'Добавить героя'}</strong><small>${i === 0 ? 'Получает адресные бафы' : 'Место '+(i+1)}</small></button>`;
      }).join('')}</div>
      <details class="plan-settings"><summary>Условия боя · ${state.scenario.encounter==='gepard'?'Гепард':state.scenario.targets+' цел.'} / ${state.scenario.cycles} ц.</summary>
        <form data-form="scenario" class="plan-fields">
          <label>Противник<select name="encounter"><option value="dummy">Болванки</option><option value="gepard" ${state.scenario.encounter==='gepard'?'selected':''}>Гепард · пробный сценарий</option></select></label>
          <label>HP фазы Гепарда<input name="enemyHP" type="number" min="1" max="10000000" value="${state.scenario.enemyHP}" required></label>
          ${[['targets','Целей',1,5],['cycles','Циклов',1,20],['enemyLevel','Уровень цели (0 = без DEF)',0,100],
            ['toughness','Стойкость цели',0,1000],['initialSP','Начальные очки навыков',0,5],
            ['energyPercent','Начальная энергия, %',0,100],['seed','Seed',1,2147483647],['trials','Прогонов на вариант',1,32]].map(([key,label,min,max]) =>
              `<label>${label}<input name="${key}" type="number" min="${min}" max="${max}" value="${state.scenario[key]}" required></label>`).join('')}
          <label>Атаки целей<select name="enemyAttacks"><option value="training" ${state.scenario.enemyAttacks==='training'?'selected':''}>Тренировочные</option><option value="off" ${state.scenario.enemyAttacks==='off'?'selected':''}>Отключены</option></select></label>
          <button type="submit">Сохранить условия</button>
        </form><p class="plan-muted">${encounterNotes(state.scenario)}</p>
      </details>
    </section>`;
  }
  function home() {
    return `<header class="plan-title"><h1>План команды</h1><p>Выбери задачу, с которой хочешь начать.</p></header>
      <div class="plan-entry-grid">${Object.entries(steps).map(([key,[title,desc]], i) =>
        `<a class="plan-entry" href="#plan/${key}"><span class="plan-index">0${i+1}</span><h2>${title}</h2><p>${desc}</p><span class="plan-arrow" aria-hidden="true">→</span></a>`).join('')}</div>
      ${members().length ? context() : ''}`;
  }
  function teamPage() {
    return `<section class="plan-panel"><h2>Подбор союзников</h2>
      <p>Добавь обязательных героев в состав. Если оставишь места свободными, поиск проверит допустимые варианты из пула.</p>
      <p class="plan-muted">Подбор использует персонажей 80-го уровня с прокачанными следами и выбранными эйдолонами. Конусы и реликвии подбираются на этапе «Билд».</p>
      <div class="plan-actions">${button('Пул: '+(state.pool.length ? state.pool.length+' гер.' : 'весь ростер'), 'pool')}
      <label class="plan-check"><input type="checkbox" data-sustain ${state.scenario.requireSustain?'checked':''}> Обязательный састейн</label></div>
      <p class="plan-muted">Боевые эффекты эйдолонов · ${eidolonModels.size} из ${distinctForms} игровых форм.</p>
      ${members().length ? `<details class="plan-settings"><summary>Эйдолоны состава</summary>
        <p class="plan-muted">Счётчик учитывает формы с отдельной моделью эффектов. Повышения уровней применяются к умениям, коэффициенты которых симулятор берёт из каталога. Эффекты убийств, контроля и смертельного урона зависят от условий боя.</p>
        <div class="plan-fields">${members().map(id=>`<div><label>${esc(name(id))}<select data-eidolon="${id}">
          ${Array.from({length:7},(_,rank)=>`<option value="${rank}" ${(state.eidolons[id]||0)===rank?'selected':''}>E${rank}</option>`).join('')}
        </select></label>${window.HSR_SUPPLEMENTS.ex_eidolons[id]?`<label class="plan-check"><input type="checkbox" data-ex="${id}" ${state.ex[id]?'checked':''}> EX-эйдолон</label>`:''}
        ${complete()&&eidolonModels.has(T.canonical(id))?button('Сравнить E0–E6','rank-estimate-'+id):''}</div>`).join('')}</div></details>`:''}
      <div class="plan-actions">${complete() ? button('Подобрать билд в этом составе →','to-build',true) : button('Найти команды','search-team',true)}
      ${button('Открыть запись боя','open-replay')}
      ${complete() ? button('Сравнить урон состава','search-team') : ''}</div></section>`;
  }
  function buildPage() {
    const id = hero();
    if (!complete()) return emptyTeam('Заполни состав, чтобы сравнить билды в одном бою.');
    const saved = state.builds[id];
    return `<section class="plan-panel"><h2>Билд · ${esc(name(id))}</h2>
      <div class="plan-actions">${button('Подобрать ротацию','search-rotation')}${state.scenario.rotation?button('Вернуть автоматическую ротацию','reset-rotation'):''}</div>
      <details class="plan-settings"><summary>Скорость и экипировка состава</summary>
        <p class="plan-muted">Поиск по бюджетам скорости, выбранным конусам и сетам. В бою проверяются реальные ходы и продвижения.</p>
        <form data-form="tune-team"><label>Кого настроить первым<select name="actor">
        ${members().map(member=>`<option value="${member}" ${member===id?'selected':''}>${esc(name(member))}</option>`).join('')}</select></label>
        <label>Альтернативный пещерный набор для первого героя<select name="cavern"><option value="">Текущий</option>
        ${Object.values(D.relic_sets).filter(set=>/^1\d\d$/.test(set.id)).map(set=>`<option value="${set.id}">${esc(set.name)}</option>`).join('')}</select></label>
        <label>Альтернативное планарное украшение для первого героя<select name="planar"><option value="">Текущее</option>
        ${G.planar.map(id=>`<option value="${id}">${esc(D.relic_sets[id].name)}</option>`).join('')}</select></label>
        <button type="submit">Проверить сборки состава</button></form></details>
      ${state.scenario.rotation?`<p class="plan-muted">${rotationLabel(state.scenario.rotation)}</p>`:''}
      <div class="plan-actions" role="group" aria-label="Разделы билда">
        <button type="button" data-action="build-sets" aria-pressed="${buildTab==='sets'}">Артефакты</button>
        <button type="button" data-action="build-cones" aria-pressed="${buildTab==='cones'}">Конус</button>
      </div>
      ${saved ? `<div class="plan-saved"><strong>Выбранный билд</strong>${packLabel(saved.pack)}<small>${coneLabel(saved.cone)}</small>
        ${saved.speedBudget!==undefined?`<small>${number(saved.profile.speed)} SPD до бонусов сетов · ${saved.boots==='speed'?'обувь на скорость':'обувь на основной стат'} · ${saved.speedBudget} средних роллов скорости</small>`:''}
        ${saved.signature !== buildSignature(id) ? '<small>Состав, условия или экипировка союзников изменились. Перепроверь выбор.</small>' : ''}</div>` : ''}
      ${buildTab==='cones' ? conePage(id) : setForm(id,saved)}
      ${comparisonForm(id,saved)}
      </section>`;
  }
  function setForm(id,saved) {
    return `<p>Сеты сравниваются на одинаковом бюджете сабстатов с выбранными конусами.</p>
      <form data-form="build">
        <div class="plan-fields"><label>Обувь в эталоне<select name="boots"><option value="speed">Скорость</option><option value="scaling" ${state.boots[id]==='scaling'?'selected':''}>Основной стат урона</option></select></label>
        <label class="plan-check"><input name="mixed" type="checkbox" ${state.mixed?'checked':''}> Включить сочетания 2+2</label></div>
        <div class="plan-actions"><button class="plan-primary" type="submit" value="hero">Подобрать герою</button>
        <button type="submit" value="team">Подобрать всей команде</button>${saved?.pack ? button('К целям по статам →','to-relics') : ''}</div>
      </form>`;
  }
  function coneOptions(id) {
    return Object.values(D.light_cones).filter(cone => cone.path===D.characters[id].path);
  }
  function coneLabel(cone) {
    return cone ? esc(D.light_cones[cone.id].name)+' S'+cone.rank+(cone.baseOnly?' · только базовые статы':'') : 'Эталонный конус 4★';
  }
  function conePage(id) {
    const options = coneOptions(id);
    const groups = {'Сигна':signatures[id]||'',...coneSources,'Другие конусы':''};
    const used = new Set(Object.values(groups).flatMap(ids => ids.split(' ')));
    return `<p>Сравнение фиксирует текущий набор реликвий. Где пассив ещё не моделируется, в расчёт идут только базовые HP, ATK и DEF.</p>
      <form data-form="cones"><div class="plan-fields"><label>Наложение для сравнения${rankSelect()}</label></div>
      <div class="plan-actions"><button type="submit" class="plan-primary">Сравнить конусы</button></div></form>
      ${Object.entries(groups).map(([label,ids])=>{
        const rows=options.filter(cone=>ids ? ids.split(' ').includes(cone.id) : label==='Другие конусы'&&!used.has(cone.id));
        return `<details class="plan-settings" ${label==='Другие конусы'?'':'open'}><summary>${label} · ${rows.length}</summary>
          <div class="plan-gear">${rows.map(cone=>`<span><img src="${asset(cone.icon)}" alt="">${esc(cone.name)}${G.cones.includes(cone.id)?'':' · базовые статы'}</span>`).join('')||'<p>Для этого Пути нет вариантов.</p>'}</div></details>`;
      }).join('')}`;
  }
  function rankSelect() {
    return `<select name="rank">${[1,2,3,4,5].map(rank=>`<option value="${rank}">S${rank}</option>`).join('')}</select>`;
  }
  function comparisonForm(id,saved) {
    const sets=Object.values(D.relic_sets).filter(set=>set.id.startsWith('1'));
    const options=list=>list.map(set=>`<option value="${set.id}">${esc(set.name)}</option>`).join('');
    return `<details class="plan-settings"><summary>Сравнить с другим сетом или конусом</summary>
      <p class="plan-muted">Пустое поле сохраняет выбранный вариант. Для комплекта 2+2 выбери второй пещерный набор.</p>
      <form data-form="compare-build"><div class="plan-fields">
      <label>Пещерный набор<select name="first"><option value="">Как в билде</option>${options(sets)}</select></label>
      <label>Второй пещерный набор<select name="second"><option value="">Без второго набора</option>${options(sets)}</select></label>
      <label>Планарный набор<select name="planar"><option value="">Как в билде</option>${options(Object.values(D.relic_sets).filter(set=>set.id.startsWith('3')))}</select></label>
      <label>Конус<select name="cone"><option value="">Как в билде</option><option value="reference">Эталон 4★</option>${coneOptions(id).map(cone=>`<option value="${cone.id}">${esc(cone.name)}${G.cones.includes(cone.id)?'':' · базовые статы'}</option>`).join('')}</select></label>
      <label>Наложение${rankSelect()}</label></div>
      <label class="plan-check"><input type="checkbox" name="optimizeRotation"> Подобрать ротацию выбранного героя отдельно для каждого билда</label>
      <p class="plan-muted">Основа сравнения: ${saved?.pack?'выбранные сеты':'эталон без сетов'} и ${coneLabel(saved?.cone)}.</p>
      <button type="submit">Сравнить урон команды</button></form></details>`;
  }
  function packLabel(pack) {
    return `<div class="plan-gear">${Object.entries(G.counts(pack)).map(([id,count]) =>
      `<span><img src="${asset(D.relic_sets[id].icon)}" alt="">${count} × ${esc(D.relic_sets[id].name)}</span>`).join('')}</div>
      ${pack?.partial?'<small>Часть бонусов набора пока не участвует в расчёте.</small>':''}`;
  }
  function eidolonEstimate(id){
    const usePlan=complete()&&members().includes(id);
    if(!usePlan&&id!=='1511')throw Error('Сначала добавь персонажа в полный состав.');
    const ids=usePlan?members():['1501','1511','1502','1503'];
    const all=usePlan?teamProfiles(ids):Object.fromEntries(ids.map(member=>[member,reference(member).profile]));
    const settings=usePlan?scenario():{...scenarioDefaults,targets:3,cycles:5,focus:ids[0]};
    const rows=Array.from({length:7},(_,rank)=>{
      const result=T.evaluate(ids,{...all,[id]:{...all[id],eidolon:rank}},settings,D);
      const actor=result.breakdown.find(row=>row.id===id);
      return {total:result.total,damage:actor.damage,ults:actor.ults};
    });
    return {rows,team:ids.map(name),cycles:settings.cycles,targets:settings.targets,usePlan};
  }
  function eidolonTable(id){
    const {rows,team,cycles,targets,usePlan}=eidolonEstimate(id);
    const gain=(current,base)=>base?((current>=base?'+':'')+number(100*(current/base-1),1)+'%'):'—';
    return `<p>${usePlan?'Состав из плана':'Пример состава'} · ${esc(team.join(' / '))} · ${targets} цел. / ${cycles} ц.</p>
      <div class="table-wrap"><table aria-label="Прирост от эйдолонов"><thead><tr><th scope="col">Эйдолон</th>
      <th scope="col">Команда к предыдущему</th><th scope="col">Команда к E0</th><th scope="col">Личный урон</th><th scope="col">Ульт</th></tr></thead>
      <tbody>${rows.map(({total,damage,ults},rank)=>`<tr><th scope="row">E${rank}</th><td>${rank?gain(total,rows[rank-1].total):'—'}</td>
      <td>${gain(total,rows[0].total)}</td><td>${number(damage,0)}</td><td>${ults}</td></tr>`).join('')}</tbody></table></div>
      <p class="data-meta">Один сценарий для всех строк. В таблицу входят эффекты, которые работают против тренировочных целей и подключены к симуляции.</p>`;
  }
  function buildSignature(id) {
    return JSON.stringify([members(), state.scenario, state.eidolons[id]||0, Boolean(state.ex[id]),
      members().filter(other => other !== id).map(other => withRanks(other,profile(other)))]);
  }
  function tierTargets(id) {
    const idx = Math.max(0, tiers.findIndex(([key]) => key === state.tier));
    const archetype = R.archetype(id,D);
    const values = {speed:[110,134,134,134][idx]};
    if (['atk','hp','def'].includes(archetype)) {
      values[archetype] = {atk:[1800,2800,3000,3200],hp:[3500,5500,6000,6500],def:[1800,3000,3250,3500]}[archetype][idx];
      values.crit = [.5,.7,.75,.8][idx];
      values.critDamage = [1,1.4,1.6,1.8][idx];
    }
    if (archetype==='break') values.breakEffect = [.8,1.8,2.2,2.5][idx];
    if (archetype==='dot') { values.atk = [1800,2800,3000,3200][idx]; values.effectHit = [.3,.67,.67,.67][idx]; }
    if (archetype==='support') values.hp = [2500,3500,3750,4000][idx];
    if (id==='1511') {
      values.speed=idx<2?125:150;
      values.critDamage=[1,1.4,1.6,1.8][idx];
    }
    if (['1107','1221'].includes(T.canonical(id))) delete values.speed;
    if (['1101','1313'].includes(T.canonical(id))) {
      values.critDamage = [1,1.8,2,2.2][idx];
      values.energyRegen = [1,1.1944,1.1944,1.1944][idx];
    }
    if (state.builds[id]?.boots==='scaling' && values.speed && ['atk','hp','def'].includes(archetype)) {
      values.speed = Math.min(values.speed, Math.floor(state.builds[id].profile.speed));
    }
    for (const key of Object.keys(values)) {
      const custom = oldJourney?.goals?.[id]?.[state.tier]?.[key];
      if (Number.isFinite(custom)) values[key] = custom/statFields[key][1];
    }
    if(state.builds[id]?.speedBudget!==undefined)values.speed=state.builds[id].profile.speed;
    return values;
  }
  function tierControl() {
    return `<label class="plan-tier">Уровень геймплея<select data-tier>
      ${tiers.map(([key,label]) => `<option value="${key}" ${state.tier===key?'selected':''}>${label}</option>`).join('')}</select></label>`;
  }
  const statTargets = id => Object.entries(tierTargets(id)).map(([key,value]) =>
    `<span class="plan-chip">${statFields[key][0]} <strong>${fieldValue(key,value)}</strong></span>`).join('');
  function itemLabel(item) {
    return `${esc(D.relic_sets[item.setId]?.name)} · ${propertyName(item.main)} · +${item.level}`;
  }
  function relicPage() {
    const id = hero();
    if (!id) return emptyTeam('Добавь героя, для которого хочешь проверить статы и предметы.');
    const build = state.builds[id], sample = reference(id,true,build?.boots || state.boots[id],build?.speedBudget).items;
    const equipped = state.equipped[id] || {};
    const available = state.inventory.filter(item => item.slot===itemSlot);
    const priorities = Object.entries(R.defaultWeights(id,D)).filter(([,weight]) => weight > 0).sort((a,b) => b[1]-a[1]).slice(0,4);
    return `<section class="plan-panel"><div class="plan-panel-head"><h2>Цели · ${esc(name(id))}</h2>${tierControl()}</div>
      ${build?.pack ? packLabel(build.pack) : '<p class="plan-muted">Основные статы предложены по роли. Выбранный сет появится здесь после подбора билда.</p>'}
      <div class="plan-chips">${statTargets(id)}</div>
      ${build?.speedBudget!==undefined?`<p>Цель выбранного билда · ${number(build.profile.speed)} SPD до сетовых бонусов и ${build.speedBudget} средних роллов скорости.</p>`:''}
      <p>Приоритет сабстатов по роли: ${priorities.map(([key]) => propertyName(key)).join(' · ')}.</p>
      ${complete() ? button('Проверить приоритеты в бою','rolls') : ''}
      <div class="plan-slots">${sample.map((item,i) => {
        const actual = state.inventory.find(r => r.id===equipped[item.slot]);
        return `<button type="button" data-action="item-slot-${item.slot}" aria-pressed="${item.slot===itemSlot}">
          <strong>${slots[i]}</strong><span>${propertyName(item.main)}</span><small>${actual ? itemLabel(actual) : 'Предмет не введён'}</small></button>`;
      }).join('')}</div>
    </section>
    <section class="plan-panel"><h2>Проверить реликвию · ${slots[O.slots.indexOf(itemSlot)]}</h2>
      <div class="plan-actions">${button('Добавить реликвию','new-item',true)}</div>
      ${available.length ? `<form data-form="compare"><div class="plan-fields">
        <label>Предмет A<select name="a">${available.map(item => `<option value="${esc(item.id)}" ${item.id===equipped[itemSlot]?'selected':''}>${itemLabel(item)}</option>`).join('')}</select></label>
        <label>Предмет B<select name="b"><option value="">Без сравнения</option>${available.map(item => `<option value="${esc(item.id)}">${itemLabel(item)}</option>`).join('')}</select></label></div>
        <div class="plan-actions"><button type="submit">Оценить качество и сравнить</button>${button('Изменить A','edit-item')}
        ${equipped[itemSlot] ? button('Снять текущий предмет','unequip-item') : ''}</div></form>` : '<p class="plan-muted">Добавь текущую или выпавшую вещь. Второй предмет того же слота можно сравнить с первым.</p>'}
      ${complete()&&equippedItems(id).every(Boolean)&&available.some(item=>item.id!==equipped[itemSlot])?
        `<form data-form="farm"><label>Второй слот для совместной замены<select name="second"><option value="">Один слот</option>
        ${O.slots.map((slot,i)=>slot!==itemSlot?`<option value="${slot}">${slots[i]}</option>`:'').join('')}</select></label>
        <div class="plan-actions"><label class="plan-check"><input type="checkbox" name="alternate" checked>
        Проверить также ${state.scenario.encounter==='gepard'?'бой с болванками':'пробный бой с Гепардом'}</label>
        <button type="submit">Проверить замены из инвентаря</button></div></form>`:''}
      ${complete() ? `<div class="plan-actions">${button('Посмотреть, кого докачать →','to-improve')}</div>` : ''}
    </section>`;
  }
  function improvePage() {
    if (!complete()) return emptyTeam('Для сравнения улучшений нужны все четыре участника команды.');
    return `<section class="plan-panel"><div class="plan-panel-head"><h2>Уровень и текущие статы</h2>${tierControl()}</div>
      <p>Сравним недостающие статы и проверим, как на командный урон влияют до трёх средних роллов одной характеристики за раз.</p>
      <div class="plan-stat-cards">${members().map(id => `<div><strong>${esc(name(id))}</strong>
        <small>${state.actual[id] ? 'Статы введены вручную' : equippedItems(id).every(Boolean) ? 'Статы из шести реликвий' : 'Расчётные статы'}</small>
        <div class="plan-actions">${button('Ввести статы','stats-'+id)}${state.actual[id] ? button('Сбросить ручной ввод','reset-stats-'+id) : ''}</div></div>`).join('')}</div>
      <div class="plan-actions">${button('Найти ближайшие улучшения','improve',true)}</div></section>`;
  }
  function emptyTeam(message) {
    return `<section class="plan-panel"><p>${message}</p><a class="plan-primary" href="#plan/team">Выбрать команду →</a></section>`;
  }
  const pages = {team:teamPage, build:buildPage, relics:relicPage, improve:improvePage};
  function show(route) {
    stop();
    report = null;
    const next = Object.hasOwn(steps,route) ? route : 'home';
    const changedPage = step!==next;
    step = next;
    const content = step==='home' ? home() :
      `<header class="plan-title"><a href="#plan">← План команды</a><h1 tabindex="-1">${steps[step][0]}</h1><p>${steps[step][1]}</p></header>
        <nav class="plan-stages" aria-label="Задачи плана">${Object.entries({team:'Состав',build:'Билд',relics:'Статы и реликвии',improve:'Улучшения'}).map(([key,label]) =>
          `<a href="#plan/${key}" ${step===key?'aria-current="step"':''}>${label}</a>`).join('')}</nav>${context()}${pages[step]()}`;
    root.innerHTML = `${content}<p class="plan-status" data-status role="status">${storageError ? 'Браузер не сохранил изменения. План доступен до перезагрузки.' : ''}</p>
      <div data-result></div><dialog data-dialog aria-labelledby="plan-dialog-title"></dialog>`;
    if (changedPage) {
      window.scrollTo(0,0);
      if (step!=='home') root.querySelector('h1').focus({preventScroll:true});
    }
  }

  const resultBox = () => root.querySelector('[data-result]');
  function results(title, body) {
    resultBox().innerHTML = `<section class="plan-panel" aria-labelledby="plan-result-title">
      <h2 id="plan-result-title" tabindex="-1">${title}</h2>${body}</section>`;
    root.querySelector('#plan-result-title').focus();
  }
  async function search(makeSearch, done) {
    stop();
    const current = job;
    report = null;
    resultBox().innerHTML = `<div class="plan-actions"><progress aria-label="Прогресс перебора"></progress>${button('Остановить','stop')}</div>`;
    live('Подготовка перебора…');
    try {
      const engine = makeSearch();
      let progress;
      do {
        await new Promise(resolve => setTimeout(resolve,0));
        if (current!==job) return;
        const deadline = performance.now()+14;
        do { progress = engine.step(1); } while (!progress.done && performance.now()<deadline);
        const bar = resultBox().querySelector('progress');
        bar.max = progress.total;
        bar.value = progress.checked;
        live(`Проверено ${number(progress.checked,0)} из ${number(progress.total,0)}. `);
      } while (!progress.done);
      done(progress);
    } catch (error) {
      resultBox().replaceChildren();
      live(error.message);
    }
  }
  function searchTeam() {
    const core = members();
    const settings = {...state.scenario,rotation:undefined,focus:core[0]};
    if (!core.length) throw Error('Сначала добавь героя в состав.');
    const pool = state.pool.filter(id => !core.includes(id));
    if (state.pool.length && pool.length < 4-core.length) throw Error('Добавь больше свободных героев в пул.');
    search(() => {
      const ids = [...new Set([...core,...(pool.length ? pool : supported)])];
      return T.createSearch(core,pool,teamProfiles(ids),settings,D);
    }, result => {
      report = {kind:'team',rows:result.top,settings};
      results('Результаты подбора', `<p class="plan-muted">Средний урон за ${settings.cycles} ц. · прогонов на состав: ${settings.trials}. Персонажи 80-го уровня с прокачанными следами и выбранными эйдолонами, без экипировки.</p>
        <div class="plan-results">${result.top.map((row,i) => `<article><div class="plan-panel-head"><strong>${i+1}. ${row.ids.map(id => esc(name(id))).join(' · ')}</strong><span>${number(row.total,0)} урона</span></div>
          ${spread(row)}${encounterSummary(row)}
          <p>${row.breakdown.map(unit=>`${esc(name(unit.id))} · ${number(unit.damage,0)} урона · ${number(unit.ults,1)} ульт`).join(' / ')}</p>
          ${row.aha ? `<p>Аха · ходов: ${row.aha.turns} · Юмор в конце боя: ${number(row.aha.punchline)}</p>` : ''}
          <div class="plan-mini-lineup">${row.ids.map(portrait).join('')}</div>
          <div class="plan-actions">${button('Выбрать состав и подобрать билд →','use-team-'+i,true)}${button('Журнал боя','team-replay-'+i)}</div></article>`).join('')}</div>`);
    });
  }
  function buildInput(id,cone,boots,contextProfiles=profiles(members()),speedBudget=state.builds[id]?.speedBudget){
    const farm=reference(id,!cone,boots,speedBudget);
    return {
      characterId:id, profile:withRanks(id,farm.profile), context:members().filter(member=>member!==id), contextProfiles,
      position:members().indexOf(id), focus:members()[0], scenario:{...state.scenario},
      caverns:Object.keys(D.relic_sets).filter(set=>/^1\d\d$/.test(set)), planars:G.planar,
      cones:cone?[cone]:[], coneRatios:farm.ratios, mixed:state.mixed
    };
  }
  const chosenCone = (id,rank) => ({id,rank,baseOnly:!G.cones.includes(id)});
  function saveEquipment(id,pack,cone,boots,speedBudget=state.builds[id]?.speedBudget) {
    const input=buildInput(id,cone,boots,{},speedBudget);
    state.builds[id]={pack,cone,boots,speedBudget,profile:S.buildProfile(input,pack,cone,D)};
  }
  function compareEquipment(id,pack,cone,boots){
    return S.run(buildInput(id,cone,boots),pack,D,false,cone);
  }
  function searchCones(rank){
    const id=hero(), saved=state.builds[id], pack=saved?.pack||null, boots=saved?.boots||state.boots[id];
    const rows=coneOptions(id).map(option=>{
      const cone=chosenCone(option.id,rank);
      const {total,encounter}=compareEquipment(id,pack,cone,boots);
      return {cone,total,encounter};
    }).sort(T.compareResults);
    report={kind:'cones',rows,pack,boots};
    results('Конусы в выбранном составе', `<p class="plan-muted">Одинаковые реликвии и условия боя для всех конусов.</p>
      <div class="plan-results">${rows.map(({cone,total,encounter},i)=>`<article><div class="plan-panel-head">
        <div class="plan-gear"><span><img src="${asset(D.light_cones[cone.id].icon)}" alt="">${coneLabel(cone)}</span></div>
        <strong>${number(total,0)} урона</strong></div>${encounterSummary({encounter})}${button('Выбрать конус','use-cone-'+i)}</article>`).join('')}</div>`);
  }
  function compareBuild(form) {
    const id=hero(), saved=state.builds[id], boots=saved?.boots||state.boots[id];
    const first=form.get('first'), second=form.get('second'), planar=form.get('planar');
    let pack=saved?.pack||null;
    if(first||second||planar){
      const primary=first||pack?.cavern[0], ornament=planar||pack?.planar;
      if(!primary||!ornament)throw Error('Выбери пещерный и планарный наборы.');
      const cavern=first||second?[primary,primary,second||primary,second||primary]:pack.cavern;
      pack={cavern,planar:ornament};
      if(!G.planar.includes(ornament)||(cavern.every(set=>set===primary)&&!G.supportsFour(primary,id)))pack.partial=true;
    }
    const selection=form.get('cone');
    const cone=selection==='reference'?null:selection?chosenCone(selection,Number(form.get('rank'))):saved?.cone||null;
    const inputs=[buildInput(id,saved?.cone||null,boots),buildInput(id,cone,boots)];
    const packs=[saved?.pack||null,pack],cones=[saved?.cone||null,cone];
    const battles=inputs.map((input,index)=>S.battleArguments(input,packs[index],D,cones[index]));
    if(form.has('optimizeRotation')){
      let index=0,finished=0,engine;
      const rules=[];
      search(()=>{
        const searches=battles.map(({ids,profiles,scenario})=>T.createRotationSearch(ids,profiles,scenario,D,id));
        const total=searches.reduce((sum,item)=>sum+item.total,0);
        return {step(){
          engine??=searches[index];
          const progress=engine.step(1),checked=finished+progress.checked;
          if(progress.done){
            const best=progress.top[0];
            rules.push(T.compareResults(best,progress.baseline)<0?best.rotation:undefined);
            finished=checked;
            index++;
            engine=null;
          }
          return {total,checked,done:index===searches.length};
        }};
      },()=>{
        const tuned=battles.map((input,i)=>({...input,scenario:{...input.scenario,rotation:rules[i]}}));
        showBuildComparison(tuned,saved,pack,cone,boots,true);
      });
      return;
    }
    showBuildComparison(battles,saved,pack,cone,boots,false);
  }
  function showBuildComparison(battles,saved,pack,cone,boots,optimized){
    const {rows:comparisons,method,outcomes,count,interval}=T.compareBattles(...battles,D);
    const [base,other]=comparisons.map(row=>row.total);
    const replays=battles.map(({ids,profiles,scenario})=>T.battleInput(ids,profiles,{...scenario,rollCrits:true},D));
    const signed=value=>`${value>0?'+':''}${number(value)}`;
    const change=base? `${signed(100*(other-base)/base)}% командного урона` : `${signed(other-base)} урона`;
    const precision=method==='exact'
      ? `Точное матожидание в рамках симулятора · исходов ${outcomes.join(' / ')}.`
      : `${count} парных прогонов. ${interval
        ? interval.lower===interval.upper
          ? 'Во всех прогонах получилась одинаковая разница. Редкие исходы могли не попасть в выборку.'
          : `Приблизительный 95% интервал разницы в уроне от ${signed(interval.lower)} до ${signed(interval.upper)}.${interval.lower<=0&&interval.upper>=0?' Интервал включает ноль. Преимущество по урону пока не подтверждено.':''}`
        : 'Для оценки разброса увеличь число прогонов в условиях боя.'}`;
    const encounterDetails=method==='exact'&&comparisons[0].encounter
      ? comparisons.map(({encounter},index)=>`<small>${index?'Вариант':'Текущий'} · вероятность победы ${number(encounter.wins*100)}%</small>`).join('<br>')
      : comparisons.map(encounterSummary).join('');
    report={kind:'compare-build',pack,cone,boots,replays,optimized};
    results('Сравнение билдов', `<div class="plan-stat-cards">
      <div><strong>Текущий · ${number(base,0)} урона</strong>${packLabel(saved?.pack)}<small>${coneLabel(saved?.cone)}</small></div>
      <div><strong>Вариант · ${number(other,0)} урона</strong>${packLabel(pack)}<small>${coneLabel(cone)}</small></div></div>
      <p><strong>${change}</strong></p>
      <p class="plan-muted">${precision}</p>
      ${optimized?`<p>Ротации подобраны на той же серии прогонов. Для независимой проверки можно сменить seed.</p>
        <p>Текущий · ${battles[0].scenario.rotation?rotationLabel(battles[0].scenario.rotation):'Автоматическая'}<br>
        Вариант · ${battles[1].scenario.rotation?rotationLabel(battles[1].scenario.rotation):'Автоматическая'}</p>`:''}
      ${encounterDetails}
      <p class="plan-muted">Журналы показывают отдельный прогон с выбранным seed.</p>
      <div class="plan-actions">${button('Журнал текущего билда','build-replay-0')}${button('Журнал варианта','build-replay-1')}${button('Сохранить вариант','use-comparison',true)}</div>`);
  }
  function searchTeamSets() {
    const ids=members(), context=profiles(ids), pending=[];
    const inputs=ids.map(id=>buildInput(id,state.builds[id]?.cone,state.boots[id],context));
    const total=inputs.reduce((sum,input)=>sum+S.packs(input.caverns,input.planars,input.mixed,D,input.characterId).length,0);
    let index=0, finished=0, engine;
    search(()=>({step(){
      const input=inputs[index];
      engine??=S.createSearch(input,D);
      const progress=engine.step(1), checked=finished+progress.checked;
      if(progress.done){
        const row=progress.top[0], id=input.characterId;
        context[id]=S.buildProfile(input,row.pack,row.cone,D);
        pending.push({id,pack:row.pack,cone:row.cone,boots:state.boots[id]});
        index++;
        finished=checked;
        engine=null;
      }
      return {total,checked,done:index===inputs.length};
    }}),()=>{
      report={kind:'team-build',rows:pending};
      const before=T.evaluate(ids,profiles(ids),scenario(),D).total;
      const after=T.evaluate(ids,context,scenario(),D).total;
      results('Реликвии для всей команды', `<p>Подбор по очереди в порядке состава. Каждый следующий герой сравнивается с уже подобранными сетами союзников.</p>
        <p>Командный урон · <strong>${number(before,0)} → ${number(after,0)}</strong></p>
        <div class="plan-results">${pending.map(row=>`<article><strong>${esc(name(row.id))}</strong>${packLabel(row.pack)}<small>${coneLabel(row.cone)}</small></article>`).join('')}</div>
        <div class="plan-actions">${button('Сохранить сеты всей команды','use-team-build',true)}</div>`);
    });
  }
  function tuneTeam(form) {
    const ids=members(), actor=form.get('actor');
    if(!ids.includes(actor))throw Error('Выбери участника состава.');
    const settings=scenario(), baseline=profiles(ids,false);
    const alternateCavern=form.get('cavern'),alternatePlanar=form.get('planar');
    const order=[actor,...ids.filter(id=>id!==actor)];
    const options=Object.fromEntries(order.map(id=>{
      const saved=state.builds[id],pack=saved?.pack||null;
      const packs=[pack];
      if(id===actor&&(alternateCavern||alternatePlanar)){
        const cavern=alternateCavern?Array(4).fill(alternateCavern):pack?.cavern;
        const planar=alternatePlanar||pack?.planar;
        if(!cavern||!planar)throw Error('Выбери оба набора, если у первого героя ещё нет полного комплекта.');
        if(alternateCavern&&!G.supportsFour(alternateCavern,id))throw Error('Для этого героя бонус четырёх частей выбранного набора пока недоступен.');
        if(JSON.stringify([cavern,planar])!==JSON.stringify([pack?.cavern,pack?.planar]))packs.push({cavern,planar});
      }
      const cones=[saved?.cone||null];
      if(saved?.cone)cones.push(null);
      const signature=(signatures[id]||'').split(' ').find(cone=>D.light_cones[cone]?.path===D.characters[id].path&&G.cones.includes(cone));
      if(signature&&saved?.cone?.id!==signature)cones.push(chosenCone(signature,1));
      const variants=[];
      for(const boots of ['speed','scaling'])for(let speedBudget=0;speedBudget<=12;speedBudget++){
        for(const cone of cones){
          const farm=reference(id,!cone,boots,speedBudget);
          const input={characterId:id,profile:withRanks(id,farm.profile),coneRatios:farm.ratios};
          for(const candidate of packs)variants.push({id,pack:candidate,cone,boots,speedBudget,profile:S.buildProfile(input,candidate,cone,D)});
        }
      }
      return [id,variants];
    }));
    search(()=>S.createLineupSearch(order,baseline,options,settings,D,ids),result=>{
      const before={ids,profiles:baseline,scenario:settings};
      const after={ids,profiles:result.profiles,scenario:settings};
      const validationSeed=1+((settings.seed-1+1000000007)%2147483647);
      const validation=[before,after].map(input=>({...input,scenario:{...settings,seed:validationSeed}}));
      const sampled=T.compareBattles(...validation,D,{preferExact:false});
      const journals=[before,after].map(({ids,profiles,scenario})=>T.battleInput(ids,profiles,{...scenario,rollCrits:true},D));
      const logs=journals.map(input=>T.replayBattle(input,D));
      const opening=battle=>battle.events.filter(event=>event.kind==='turn').slice(0,8)
        .map(event=>esc(name(event.actor))+' '+number(event.time,1)+' AV').join(' → ');
      const chosen=Object.values(result.chosen);
      const validationGain=sampled.rows[0].total?100*(sampled.rows[1].total/sampled.rows[0].total-1):null;
      report={kind:'tune-team',chosen,journals};
      results('Скорость и экипировка состава',`
        <p>Проверено ${result.checked} вариантов. Один проход по героям: ${order.map(id=>esc(name(id))).join(' → ')}.</p>
        <p>На героя проверены два основных стата обуви, 0–12 средних роллов скорости, текущий конус, эталон 4★ и моделируемая сигна S1 при наличии. ${alternateCavern||alternatePlanar?'Для первого героя проверен и выбранный альтернативный комплект. ':''}Ротация фиксирована.</p>
        <p>Средний урон при подборе · <strong>${number(result.before.total,0)} → ${number(result.after.total,0)}</strong></p>
        <p>Средний урон на проверочной серии · <strong>${number(sampled.rows[0].total,0)} → ${number(sampled.rows[1].total,0)}</strong>
          ${validationGain===null?'':` · ${validationGain>0?'+':''}${number(validationGain,1)}%`}</p>
        ${sampled.rows.map(encounterSummary).join('')}
        ${sampled.interval&&sampled.interval.lower!==sampled.interval.upper?`<p>Приблизительный 95% интервал парной разницы · ${number(sampled.interval.lower,0)} … ${number(sampled.interval.upper,0)} урона.${sampled.interval.lower<=0&&sampled.interval.upper>=0?' Преимущество по урону пока не подтверждено.':''}</p>`:'<p>Для оценки разброса по урону нужны прогоны с различающимися исходами.</p>'}
        <p class="plan-muted">Проверочная серия использует отдельный seed. Журналы показывают первый прогон серии подбора.</p>
        <p><strong>Ходы в первом прогоне</strong><br>Текущий · ${opening(logs[0])||'—'}<br>Новый · ${opening(logs[1])||'—'}</p>
        <div class="plan-results">${chosen.map(row=>`<article><strong>${esc(name(row.id))} · ${number(baseline[row.id].speed)} → ${number(row.profile.speed)} SPD до бонусов сетов</strong>
          <p>${row.boots==='speed'?'Обувь на скорость':'Обувь на основной стат'} · средних роллов скорости ${row.speedBudget}</p>
          ${packLabel(row.pack)}<small>${coneLabel(row.cone)}</small></article>`).join('')}</div>
        <div class="plan-actions">${button('Журнал текущего состава','tune-replay-0')}${button('Журнал нового состава','tune-replay-1')}
        ${chosen.length?button('Сохранить сборки и цели SPD','use-tuning',true):'Улучшений в проверенной области не найдено.'}</div>`);
    });
  }
  function searchBuild(form,wholeTeam) {
    const id = hero();
    const boots = form.get('boots');
    state.boots[id] = boots;
    state.mixed = form.has('mixed');
    save();
    if(wholeTeam){ searchTeamSets(); return; }
    const input=buildInput(id,state.builds[id]?.cone,boots);
    const signature = buildSignature(id);
    search(() => S.createSearch(input,D), result => {
      const top = result.top[0].score;
      const rows = [...new Set([...result.top.slice(0,6),...result.bestByCone])].sort((a,b) => a.encounter?T.compareResults(a,b):b.score-a.score);
      report = {kind:'build',rows,input,boots,signature};
      results('Кандидаты для этого состава', `<p class="plan-muted">Средний командный урон за ${input.scenario.cycles} ц. · прогонов на вариант: ${input.scenario.trials}. Для выбранного героя используются эталонные статы, чтобы сравнить бонусы сетов на равных.</p>
        <div class="plan-results">${rows.map((row,i) => {
          const gap = top&&!row.encounter ? 100*(1-row.score/top) : 0;
          return `<article><div class="plan-panel-head"><strong>${i+1}. ${number(row.score,0)} урона</strong>${row.encounter?'':`<span>${gap>0 && gap<.01 ? 'Отставание < 0,01%' : gap>0 ? 'Отставание '+number(gap)+'%' : 'Лучший результат'}</span>`}</div>
            ${packLabel(row.pack)}<p>${coneLabel(row.cone)}</p>
            ${spread(row)}${encounterSummary(row)}
            ${row.checkpoints ? `<small>${row.checkpoints.map(sample => sample.cycles+' ц. · '+number(sample.total,0)).join(' / ')}</small>` : ''}
            ${button('Сохранить билд и перейти к статам →','use-build-'+i,true)}</article>`;
        }).join('')}</div>`);
    });
  }
  function dialog(title, body) {
    const modal = root.querySelector('[data-dialog]');
    modal.innerHTML = `<div class="plan-panel-head"><h2 id="plan-dialog-title">${title}</h2><button type="button" data-action="close" aria-label="Закрыть">✕</button></div>${body}<p class="plan-status" role="status" data-dialog-error></p>`;
    if (!modal.open) modal.showModal();
    return modal;
  }
  function replayTeam(index) {
    const row=report.rows[index],settings=report.settings;
    showReplay(T.battleInput(row.ids,row.profiles,{...settings,rollCrits:true},D));
  }
  function rotationLabel(rule) {
    const action={basic:'базовая',skill:'навык'};
    const details=[
      rule.opening?.map(key=>action[key]).join(' → '),
      rule.reserve&&'резерв SP '+rule.reserve,
      rule.ultimate&&'ульт после атакующего бафа',
      rule.ally&&'цель среди союзников '+name(rule.ally),
      rule.enemy&&'враг с наименьшим текущим HP'
    ].filter(Boolean);
    return esc(name(rule.actor)+' · '+(details.join(' · ')||'автоматическая ротация'));
  }
  function searchRotation() {
    const ids=members(),all=profiles(ids),settings=scenario(),actor=hero();
    search(()=>T.createRotationSearch(ids,all,settings,D,actor),result=>{
      report={kind:'rotation',rows:result.top,ids,profiles:all,settings};
      results('Ротации · '+esc(name(actor)),`
        <p>Проверено ${result.total} правил для выбранного героя. Состав, билды и серия seed одинаковы. Первые два хода задают приоритет, а игра навыком зависит от доступных SP и состояния героя.</p>
        <p>Автоматическая ротация · ${number(result.baseline.total,0)} урона</p>${encounterSummary(result.baseline)}
        <div class="plan-results">${result.top.map((row,i)=>`<article><strong>${rotationLabel(row.rotation)}</strong>
          <p>${number(row.total,0)} урона</p>${spread(row)}${encounterSummary(row)}
          <div class="plan-actions">${button('Журнал боя','rotation-replay-'+i)}${button('Применить к билдам','use-rotation-'+i)}</div>
        </article>`).join('')}</div>`);
    });
  }
  function encounterSummary(row) {
    const fight=row.encounter;
    if(!fight)return '';
    if(fight.count)return `<p>Победы ${fight.wins}/${fight.count} · среднее завершение ${number(fight.meanFinishAV,1)} AV · фаз пройдено ${number(fight.meanPhases,1)}/3</p>`;
    const result={victory:'Победа',defeat:'Поражение',timeout:'Лимит циклов'}[fight.result];
    return `<p>${result} · ${number(fight.finishAV,1)} AV · фаз пройдено ${fight.phasesCleared}/3 · в строю ${fight.survivors}</p>`;
  }
  function showReplay(input) {
    const battle=T.replayBattle(input,D),settings=input.scenario,row=input;
    dialog('Журнал боя', `<p>Прогон 1 из ${settings.trials??1} · seed ${settings.seed} · ${number(battle.total,0)} урона.</p>
      ${encounterSummary(battle)}
      <p class="plan-muted">Движок ${esc(input.battleVersion)} · данные ${esc(input.dataVersion)}. ${encounterNotes(settings)}</p>
      <details><summary>Запись для повторного прогона</summary><textarea readonly rows="6" aria-label="Запись боя в JSON">${esc(JSON.stringify(input,null,2))}</textarea></details>
      <p>${settings.encounter==='gepard'?'Гепард':settings.targets+' цел.'} · ${settings.cycles} ц. · ур. цели ${settings.enemyLevel} · стойкость ${settings.toughness} · начальные SP ${settings.initialSP}</p>
      <details><summary>Статы и эйдолоны участников</summary><ul>${row.ids.map(id=>{
        const p=row.profiles[id];
        return `<li>${esc(name(id))} · E${p.eidolon||0}${p.exEidolon?' + EX':''} · ATK ${number(p.atk,0)} · SPD ${number(p.speed,1)}
          · крит. шанс ${number(p.crit*100,1)}% · крит. урон ${number(p.critDamage*100,1)}%</li>`;
      }).join('')}</ul></details>
      <ol>${battle.events.map(event=>`<li>${number(event.time,1)} AV · ${event.actor==='dummy'?'Противник':esc(name(event.actor))} · ${esc(event.label)}
        ${event.targets?.length?` · цели ${event.targets.map(i=>i+1).join(', ')}`:''}
        ${event.before!==undefined?` · ${event.before} → ${event.after}`:''}
        ${event.reason?` · ${esc(event.reason)}`:''}
        ${event.waitAV!==undefined?` · ожидание ${number(event.waitAV,1)} AV`:''}
        ${event.hpLoss!==undefined?` · −${number(event.hpLoss,0)} HP`:''}
        ${event.damage? ` · ${number(event.damage,0)} урона` : ''}${event.crits?.length? ` · криты ${event.crits.filter(Boolean).length}/${event.crits.length}` : ''} · SP ${event.sp}</li>`).join('')}</ol>`);
  }
  function picker(index) {
    const pool = index===null;
    const draft = new Set(state.pool);
    const modal = dialog(pool ? 'Пул доступных героев' : 'Выбрать персонажа',
      `<label>Поиск по имени<input type="search" data-picker-search autofocus></label>
      <div class="plan-fields">
        <label>Путь<select data-picker-path><option value="">Все пути</option>${Object.entries(D.paths).filter(([,path])=>path.name).map(([id,path])=>`<option value="${id}">${esc(path.name)}</option>`).join('')}</select></label>
        <label>Элемент<select data-picker-element><option value="">Все элементы</option>${Object.entries(D.elements).map(([id,element])=>`<option value="${id}">${esc(element.name)}</option>`).join('')}</select></label>
        <label>Редкость<select data-picker-rarity><option value="">Любая</option><option value="4">4★</option><option value="5">5★</option></select></label>
        ${pool?'<label class="plan-check"><input type="checkbox" data-picker-selected> Только выбранные</label>':''}
      </div>
      <div class="plan-picker" data-picker></div>
      <div class="plan-actions">${pool ? '<button type="button" data-picker-save class="plan-primary">Сохранить пул</button><button type="button" data-picker-clear>Очистить выбор</button>' : state.members[index] ? '<button type="button" data-picker-clear>Освободить место</button>' : ''}</div>`);
    const input = modal.querySelector('[data-picker-search]');
    const grid = modal.querySelector('[data-picker]');
    const options = supported.filter(id => !state.members.some((other,i) => other===id && i!==index));
    const names = id => `${name(id)} ${D.paths[D.characters[id].path]?.name||''} ${D.english_names?.[id]||''}`.toLocaleLowerCase('ru');
    function filter() {
      const query = input.value.trim().toLocaleLowerCase('ru');
      const path=modal.querySelector('[data-picker-path]').value, element=modal.querySelector('[data-picker-element]').value;
      const rarity=modal.querySelector('[data-picker-rarity]').value, selected=modal.querySelector('[data-picker-selected]')?.checked;
      grid.innerHTML = options.filter(id=>{
        const c=D.characters[id];
        return names(id).includes(query)&&(!path||c.path===path)&&(!element||c.element===element)&&
          (!rarity||String(c.rarity)===rarity)&&(!selected||draft.has(id));
      }).map(id=>{
        const c=D.characters[id], pathName=D.paths[c.path]?.name, elementName=D.elements[c.element]?.name;
        return `<button type="button" data-pick="${id}" ${pool ? `aria-pressed="${draft.has(id)}"` : ''}><span class="plan-picker-art">${portrait(id)}
          <span class="plan-picker-badge" title="${esc(pathName)}">${icon('path',c.path)}</span><span class="plan-picker-badge" title="${esc(elementName)}">${icon('element',c.element)}</span></span>
          <strong>${esc(name(id))}</strong><small>${esc(pathName)} · ${esc(elementName)}</small></button>`;
      }).join('') || '<p>Персонажи не найдены.</p>';
    }
    grid.onclick = event => {
      const btn = event.target.closest('[data-pick]');
      if (!btn) return;
      const id = btn.dataset.pick;
      if (pool) {
        if (draft.has(id)) draft.delete(id);
        else draft.add(id);
        btn.setAttribute('aria-pressed',String(draft.has(id)));
        if(modal.querySelector('[data-picker-selected]')?.checked)filter();
      } else {
        try { chooseMember(index,id); }
        catch (error) { modal.querySelector('[data-dialog-error]').textContent = error.message; }
      }
    };
    input.oninput = filter;
    for(const field of modal.querySelectorAll('select,[data-picker-selected]'))field.onchange=filter;
    const clear = modal.querySelector('[data-picker-clear]');
    if (clear) clear.onclick = () => {
      if (pool) { draft.clear(); filter(); }
      else chooseMember(index,null);
    };
    if (pool) modal.querySelector('[data-picker-save]').onclick = () => {
      state.pool = [...draft];
      save();
      show(step);
    };
    filter();
    input.focus();
  }
  function equippedItems(id) {
    return O.slots.map(slot => state.inventory.find(item => item.slot===slot && item.id===state.equipped[id]?.[slot]));
  }
  function itemProfile(id,items) {
    const build = state.builds[id], cone = build?.cone;
    const farm = reference(id,!cone,build?.boots,build?.speedBudget);
    const ratios = {};
    let result = O.sheetWithoutSets(items,farm.config,D,ratios);
    if (cone) result = G.coneProfile(id,result,cone,ratios,D);
    else {
      for (const [stat,base] of [['hp','baseHP'],['atk','baseAtk'],['def','baseDef']]) {
        const added = farm.profile[base]-result[base];
        result[base] += added;
        result[stat] += added*(1+ratios[stat]);
      }
    }
    const setIds = items.map(item => item.setId);
    result.equipment = {cavern:setIds.slice(0,4),planars:setIds.slice(4)};
    G.validate(result.equipment,D);
    for (const [set,count] of Object.entries(G.counts(result.equipment))) {
      if (count===4 && !G.supportsFour(set,id)) throw Error('Бонус четырёх предметов этого сета пока не моделируется для героя.');
    }
    return result;
  }
  function editor(item) {
    const id = hero(), index = O.slots.indexOf(itemSlot);
    const build = state.builds[id];
    const main = item?.main || reference(id,true,build?.boots,build?.speedBudget).items[index].main;
    const suggested = item?.setId || (build?.pack && (index<4 ? build.pack.cavern[index] : build.pack.planar));
    const setIds = [...new Set(Object.values(D.relics).filter(item => item.rarity===5 && item.type===itemSlot).map(item => item.set_id))];
    const modal = dialog((item ? 'Изменить' : 'Добавить')+' реликвию · '+slots[index], `<form data-form="item" data-item="${esc(item?.id)}">
      <div class="plan-fields">
      <label>Набор<select name="set">${setIds.map(set => `<option value="${set}" ${set===suggested?'selected':''}>${esc(D.relic_sets[set].name)}</option>`).join('')}</select></label>
      <label>Основной стат<select name="main">${O.mainAffixes(D,itemSlot).map(a => `<option value="${a.property}" ${a.property===main?'selected':''}>${propertyName(a.property)}</option>`).join('')}</select></label>
      <label>Уровень<input type="number" name="level" min="0" max="15" value="15" required></label>
      <label>Начальных сабстатов<select name="initial"><option value="4">4</option><option value="3">3</option></select></label></div>
      <p class="plan-muted">Вводи значения как в игре. Для процентных характеристик введи число в процентах.</p>
      <div class="plan-fields">${Array.from({length:4},(_,i) => `<div class="plan-subfield"><label>Сабстат ${i+1}<select name="type-${i}"><option value="">Нет</option>${O.subAffixes(D).map(a => `<option value="${a.property}">${propertyName(a.property)}${D.properties[a.property].percent?' (%)':''}</option>`).join('')}</select></label><label>Значение ${i+1}<input name="value-${i}" type="number" min="0" step=".001" value="0" required></label></div>`).join('')}</div>
      <div class="plan-actions"><button type="submit" value="save">Сохранить</button><button type="submit" class="plan-primary" value="equip">Сохранить и надеть</button></div></form>`);
    if (item) {
      const fields = modal.querySelector('form').elements;
      fields.level.value = item.level;
      fields.initial.value = item.initial || 4;
      for (const [i,sub] of item.subs.entries()) {
        fields['type-'+i].value = sub.type;
        fields['value-'+i].value = Number((sub.value*(D.properties[sub.type].percent?100:1)).toFixed(3));
      }
    }
  }
  function equip(id,item) {
    if (equippedByAlly(id,item)) {
      throw Error('Эта реликвия уже надета на другого участника.');
    }
    state.equipped[id] ??= {};
    state.equipped[id][item.slot] = item.id;
  }
  function equippedByAlly(id,item){
    return members().some(other=>other!==id&&Object.values(state.equipped[other]||{}).includes(item.id));
  }
  function storeItem(form, shouldEquip, itemId) {
    const subs = Array.from({length:4},(_,i) => {
      const type = form.get('type-'+i);
      return {type,value:Number(form.get('value-'+i))/(D.properties[type]?.percent ? 100 : 1)};
    }).filter(sub => sub.type);
    const item = O.validateItem({
      id:itemId || globalThis.crypto?.randomUUID?.() || 'relic-'+Date.now()+'-'+Math.random().toString(36).slice(2),
      slot:itemSlot, setId:form.get('set'), main:form.get('main'), level:Number(form.get('level')), subs
    },D);
    const initial = Number(form.get('initial'));
    R.validateRolls(item,initial,D);
    if (shouldEquip) equip(hero(),item);
    const existing = state.inventory.findIndex(other => other.id===item.id);
    if (existing<0) state.inventory.push({...item,initial});
    else state.inventory[existing] = {...item,initial};
    save();
    show(step);
    live('Реликвия сохранена.');
  }
  function compare(form) {
    const id = hero(), a = state.inventory.find(item => item.id===form.get('a'));
    const b = state.inventory.find(item => item.id===form.get('b'));
    if (!a || (b && a.id===b.id)) throw Error('Для сравнения выбери две разные реликвии.');
    const weights = R.defaultWeights(id,D), max = R.ceiling(a,weights,D), current = R.score(a,weights,D);
    let reroll = '';
    if (a.level===15 && a.subs.length===4) {
      try {
        const roll = R.reroll(a,weights,D,a.initial || 4);
        reroll = `<p>Оценка шанса улучшения при реролле: <strong>${number(100*roll.chance)}%</strong> при равновероятных роллах.</p>`;
      } catch { /* A legacy item may not include its initial roll count. */ }
    }
    let comparison = '', replays=[];
    if (b) {
      const diff = R.compare(a,b,weights,D).delta;
      comparison = `<p>B относительно A по сабстатам: ${diff>0?'+':''}${number(diff)} взвешенных ролла.</p>`;
      const base = equippedItems(id), index = O.slots.indexOf(a.slot);
      if (complete() && base.every((item,i) => i===index || item)) {
        try {
          const all = profiles(members().filter(other => other!==id));
          const run = item => {
            const items = [...base];
            items[index] = item;
            return {ids:members(),profiles:{...all,[id]:withRanks(id,itemProfile(id,items))},scenario:scenario()};
          };
          const builds=[run(a),run(b)];
          comparison += farmFight(T.compareBattles(...builds,D),builds[0].scenario);
          replays=builds.map(({ids,profiles,scenario})=>T.battleInput(ids,profiles,{...scenario,rollCrits:true},D));
        } catch (error) { comparison += `<p>Сравнение в бою: ${esc(error.message)}</p>`; }
      } else comparison += '<p class="plan-muted">Для сравнения урона нужны полный состав и остальные пять предметов героя.</p>';
    }
    report = {kind:'items',rows:b?[a,b]:[a],replays};
    results('Оценка реликвии', `<p>${itemLabel(a)}</p><p><strong>${number(current)} из ${number(max.score)}</strong> взвешенных роллов. Потолок рассчитан для того же основного стата и сета по весам роли.</p>
      ${reroll}${comparison}<div class="plan-actions">${button('Надеть A','use-item-0')}${b ? button('Надеть B','use-item-1',true) : ''}
      ${replays.length?button('Журнал A','item-replay-0')+button('Журнал B','item-replay-1'):''}</div>`);
  }
  function farmFight(fight,settings){
    const [base,variant]=fight.rows;
    const delta=variant.total-base.total;
    const change=base.total?100*delta/base.total:null;
    const {interval}=fight;
    const boss=settings.encounter==='gepard';
    const wins=row=>number(100*row.encounter.wins/row.encounter.count,1)+'%';
    const finish=boss&&[base,variant].every(row=>row.encounter.wins===row.encounter.count)
      ? ` · среднее время победы ${number(base.encounter.meanFinishAV,1)} → ${number(variant.encounter.meanFinishAV,1)} AV`:'';
    return `<p><strong>${boss?'Гепард':'Болванки'} · ${settings.cycles} ц.</strong> · средний урон
      ${number(base.total,0)} → ${number(variant.total,0)}${change===null?'':` (${change>0?'+':''}${number(change)}%)`}
      ${boss?`<br>Доля побед ${wins(base)} → ${wins(variant)}${finish}`:''}
      <br><small>${fight.method==='exact'?'Точное матожидание в модели':`${fight.count} парных прогонов`}
      ${interval&&interval.lower!==interval.upper?` · прибл. 95% интервал разницы ${number(interval.lower,0)} … ${number(interval.upper,0)} урона${interval.lower<=0&&interval.upper>=0?' · включает ноль':''}`
      :fight.method==='paired'?' · разброс по этой серии оценить нельзя':''}</small></p>`;
  }
  function searchFarm(form){
    const id=hero(),ids=members(),items=equippedItems(id),index=O.slots.indexOf(itemSlot);
    if(!complete()||!items.every(Boolean))throw Error('Нужны полный состав и шесть надетых реликвий героя.');
    const second=form.get('second');
    if(second&&(!O.slots.includes(second)||second===itemSlot))throw Error('Выбери другой слот.');
    const baseline={...profiles(ids.filter(other=>other!==id)),[id]:withRanks(id,itemProfile(id,items))};
    const variants=[],skipped=[];
    const candidates=slot=>state.inventory.filter(item=>item.slot===slot&&item.id!==items[O.slots.indexOf(slot)].id)
      .filter(item=>{
        if(!equippedByAlly(id,item))return true;
        skipped.push(itemLabel(item)+' · надета на союзника');
        return false;
      });
    const primary=candidates(itemSlot),secondary=second?candidates(second):[];
    if(second&&(!primary.length||!secondary.length))throw Error('В каждом из двух слотов нужна хотя бы одна свободная замена.');
    const count=primary.length+secondary.length+primary.length*secondary.length;
    if(count>2000)throw Error('Больше 2000 сборок. Выбери один слот или меньшую пару слотов.');
    for(const changes of O.slotReplacements(primary,secondary)){
      const replacement=[...items];
      for(const item of changes)replacement[O.slots.indexOf(item.slot)]=item;
      try {
        variants.push({id:variants.length,changes,profiles:{...baseline,[id]:withRanks(id,itemProfile(id,replacement))}});
      } catch(error){skipped.push(changes.map(itemLabel).join(' + ')+' · '+esc(error.message));}
    }
    if(!variants.length)throw Error('Для этого слота нет свободных замен с поддерживаемыми сетовыми бонусами.');
    const settings=scenario(),scenarios=[settings];
    if(form.has('alternate'))scenarios.push({...settings,encounter:settings.encounter==='gepard'?'dummy':'gepard'});
    search(()=>T.createFarmSearch(ids,baseline,variants,scenarios,D),result=>{
      const byId=new Map(variants.map(variant=>[variant.id,variant]));
      const rows=result.rows.map(row=>({...row,...byId.get(row.id)}))
        .sort((a,b)=>T.compareResults(a.fights[0].rows[1],b.fights[0].rows[1]));
      const baselineBuild=baseline[id];
      report={kind:'farm',ids,baseline,rows,scenarios,hero:id};
      const targetSlots=[index,...(second?[O.slots.indexOf(second)]:[])];
      results('Замены реликвий · '+esc(name(id)),`
        <p>Текущие предметы · ${targetSlots.map(i=>itemLabel(items[i])).join(' + ')}.</p>
        <p>Порядок по основному сценарию. Проверено ${variants.length} сборок в ${result.checked} сравнениях${second?', включая одиночные замены и пары':''}.</p>
        <p>${tierTargets(id).speed===undefined?'':`Цель SPD ${fieldValue('speed',tierTargets(id).speed)} · `}текущий SPD ${fieldValue('speed',baselineBuild.speed)} до сетовых бонусов.</p>
        ${state.actual[id]?'<p>В этой проверке статы героя рассчитаны по надетым предметам.</p>':''}
        <div class="plan-results">${rows.map((row,i)=>`<article><strong>${row.changes.map(item=>slots[O.slots.indexOf(item.slot)]+' · '+itemLabel(item)).join(' + ')}</strong>
          <p>SPD до сетовых бонусов · ${fieldValue('speed',row.profiles[id].speed)}</p>
          ${row.fights.map((fight,j)=>farmFight(fight,scenarios[j])+ `<div class="plan-actions">
          ${button('Журнал текущего','farm-log-'+i+'-'+j+'-0')}${button('Журнал замены','farm-log-'+i+'-'+j+'-1')}</div>`).join('')}
          ${button(row.changes.length===2?'Надеть обе реликвии':'Надеть замену','use-farm-'+i)}</article>`).join('')}</div>
        ${skipped.length?`<details><summary>Пропущенные варианты · ${skipped.length}</summary><ul>${skipped.map(item=>`<li>${item}</li>`).join('')}</ul></details>`:''}`);
    });
  }
  function statEditor(id) {
    let p = profile(id,false);
    try { p = profile(id); } catch { /* Allow manual stats when an equipped set is unsupported. */ }
    dialog('Текущие статы · '+esc(name(id)), `<form data-form="stats" data-id="${id}">
      <p class="plan-muted">Введи характеристики до сетовых бонусов и временных бафов. При ручном вводе в расчёт войдут бонусы выбранного в плане набора.</p>
      <div class="plan-fields">${Object.entries(statFields).map(([key,[label,scale]]) => `<label>${label}${scale===100?', %':''}<input name="${key}" type="number" min="${['hp','atk','speed','energyRegen'].includes(key)?1:0}" step="any" value="${Number((p[key]*scale).toFixed(3))}" required></label>`).join('')}</div>
      <div class="plan-actions"><button type="submit" class="plan-primary">Сохранить статы</button></div></form>`);
  }
  function saveStats(id, form) {
    const actual = Object.fromEntries(Object.entries(statFields).map(([key,[,scale]]) => [key,Number(form.get(key))/scale]));
    T.validateStats({...profile(id,false),...actual});
    state.actual[id] = actual;
    save();
    show(step);
  }
  function sensitivity(id, all, baseline) {
    const rows = [];
    for (const affix of O.subAffixes(D)) {
      const [key,base] = subFields[affix.property];
      const p = all[id];
      const add = (affix.base+affix.step)*(base ? p[base] : 1);
      const total = T.simulate(members(),{...all,[id]:{...p,[key]:p[key]+add}},scenario(),D).total;
      rows.push({label:propertyName(affix.property),delta:baseline ? 100*(total/baseline-1) : 0});
    }
    return rows.sort((a,b) => b.delta-a.delta);
  }
  function showRolls() {
    const all = profiles(members());
    const baseline = T.simulate(members(),all,scenario(),D).total;
    const rows = sensitivity(hero(),all,baseline);
    results('Эффект одного среднего ролла', `<p class="plan-muted">Меняем по одному сабстату, остальной билд и состав фиксированы.</p>
      <ul class="plan-ranking">${rows.map(row => `<li><span>${row.label}</span><strong>${row.delta>=0?'+':''}${number(row.delta)}%</strong></li>`).join('')}</ul>`);
  }
  function improvements() {
    const all = profiles(members());
    const battle = T.simulate(members(),all,scenario(),D);
    const rows = [];
    const stats = [];
    const scales = {hp:'HPAddedRatio',atk:'AttackAddedRatio',def:'DefenceAddedRatio',speed:'SpeedDelta',
      crit:'CriticalChanceBase',critDamage:'CriticalDamageBase',effectHit:'StatusProbabilityBase',breakEffect:'BreakDamageAddedRatioBase'};
    const affixes = Object.fromEntries(O.subAffixes(D).map(a => [a.property,a.base+a.step]));
    for (const id of members()) {
      const p = all[id];
      const gaps = Object.entries(tierTargets(id)).filter(([key,target]) => target-p[key]>.0001);
      stats.push(`<div><strong>${esc(name(id))}</strong><small>${gaps.length ? gaps.map(([key,target]) =>
        `${statFields[key][0]} ${fieldValue(key,p[key])} → ${fieldValue(key,target)}`).join(' · ') : 'Ориентиры достигнуты'}</small></div>`);
      for (const [key,target] of gaps) {
        if (!scales[key]) continue;
        const [,base] = subFields[scales[key]];
        const bump = Math.min(target-p[key],3*affixes[scales[key]]*(base?p[base]:1));
        const total = T.simulate(members(),{...all,[id]:{...p,[key]:p[key]+bump}},scenario(),D).total;
        if (total>battle.total) rows.push({id,key,bump,delta:100*(total/battle.total-1)});
      }
    }
    rows.sort((a,b) => b.delta-a.delta);
    const estimated = members().filter(id => !state.actual[id] && !equippedItems(id).every(Boolean));
    results('Что докачать в команде', `${estimated.length ? `<p class="plan-muted">Для ${estimated.map(id => esc(name(id))).join(', ')} использованы расчётные статы. Введи текущие статы, чтобы уточнить порядок.</p>` : ''}
      <div class="plan-stat-cards">${stats.join('')}</div>
      ${rows.length ? `<ul class="plan-ranking">${rows.slice(0,8).map(row => `<li><span>${esc(name(row.id))} · ${statFields[row.key][0]} +${fieldValue(row.key,row.bump)}</span><strong>+${number(row.delta)}% урона</strong>${button('К реликвиям →','improve-hero-'+row.id)}</li>`).join('')}</ul>` :
        '<p>Среди проверенных прибавок нет прироста урона. Разницу до ориентиров можно посмотреть выше.</p>'}
      <p class="plan-muted">Статы сравниваются до бонусов сетов и боевых бафов. Уровень задаёт ориентиры, а прирост рассчитывается в выбранном тренировочном бою.</p>`);
  }

  root.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    try {
      if (action.startsWith('slot-')) picker(Number(action.slice(5)));
      else if (action==='pool') picker(null);
      else if (action==='close') target.closest('dialog').close();
      else if (action==='stop') { stop(); resultBox().replaceChildren(); live('Перебор остановлен.'); }
      else if (action==='search-team') searchTeam();
      else if(action.startsWith('item-replay-')&&report?.kind==='items')showReplay(report.replays[Number(action.slice(12))]);
      else if(action.startsWith('farm-log-')&&report?.kind==='farm'){
        const [item,fight,variant]=action.slice(9).split('-').map(Number);
        const {ids,baseline,rows,scenarios}=report;
        showReplay(T.battleInput(ids,variant?rows[item].profiles:baseline,{...scenarios[fight],rollCrits:true},D));
      }
      else if(action.startsWith('use-farm-')&&report?.kind==='farm'){
        const {hero:id,rows}=report;
        const {changes}=rows[Number(action.slice(9))];
        if(changes.some(item=>equippedByAlly(id,item)))throw Error('Одна из реликвий уже надета на союзника.');
        state.equipped[id]={...state.equipped[id],...Object.fromEntries(changes.map(item=>[item.slot,item.id]))};
        save(); show(step); live(changes.length===2?'Обе реликвии надеты.':'Реликвия надета.');
      }
      else if (action.startsWith('rank-estimate-')){
        const id=action.slice(14);
        stop(); report=null;
        results('Эйдолоны · '+esc(name(id)),eidolonTable(id));
      }
      else if (action==='to-build') go('build');
      else if (action==='build-sets'||action==='build-cones') {buildTab=action.slice(6); show(step);}
      else if (action.startsWith('use-cone-')&&report?.kind==='cones') {
        saveEquipment(hero(),report.pack,report.rows[Number(action.slice(9))].cone,report.boots);
        state.builds[hero()].signature=buildSignature(hero());
        save(); show(step); live('Конус сохранён.');
      } else if(action==='use-comparison'&&report?.kind==='compare-build'){
        saveEquipment(hero(),report.pack,report.cone,report.boots);
        if(report.optimized){
          const rotation=report.replays[1].scenario.rotation;
          if(rotation)state.scenario.rotation=rotation;
          else delete state.scenario.rotation;
        }
        state.builds[hero()].signature=buildSignature(hero());
        save(); show(step); live('Билд сохранён.');
      } else if(action==='use-team-build'&&report?.kind==='team-build'){
        for(const row of report.rows)saveEquipment(row.id,row.pack,row.cone,row.boots);
        for(const id of members())state.builds[id].signature=buildSignature(id);
        save(); show(step); live('Наборы сохранены для всей команды.');
      }
      else if (action==='to-relics') go('relics');
      else if (action==='to-improve') go('improve');
      else if (action==='new-item') editor();
      else if (action==='edit-item') {
        const selected = target.form.elements.a.value;
        editor(state.inventory.find(item => item.id===selected));
      } else if (action==='unequip-item') {
        delete state.equipped[hero()][itemSlot];
        save();
        show(step);
      }
      else if (action==='rolls') showRolls();
      else if (action==='improve') improvements();
      else if (action.startsWith('hero-')) { state.hero=action.slice(5); save(); show(step); }
      else if (action.startsWith('item-slot-')) { itemSlot=action.slice(10); show(step); }
      else if (action.startsWith('stats-')) statEditor(action.slice(6));
      else if (action.startsWith('reset-stats-')) { delete state.actual[action.slice(12)]; save(); show(step); }
      else if (action.startsWith('improve-hero-')) { state.hero=action.slice(13); save(); go('relics'); }
      else if (action==='open-replay') dialog('Открыть запись боя', '<form data-form="replay"><label>Запись боя в JSON<textarea name="replay" rows="8" required></textarea></label><button type="submit">Повторить бой</button></form>');
      else if (action==='search-rotation') searchRotation();
      else if (action.startsWith('tune-replay-')&&report?.kind==='tune-team') showReplay(report.journals[Number(action.slice(12))]);
      else if (action==='use-tuning'&&report?.kind==='tune-team') {
        for(const row of report.chosen){
          state.boots[row.id]=row.boots;
          saveEquipment(row.id,row.pack,row.cone,row.boots,row.speedBudget);
        }
        for(const id of members())if(state.builds[id])state.builds[id].signature=buildSignature(id);
        save(); show(step); live('Сборки и цели по скорости сохранены.');
      }
      else if (action==='reset-rotation') { delete state.scenario.rotation; save(); show(step); }
      else if (action.startsWith('rotation-replay-')&&report?.kind==='rotation') {
        const rotation=report.rows[Number(action.slice(16))].rotation;
        showReplay(T.battleInput(report.ids,report.profiles,{...report.settings,rotation,rollCrits:true},D));
      }
      else if (action.startsWith('use-rotation-')&&report?.kind==='rotation') {
        state.scenario.rotation=report.rows[Number(action.slice(13))].rotation;
        save();
        show(step);
      }
      else if (action.startsWith('build-replay-')&&report?.kind==='compare-build') showReplay(report.replays[Number(action.slice(13))]);
      else if (action.startsWith('team-replay-') && report?.kind==='team') replayTeam(Number(action.slice(12)));
      else if (action.startsWith('use-team-') && report?.kind==='team') {
        state.members = report.rows[Number(action.slice(9))].ids;
        state.hero = hero();
        save();
        go('build');
      } else if (action.startsWith('use-build-') && report?.kind==='build') {
        const row = report.rows[Number(action.slice(10))];
        saveEquipment(hero(),row.pack,row.cone,report.boots);
        state.builds[hero()].signature=report.signature;
        save();
        go('relics');
      } else if (action.startsWith('use-item-') && report?.kind==='items') {
        equip(hero(),report.rows[Number(action.slice(9))]);
        save();
        show(step);
        live('Реликвия надета.');
      }
    } catch (error) { live(error.message); }
  });
  root.addEventListener('change', event => {
    if(event.target.matches('[data-eidolon],[data-ex]')){
      const {eidolon,ex}=event.target.dataset;
      if(eidolon)state.eidolons[eidolon]=Number(event.target.value);
      else state.ex[ex]=event.target.checked;
      stop(); report=null; resultBox().replaceChildren(); save(); live('Эйдолоны сохранены.');
    } else if (event.target.matches('[data-tier]')) {
      state.tier = event.target.value;
      save();
      show(step);
    } else if (event.target.matches('[data-sustain]')) {
      state.scenario.requireSustain = event.target.checked;
      save();
      show(step);
    }
  });
  root.addEventListener('submit', event => {
    const form = event.target;
    if (!form.dataset.form) return;
    event.preventDefault();
    const values = new FormData(form);
    try {
      if (form.dataset.form==='scenario') {
        const next = {...state.scenario};
        for (const [key,value] of values) next[key] = ['enemyAttacks','encounter'].includes(key) ? value : Number(value);
        T.validateScenario(next);
        state.scenario = next;
        save();
        show(step);
      } else if (form.dataset.form==='replay') showReplay(JSON.parse(values.get('replay')));
      else if (form.dataset.form==='build') searchBuild(values,event.submitter?.value==='team');
      else if (form.dataset.form==='cones') searchCones(Number(values.get('rank')));
      else if (form.dataset.form==='compare-build') compareBuild(values);
      else if (form.dataset.form==='tune-team') tuneTeam(values);
      else if (form.dataset.form==='stats') saveStats(form.dataset.id,values);
      else if (form.dataset.form==='item') storeItem(values,event.submitter?.value==='equip',form.dataset.item);
      else if (form.dataset.form==='compare') compare(values);
      else if (form.dataset.form==='farm') searchFarm(values);
    } catch (error) {
      const errorBox = form.closest('dialog')?.querySelector('[data-dialog-error]');
      if (errorBox) errorBox.textContent = error.message;
      else live(error.message);
    }
  });
  window.USPlan = {show, stop, start, eidolonTable, supports:id => Boolean(T.models[id])};
})();
