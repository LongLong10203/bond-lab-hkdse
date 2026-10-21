'use client';
import { hydrogens } from '@/chemistry/molecules';
import type { Atom, Molecule } from '@/chemistry/types';
export const atomColor=(e:string)=>e==='O'?'#c45746':e==='N'?'#4867b8':['Cl','Br','I','F'].includes(e)?'#608547':'#252d28';
export function AtomLabel({atom,molecule}:{atom:Atom;molecule:Molecule}){
  const h=hydrogens(molecule,atom);
  return <text x={atom.x} y={atom.y+1} textAnchor="middle" dominantBaseline="middle" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="500" fill={atomColor(atom.element)} pointerEvents="none">{atom.element}{h>0&&<tspan fontSize="18">H</tspan>}{h>1&&<tspan fontSize="12" dy="5">{h}</tspan>}{atom.charge?<tspan fontSize="14" dy={h>1?'-14':'-9'}>{atom.charge>0?'+':'−'}</tspan>:null}</text>;
}
export function BondLines({molecule,onBondClick,animate=false}:{molecule:Molecule;animate?:boolean;onBondClick?:(index:number)=>void}){
  return <>{molecule.bonds.map((b,i)=>{
    const a=molecule.atoms.find(a=>a.id===b.a),c=molecule.atoms.find(a=>a.id===b.b);if(!a||!c)return null;
    const dx=c.x-a.x,dy=c.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
    const offsets=b.order===1?[0]:b.order===2?[-3,3]:[-5,0,5];
    return <g key={`${b.a}-${b.b}-${b.order}`} className={animate?'bond-entrance':undefined} onClick={e=>{if(onBondClick){e.stopPropagation();onBondClick(i);}}}>
      {offsets.map(o=><line key={o} className="bond-stroke" pathLength="1" x1={a.x+ux*24-uy*o} y1={a.y+uy*24+ux*o} x2={c.x-ux*24-uy*o} y2={c.y-uy*24+ux*o} stroke="#555f56" strokeWidth="2" strokeLinecap="round"/>)}
      {onBondClick&&<line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="transparent" strokeWidth="18" style={{cursor:'pointer'}}/>}
    </g>;
  })}</>;
}
export default function MoleculeView({molecule,label,className=''}:{molecule:Molecule;label?:string;className?:string}){
  const xs=molecule.atoms.map(a=>a.x),ys=molecule.atoms.map(a=>a.y);
  const x=Math.min(...xs)-48,y=Math.min(...ys)-45,w=Math.max(...xs)-x+48,h=Math.max(...ys)-y+45;
  return <svg className={'molecule-view '+className} role="img" aria-label={label??'Molecular structure'} viewBox={`${x} ${y} ${Math.max(w,100)} ${Math.max(h,100)}`}><BondLines molecule={molecule}/>{molecule.atoms.map(a=><AtomLabel key={a.id} atom={a} molecule={molecule}/>)}</svg>;
}
