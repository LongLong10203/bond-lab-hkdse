'use client';
import { useEffect,useState } from 'react';
import type { Player } from './account';
export default function ProfileSetup({player,children}:{player:Player;children:(player:Player)=>React.ReactNode}){
  const [name,setName]=useState<string|null|undefined>(undefined),[draft,setDraft]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();setError('');
    fetch('/api/profile',{headers:{'X-Bond-Lab-Account':player.id},cache:'no-store',signal:controller.signal}).then(async response=>{
      const data=await response.json();if(!response.ok)throw Error(data.error);setName(data.displayName);
    }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Could not load your profile.');});
    return()=>controller.abort();
  },[player.id,retry]);
  const save=async(event:React.FormEvent)=>{
    event.preventDefault();setBusy(true);setError('');
    try{
      const response=await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json','X-Bond-Lab-Account':player.id},body:JSON.stringify({displayName:draft})});
      const data=await response.json();if(!response.ok)throw Error(data.error);setName(data.displayName);
    }catch(e){setError(e instanceof Error?e.message:'Could not save your name.');}finally{setBusy(false);}
  };
  if(name===undefined)return <div className="account-loading" role={error?'alert':'status'}>{error||'Loading your profile…'}{error&&<button className="secondary-button" onClick={()=>setRetry(n=>n+1)}>Try again</button>}</div>;
  if(name)return children({...player,name});
  return <main className="welcome-page"><section className="welcome-card profile-setup">
    <span className="welcome-eyebrow">WELCOME TO BOND LAB</span><h1>What should we call you?</h1>
    <p className="welcome-intro">Choose the name other school players will see on the leaderboard. You can change it any time in your profile.</p>
    <form onSubmit={save}>
      <label htmlFor="first-display-name">Display name</label><input id="first-display-name" autoFocus value={draft} onChange={e=>setDraft(e.target.value)} required minLength={2} maxLength={32} autoComplete="nickname" placeholder="Your nickname"/>
      <p className="small-note">2–32 characters. A nickname is fine; avoid personal details.</p><button className="primary-button" disabled={busy}>{busy?'Saving…':'Save name and continue'}</button>
    </form>{error&&<p role="alert" className="account-notice">{error}</p>}
  </section></main>;
}
