/* Image-backed selections retain native form values and change events. */
(function(){
  const D=window.HSR_DATA,mounted=new Map();let dialog,active,query='';
  const orders={'name-asc':'По имени · А–Я','name-desc':'По имени · Я–А','rarity-desc':'Сначала 5★','rarity-asc':'Сначала 4★'},collator=new Intl.Collator('ru',{numeric:true,sensitivity:'base'});
  let characterOrder='name-asc';try{const saved=localStorage.getItem('universesolver.character-order');if(orders[saved])characterOrder=saved;}catch{}
  const characterLabel=id=>window.HSR.characterName(D.characters[id],D.paths);
  function setCharacterOrder(value){if(!orders[value])return;characterOrder=value;try{localStorage.setItem('universesolver.character-order',value);}catch{}document.dispatchEvent(new Event('character-order-change'));}
  function sortCharacters(ids){return [...ids].sort((a,b)=>{const names=collator.compare(characterLabel(a),characterLabel(b));if(characterOrder==='name-desc')return -names||collator.compare(a,b);if(characterOrder.startsWith('rarity'))return (D.characters[a].rarity-D.characters[b].rarity)*(characterOrder==='rarity-desc'?-1:1)||names||collator.compare(a,b);return names||collator.compare(a,b);});}
  function orderOptions(){return Object.entries(orders).map(([value,label])=>`<option value="${value}">${label}</option>`).join('');}
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function entry(select,value){
    if(['opt-character','set-character','lab-character'].includes(select.id)){const c=D.characters[value];return c?{image:c.icon,label:window.HSR.characterName(c,D.paths)}:null;}
    if(select.id==='opt-cone'){const c=D.light_cones[value];return c?{image:c.icon,label:c.name}:null;}
    if(select.id==='item-set'){const piece=Object.values(D.relics).find(r=>r.set_id===value&&r.type===document.querySelector('#item-slot')?.value&&r.rarity===5);return D.relic_sets[value]?{image:piece?.icon||D.relic_sets[value].icon,label:D.relic_sets[value].name}:null;}
    if(select.id==='item-slot'){const set=document.querySelector('#item-set')?.value;const piece=Object.values(D.relics).find(r=>r.type===value&&r.rarity===5&&(!set||r.set_id===set))||Object.values(D.relics).find(r=>r.type===value&&r.rarity===5);return piece?{image:piece.icon,label:[...select.options].find(o=>o.value===value)?.textContent||value}:null;}
  }
  function refresh(select){const button=mounted.get(select);if(!button)return;const item=entry(select,select.value);button.innerHTML=`${item?`<img src="${escape(D.meta.asset_base+item.image)}" alt="">`:''}<span>${escape(item?.label||select.selectedOptions[0]?.textContent||'Выбрать')}</span><span class="picker-chevron">⌄</span>`;}
  function render(){const grid=dialog.querySelector('.picker-grid'),character=['opt-character','set-character','lab-character'].includes(active.id),options=[...active.options];dialog.querySelector('.picker-order').hidden=!character;dialog.querySelector('select').value=characterOrder;const byId=new Map(options.map(o=>[o.value,o])),ordered=character?sortCharacters(options.map(o=>o.value)).map(id=>byId.get(id)):options;grid.replaceChildren();for(const option of ordered){const item=entry(active,option.value);if(!`${item?.label||option.textContent} ${option.value}`.toLocaleLowerCase('ru').includes(query))continue;const button=document.createElement('button');button.type='button';button.className='picker-option';button.setAttribute('aria-pressed',String(active.value===option.value));button.innerHTML=`${item?`<img src="${escape(D.meta.asset_base+item.image)}" alt="" loading="lazy">`:'<span class="picker-none">—</span>'}<span>${escape(item?.label||option.textContent)}</span>`;button.addEventListener('click',()=>{const select=active;select.value=option.value;dialog.close();refresh(select);select.dispatchEvent(new Event('change',{bubbles:true}));});grid.append(button);}if(!grid.children.length)grid.textContent='Ничего не найдено.';}
  function mountAll(){
    if(!dialog){dialog=document.createElement('dialog');dialog.className='icon-picker';dialog.setAttribute('aria-label','Выбор по иконкам');dialog.innerHTML='<div class="dialog-top"><h2>Выбор</h2><button type="button" aria-label="Закрыть выбор">✕</button></div><input type="search" class="picker-search" aria-label="Поиск в выборе" placeholder="Поиск по имени или названию…"><label class="picker-order">Сортировка персонажей<select aria-label="Сортировка персонажей">'+orderOptions()+'</select></label><div class="picker-grid"></div>';document.body.append(dialog);dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.querySelector('select').addEventListener('change',event=>{setCharacterOrder(event.target.value);render();});dialog.querySelector('input').addEventListener('input',event=>{query=event.target.value.trim().toLocaleLowerCase('ru');render();});}
    for(const id of ['opt-character','set-character','lab-character','opt-cone','item-set','item-slot']){const select=document.getElementById(id);if(!select||mounted.has(select))continue;const character=['opt-character','set-character','lab-character'].includes(id),button=document.createElement('button');button.type='button';button.className='icon-select';button.setAttribute('aria-label',`Выбрать ${character?'персонажа':id==='opt-cone'?'конус':id==='item-slot'?'слот реликвии':'набор реликвий'}`);select.hidden=true;select.after(button);mounted.set(select,button);button.addEventListener('click',()=>{active=select;query='';dialog.querySelector('input').value='';dialog.querySelector('h2').textContent=character?'Персонаж':id==='opt-cone'?'Световой конус':id==='item-slot'?'Слот реликвии':'Набор реликвий';render();dialog.showModal();dialog.querySelector('input').focus();});select.addEventListener('change',()=>{for(const s of mounted.keys())refresh(s);});new MutationObserver(()=>refresh(select)).observe(select,{childList:true});refresh(select);}
  }
  window.IconPicker={mountAll,sortCharacters,setCharacterOrder,orderOptions,getCharacterOrder:()=>characterOrder,refreshAll(){mountAll();for(const select of mounted.keys())refresh(select);}};
  function mountPanels(){
    for(const panel of document.querySelectorAll('#optimizer .opt-panel,#teams .opt-panel,#relic-lab .opt-panel')){
      if(panel.dataset.collapsible)continue;
      const heading=panel.querySelector('h2');if(!heading)continue;
      panel.dataset.collapsible='true';
      const header=heading.parentElement===panel?heading:heading.parentElement;
      header.classList.add('panel-collapse-header');
      const title=Array.from(heading.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()||heading.textContent,key='universesolver.panel.'+(panel.closest('#set-mode')?'sets':panel.closest('#teams')?'teams':panel.closest('#relic-lab')?'relic-lab':'build')+'.'+title;
      const button=document.createElement('button');button.type='button';button.className='panel-toggle';button.append(...heading.childNodes);button.setAttribute('aria-label',title);heading.replaceChildren(button);
      let closed=false;try{closed=localStorage.getItem(key)==='closed';}catch{}
      function sync(){panel.classList.toggle('panel-collapsed',closed);button.setAttribute('aria-expanded',String(!closed));button.title=closed?'Развернуть раздел':'Свернуть раздел';}
      button.addEventListener('click',()=>{closed=!closed;sync();try{localStorage.setItem(key,closed?'closed':'open');}catch{}});sync();
    }
  }
  document.addEventListener('click',event=>{const jump=event.target.closest('[data-set-jump],#jump-inventory,#jump-search');if(!jump)return;const target=jump.dataset.setJump||(jump.id==='jump-inventory'?'relic-editor':'start-search');const panel=document.getElementById(target)?.closest('.panel-collapsed');panel?.querySelector('.panel-toggle')?.click();},true);
  new MutationObserver(mountPanels).observe(document.body,{childList:true,subtree:true});mountPanels();
})();
