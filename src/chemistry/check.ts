import type { Molecule } from './types';
import { hydrogens, valence } from './molecules';
export function validate(m:Molecule):string|null{
  if(!m.atoms.length)return 'Add some atoms to the workspace first.';
  if(m.atoms.length>80||m.bonds.length>100)return 'This drawing is too large for this challenge.';
  const ids=new Set(m.atoms.map(a=>a.id));if(ids.size!==m.atoms.length)return 'Every atom must have a unique identifier.';
  const seen=new Set<string>();
  for(const b of m.bonds){const key=JSON.stringify([b.a,b.b].sort());if(![1,2,3].includes(b.order)||!ids.has(b.a)||!ids.has(b.b)||b.a===b.b||seen.has(key))return 'Check for duplicate or invalid bonds.';seen.add(key);}
  for(const a of m.atoms){
    if(a.charge && !((a.element==='O'&&a.charge===-1)||(a.element==='N'&&a.charge===1)))return 'Use O⁻ or N⁺ for charged atoms in these questions.';
    const used=m.bonds.filter(b=>b.a===a.id||b.b===a.id).reduce((s,b)=>s+b.order,0);
    if(used>valence(a))return `An ${a.element} atom has too many bonds. Check the bond orders.`;
    if((!m.autoH||a.element==='H')&&used!==valence(a))return `An ${a.element} atom has an incomplete valence. Add its missing bonds or enable automatic hydrogens.`;
  }
  return null;
}
function normalise(m:Molecule){
  // Fold only hydrogens attached to heavy atoms into their labels. Keep H₂ as
  // its own component so adding an unrelated hydrogen molecule cannot pass.
  const foldedH=new Set(m.atoms.filter(a=>a.element==='H'&&m.bonds.some(b=>{
    const neighbor=b.a===a.id?b.b:b.b===a.id?b.a:null;
    return neighbor!==null&&m.atoms.some(x=>x.id===neighbor&&x.element!=='H');
  })).map(a=>a.id));
  const atoms=m.atoms.filter(a=>!foldedH.has(a.id));
  const labels=atoms.map(a=>`${a.element}:${a.charge??0}:${hydrogens(m,a)+m.bonds.filter(b=>(b.a===a.id&&foldedH.has(b.b))||(b.b===a.id&&foldedH.has(b.a))).length}`);
  const matrix=atoms.map(a=>atoms.map(b=>m.bonds.find(x=>(x.a===a.id&&x.b===b.id)||(x.a===b.id&&x.b===a.id))?.order??0));
  return {labels,matrix};
}
export function equivalent(a:Molecule,b:Molecule):boolean{
  if(validate(a)||validate(b))return false;
  const x=normalise(a),y=normalise(b);if(x.labels.length!==y.labels.length)return false;
  const signatures=(g:typeof x)=>g.labels.map((v,i)=>v+'|'+g.matrix[i].map((o,j)=>o?`${o}:${g.labels[j]}`:'').filter(Boolean).sort().join(','));
  const xs=signatures(x),ys=signatures(y);
  if([...xs].sort().join(';')!==[...ys].sort().join(';'))return false;
  const order=xs.map((_,i)=>i).sort((i,j)=>ys.filter(v=>v===xs[i]).length-ys.filter(v=>v===xs[j]).length);
  const mapping=new Map<number,number>(),used=new Set<number>();
  const match=(depth:number):boolean=>{
    if(depth===order.length)return true;
    const i=order[depth];
    for(let j=0;j<ys.length;j++)if(!used.has(j)&&xs[i]===ys[j]&&[...mapping].every(([a,b])=>x.matrix[i][a]===y.matrix[j][b])){
      mapping.set(i,j);used.add(j);if(match(depth+1))return true;mapping.delete(i);used.delete(j);
    }return false;
  };return match(0);
}
export function conditionsMatch(actual:string[],accepted:string[][],context:{alcohol?:boolean;provided?:string[]}={}){
  const normalise=(ids:string[])=>[...new Set(ids)].filter(id=>id!=='excess'&&!context.provided?.includes(id)).map(id=>{
    if(['pt','ni','pd'].includes(id))return 'pt';
    if(context.alcohol&&id==='pcl3')return 'hcl';
    if(context.alcohol&&id==='pbr3')return 'hbr';
    return id;
  }).sort().join('|');
  return accepted.some(set=>normalise(actual)===normalise(set));
}
