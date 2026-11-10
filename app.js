const D=window.HSR_DATA,H=window.HSR,S=window.HSR_SUPPLEMENTS;
const $=selector=>document.querySelector(selector);
const esc=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset=path=>D.meta.asset_base+path;
const pathName=id=>D.paths[id]?.name||id,elementName=id=>D.elements[id]?.name||id;
const pathIcons={Warrior:'destruction',Rogue:'hunt',Mage:'erudition',Shaman:'harmony',Warlock:'nihility',Knight:'preservation',Priest:'abundance',Memory:'remem',Elation:'elation'};
const elementIcons={Physical:'physical',Fire:'fire',Ice:'ice',Thunder:'lightning',Wind:'wind',Quantum:'quantum',Imaginary:'imaginary'};
const icon=(kind,id)=>{const name=kind==='path'?pathIcons[id]:elementIcons[id];return name?`<img class="game-icon" src="assets/icons/${kind==='path'?'path':'ele'}_${name}.webp" alt="">`:'';};
const slots={HEAD:'Голова',HAND:'Руки',BODY:'Тело',FOOT:'Ноги',NECK:'Планарная сфера',OBJECT:'Соединительная верёвка'};
const statNames={hp:'HP',atk:'Сила атаки',def:'Защита',spd:'Скорость',taunt:'Агрессия',crit_rate:'Крит. шанс',crit_dmg:'Крит. урон'};
const groups={characters:Object.values(D.characters),cones:Object.values(D.light_cones),relics:Object.values(D.relic_sets)};
const setKinds=Object.fromEntries(groups.relics.map(s=>[s.id,H.relicKind(s.id,D.relics)]));
const titles={characters:'Персонажи',cones:'Световые конусы',relics:'Реликвии'};
let section='characters';const filters={element:'',path:'',rarity:'',kind:''};let profiles={};
try{const stored=JSON.parse(localStorage.getItem('universesolver.profiles')||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))profiles=stored;}catch{}
function filterButtons(container,key,options){
  const group=$('#'+container);group.replaceChildren();
  for(const [value,label,image] of options){const button=document.createElement('button');button.type='button';button.dataset.filter=key;button.dataset.value=value;button.innerHTML=(image||'')+`<span>${esc(label)}</span>`;button.addEventListener('click',()=>{filters[key]=filters[key]===value?'':value;render();});group.append(button);}
}
filterButtons('elements','element',[['','Все стихии'],...Object.keys(D.elements).map(id=>[id,elementName(id),icon('element',id)])]);
filterButtons('set-kinds','kind',[['','Все наборы'],['cavern','Пещерные'],['planar','Планарные']]);
for(const nav of document.querySelectorAll('[data-section]'))nav.querySelector('small').textContent=groups[nav.dataset.section].length;
$('#data-version').textContent=`StarRailRes · ${D.meta.revision.slice(0,8)} · загружено ${new Date(D.meta.generated_at).toLocaleDateString('ru-RU')}`;
$('#data-version').title='Полнота и актуальность ограничены снимком источника; записи не подтверждают дату выхода персонажа.';
function itemName(item){return section==='characters'?H.characterName(item,D.paths):item.name;}
function route(){
  const [target,step]=location.hash.slice(1).split('/');
  const isCatalog=Object.hasOwn(groups,target);
  $('#plan').hidden=isCatalog;
  $('#catalog').hidden=!isCatalog;
  const plannerLink=$('[data-plan-link]');
  plannerLink.classList.toggle('nav-active',!isCatalog);
  if(isCatalog)plannerLink.removeAttribute('aria-current');
  else plannerLink.setAttribute('aria-current','page');
  if($('#profile').open)$('#profile').close();
  if(!isCatalog){
    for(const nav of document.querySelectorAll('[data-section]')){
      nav.classList.remove('nav-active');
      nav.removeAttribute('aria-current');
    }
    document.title='План команды · UniverseSolver';
    $('#breadcrumb').textContent='План команды';
    const legacy={teams:'team',optimizer:'build','relic-lab':'relics'};
    window.USPlan.show(target==='plan'?step:legacy[target]);
    return;
  }
  window.USPlan.stop();
  section=target;
  document.title=`${titles[section]} · UniverseSolver`;$('#roster-title').textContent=titles[section];$('#breadcrumb').textContent=titles[section];
  for(const nav of document.querySelectorAll('[data-section]')){const active=nav.dataset.section===section;nav.classList.toggle('nav-active',active);if(active)nav.setAttribute('aria-current','page');else nav.removeAttribute('aria-current');}
  $('#search').value='';for(const key of Object.keys(filters))filters[key]='';$('#elements').hidden=section!=='characters';$('#paths').hidden=section==='relics';$('#rarities').hidden=section==='relics';$('#set-kinds').hidden=section!=='relics';
  filterButtons('paths','path',[['','Все пути'],...[...new Set(groups[section].map(x=>x.path).filter(Boolean))].map(id=>[id,pathName(id),icon('path',id)])]);
  filterButtons('rarities','rarity',[['','Любая редкость'],...[...new Set(groups[section].map(x=>x.rarity).filter(Boolean))].sort((a,b)=>b-a).map(r=>[String(r),`${r} ★`])]);
  if($('#profile').open)$('#profile').close();render();
}
function render(){
  const query=$('#search').value.trim().toLocaleLowerCase('ru');
  const filtered=groups[section].filter(c=>(!filters.element||c.element===filters.element)&&(!filters.path||c.path===filters.path)&&(!filters.rarity||c.rarity===Number(filters.rarity))&&(!filters.kind||setKinds[c.id]===filters.kind)&&`${itemName(c)} ${section==='characters'?D.english_names[c.id]||'':''} ${c.id}`.toLocaleLowerCase('ru').includes(query));
  $('#grid').replaceChildren();$('#grid').className=`grid ${section}-grid`;
  for(const c of filtered){
    const button=document.createElement('button');button.type='button';button.className='card';button.style.setProperty('--accent',D.elements[c.element]?.color||'#c0d6b5');
    const name=itemName(c),subtitle=section==='characters'?`${elementName(c.element)} · ${pathName(c.path)}`:section==='cones'?pathName(c.path):setKinds[c.id]==='planar'?'Планарные украшения':'Пещерные реликвии';
    button.setAttribute('aria-label',`Открыть: ${name}`);
    button.innerHTML=`<div class="card-art"><span class="card-element">${c.element?icon('element',c.element):c.path?icon('path',c.path):''}</span><img class="character-art" src="${esc(asset(c.preview||c.icon))}" alt="" loading="lazy"><span class="stars">${c.rarity?'★'.repeat(c.rarity):''}</span></div><div class="card-body"><div class="card-path">${esc(subtitle)}</div><h3>${esc(name)}<span>↗</span></h3></div>`;
    button.querySelector('.character-art').addEventListener('error',e=>{e.target.hidden=true;button.classList.add('missing-art');},{once:true});button.addEventListener('click',()=>openDetail(c));$('#grid').append(button);
  }
  $('#count').textContent=`Показано ${filtered.length} из ${groups[section].length}`;$('#empty').hidden=filtered.length>0;$('#reset').hidden=!query&&!Object.values(filters).some(Boolean);
  for(const button of document.querySelectorAll('[data-filter]')){const active=button.dataset.value===filters[button.dataset.filter];button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}
}
function textBlock(title,description,small=''){return `<article class="data-block"><h4>${esc(title)}</h4>${small?`<div class="data-meta">${esc(small)}</div>`:''}<p class="game-text">${esc(description)}</p></article>`;}
function statGrid(record,level,promotion){return `<div class="stats-grid">${H.stats(record,level,promotion).map(([key,value])=>`<div><span>${esc(statNames[key]||key)}</span><strong>${H.number(value*(['crit_rate','crit_dmg'].includes(key)?100:1))}${['crit_rate','crit_dmg'].includes(key)?'%':''}</strong></div>`).join('')}</div>`;}
function levelControls(level=80){return `<div class="fields"><label>Уровень<input id="detail-level" type="number" min="1" max="80" value="${level}"></label><label>Возвышение<select id="promotion">${Array.from({length:7},(_,i)=>`<option value="${i}" ${i===H.minimumPromotion(level)?'selected':''}>${i} · до ур. ${i===0?20:20+i*10}</option>`).join('')}</select></label></div><p class="data-meta">Базовые характеристики без экипировки, следов и боевых эффектов.</p><div id="base-stats"></div>`;}
function bindStats(record){
  const input=$('#detail-level'),promotion=$('#promotion');
  function update(){const level=Math.max(1,Math.min(80,Number(input.value)||1));let phase=Number(promotion.value);const min=phase===0?1:phase===1?20:10+phase*10,max=phase===0?20:20+phase*10;if(level<min||level>max)phase=H.minimumPromotion(level);promotion.value=phase;$('#base-stats').innerHTML=statGrid(record,level,phase);}
  input.addEventListener('input',update);input.addEventListener('change',()=>{input.value=Math.max(1,Math.min(80,Number(input.value)||1));update();});
  promotion.addEventListener('change',()=>{const phase=Number(promotion.value),min=phase===0?1:phase===1?20:10+phase*10,max=phase===0?20:20+phase*10;input.value=Math.max(min,Math.min(max,Number(input.value)||1));update();});update();
}
function openDetail(c){
  $('#profile-name').textContent=itemName(c);$('#profile-meta').textContent=section==='characters'?`${elementName(c.element)} · ${pathName(c.path)} · ${c.rarity} ★`:section==='cones'?`${pathName(c.path)} · ${c.rarity} ★`:(setKinds[c.id]==='planar'?'Планарные украшения':'Пещерные реликвии');
  $('#profile-image').hidden=false;$('#profile-image').src=asset(c.preview||c.icon);$('#profile-image').onerror=()=>{$('#profile-image').hidden=true;};$('#detail-label').textContent=titles[section].toLocaleUpperCase('ru');
  $('#character-sources').innerHTML=section==='characters'?`<a href="${esc(prydwenUrl(c))}" target="_blank" rel="noreferrer">Гайд Prydwen ↗</a><a href="${esc(D.meta.source)}" target="_blank" rel="noreferrer">Данные: StarRailRes ↗</a>`:'';
  if(section==='characters')characterDetail(c);else if(section==='cones')coneDetail(c);else relicDetail(c);$('#profile').showModal();$('#profile').scrollTop=0;
}
function prydwenUrl(c){
  if(S.characters[c.id]?.source)return S.characters[c.id].source;
  const special={'1112':'topaz','1224':'march-7th-swordmaster','1213':'imbibitor-lunae','1225':'tingyun-fugue','1305':'dr-ratio','1413':'march-7th-evernight','1414':'dan-heng-permansor-terrae','1506':'silver-wolf-lv-999','1512':'robin-summeretto','1513':'aventurine-waveflair'};
  const trailblazer={'Warrior':'destruction','Knight':'preservation','Shaman':'harmony','Memory':'remembrance','Elation':'elation'};
  const slug=c.name.includes('{NICKNAME}')?`trailblazer-${trailblazer[c.path]}`:special[c.id]||(D.english_names[c.id]||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return `https://www.prydwen.gg/star-rail/characters/${slug}`;
}
function bindCharacterTabs(){
  const tabs=[...document.querySelectorAll('[data-character-tab]')];
  function activate(button,focus=false){for(const tab of tabs){const active=tab===button;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;$('#panel-'+tab.dataset.characterTab).hidden=!active;}if(focus)button.focus();}
  for(const [index,button] of tabs.entries()){
    button.addEventListener('click',()=>activate(button));
    button.addEventListener('keydown',event=>{let target;if(event.key==='ArrowRight')target=tabs[(index+1)%tabs.length];if(event.key==='ArrowLeft')target=tabs[(index+tabs.length-1)%tabs.length];if(event.key==='Home')target=tabs[0];if(event.key==='End')target=tabs.at(-1);if(target){event.preventDefault();activate(target,true);}});
  }
}
function characterDetail(c){
  const saved=profiles[c.id],level=Math.max(1,Math.min(80,Number(saved?.level)||80));
  const tabs=[['kit','Кит'],['traces','Следы'],['eidolons','Эйдолоны'],['stats','Характеристики'],['ex','EX-эйдолоны']];
  const extra=S.characters[c.id],exEntries=S.ex_eidolons[c.id]||[];
  $('#detail-content').innerHTML=`<div class="character-tabs" role="tablist" aria-label="Информация о персонаже">${tabs.map(([id,label],i)=>`<button type="button" role="tab" id="tab-${id}" data-character-tab="${id}" aria-selected="${i===0}" aria-controls="panel-${id}" tabindex="${i===0?0:-1}">${label}${id==='ex'&&!exEntries.length?'<span class="soon-dot" aria-label="Данные не добавлены"></span>':''}</button>`).join('')}</div>
  <section role="tabpanel" id="panel-kit" aria-labelledby="tab-kit">${extra?.summary?textBlock('Механика',extra.summary):''}<div class="kit-resource">${extra?`${esc(extra.resource)}${extra.cost==null?'':` · ${extra.cost}`}`:c.max_sp==null?'Особый ресурс сверхспособности':`Ресурс сверхспособности · ${esc(c.max_sp)}`}</div><div id="skills"></div></section>
  <section role="tabpanel" id="panel-traces" aria-labelledby="tab-traces" hidden><div id="traces"></div></section>
  <section role="tabpanel" id="panel-eidolons" aria-labelledby="tab-eidolons" hidden><p class="data-meta">E1–E6. Описания эффектов; значения в ките выбираются независимо.</p><div id="ranks"></div></section>
  <section role="tabpanel" id="panel-stats" aria-labelledby="tab-stats" hidden>${levelControls(level)}<form id="profile-form"><div class="fields"><label>Эйдолоны<select name="eidolon">${Array.from({length:7},(_,i)=>`<option value="${i}" ${i===Number(saved?.eidolon||0)?'selected':''}>E${i}</option>`).join('')}</select></label><button class="primary" type="submit">Сохранить профиль ↗</button></div><p id="save-status" role="status"></p></form></section>
  <section role="tabpanel" id="panel-ex" aria-labelledby="tab-ex" hidden>${exEntries.length?exEntries.map(e=>textBlock(e.name,e.description)+`<a class="fact-source" href="${esc(e.source)}" target="_blank" rel="noreferrer">Источник ↗</a>`).join(''):'<div class="ex-empty"><h3>EX-эйдолоны</h3><p>Для этого персонажа EX-эйдолоны ещё не добавлены в каталог.</p></div>'}</section>`;
  bindCharacterTabs();
  if(window.USPlan.supports(c.id)){
    const start=document.createElement('button');
    start.type='button';
    start.className='primary optimize-character';
    start.textContent='Подобрать команду для персонажа →';
    start.addEventListener('click',()=>window.USPlan.start(c.id));
    $('#detail-content').prepend(start);
  }
  bindStats(D.character_promotions[c.id]);
  for(const id of c.skills){const skill=D.character_skills[id];if(!skill)continue;const max=skill.params?.length||1,defaultLevel=H.skillCap(c,skill,D);const block=document.createElement('article');block.className='data-block';block.innerHTML=`<div class="skill-heading"><div class="skill-title"><img class="skill-icon" src="${esc(asset(skill.icon))}" alt="" loading="lazy"><div><h4>${esc(skill.name)}</h4><div class="data-meta">${esc([skill.type_text,skill.effect_text].filter(Boolean).join(' · '))}</div></div></div><label>Ур. <select aria-label="Уровень: ${esc(skill.name)}">${Array.from({length:max},(_,i)=>`<option value="${i}" ${i===defaultLevel-1?'selected':''}>${i+1}</option>`).join('')}</select></label></div><p class="game-text"></p><details><summary>Числовые параметры</summary><div class="parameter-list"></div></details>${S.skill_parameters[id]?`<a class="fact-source" href="${esc(S.skill_parameters[id].source)}" target="_blank" rel="noreferrer">Порог HP уточнён по Prydwen ↗</a>`:''}`;
    const update=()=>{const params=H.skillParams(skill,Number(block.querySelector('select').value),S);block.querySelector('.game-text').textContent=H.describe(skill.desc,params);block.querySelector('.parameter-list').textContent=params.length?Array.from(params,(value,i)=>value===undefined?null:`#${i+1}: ${H.number(value,6)}`).filter(Boolean).join(' · '):'Нет отдельных параметров.';};block.querySelector('select').addEventListener('change',update);update();$('#skills').append(block);
  }
  for(const id of c.skill_trees){const trace=D.character_skill_trees[id];if(!trace)continue;const properties=trace.levels?.flatMap(l=>l.properties||[])||[];if(!trace.desc&&!properties.length)continue;$('#traces').insertAdjacentHTML('beforeend',textBlock(trace.name||'Бонус характеристики',H.describe(trace.desc,trace.params?.[0]||[])+(properties.length?'\n'+properties.map(propertyText).join('\n'):''),trace.levels?.[0]?.promotion?`Возвышение ${trace.levels[0].promotion}`:''));}
  for(const id of c.ranks){const rank=D.character_ranks[id];if(rank)$('#ranks').insertAdjacentHTML('beforeend',`<article class="data-block eidolon-block"><div class="eidolon-heading"><span class="eidolon-number">E${rank.rank}</span><img class="skill-icon" src="${esc(asset(rank.icon))}" alt="" loading="lazy"><h4>${esc(rank.name)}</h4></div><p class="game-text">${esc(H.clean(rank.desc))}</p></article>`);}
  $('#profile-form').addEventListener('submit',e=>{e.preventDefault();if(!$('#detail-level').reportValidity())return;try{const updated={...profiles,[c.id]:{level:Number($('#detail-level').value),promotion:Number($('#promotion').value),eidolon:Number(e.target.elements.eidolon.value)}};localStorage.setItem('universesolver.profiles',JSON.stringify(updated));profiles=updated;$('#save-status').textContent='Профиль сохранён на этом устройстве.';render();}catch{$('#save-status').textContent='Браузер не разрешил сохранить профиль.';}});
  if(saved?.promotion!=null&&Number.isInteger(saved.promotion)&&saved.promotion>=0&&saved.promotion<=6){$('#promotion').value=saved.promotion;$('#detail-level').dispatchEvent(new Event('input'));}
}
function propertyText(property){const p=D.properties[property.type];return `${p?.name||property.type}: ${H.number(property.value*(p?.percent?100:1),4)}${p?.percent?'%':''}`;}
function coneDetail(c){
  const rank=D.light_cone_ranks[c.id];$('#detail-content').innerHTML=`${levelControls()}<h3 class="detail-heading">${esc(rank?.skill||'Эффект конуса')}</h3><div class="fields"><label>Наложение<select id="superimposition">${Array.from({length:rank?.params?.length||5},(_,i)=>`<option value="${i}">S${i+1}</option>`).join('')}</select></label></div><p class="data-meta">Эффект активен при совпадении Пути владельца с Путём конуса.</p><article class="data-block"><p class="game-text" id="cone-effect"></p><div id="cone-properties" class="data-meta"></div></article><details class="data-block"><summary>Описание</summary><p class="game-text">${esc(H.clean(c.desc))}</p></details>`;
  bindStats(D.light_cone_promotions[c.id]);const update=()=>{const index=Number($('#superimposition').value);$('#cone-effect').textContent=rank?H.describe(rank.desc,rank.params?.[index]||[]):'В источнике нет описания эффекта.';$('#cone-properties').textContent=(rank?.properties?.[index]||[]).map(propertyText).join(' · ');};$('#superimposition').addEventListener('change',update);update();
}
function relicDetail(c){
  const pieces=Object.values(D.relics).filter(r=>r.set_id===c.id),rarities=[...new Set(pieces.map(p=>p.rarity))].sort((a,b)=>b-a);
  $('#detail-content').innerHTML=`${c.desc.map((desc,i)=>textBlock(`${i===0?2:4} предмета`,H.clean(desc))).join('')}<h3 class="detail-heading">Предметы набора</h3><div class="fields"><label>Редкость<select id="relic-rarity">${rarities.map(r=>`<option value="${r}">${r} ★</option>`).join('')}</select></label><label>Слот<select id="relic-slot"></select></label><label>Уровень реликвии<input id="relic-level" type="number" min="0" value="15"></label></div><h4 id="piece-name"></h4><h3 class="detail-heading">Основная характеристика</h3><div id="main-affixes"></div><h3 class="detail-heading">Дополнительные характеристики</h3><p class="data-meta">Значения одного выпадения или улучшения. Характеристика не может одновременно быть основной и дополнительной. Не все варианты могут присутствовать на одном предмете.</p><div id="sub-affixes"></div>`;
  function update(){const piece=pieces.find(p=>p.rarity===Number($('#relic-rarity').value)&&p.type===$('#relic-slot').value);if(!piece)return;$('#piece-name').textContent=piece.name;$('#relic-level').max=piece.max_level;const level=Math.max(0,Math.min(piece.max_level,Number($('#relic-level').value)||0));$('#relic-level').value=level;
    const main=D.relic_main_affixes[piece.main_affix_id]?.affixes||{},sub=D.relic_sub_affixes[piece.sub_affix_id]?.affixes||{};
    $('#main-affixes').innerHTML=affixTable(Object.values(main).map(a=>[D.properties[a.property]?.name||a.property,affixNumber(a.property,a.base+a.step*level)]),'Значение');
    $('#sub-affixes').innerHTML=affixTable(Object.values(sub).map(a=>[D.properties[a.property]?.name||a.property,Array.from({length:a.step_num+1},(_,i)=>affixNumber(a.property,a.base+a.step*i)).join(' / ')]),'Варианты одного ролла');
  }
  function updateSlots(){const old=$('#relic-slot').value;$('#relic-slot').replaceChildren();for(const piece of pieces.filter(p=>p.rarity===Number($('#relic-rarity').value)))$('#relic-slot').add(new Option(slots[piece.type]||piece.type,piece.type));if([...$('#relic-slot').options].some(o=>o.value===old))$('#relic-slot').value=old;update();}
  $('#relic-rarity').addEventListener('change',updateSlots);$('#relic-slot').addEventListener('change',update);$('#relic-level').addEventListener('change',update);updateSlots();
}
function affixNumber(type,value){const percent=D.properties[type]?.percent;return H.number(value*(percent?100:1),3)+(percent?'%':'');}
function affixTable(rows,label){return `<div class="table-wrap"><table><thead><tr><th>Характеристика</th><th>${esc(label)}</th></tr></thead><tbody>${rows.map(([name,value])=>`<tr><td>${esc(name)}</td><td>${esc(value)}</td></tr>`).join('')}</tbody></table></div>`;}
$('#search').addEventListener('input',render);
$('#reset').addEventListener('click',()=>{$('#search').value='';for(const key of Object.keys(filters))filters[key]='';render();});
$('#close').addEventListener('click',()=>$('#profile').close());$('#profile').addEventListener('click',e=>{if(e.target!==$('#profile'))return;const r=$('#profile').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#profile').close();});
window.addEventListener('hashchange',route);route();
