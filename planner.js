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
  function reference(id, includeCone = true, boots = 'speed') {
    const key = id+'-'+includeCone+'-'+boots;
    if (!references.has(key)) references.set(key,O.farmReference(id,R.archetype(id,D),D,includeCone,boots));
    return references.get(key);
  }
  const scenarioDefaults = {
    targets:1, cycles:3, enemyLevel:95, toughness:120, initialSP:3, energyPercent:50,
    seed:42, externalDebuffs:0, enemyAttacks:'training', requireSustain:true
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
    tier: oldJourney?.stage || 'initial', pool:[], builds:{}, actual:{}, boots:{}, cones:{},
    inventory:oldInventory?.inventory || [],
    equipped:Object.fromEntries(Object.entries(oldInventory?.builds || {}).map(([id, build]) => [id, build.equipped])),
    ...read('universesolver.plan.v1')
  };
  if (oldInventory?.config?.characterId && !state.equipped[oldInventory.config.characterId]) {
    state.equipped[oldInventory.config.characterId] = oldInventory.equipped || {};
  }
  state.members = [...new Set(state.members.filter(id => T.models[id]))];
  state.scenario = {...scenarioDefaults, ...state.scenario};
  let step, job = 0, report = null, itemSlot = 'HEAD';
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
  const profiles = (ids, useActual = true) => Object.fromEntries(ids.map(id => [id, profile(id, useActual)]));
  const scenario = () => ({...state.scenario, focus:members()[0], allowPartial:true});
  const propertyName = key => esc(D.properties[key]?.name || key);
  const fieldValue = (key, value) => number(value * statFields[key][1]) + (statFields[key][1] === 100 ? '%' : '');
  const portrait = id => `<img src="${asset(D.characters[id].icon)}" alt="" loading="lazy">`;
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
      <details class="plan-settings"><summary>Условия боя · ${state.scenario.targets} цел. / ${state.scenario.cycles} ц.</summary>
        <form data-form="scenario" class="plan-fields">
          ${[['targets','Целей',1,5],['cycles','Циклов',1,20],['enemyLevel','Уровень цели (0 = без DEF)',0,100],
            ['toughness','Стойкость цели',0,1000],['initialSP','Начальные очки навыков',0,5],
            ['energyPercent','Начальная энергия, %',0,100],['seed','Seed',1,2147483647]].map(([key,label,min,max]) =>
              `<label>${label}<input name="${key}" type="number" min="${min}" max="${max}" value="${state.scenario[key]}" required></label>`).join('')}
          <label>Атаки целей<select name="enemyAttacks"><option value="training" ${state.scenario.enemyAttacks==='training'?'selected':''}>Тренировочные</option><option value="off" ${state.scenario.enemyAttacks==='off'?'selected':''}>Отключены</option></select></label>
          <button type="submit">Сохранить условия</button>
        </form><p class="plan-muted">Сценарий с бесконечным HP целей. Рейтинг отражает урон, а выживаемость в этом бою не проверяется.</p>
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
      <div class="plan-actions">${button('Пул: '+(state.pool.length ? state.pool.length+' гер.' : 'весь ростер'), 'pool')}
      <label class="plan-check"><input type="checkbox" data-sustain ${state.scenario.requireSustain?'checked':''}> Обязательный састейн</label></div>
      <div class="plan-actions">${complete() ? button('Подобрать билд в этом составе →','to-build',true) : button('Найти команды','search-team',true)}
      ${complete() ? button('Сравнить урон состава','search-team') : ''}</div></section>`;
  }
  function buildPage() {
    const id = hero();
    if (!complete()) return emptyTeam('Заполни состав, чтобы сравнить билды в одном бою.');
    const cones = G.cones.filter(cone => D.light_cones[cone]?.path === D.characters[id].path);
    const selected = state.cones[id] || {};
    const saved = state.builds[id];
    return `<section class="plan-panel"><h2>Билд · ${esc(name(id))}</h2>
      <p>Сеты сравниваются на одинаковом бюджете сабстатов. Экипировка союзников берётся из плана, остальные статы — из эталона.</p>
      ${saved ? `<div class="plan-saved"><strong>Выбранный билд</strong>${packLabel(saved.pack)}<small>${saved.cone ? esc(D.light_cones[saved.cone.id].name)+' S'+saved.cone.rank : 'Эталонный конус 4★ без пассива'}</small>
        ${saved.signature !== buildSignature(id) ? '<small>Состав, условия или экипировка союзников изменились. Перепроверь выбор.</small>' : ''}</div>` : ''}
      <form data-form="build">
        <div class="plan-fields"><label>Обувь в эталоне<select name="boots"><option value="speed">Скорость</option><option value="scaling" ${state.boots[id]==='scaling'?'selected':''}>Основной стат урона</option></select></label>
        <label class="plan-check"><input name="mixed" type="checkbox" ${state.mixed?'checked':''}> Включить сочетания 2+2</label></div>
        <details class="plan-settings"><summary>Конусы для сравнения · ${Object.keys(selected).length}</summary>
        <p class="plan-muted">Здесь доступны конусы с реализованным пассивом. Если ничего не выбрать, берутся базовые статы конуса 4★.</p>
        <div class="plan-fields">${cones.length ? cones.map(cone => `<label>${esc(D.light_cones[cone].name)}<select name="cone-${cone}"><option value="0">Пропустить</option>${[1,2,3,4,5].map(rank => `<option value="${rank}" ${selected[cone]===rank?'selected':''}>S${rank}</option>`).join('')}</select></label>`).join('') : '<p>Для этого Пути пассивы конусов пока не моделируются.</p>'}</div></details>
        <div class="plan-actions"><button class="plan-primary" type="submit">Сравнить билды</button>${saved ? button('К целям по статам →','to-relics') : ''}</div>
      </form></section>`;
  }
  function packLabel(pack) {
    return `<div class="plan-gear">${Object.entries(G.counts(pack)).map(([id,count]) =>
      `<span><img src="${asset(D.relic_sets[id].icon)}" alt="">${count} × ${esc(D.relic_sets[id].name)}</span>`).join('')}</div>`;
  }
  function buildSignature(id) {
    return JSON.stringify([members(), state.scenario, members().filter(other => other !== id).map(other => profile(other))]);
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
    const build = state.builds[id], sample = reference(id,true,build?.boots || state.boots[id]).items;
    const equipped = state.equipped[id] || {};
    const available = state.inventory.filter(item => item.slot===itemSlot);
    const priorities = Object.entries(R.defaultWeights(id,D)).filter(([,weight]) => weight > 0).sort((a,b) => b[1]-a[1]).slice(0,4);
    return `<section class="plan-panel"><div class="plan-panel-head"><h2>Цели · ${esc(name(id))}</h2>${tierControl()}</div>
      ${build ? packLabel(build.pack) : '<p class="plan-muted">Основные статы предложены по роли. Выбранный сет появится здесь после подбора билда.</p>'}
      <div class="plan-chips">${statTargets(id)}</div>
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
    if (!core.length) throw Error('Сначала добавь героя в состав.');
    const pool = state.pool.filter(id => !core.includes(id));
    if (state.pool.length && pool.length < 4-core.length) throw Error('Добавь больше свободных героев в пул.');
    search(() => {
      const ids = [...new Set([...core,...(pool.length ? pool : supported)])];
      return T.createSearch(core,pool,profiles(ids),state.scenario,D);
    }, result => {
      report = {kind:'team',rows:result.top};
      results('Результаты подбора', `<p class="plan-muted">Урон за заданное число циклов. Для героев без введённых статов используются сохранённые билды или эталон.</p>
        <div class="plan-results">${result.top.map((row,i) => `<article><div class="plan-panel-head"><strong>${i+1}. ${row.ids.map(id => esc(name(id))).join(' · ')}</strong><span>${number(row.total,0)} урона</span></div>
          <div class="plan-mini-lineup">${row.ids.map(portrait).join('')}</div>${button('Выбрать состав и подобрать билд →','use-team-'+i,true)}</article>`).join('')}</div>`);
    });
  }
  function searchBuild(form) {
    const id = hero(), context = members().filter(member => member!==id);
    const cones = [];
    for (const [key,value] of form) {
      if (key.startsWith('cone-') && Number(value)) cones.push({id:key.slice(5),rank:Number(value)});
    }
    const boots = form.get('boots');
    state.boots[id] = boots;
    state.cones[id] = Object.fromEntries(cones.map(cone => [cone.id,cone.rank]));
    state.mixed = form.has('mixed');
    save();
    const farm = reference(id,!cones.length,boots);
    const input = {
      characterId:id, profile:farm.profile, context, contextProfiles:profiles(context),
      position:members().indexOf(id), focus:members()[0], scenario:state.scenario,
      caverns:Object.keys(D.relic_sets).filter(set => /^1\d\d$/.test(set)), planars:G.planar,
      cones, coneRatios:farm.ratios, mixed:state.mixed, stableRanking:true
    };
    const signature = buildSignature(id);
    search(() => S.createSearch(input,D), result => {
      const top = result.top[0].score;
      const rows = [...new Set([...result.top.slice(0,6),...result.bestByCone])].sort((a,b) => b.score-a.score);
      report = {kind:'build',rows,input,boots,signature};
      results('Кандидаты для этого состава', `<p class="plan-muted">Сортировка по среднему командному урону на 100 AV за соседние длины боя. Сохранение варианта задаёт цель фарма.</p>
        <div class="plan-results">${rows.map((row,i) => {
          const gap = top ? 100*(1-row.score/top) : 0;
          return `<article><div class="plan-panel-head"><strong>${i+1}. ${number(row.score,0)} / 100 AV</strong><span>${gap>0 && gap<.01 ? 'Отставание < 0,01%' : gap>0 ? 'Отставание '+number(gap)+'%' : 'Лучший результат'}</span></div>
            ${packLabel(row.pack)}<p>${row.cone ? esc(D.light_cones[row.cone.id].name)+' S'+row.cone.rank : 'Эталонный конус'}</p>
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
  function picker(index) {
    const pool = index===null;
    const draft = new Set(state.pool);
    const modal = dialog(pool ? 'Пул доступных героев' : 'Выбрать персонажа',
      `<label>Поиск по имени<input type="search" data-picker-search autofocus></label>
      <div class="plan-picker" data-picker></div>
      <div class="plan-actions">${pool ? '<button type="button" data-picker-save class="plan-primary">Сохранить пул</button><button type="button" data-picker-clear>Очистить выбор</button>' : state.members[index] ? '<button type="button" data-picker-clear>Освободить место</button>' : ''}</div>`);
    const input = modal.querySelector('[data-picker-search]');
    const grid = modal.querySelector('[data-picker]');
    const options = supported.filter(id => !state.members.some((other,i) => other===id && i!==index));
    const names = id => `${name(id)} ${D.paths[D.characters[id].path]?.name||''} ${D.english_names?.[id]||''}`.toLocaleLowerCase('ru');
    function filter() {
      const query = input.value.trim().toLocaleLowerCase('ru');
      grid.innerHTML = options.filter(id => names(id).includes(query)).map(id => `<button type="button" data-pick="${id}" ${pool ? `aria-pressed="${draft.has(id)}"` : ''}>${portrait(id)}<strong>${esc(name(id))}</strong><small>${esc(D.paths[D.characters[id].path]?.name)}</small></button>`).join('') || '<p>Персонажи не найдены.</p>';
    }
    grid.onclick = event => {
      const btn = event.target.closest('[data-pick]');
      if (!btn) return;
      const id = btn.dataset.pick;
      if (pool) {
        if (draft.has(id)) draft.delete(id);
        else draft.add(id);
        btn.setAttribute('aria-pressed',String(draft.has(id)));
      } else {
        try { chooseMember(index,id); }
        catch (error) { modal.querySelector('[data-dialog-error]').textContent = error.message; }
      }
    };
    input.oninput = filter;
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
    const farm = reference(id,!cone,build?.boots);
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
    const main = item?.main || reference(id,true,build?.boots).items[index].main;
    const suggested = item?.setId || (build && (index<4 ? build.pack.cavern[index] : build.pack.planar));
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
    if (members().some(other => other!==id && Object.values(state.equipped[other]||{}).includes(item.id))) {
      throw Error('Эта реликвия уже надета на другого участника.');
    }
    state.equipped[id] ??= {};
    state.equipped[id][item.slot] = item.id;
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
    let comparison = '';
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
            return T.simulate(members(),{...all,[id]:itemProfile(id,items)},scenario(),D).total;
          };
          const first = run(a), second = run(b);
          comparison += `<p>Урон команды с A → с B: <strong>${number(first,0)} → ${number(second,0)}</strong>${first ? ` (${second>=first?'+':''}${number(100*(second/first-1))}%)` : ''}.</p>`;
        } catch (error) { comparison += `<p>Сравнение в бою: ${esc(error.message)}</p>`; }
      } else comparison += '<p class="plan-muted">Для сравнения урона нужны полный состав и остальные пять предметов героя.</p>';
    }
    report = {kind:'items',rows:b?[a,b]:[a]};
    results('Оценка реликвии', `<p>${itemLabel(a)}</p><p><strong>${number(current)} из ${number(max.score)}</strong> взвешенных роллов. Потолок рассчитан для того же основного стата и сета по весам роли.</p>
      ${reroll}${comparison}<div class="plan-actions">${button('Надеть A','use-item-0')}${b ? button('Надеть B','use-item-1',true) : ''}</div>`);
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
      else if (action==='to-build') go('build');
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
      else if (action.startsWith('use-team-') && report?.kind==='team') {
        state.members = report.rows[Number(action.slice(9))].ids;
        state.hero = hero();
        save();
        go('build');
      } else if (action.startsWith('use-build-') && report?.kind==='build') {
        const row = report.rows[Number(action.slice(10))];
        state.builds[hero()] = {pack:row.pack,cone:row.cone,profile:S.buildProfile(report.input,row.pack,row.cone,D),
          boots:report.boots,signature:report.signature};
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
    if (event.target.matches('[data-tier]')) {
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
        for (const [key,value] of values) next[key] = key==='enemyAttacks' ? value : Number(value);
        T.validateScenario(next);
        state.scenario = next;
        save();
        show(step);
      } else if (form.dataset.form==='build') searchBuild(values);
      else if (form.dataset.form==='stats') saveStats(form.dataset.id,values);
      else if (form.dataset.form==='item') storeItem(values,event.submitter?.value==='equip',form.dataset.item);
      else if (form.dataset.form==='compare') compare(values);
    } catch (error) {
      const errorBox = form.closest('dialog')?.querySelector('[data-dialog-error]');
      if (errorBox) errorBox.textContent = error.message;
      else live(error.message);
    }
  });
  window.USPlan = {show, stop, start, supports:id => Boolean(T.models[id])};
})();
