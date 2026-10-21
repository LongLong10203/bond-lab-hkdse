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
    if((!m.autoH||a.element==='H'||a.element==='*')&&used!==valence(a))return `An ${a.element} atom has an incomplete valence. Add its missing bonds or enable automatic hydrogens.`;
  }
  const ends=m.atoms.filter(a=>a.element==='*');
  if(ends.length){
    if(ends.length!==2)return 'A polymer repeat unit needs exactly two chain continuation points (*).';
    const connected=new Set<string>([ends[0].id]);
    const queue=[ends[0].id];
    for(const id of queue)for(const b of m.bonds){const neighbor=b.a===id?b.b:b.b===id?b.a:null;if(neighbor&&!connected.has(neighbor)){connected.add(neighbor);queue.push(neighbor);}}
    if(connected.size!==m.atoms.length||m.bonds.length!==m.atoms.length-1)return 'Draw one connected, open-chain repeat unit with * at both ends.';
    for(const end of ends){const bond=m.bonds.find(b=>b.a===end.id||b.b===end.id)!;const neighbor=m.atoms.find(a=>a.id===(bond.a===end.id?bond.b:bond.a))!;if(['*','H'].includes(neighbor.element))return 'Attach each continuation point to the repeat unit’s carbon, oxygen or nitrogen backbone.';}
  }
  return null;
}
function normalise(m:Molecule){
  const ends=m.atoms.filter(a=>a.element==='*');
  const periodic=ends.length===2;
  // Fold only hydrogens attached to heavy atoms into their labels. Keep H₂ as
  // its own component so adding an unrelated hydrogen molecule cannot pass.
  const foldedH=new Set(m.atoms.filter(a=>a.element==='H'&&m.bonds.some(b=>{
    const neighbor=b.a===a.id?b.b:b.b===a.id?b.a:null;
    return neighbor!==null&&m.atoms.some(x=>x.id===neighbor&&x.element!=='H');
  })).map(a=>a.id));
  const atoms=m.atoms.filter(a=>!foldedH.has(a.id)&&(!periodic||a.element!=='*'));
  const endNeighbors=periodic?ends.map(a=>{const b=m.bonds.find(b=>b.a===a.id||b.b===a.id)!;return b.a===a.id?b.b:b.a;}):[];
  const labels=atoms.map(a=>`${a.element}:${a.charge??0}:${hydrogens(m,a)+m.bonds.filter(b=>(b.a===a.id&&foldedH.has(b.b))||(b.b===a.id&&foldedH.has(b.a))).length}`);
  const matrix=atoms.map(a=>atoms.map(b=>m.bonds.find(x=>(x.a===a.id&&x.b===b.id)||(x.a===b.id&&x.b===a.id))?.order??0));
  if(periodic){const i=atoms.findIndex(a=>a.id===endNeighbors[0]),j=atoms.findIndex(a=>a.id===endNeighbors[1]);if(i>=0&&j>=0){matrix[i][j]+=1;matrix[j][i]+=1;}}
  return {labels,matrix};
}
export function equivalent(a:Molecule,b:Molecule):boolean{
  if(validate(a)||validate(b))return false;
  if(a.atoms.filter(a=>a.element==='*').length!==b.atoms.filter(a=>a.element==='*').length)return false;
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
