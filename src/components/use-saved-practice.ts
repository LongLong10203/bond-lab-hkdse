'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Mode } from '@/chemistry/types';
import { restoreSessions, type PracticeSession } from '@/lib/practice';
import { freshProgress, progressSchema } from '@/lib/progress';
const PROGRESS='bond-lab-progress-v1',SESSIONS='bond-lab-sessions-v2',ACTIVE_MODE='bond-lab-active-mode';
type Drafts=Partial<Record<Mode,PracticeSession>>;
export function useSavedPractice(userId?:string) {
  const [mode,setMode]=useState<Mode>('products'),[family,setFamily]=useState('all');
  const [sessions,setSessions]=useState<Drafts>({}),[progress,setProgress]=useState(freshProgress);
  const [tutorialCompleted,setTutorialCompleted]=useState(true);
  const [ready,setReady]=useState(false),[storageWarning,setStorageWarning]=useState(false);
  const [saveStatus,setSaveStatus]=useState(''),[saveError,setSaveError]=useState('');
  const revision=useRef(0),pending=useRef<string|null>(null),lastSaved=useRef(''),inFlight=useRef<Promise<boolean>|null>(null),blocked=useRef(false),alive=useRef(true);
  useEffect(()=>{
    alive.current=true;const controller=new AbortController();
    const load=async()=>{
      try{
        let saved:Drafts,last:Mode='products';
        if(userId){
          const response=await fetch('/api/progress',{cache:'no-store',headers:{'X-Bond-Lab-Account':userId},signal:controller.signal});
          const data=await response.json();if(!response.ok)throw Error(data.error);
          saved=restoreSessions(JSON.stringify(data.sessions));last=data.activeMode;setTutorialCompleted(data.tutorialCompleted===true);
          setProgress(progressSchema.parse(data.progress));revision.current=data.revision;
          lastSaved.current=JSON.stringify({sessions:saved,activeMode:last});
          setSaveStatus('Saved to your account');
        }else{
          saved=restoreSessions(localStorage.getItem(SESSIONS));setTutorialCompleted(localStorage.getItem('bond-lab-tutorial-v1')==='done');
          const raw=localStorage.getItem(PROGRESS);if(raw){const result=progressSchema.safeParse(JSON.parse(raw));if(result.success)setProgress({...result.data,xp:0});}
          const stored=localStorage.getItem(ACTIVE_MODE);if(stored==='products'||stored==='conditions'||stored==='synthesis')last=stored;
        }
        if(!alive.current)return;
        setSessions(saved);setMode(last);setFamily(saved[last]?.question.family??'all');setReady(true);
      }catch(e){
        if(controller.signal.aborted)return;
        if(userId)setSaveError(e instanceof Error?e.message:'Could not load your account.');
        else{setStorageWarning(true);setTutorialCompleted(false);setReady(true);}
      }
    };
    void load();return()=>{alive.current=false;controller.abort();};
  },[userId]);
  const flush=useCallback(async():Promise<boolean>=>{
    if(!userId)return true;
    if(inFlight.current)return inFlight.current;
    if(blocked.current)return false;
    const run=async()=>{
      while(pending.current){
        const body=pending.current;pending.current=null;
        setSaveStatus('Saving…');
        try{
          const response=await fetch('/api/progress',{method:'PATCH',headers:{'Content-Type':'application/json','X-Bond-Lab-Account':userId},body:JSON.stringify({...JSON.parse(body),revision:revision.current}),signal:AbortSignal.timeout(12000)});
          const data=await response.json();
          if(!response.ok){if(response.status===409||response.status===401)blocked.current=true;throw Error(data.error);}
          revision.current=data.revision;lastSaved.current=body;setSaveError('');
        }catch(e){pending.current=pending.current??body;setSaveStatus('Not saved');setSaveError(e instanceof Error?e.message:'Could not save. Keep this page open and try again.');return false;}
      }
      setSaveStatus('Saved to your account');return true;
    };
    inFlight.current=run();try{return await inFlight.current;}finally{inFlight.current=null;}
  },[userId]);
  useEffect(()=>{
    if(!ready)return;
    if(!userId){
      try{localStorage.setItem(SESSIONS,JSON.stringify(sessions));localStorage.setItem(PROGRESS,JSON.stringify(progress));localStorage.setItem(ACTIVE_MODE,mode);}catch{setStorageWarning(true);}
      return;
    }
    const body=JSON.stringify({sessions,activeMode:mode});
    if(body===lastSaved.current)return;
    pending.current=body;setSaveStatus('Saving…');
    const timer=setTimeout(()=>void flush(),500);return()=>clearTimeout(timer);
  },[sessions,progress,mode,ready,userId,flush]);
  useEffect(()=>{
    if(!userId)return;
    const onUnload=(event:BeforeUnloadEvent)=>{if(pending.current||inFlight.current){event.preventDefault();event.returnValue='';}};
    const onHidden=()=>{if(document.visibilityState==='hidden')void flush();};
    window.addEventListener('beforeunload',onUnload);document.addEventListener('visibilitychange',onHidden);
    return()=>{window.removeEventListener('beforeunload',onUnload);document.removeEventListener('visibilitychange',onHidden);};
  },[userId,flush]);
  const completeTutorial=async()=>{
    try{
      if(userId){const response=await fetch('/api/tutorial',{method:'POST',headers:{'X-Bond-Lab-Account':userId}});if(!response.ok)return false;}
      else{try{localStorage.setItem('bond-lab-tutorial-v1','done');}catch{setStorageWarning(true);}}
      setTutorialCompleted(true);return true;
    }catch{return false;}
  };
  return {tutorialCompleted,completeTutorial,mode,setMode,family,setFamily,sessions,setSessions,progress,setProgress,ready,storageWarning,saveStatus,saveError,flush};
}
