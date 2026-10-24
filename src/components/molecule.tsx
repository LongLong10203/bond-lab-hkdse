'use client';
import { atomLabelLayout,bondSegments } from '@/lib/molecule-display';
import type { Atom, Molecule } from '@/chemistry/types';
export const atomColor=(e:string)=>e==='O'?'#c45746':e==='N'?'#4867b8':['Cl','Br','I','F'].includes(e)?'#608547':'#252d28';
export function AtomLabel({atom,molecule}:{atom:Atom;molecule:Molecule}){
  return <g pointerEvents="none" fill={atomColor(atom.element)} fontFamily="Arial, sans-serif" fontWeight="500">{atomLabelLayout(atom,molecule).parts.map(part=><text key={part.kind} data-label-part={part.kind} x={atom.x+part.x} y={atom.y+part.y} textAnchor="middle" dominantBaseline="alphabetic" fontSize={part.size}>{part.text}</text>)}</g>;
}
export function BondLines({molecule,onBondClick,animate=false}:{molecule:Molecule;animate?:boolean;onBondClick?:(index:number)=>void}){
  return <>{molecule.bonds.map((b,i)=>{
    const a=molecule.atoms.find(a=>a.id===b.a),c=molecule.atoms.find(a=>a.id===b.b);if(!a||!c)return null;
    const segments=bondSegments(molecule,b);
    return <g key={`${b.a}-${b.b}-${b.order}`} className={animate?'bond-entrance':undefined} onClick={e=>{if(onBondClick){e.stopPropagation();onBondClick(i);}}}>
      {segments.map((segment,index)=><line key={index} className="bond-stroke" pathLength="1" {...segment} stroke="#555f56" strokeWidth="2" strokeLinecap="round"/>)}
      {onBondClick&&<line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="transparent" strokeWidth="18" style={{cursor:'pointer'}}/>}
    </g>;
  })}</>;
}
export default function MoleculeView({molecule,label,className=''}:{molecule:Molecule;label?:string;className?:string}){
  const boxes=molecule.atoms.map(atom=>{const b=atomLabelLayout(atom,molecule).bounds;return {left:atom.x+b.left,right:atom.x+b.right,top:atom.y+b.top,bottom:atom.y+b.bottom};});
  const x=(boxes.length?Math.min(...boxes.map(b=>b.left)):0)-15,y=(boxes.length?Math.min(...boxes.map(b=>b.top)):0)-15;
  const w=(boxes.length?Math.max(...boxes.map(b=>b.right)):85)-x+15,h=(boxes.length?Math.max(...boxes.map(b=>b.bottom)):85)-y+15;
  return <svg className={'molecule-view '+className} role="img" aria-label={label??'Molecular structure'} viewBox={`${x} ${y} ${Math.max(w,100)} ${Math.max(h,100)}`}><BondLines molecule={molecule}/>{molecule.atoms.map(a=><AtomLabel key={a.id} atom={a} molecule={molecule}/>)}</svg>;
}
