/* Shared text semantics for the planner, catalogue and dynamic dialogs. */
(function(root){
  const symbols={
    hp:['♥','health'],atk:['⚔','attack'],def:['⬟','defense'],speed:['»','speed'],
    crit:['◎','crit'],critDamage:['✷','crit-damage'],effectHit:['⊙','debuff'],
    effectRes:['◈','defense'],breakEffect:['ϟ','break'],energyRegen:['◆','energy'],
    humor:['✦','humor'],banger:['★','humor'],sp:['◇','energy'],resource:['❖','resource'],
    buff:['↑','buff'],debuff:['↓','debuff'],zone:['◉','zone'],state:['◈','resource'],
    shield:['⬟','defense'],break:['ϟ','break'],attack:['⚔','attack'],
    followup:['↪','attack'],dot:['◌','debuff'],turn:['»','speed'],expire:['⌛','muted']
  };
  const rules=[
    ['critDamage','крит\\.?\\s*урон(?:а|у|ом)?|критическ(?:ий|ого)\\s+урон(?:а)?|CRIT\\s*DMG|CDMG'],
    ['crit','крит\\.?\\s*шанс(?:а)?|шанс(?:а)?\\s+критическ(?:ого|их)\\s+(?:попадания|попаданий)|CRIT\\s*Rate'],
    ['effectHit','шанс(?:а)?\\s+попадания\\s+эффектов|EHR'],
    ['effectRes','сопротивлени(?:е|я)\\s+эффектам|Effect\\s*RES'],
    ['breakEffect','эффект(?:а|ом)?\\s+пробития|Break\\s*Effect'],
    ['energyRegen','восстановлени(?:е|я)\\s+энергии|ERR'],
    ['atk','сил(?:а|ы|у|ой)\\s+атаки|ATK'],['def','защит(?:а|ы|у|ой)|DEF'],
    ['hp','HP|здоровь(?:е|я)'],['speed','скорост(?:ь|и|ью)|SPD'],
    ['banger','настоящий\\s+хит|сертифицированный\\s+хит|Certified\\s+Banger|Хит'],
    ['humor','Юмор(?:а|ом)?|Радост(?:ь|и|ью)|Punchline|Elation'],
    ['sp','очк(?:и|ов|а)\\s+навыков|SP'],
    ['followup','бонус[ -]атак(?:а|и|у|ой)|контратак(?:а|и|у|ой)|FUA'],
    ['dot','периодическ(?:ий|ого)\\s+урон(?:а)?|DoT'],
    ['shield','щит(?:а|ы|ом)?|барьер(?:а)?'],
    ['debuff','заморозк(?:а|и|у|ой)|замедлени(?:е|я)|ослаблени(?:е|я)'],
    ['buff','усилени(?:е|я)|баф(?:ф)?(?:ы|ов)?'],
    ['break','стойкост(?:ь|и)|суперпробити(?:е|я)|пробити(?:е|я)'],
    ['zone','зон(?:а|ы|у|ой)|пол(?:е|я)|Концерт'],
    ['state','Спектральная\\s+трансмиграция|Полное\\s+сгорание|Безмерная\\s+ярость|Повторное\\s+появление']
  ].map(([key,source])=>({key,source,match:new RegExp('^(?:'+source+')$','iu')}));
  const pattern=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+rules.map(rule=>rule.source).join('|')+')(?![\\p{L}\\p{N}_])','giu');
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function tokenize(value){
    const text=String(value),parts=[];let position=0;pattern.lastIndex=0;
    for(const match of text.matchAll(pattern)){
      if(match.index>position)parts.push({text:text.slice(position,match.index)});
      parts.push({text:match[0],key:rules.find(rule=>rule.match.test(match[0])).key});
      position=match.index+match[0].length;
    }
    if(position<text.length)parts.push({text:text.slice(position)});
    return parts;
  }
  function mark(key,content,trustedHTML=false){
    const [symbol,tone]=symbols[key]||symbols.state;
    return `<span class="plan-mark mark-${tone}" data-phenomenon="${symbols[key]?key:'state'}"><span class="phenomenon-icon" aria-hidden="true">${symbol}</span> ${trustedHTML?content:esc(content)}</span>`;
  }
  const excluded='script,style,textarea,input,select,option,svg,code,pre,[contenteditable="true"],[data-no-phenomena],.plan-mark';
  function decorate(container){
    const doc=container.ownerDocument||container;
    const nodes=[];
    if(container.nodeType===3)nodes.push(container);
    else{
      if(container.nodeType===1&&container.closest(excluded))return;
      const walker=doc.createTreeWalker(container,4);let node;
      while((node=walker.nextNode()))nodes.push(node);
    }
    for(const node of nodes){
      if(!node.parentElement||node.parentElement.closest(excluded))continue;
      const parts=tokenize(node.nodeValue);if(!parts.some(part=>part.key))continue;
      // Keep the original text as one layout item (labels use CSS grid).
      const fragment=doc.createElement('span');fragment.className='phenomenon-text';
      for(const part of parts){
        if(!part.key){fragment.append(doc.createTextNode(part.text));continue;}
        const span=doc.createElement('span'),icon=doc.createElement('span');
        span.className='plan-mark mark-'+symbols[part.key][1];span.dataset.phenomenon=part.key;
        icon.className='phenomenon-icon';icon.setAttribute('aria-hidden','true');icon.textContent=symbols[part.key][0];
        span.append(icon,doc.createTextNode(' '+part.text));fragment.append(span);
      }
      node.replaceWith(fragment);
    }
  }
  root.HSR_PHENOMENA={symbols,tokenize,mark,decorate};
  if(!root.document)return;
  function start(){
    decorate(root.document.body);
    new root.MutationObserver(records=>{
      for(const record of records){
        if(record.type==='characterData')decorate(record.target);
        else for(const node of record.addedNodes)if(node.nodeType===1||node.nodeType===3)decorate(node);
      }
    }).observe(root.document.body,{childList:true,subtree:true,characterData:true});
  }
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})(typeof window==='undefined'?globalThis:window);
