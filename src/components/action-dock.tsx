'use client';
import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';

export default function ActionDock({children}:{children:ReactNode}){
  const bar=useRef<HTMLDivElement>(null);
  const [height,setHeight]=useState(0);
  useLayoutEffect(()=>{
    const element=bar.current;if(!element)return;
    const measure=()=>setHeight(Math.ceil(element.getBoundingClientRect().height));
    measure();
    const observer=new ResizeObserver(measure);observer.observe(element);
    return()=>observer.disconnect();
  },[]);
  return <>
    <div className="action-dock-space" style={{height}} aria-hidden="true"/>
    <div ref={bar} className="answer-toolbar" role="region" aria-label="Challenge actions">{children}</div>
  </>;
}
