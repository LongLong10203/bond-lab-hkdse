'use client';
import { useEffect,useRef,useState } from 'react';
import type { Molecule } from '@/chemistry/types';
import { clampPoint,layoutTick,withPositions,type Point,type Positions } from '@/lib/molecule-layout';
export function useMoleculeLayout(value:Molecule,onLayout:(m:Molecule)=>void,disabled:boolean,paused=false){
  const [flexible,setFlexible]=useState(true),[reducedMotion,setReducedMotion]=useState(false),[positions,setPositions]=useState<Positions>({});
  const points=useRef<Positions>({}),current=useRef(value),persist=useRef(onLayout),frame=useRef(0),iterations=useRef(0),skip=useRef<Molecule|null>(null);
  const pinned=useRef<{id:string;point:Point}|undefined>(undefined),drag=useRef<{start:Molecule;point:Point;moved:boolean}|null>(null);
  const running=useRef({flexible,disabled,reducedMotion,paused});current.current=value;persist.current=onLayout;running.current={flexible,disabled,reducedMotion,paused};
  const snapshot=()=>withPositions(current.current,points.current);
  const stop=()=>{cancelAnimationFrame(frame.current);frame.current=0;};
  const save=()=>{const next=snapshot();if(next.atoms.some(a=>{const old=current.current.atoms.find(b=>b.id===a.id);return old&&Math.hypot(a.x-old.x,a.y-old.y)>.01;})){skip.current=next;persist.current(next);}};
  const tick=()=>{
    frame.current=0;const settings=running.current;if(settings.disabled||settings.paused||!settings.flexible||settings.reducedMotion)return;
    const result=layoutTick(current.current,points.current,{},pinned.current);points.current=result.positions;setPositions(result.positions);
    if(result.speed>.02&&iterations.current++<240){frame.current=requestAnimationFrame(tick);return;}
    if(!drag.current)save();
  };
  const kick=()=>{const s=running.current;if(frame.current||!s.flexible||s.reducedMotion||s.disabled||s.paused)return;iterations.current=0;frame.current=requestAnimationFrame(tick);};
  useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');setReducedMotion(query.matches);try{if(localStorage.getItem('bond-lab-flexible-layout')==='false')setFlexible(false);}catch{}const changed=()=>setReducedMotion(query.matches);query.addEventListener('change',changed);return()=>query.removeEventListener('change',changed);},[]);
  useEffect(()=>{
    stop();points.current=Object.fromEntries(value.atoms.map(a=>[a.id,{x:a.x,y:a.y}]));setPositions(points.current);
    if(skip.current===value){skip.current=null;return;}
    kick();return stop;
    // Drawing updates restart the gentle, bounded arrangement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[value]);
  useEffect(()=>{stop();if(paused||!flexible||disabled||reducedMotion){if(!drag.current)save();}else kick();return stop;
    // Settings pause animation without resetting the current rendered coordinates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[flexible,reducedMotion,disabled,paused]);
  const startDrag=(id:string,point:Point)=>{stop();drag.current={start:snapshot(),point,moved:false};pinned.current={id,point:points.current[id]??point};};
  const moveDrag=(point:Point)=>{
    if(!drag.current||!pinned.current)return;const bounded=clampPoint(point);if(Math.hypot(bounded.x-drag.current.point.x,bounded.y-drag.current.point.y)>4)drag.current.moved=true;
    if(!drag.current.moved)return;
    pinned.current.point=bounded;points.current={...points.current,[pinned.current.id]:bounded};setPositions(points.current);kick();
  };
  const finishDrag=()=>{const saved=drag.current;drag.current=null;pinned.current=undefined;if(!saved?.moved)save();return saved?{...saved,end:snapshot()}:null;};
  const cancelDrag=()=>{stop();const previous=drag.current?.start;drag.current=null;pinned.current=undefined;return previous;};
  const toggleFlexible=(next:boolean)=>{if(!next){stop();save();}setFlexible(next);try{localStorage.setItem('bond-lab-flexible-layout',String(next));}catch{}};
  return {rendered:withPositions(value,positions),snapshot,flexible,setFlexible:toggleFlexible,startDrag,moveDrag,finishDrag,cancelDrag};
}
