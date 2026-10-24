'use client';
import { useEffect,useRef,useState } from 'react';
import { Undo2,Redo2,Trash2,Move,Copy,Minus,Equal } from 'lucide-react';
import type { Element,Molecule } from '@/chemistry/types';
import { formula } from '@/chemistry/molecules';
import { atomLabelLayout,moleculeDisplayBounds } from '@/lib/molecule-display';
import { AtomLabel,BondLines } from './molecule';
import { useMoleculeLayout } from './use-molecule-layout';
const empty=():Molecule=>({atoms:[],bonds:[],autoH:true});
const ELEMENTS:Element[]=['C','H','O','N','Cl','Br','I','*'];
export default function Editor({value,onChange,onLayout=onChange,starting,disabled=false}:{value:Molecule;onChange:(m:Molecule)=>void;onLayout?:(m:Molecule)=>void;starting?:Molecule;disabled?:boolean}){
  const svg=useRef<SVGSVGElement>(null),suppressClick=useRef(false);
  const [tool,setTool]=useState<string>('C'),[selected,setSelected]=useState<string|null>(null),[bondStart,setBondStart]=useState<string|null>(null),[past,setPast]=useState<Molecule[]>([]),[future,setFuture]=useState<Molecule[]>([]);
  const layout=useMoleculeLayout(value,onLayout,disabled,bondStart!==null);
  const exitTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const previous=useRef(value),[leaving,setLeaving]=useState<Molecule|null>(null);
  useEffect(()=>{const old=previous.current;previous.current=value;const removed=old.atoms.filter(a=>!value.atoms.some(b=>b.id===a.id));const removedBonds=old.bonds.filter(a=>!value.bonds.some(b=>a.a===b.a&&a.b===b.b&&a.order===b.order));if(!removed.length&&!removedBonds.length)return;setLeaving({...old,atoms:old.atoms,bonds:removedBonds});clearTimeout(exitTimer.current);exitTimer.current=setTimeout(()=>setLeaving(null),180);},[value]);
  useEffect(()=>()=>clearTimeout(exitTimer.current),[]);
  const commit=(next:Molecule,keepCoordinates=false)=>{if(disabled)return;const before=layout.snapshot();setPast(p=>[...p.slice(-49),structuredClone(before)]);setFuture([]);onChange(keepCoordinates?next:{...next,atoms:next.atoms.map(a=>{const existing=before.atoms.find(b=>b.id===a.id);return existing?{...a,x:existing.x,y:existing.y}:a;})});};
  const undo=()=>{if(disabled||!past.length)return;setFuture(f=>[structuredClone(layout.snapshot()),...f]);onChange(past.at(-1)!);setPast(p=>p.slice(0,-1));setSelected(null);setBondStart(null);};
  const redo=()=>{if(disabled||!future.length)return;setPast(p=>[...p,structuredClone(layout.snapshot())]);onChange(future[0]);setFuture(f=>f.slice(1));setSelected(null);setBondStart(null);};
  const point=(x:number,y:number)=>{const p=svg.current!.createSVGPoint();p.x=x;p.y=y;const a=p.matrixTransform(svg.current!.getScreenCTM()!.inverse());return {x:Math.max(38,Math.min(682,a.x)),y:Math.max(38,Math.min(302,a.y))};};
  const add=(element:Element,x:number,y:number)=>{if(value.atoms.length>=60)return;const id=crypto.randomUUID().slice(0,12);commit({...value,atoms:[...value.atoms,{id,element,x,y}]});setSelected(id);setBondStart(null);};
  const atomClick=(id:string)=>{
    if(disabled||suppressClick.current){suppressClick.current=false;return;}
    if(tool==='erase'){commit({...value,atoms:value.atoms.filter(a=>a.id!==id),bonds:value.bonds.filter(b=>b.a!==id&&b.b!==id)});setSelected(null);setBondStart(null);return;}
    setSelected(id);
    if(tool==='charge'){commit({...value,atoms:value.atoms.map(a=>a.id!==id?a:{...a,charge:a.charge?0:a.element==='O'?-1:a.element==='N'?1:0})});return;}
    if(tool==='single'||tool==='double'){
      if(bondStart&&bondStart!==id){const order=tool==='double'?2:1;const found=value.bonds.find(b=>(b.a===bondStart&&b.b===id)||(b.b===bondStart&&b.a===id));commit({...value,bonds:found?value.bonds.map(b=>b===found?{...b,order}:b):[...value.bonds,{a:bondStart,b:id,order}]});setBondStart(null);}else setBondStart(id);
    }else setSelected(id);
  };
  const useStart=()=>{if(!starting?.atoms.length)return;const bounds=moleculeDisplayBounds(starting),dx=360-(bounds.left+bounds.right)/2,dy=170-(bounds.top+bounds.bottom)/2;commit({...structuredClone(starting),atoms:starting.atoms.map(a=>({...a,x:a.x+dx,y:a.y+dy}))},true);setSelected(null);setBondStart(null);};
  const helper=tool==='single'||tool==='double'?(bondStart?'Select the second atom.':'Select two atoms to connect.'):tool==='erase'?'Select an atom or bond to remove.':tool==='charge'?'Select O for − or N for +.':'Drag atoms to rearrange them.';
  return <div className={'editor '+(disabled?'editor-disabled':'')}>
    <div className="editor-toolbar"><div className="elements" aria-label="Atoms">{ELEMENTS.map(e=><button type="button" draggable={!disabled} onDragStart={event=>event.dataTransfer.setData('element',e)} disabled={disabled} key={e} title={e==='*'?'Polymer continuation':`Add ${e}`} aria-label={e==='*'?'Add chain continuation':`Add ${e} atom`} aria-pressed={tool===e} className={tool===e?'selected':''} onClick={()=>{setTool(e);setSelected(null);setBondStart(null);}}>{e}</button>)}</div><div className="bond-tools">
      <button title="Single bond" aria-label="Single bond" aria-pressed={tool==='single'} className={tool==='single'?'selected':''} disabled={disabled} onClick={()=>{setTool('single');setSelected(null);setBondStart(null);}}><Minus size={19}/></button>
      <button title="Double bond" aria-label="Double bond" aria-pressed={tool==='double'} className={tool==='double'?'selected':''} disabled={disabled} onClick={()=>{setTool('double');setSelected(null);setBondStart(null);}}><Equal size={19}/></button>
      <button title="Move atoms" aria-label="Move atoms" aria-pressed={tool==='move'} className={tool==='move'?'selected':''} disabled={disabled} onClick={()=>{setTool('move');setBondStart(null);}}><Move size={17}/></button>
      <button title="Erase" aria-label="Erase atom or bond" aria-pressed={tool==='erase'} className={tool==='erase'?'selected':''} disabled={disabled} onClick={()=>{setTool('erase');setSelected(null);setBondStart(null);}}><Trash2 size={16}/></button>
      <button title="O− / N+" aria-label="Toggle atom charge" aria-pressed={tool==='charge'} className={tool==='charge'?'selected':''} disabled={disabled} onClick={()=>{setTool('charge');setBondStart(null);}}>±</button>
    </div></div>
    <div className="canvas-wrap"><svg ref={svg} className="drawing-canvas" viewBox="0 0 720 340" role="application" aria-label="Molecule drawing workspace" tabIndex={0}
      onKeyDown={e=>{
        if(disabled)return;
        if(e.target===e.currentTarget&&e.key==='Enter'&&ELEMENTS.includes(tool as Element)){e.preventDefault();add(tool as Element,70+(value.atoms.length%9)*70,60+Math.floor(value.atoms.length/9)*38);}
        if(tool==='move'&&selected&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const current=layout.snapshot();commit({...current,atoms:current.atoms.map(a=>a.id!==selected?a:{...a,x:Math.max(38,Math.min(682,a.x+(e.key==='ArrowLeft'?-20:e.key==='ArrowRight'?20:0))),y:Math.max(38,Math.min(302,a.y+(e.key==='ArrowUp'?-20:e.key==='ArrowDown'?20:0)))})},true);}
        if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}
        if((e.key==='Delete'||e.key==='Backspace')&&selected){e.preventDefault();commit({...value,atoms:value.atoms.filter(a=>a.id!==selected),bonds:value.bonds.filter(b=>b.a!==selected&&b.b!==selected)});setSelected(null);setBondStart(null);}
      }}
      onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(disabled)return;const el=e.dataTransfer.getData('element') as Element;if(ELEMENTS.includes(el)){const p=point(e.clientX,e.clientY);add(el,p.x,p.y);}}}
      onClick={e=>{if(disabled)return;if(suppressClick.current){suppressClick.current=false;return;}if(ELEMENTS.includes(tool as Element)){const p=point(e.clientX,e.clientY);add(tool as Element,p.x,p.y);}else setSelected(null);setBondStart(null);}}
      onPointerMove={e=>{if(!disabled)layout.moveDrag(point(e.clientX,e.clientY));}}
      onPointerUp={()=>{const ended=layout.finishDrag();if(ended?.moved){suppressClick.current=true;setPast(p=>[...p.slice(-49),ended.start]);setFuture([]);onChange(ended.end);}}}
      onPointerCancel={()=>{const start=layout.cancelDrag();if(start)onChange(start);}}>
      {leaving&&<g className="molecule-exit" pointerEvents="none"><BondLines molecule={leaving}/>{leaving.atoms.filter(a=>!value.atoms.some(b=>b.id===a.id)).map(a=><AtomLabel key={a.id} atom={a} molecule={leaving}/>)}</g>}
      <BondLines molecule={layout.rendered} animate onBondClick={i=>{if(disabled)return;if(tool==='erase')commit({...value,bonds:value.bonds.filter((_,j)=>j!==i)});else if(tool==='single'||tool==='double')commit({...value,bonds:value.bonds.map((b,j)=>j===i?{...b,order:tool==='single'?1:2}:b)});}}/>
      {layout.rendered.atoms.map(a=>{const label=atomLabelLayout(a,layout.rendered);return <g key={a.id} transform={`translate(${a.x} ${a.y})`} className="editor-atom" role="button" tabIndex={disabled?-1:0} aria-pressed={selected===a.id} aria-label={`${a.element} atom`} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();atomClick(a.id);}}} onClick={e=>{e.stopPropagation();atomClick(a.id);}} onPointerDown={e=>{if(!disabled){e.preventDefault();suppressClick.current=false;setSelected(a.id);if(ELEMENTS.includes(tool as Element)||tool==='move'){e.currentTarget.setPointerCapture(e.pointerId);layout.startDrag(a.id,point(e.clientX,e.clientY));}}}}>
        <g className="atom-entrance"><circle className="atom-ring" cx={label.center.x} cy={label.center.y} r={label.radius} fill="transparent" stroke={selected===a.id?'#789345':'transparent'} strokeWidth="1.5"/><AtomLabel atom={{...a,x:0,y:0}} molecule={layout.rendered}/></g>
      </g>;})}
    </svg>{!value.atoms.length&&<div className="empty-canvas" aria-hidden="true"><strong>Add an atom to begin.</strong></div>}
    <div className="canvas-actions"><button title="Undo" aria-label="Undo" disabled={!past.length||disabled} onClick={undo}><Undo2 size={17}/></button><button title="Redo" aria-label="Redo" disabled={!future.length||disabled} onClick={redo}><Redo2 size={17}/></button><button title="Clear drawing" aria-label="Clear drawing" disabled={!value.atoms.length||disabled} onClick={()=>{commit(empty());setSelected(null);setBondStart(null);}}><Trash2 size={16}/></button></div>
    </div>
    <div className="editor-bottom"><label className="auto-h"><input type="checkbox" checked={!!value.autoH} disabled={disabled} onChange={e=>commit({...value,autoH:e.target.checked})}/>Auto H</label><label className="auto-h"><input type="checkbox" checked={layout.flexible} disabled={disabled} onChange={e=>layout.setFlexible(e.target.checked)}/>Flexible layout</label><span className="atom-count">{value.atoms.length>0&&<b>{formula(value)}</b>}</span>{starting&&<button className="text-button" disabled={disabled} onClick={useStart}><Copy size={14}/>Copy reactant</button>}</div><div className="editor-help">{helper}</div>
  </div>;
}
