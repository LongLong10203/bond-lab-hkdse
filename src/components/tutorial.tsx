'use client';
import { useEffect,useLayoutEffect,useRef,useState } from 'react';
import { ArrowRight,ChevronLeft } from 'lucide-react';
import type { Mode } from '@/chemistry/types';
type Rect={top:number;left:number;width:number;height:number};
export default function Tutorial({mode,signedIn,onFinish}:{mode:Mode;signedIn:boolean;onFinish:()=>Promise<boolean>}){
  const steps=[
    {selector:'[data-tour="mode"]',title:'Three ways to practise',text:'Build a product, find the conditions, or plan a synthesis. Switch modes in the side menu; on a small screen, use the menu button.'},
    {selector:'.reactant-card',title:'Start with the reaction',text:'Read the starting compound and the supplied information. Your goal is to work out the missing product or reaction conditions.'},
    {selector:mode==='conditions'?'.condition-picker':'.editor-toolbar, .final-product',title:mode==='conditions'?'Choose your conditions':'Make your answer',text:mode==='conditions'?'Select your reagents, then choose any catalyst and heating. Select only what the reaction needs.':'Choose an atom and click the drawing area. To make a bond, select a bond tool and then two atoms. Auto H fills the remaining hydrogen atoms.'},
    {selector:'.answer-actions',title:'Check, learn, and try again',text:signedIn?'Check your answer for feedback and XP. You can keep editing after a mistake. Show solution explains the answer, but removes this question’s XP reward.':'Check your answer for feedback. You can keep editing after a mistake, or use Show solution to see a worked answer.'},
    {selector:'.next-button',title:'Ready for the next reaction?',text:mode==='synthesis'?'Each numbered step keeps its own drawing and conditions. New challenge starts a fresh route. Your unfinished work saves automatically.':'New challenge starts a fresh question. Your unfinished work saves automatically. Replay this tour any time from Help.'},
  ];
  const [step,setStep]=useState(0),[rect,setRect]=useState<Rect|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const card=useRef<HTMLElement>(null),next=useRef<HTMLButtonElement>(null);
  const finish=async()=>{setBusy(true);setError('');if(!(await onFinish())){setError('Could not save the tutorial. Please try again.');setBusy(false);}};
  useLayoutEffect(()=>{
    const element=document.querySelector<HTMLElement>(steps[step].selector);
    const update=()=>{if(!element)return;const r=element.getBoundingClientRect();setRect({top:r.top-6,left:Math.max(6,r.left-6),width:Math.min(r.width+12,window.innerWidth-12),height:r.height+12});};
    element?.scrollIntoView({block:'center',behavior:'instant'});update();next.current?.focus({preventScroll:true});
    const observer=new ResizeObserver(update);if(element)observer.observe(element);
    window.addEventListener('resize',update);window.addEventListener('scroll',update,true);
    return()=>{observer.disconnect();window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true);};
    // The target changes only when the step or game mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[step,mode]);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Tab'){
        const buttons=Array.from(card.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]),first=buttons[0],last=buttons.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus({preventScroll:true});};
  },[]);
  const atTop=rect?rect.top+rect.height>window.innerHeight-280:false;
  return <div className="tutorial-layer"><div className="tutorial-blocker"/>{rect&&<div aria-hidden="true" className="tutorial-highlight" style={rect}/>}
    <section ref={card} className={'tutorial-card '+(atTop?'tutorial-at-top':'tutorial-at-bottom')} role="dialog" aria-modal="true" aria-labelledby="tutorial-title" aria-describedby="tutorial-description">
      <div className="tutorial-meta"><span>QUICK TOUR · {step+1} / {steps.length}</span><button disabled={busy} onClick={finish}>Skip tour</button></div>
      <div aria-live="polite"><h2 id="tutorial-title">{steps[step].title}</h2><p id="tutorial-description">{steps[step].text}</p></div>
      {error&&<p role="alert" className="tutorial-error">{error}</p>}
      <div className="tutorial-actions"><button disabled={step===0||busy} onClick={()=>setStep(s=>s-1)}><ChevronLeft size={16}/>Back</button><button ref={next} className="primary-button" disabled={busy} onClick={()=>step===steps.length-1?void finish():setStep(s=>s+1)}>{busy?'Saving…':step===steps.length-1?'Start playing':'Next'}<ArrowRight size={16}/></button></div>
    </section>
  </div>;
}
