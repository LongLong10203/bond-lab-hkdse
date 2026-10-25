import type { Atom, Compound, Element, Molecule } from './types';
const roots = ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct'];
export function name(c: Compound): string {
  const r=roots[c.n], p=(c.position ?? 0)+1, h=c.halogen ?? 'Br';
  const hal={Cl:'chloro',Br:'bromo',I:'iodo'}[h];
  if(c.cyclic){
    const ring=`cyclo${r}`;
    if(c.kind==='alkane')return `${ring}ane`;
    if(c.kind==='alkene')return `${ring}ene`;
    if(c.kind==='alcohol')return `${ring}anol`;
    if(c.kind==='ketone')return `${ring}anone`;
    if(c.kind==='haloalkane')return `${hal}${ring}ane`;
    if(c.kind==='dihalo')return `1,2-di${hal}${ring}ane`;
  }
  switch(c.kind){
    case 'alkane': return `${r}ane`;
    case 'alkene': return c.n===2?'ethene':`${r}-1-ene`;
    case 'haloalkane': return `${c.n>2?p+'-':''}${hal}${r}ane`;
    case 'alcohol': return c.n<3?`${r}anol`:`${r}an-${p}-ol`;
    case 'aldehyde': return `${r}anal`;
    case 'ketone': return `${r}an-2-one`;
    case 'acid': return `${r}anoic acid`;
    case 'carboxylate': return `${r}anoate ion`;
    case 'ester': return `${roots[c.m??2]}yl ${r}anoate`;
    case 'amide': return `${c.m?`N-${roots[c.m]}yl` : ''}${r}anamide`;
    case 'amine': return c.n?`${roots[c.n]}ylamine`:'ammonia';
    case 'ammonium': return c.n?`${roots[c.n]}ylammonium ion`:'ammonium ion';
    case 'dihalo': return `1,2-di${hal}${r}ane`;
    case 'diol': return `${r}ane-1,2-diol`;
    case 'water': return 'water';
    case 'carbon-dioxide': return 'carbon dioxide';
    case 'hydrogen-halide': return `hydrogen ${h==='Cl'?'chloride':h==='Br'?'bromide':'iodide'}`;
  }
}
export function molecule(c: Compound): Molecule {
  const atoms:Atom[]=[], bonds:Molecule['bonds']=[];
  const add=(element:Element,x:number,y:number,charge=0)=>{const id=String(atoms.length);atoms.push({id,element,x,y,...(charge?{charge}:{})});return id;};
  const bond=(a:string,b:string,order:1|2|3=1)=>bonds.push({a,b,order});
  const attach=(id:string,e:Element,dx:number,dy:number,order:1|2|3=1,charge=0)=>{const a=atoms.find(a=>a.id===id)!;const b=add(e,a.x+dx,a.y+dy,charge);bond(id,b,order);return b;};
  if(c.kind==='water'){add('O',100,100);return {atoms,bonds,autoH:true};}
  if(c.kind==='carbon-dioxide'){const id=add('C',100,100);attach(id,'O',-66,0,2);attach(id,'O',66,0,2);return {atoms,bonds,autoH:true};}
  if(c.kind==='hydrogen-halide'){add(c.halogen??'Br',100,100);return {atoms,bonds,autoH:true};}
  if((c.kind==='amine'||c.kind==='ammonium')&&c.n===0){add('N',100,100,c.kind==='ammonium'?1:0);return {atoms,bonds,autoH:true};}
  if(c.cyclic){
    const radius=76/(2*Math.sin(Math.PI/c.n));
    for(let i=0;i<c.n;i++){const angle=-Math.PI/2+i*2*Math.PI/c.n;add('C',180+radius*Math.cos(angle),150+radius*Math.sin(angle));}
    for(let i=0;i<c.n;i++)bond(String(i),String((i+1)%c.n),c.kind==='alkene'&&i===0?2:1);
    const outward=(i:number,e:Element,order:1|2=1)=>{const angle=-Math.PI/2+i*2*Math.PI/c.n;attach(String(i),e,66*Math.cos(angle),66*Math.sin(angle),order);};
    if(c.kind==='alcohol')outward(0,'O');
    if(c.kind==='ketone')outward(0,'O',2);
    if(c.kind==='haloalkane')outward(0,c.halogen??'Br');
    if(c.kind==='dihalo'){outward(0,c.halogen??'Br');outward(1,c.halogen??'Br');}
    return {atoms,bonds,autoH:true};
  }
  for(let i=0;i<c.n;i++){add('C',70+i*66,120+(i%2)*28);if(i)bond(String(i-1),String(i),c.kind==='alkene'&&i===1?2:1);}
  const pos=String(c.position??0);
  if(c.kind==='alcohol')attach(pos,'O',0,-64);
  if(c.kind==='haloalkane')attach(pos,c.halogen??'Br',0,-64);
  if(c.kind==='dihalo'||c.kind==='diol'){attach('0',c.kind==='diol'?'O':c.halogen??'Br',0,-64);attach('1',c.kind==='diol'?'O':c.halogen??'Br',0,64);}
  if(c.kind==='aldehyde')attach('0','O',0,-64,2);
  if(c.kind==='ketone')attach('1','O',0,-64,2);
  if(['acid','ester','amide','carboxylate'].includes(c.kind)){
    attach('0','O',0,-64,2);
    const head=attach('0',c.kind==='amide'?'N':'O',-66,25,1,c.kind==='carboxylate'?-1:0);
    if(c.kind==='ester'||(c.kind==='amide'&&c.m)){
      let last=head;for(let i=0;i<(c.m??2);i++){const next=attach(last,'C',-62,i%2?-26:26);last=next;}
    }
  }
  if(c.kind==='amine'||c.kind==='ammonium')attach('0','N',0,-64,1,c.kind==='ammonium'?1:0);
  return {atoms,bonds,autoH:true};
}
export const valence=(a:Atom)=>a.element==='C'?4:a.element==='N'?(a.charge===1?4:3):a.element==='O'?(a.charge===-1?1:2):1;
export function hydrogens(m:Molecule,a:Atom){
  if(!m.autoH||a.element==='H')return 0;
  return Math.max(0,valence(a)-m.bonds.filter(b=>b.a===a.id||b.b===a.id).reduce((s,b)=>s+b.order,0));
}
export function formula(m:Molecule){
  const counts:Record<string,number>={};for(const a of m.atoms){counts[a.element]=(counts[a.element]??0)+1;counts.H=(counts.H??0)+hydrogens(m,a);}
  return ['C','H',...Object.keys(counts).filter(x=>x!=='C'&&x!=='H').sort()].filter(e=>counts[e]).map(e=>e+(counts[e]>1?counts[e]:'' )).join('');
}
