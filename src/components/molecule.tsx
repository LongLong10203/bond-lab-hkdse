'use client';
import { atomLabelLayout,bondSegments,moleculeViewBox } from '@/lib/molecule-display';
import type { Atom, Molecule } from '@/chemistry/types';
export const atomColor=(e:string)=>e==='O'?'#c45746':e==='N'?'#4867b8':['Cl','Br','I','F'].includes(e)?'#608547':'#252d28';
export function AtomLabel({atom,molecule}:{atom:Atom;molecule:Molecule}){
  const layout=atomLabelLayout(atom,molecule);
  return <g pointerEvents="none" fill={atomColor(atom.element)} fontFamily="Arial, sans-serif" fontWeight="500">{layout.hydrogenBonds.map((line,i)=><line key={`h-bond-${i}`} data-hydrogen-bond="true" x1={atom.x+line.x1} y1={atom.y+line.y1} x2={atom.x+line.x2} y2={atom.y+line.y2} stroke="#555f56" strokeWidth="2" strokeLinecap="round"/>)}{layout.parts.map((part,i)=><text key={i} data-label-part={part.kind} x={atom.x+part.x} y={atom.y+part.y} textAnchor="middle" dominantBaseline="alphabetic" fontSize={part.size}>{part.text}</text>)}</g>;
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
  const {x,y,width,height}=moleculeViewBox(molecule);
  return <svg className={'molecule-view '+className} style={height>200?{height:Math.min(240,height*0.65)}:undefined} role="img" aria-label={label??'Molecular structure'} viewBox={`${x} ${y} ${width} ${height}`}><BondLines molecule={molecule}/>{molecule.atoms.map(a=><AtomLabel key={a.id} atom={a} molecule={molecule}/>)}</svg>;
}
