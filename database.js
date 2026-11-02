/* Pure helpers shared by the interface and verification script. */
(function(root){
  const number=(value,digits=2)=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:digits}).format(value);
  const clean=value=>String(value??'').replace(/\{NICKNAME\}/g,'Первопроходец').replace(/\{F#([^}]*)\}\{M#([^}]*)\}/g,'$1 / $2').replace(/\{[FM]#([^}]*)\}/g,'$1').replace(/<[^>]*>/g,'').replace(/\\n/g,'\n').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  function describe(template,params=[]){return clean(template).replace(/#(\d+)\[(i|f\d*)\](%?)/g,(match,index,format,percent)=>{const value=params[Number(index)-1];return value===undefined?`[нет параметра ${index}]${percent}`:number(Number(value)*(percent?100:1),4)+percent;});}
  function stats(record,level,promotion){const values=record?.values?.[promotion];return values?Object.entries(values).map(([key,item])=>[key,item.base+item.step*(level-1)]):[];}
  const minimumPromotion=level=>Math.max(0,Math.min(6,Math.ceil((level-20)/10)));
  const relicKind=(setId,relics)=>Object.values(relics).some(r=>r.set_id===setId&&['OBJECT','NECK'].includes(r.type))?'planar':'cavern';
  const characterName=(c,paths)=>c.name.includes('{NICKNAME}')?`Первопроходец · ${paths[c.path]?.name||c.path} · ${Number(c.id)%2?'муж.':'жен.'}`:c.name;
  function skillParams(skill,index,supplements={}){const params=[...(skill.params?.[index]||[])];for(const [position,value] of Object.entries(supplements.skill_parameters?.[skill.id]?.values||{}))params[Number(position)]=value;return params;}
  function skillCap(character,skill,data){const trace=character.skill_trees.map(id=>data.character_skill_trees[id]).find(t=>t?.level_up_skills?.some(s=>s.id===skill.id));return Math.min(skill.params?.length||1,trace?.max_level||(skill.type==='Normal'?6:10));}
  root.HSR={number,clean,describe,stats,minimumPromotion,relicKind,characterName,skillParams,skillCap};
})(typeof window==='undefined'?globalThis:window);
