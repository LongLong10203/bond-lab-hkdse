import type { Atom, Compound, Element, Molecule } from './types';
const roots = ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct'];
export function name(c: Compound): string {
  const r=roots[c.n], p=(c.position ?? 0)+1, h=c.halogen ?? 'Br';
  const hal={Cl:'chloro',Br:'bromo',I:'iodo'}[h];
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
    case 'amine': return `${roots[c.n]}ylamine`;
    case 'ammonium': return `${roots[c.n]}ylammonium ion`;
    case 'dihalo': return `1,2-di${hal}${r}ane`;
    case 'diol': return `${r}ane-1,2-diol`;
    case 'addition-polymer': return `poly(${c.n===2?'ethene':'propene'}) repeating unit`;
    case 'polyester': return 'polyester repeating unit';
    case 'polyamide': return 'polyamide repeating unit';
    case 'combustion': return 'carbon dioxide and water';
    case 'diacid': return `${r}anedioic acid`;
    case 'cracking': return `${roots[c.n]}ane + ${c.m===2?'ethene':roots[c.m??2]+'-1-ene'}`;
  }
}
export function molecule(c: Compound): Molecule {
  const atoms:Atom[]=[], bonds:Molecule['bonds']=[];
  const add=(element:Element,x:number,y:number,charge=0)=>{const id=String(atoms.length);atoms.push({id,element,x,y,...(charge?{charge}:{})});return id;};
  const bond=(a:string,b:string,order:1|2|3=1)=>bonds.push({a,b,order});
  const attach=(id:string,e:Element,dx:number,dy:number,order:1|2|3=1,charge=0)=>{const a=atoms.find(a=>a.id===id)!;const b=add(e,a.x+dx,a.y+dy,charge);bond(id,b,order);return b;};
  if(c.kind==='cracking'){
    const a=molecule({kind:'alkane',n:c.n}),b=molecule({kind:'alkene',n:c.m??2});
    const dx=Math.max(...a.atoms.map(x=>x.x))+100-Math.min(...b.atoms.map(x=>x.x));
    return {atoms:[...a.atoms,...b.atoms.map(x=>({...x,id:'b'+x.id,x:x.x+dx}))],bonds:[...a.bonds,...b.bonds.map(x=>({...x,a:'b'+x.a,b:'b'+x.b}))],autoH:true};
  }
  if(c.kind==='combustion'){
    const a=add('C',110,90);attach(a,'O',-65,0,2);attach(a,'O',65,0,2);add('O',265,90);
    return {atoms,bonds,autoH:true};
  }
  if(c.kind==='polyester'||c.kind==='polyamide'){
    const hetero=c.kind==='polyester'?'O':'N';
    const sequence:Element[]=['*',hetero,...Array(c.m??2).fill('C'),hetero,...Array(c.n).fill('C'),'*'];
    sequence.forEach((e,i)=>{add(e,45+i*58,120+(i%2)*22);if(i)bond(String(i-1),String(i));});
    const first=3+(c.m??2),last=sequence.length-2;
    attach(String(first),'O',0,-62,2);attach(String(last),'O',0,62,2);
    return {atoms,bonds,autoH:true,polymer:true};
  }
  if(c.kind==='addition-polymer'){
    ['*','C','C','*'].forEach((e,i)=>{add(e as Element,60+i*65,120);if(i)bond(String(i-1),String(i));});
    if(c.n===3)attach('2','C',0,-65);
    return {atoms,bonds,autoH:true,polymer:true};
  }
  for(let i=0;i<c.n;i++){add('C',70+i*66,120+(i%2)*28);if(i)bond(String(i-1),String(i),c.kind==='alkene'&&i===1?2:1);}
  if(c.kind==='diacid'){for(const id of ['0',String(c.n-1)]){attach(id,'O',0,-64,2);attach(id,'O',id==='0'?-62:62,0);}return {atoms,bonds,autoH:true};}
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
  if(!m.autoH||a.element==='H'||a.element==='*')return 0;
  return Math.max(0,valence(a)-m.bonds.filter(b=>b.a===a.id||b.b===a.id).reduce((s,b)=>s+b.order,0));
}
export function formula(m:Molecule){
  const counts:Record<string,number>={};for(const a of m.atoms){if(a.element==='*')continue;counts[a.element]=(counts[a.element]??0)+1;counts.H=(counts.H??0)+hydrogens(m,a);}
  return ['C','H',...Object.keys(counts).filter(x=>x!=='C'&&x!=='H').sort()].filter(e=>counts[e]).map(e=>e+(counts[e]>1?counts[e]:'' )).join('');
}
