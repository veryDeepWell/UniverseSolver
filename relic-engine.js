/* Linear roll quality is exact for the selected weights. It is not a combat maximum. */
(function(root){
  const O=root.HSR_OPT;
  const maxima=data=>Object.fromEntries(O.subAffixes(data).map(a=>[a.property,a.base+a.step*a.step_num]));
  function weightsValid(weights,data){for(const [type,value] of Object.entries(weights))if(!maxima(data)[type]||!Number.isFinite(value)||value<0||value>10)throw Error('Вес сабстата должен быть от 0 до 10.');}
  function score(item,weights,data){const max=maxima(data);return item.subs.reduce((sum,s)=>sum+s.value/max[s.type]*(weights[s.type]||0),0);}
  function ceiling(item,weights,data,initial=4,sameTypes=false){
    weightsValid(weights,data);if(![3,4].includes(initial))throw Error('Выбери 3 или 4 начальных сабстата.');
    const types=sameTypes?item.subs.map(s=>s.type):O.subAffixes(data).map(a=>a.property).filter(t=>t!==item.main);
    const ordered=types.sort((a,b)=>(weights[b]||0)-(weights[a]||0)).slice(0,4),upgrades=initial===4?5:4;
    const best=ordered[0],max=maxima(data),value=ordered.reduce((s,t)=>s+(weights[t]||0),0)+upgrades*(weights[best]||0);
    return {score:value,subs:ordered.map(type=>({type,value:max[type]*(1+(type===best?upgrades:0))}))};
  }
  function rollCounts(sub,data){
    const a=O.subAffixes(data).find(a=>a.property===sub.type),tolerance=data.properties[sub.type]?.percent ? .00051 : 1.01,result=[];
    for(let n=1;n<=6;n++)for(let k=0;k<=a.step_num*n;k++)if(Math.abs(sub.value-(a.base*n+a.step*k))<=tolerance){result.push(n);break;}
    return result;
  }
  function validateRolls(item,initial,data){
    O.validateItem(item,data);if(![3,4].includes(initial))throw Error('Начальных сабстатов должно быть 3 или 4.');
    const ticks=Math.floor(item.level/3),count=Math.min(4,initial+ticks),budget=initial+ticks;
    if(item.subs.length!==count)throw Error(`Для +${item.level} и ${initial} начальных строк нужно ${count} сабстата.`);
    let possible=new Set([0]);for(const sub of item.subs){const counts=rollCounts(sub,data);possible=new Set([...possible].flatMap(n=>counts.map(k=>n+k)));}
    if(!possible.has(budget))throw Error(`Значения не укладываются в ${budget} роллов. Проверь цифры и число начальных строк (3/4). Допускается округление экрана игры.`);
    return true;
  }
  const factorial=n=>n<2?1:n*factorial(n-1),tierCache=new Map();
  function tiers(n){if(tierCache.has(n))return tierCache.get(n);let p=[1];for(let i=0;i<n;i++){const next=Array(p.length+2).fill(0);for(let k=0;k<p.length;k++)for(let j=0;j<3;j++)next[k+j]+=p[k]/3;p=next;}tierCache.set(n,p);return p;}
  function reroll(item,weights,data,initial=4){
    validateRolls(item,initial,data);weightsValid(weights,data);if(item.level!==15)throw Error('Реролл доступен для реликвии +15.');
    const current=score(item,weights,data),affixes=O.subAffixes(data),max=maxima(data),upgrades=initial===4?5:4;
    let chance=0,expected=0,expectedKeep=0,probability=0;
    function values(counts,prob,index=0,sum=0){
      if(index===4){probability+=prob;expected+=prob*sum;expectedKeep+=prob*Math.max(current,sum);if(sum>current+1e-8)chance+=prob;return;}
      const sub=item.subs[index],w=weights[sub.type]||0;if(!w){values(counts,prob,index+1,sum);return;}
      const n=counts[index]+1,a=affixes.find(a=>a.property===sub.type),p=tiers(n);
      for(let k=0;k<p.length;k++)values(counts,prob*p[k],index+1,sum+(a.base*n+a.step*k)/max[sub.type]*w);
    }
    function allocation(left,counts=[]){if(counts.length===3){const all=[...counts,left],p=factorial(upgrades)/all.reduce((v,n)=>v*factorial(n),1)/4**upgrades;values(all,p);return;}for(let n=0;n<=left;n++)allocation(left-n,[...counts,n]);}
    allocation(upgrades);
    return {current,chance:chance/probability,expected:expected/probability,expectedKeep:expectedKeep/probability,maximum:ceiling(item,weights,data,initial,true),probability};
  }
  function compare(a,b,weights,data){if(a.slot!==b.slot)throw Error('Сравнивать можно предметы одного слота.');O.validateItem(a,data);O.validateItem(b,data);return {a:score(a,weights,data),b:score(b,weights,data),delta:score(b,weights,data)-score(a,weights,data)};}
  const profiles={
    atk:{AttackAddedRatio:1,AttackDelta:.25,CriticalChanceBase:1,CriticalDamageBase:1,SpeedDelta:.75},
    hp:{HPAddedRatio:1,HPDelta:.3,CriticalChanceBase:1,CriticalDamageBase:1,SpeedDelta:.65},
    def:{DefenceAddedRatio:1,DefenceDelta:.3,CriticalChanceBase:1,CriticalDamageBase:1,SpeedDelta:.75},
    break:{BreakDamageAddedRatioBase:1,SpeedDelta:1},
    dot:{AttackAddedRatio:1,AttackDelta:.25,SpeedDelta:1,StatusProbabilityBase:.75},
    support:{SpeedDelta:1,HPAddedRatio:.5,DefenceAddedRatio:.5,StatusResistanceBase:.5}
  };
  function archetype(id,data){const key=root.HSR_TEAM?.canonical(id)||id;if(['1310','1315','1225','1321','8005','8006','1301','1222'].includes(key))return 'break';if(['1005','1111','1205','1404','1407','1403','1413','1507'].includes(key))return 'hp';if(['1304','1503','8003','8004'].includes(key))return 'def';if(['1009','1110','1117','1307','1218'].includes(key))return 'dot';return root.HSR_TEAM?.models[id]?.role!=='dps'?'support':'atk';}
  function defaultWeights(id,data){const result={...profiles[archetype(id,data)]};if(['1101','1313'].includes(root.HSR_TEAM?.canonical(id)||id))result.CriticalDamageBase=1;return result;}
  root.HSR_RELIC={maxima,score,ceiling,rollCounts,validateRolls,reroll,compare,profiles,archetype,defaultWeights};
})(typeof window==='undefined'?globalThis:window);
