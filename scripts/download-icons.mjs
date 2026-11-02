import {mkdir,writeFile} from 'node:fs/promises';
const root=new URL('../assets/icons/',import.meta.url);
await mkdir(root,{recursive:true});
const names=['path_abundance','path_destruction','path_elation','path_erudition','path_harmony','path_hunt','path_nihility','path_preservation','path_remem','ele_physical','ele_fire','ele_ice','ele_lightning','ele_wind','ele_quantum','ele_imaginary'];
await Promise.all(names.map(async name=>{
  const response=await fetch(`https://cdn.prydwen.gg/images/honkai-star-rail/icons/${name}.webp`);
  if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);
  if(!response.headers.get('content-type')?.startsWith('image/'))throw new Error(`${name}: expected image`);
  await writeFile(new URL(`${name}.webp`,root),Buffer.from(await response.arrayBuffer()));
}));
console.log(`Saved ${names.length} original Prydwen icons.`);
