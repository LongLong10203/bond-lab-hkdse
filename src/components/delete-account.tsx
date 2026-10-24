'use client';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
export default function DeleteAccount({userId}:{userId:string}){
  const [open,setOpen]=useState(false),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reauth,setReauth]=useState(false);
  const remove=async(event:React.FormEvent)=>{
    event.preventDefault();if(confirm!=='DELETE')return;setBusy(true);setError('');
    try{
      const response=await fetch('/api/auth/delete-user',{method:'POST',headers:{'Content-Type':'application/json','X-Bond-Lab-Account':userId},body:'{}'});
      const data=await response.json();
      if(!response.ok){if(data.code==='SESSION_EXPIRED'){setReauth(true);throw Error('Please sign in again before deleting your account.');}throw Error(data.message??'Could not delete your account.');}
      try{sessionStorage.removeItem('bond-lab-guest');}catch{}
      window.location.replace('/login');
    }catch(e){setError(e instanceof Error?e.message:'Could not delete your account.');setBusy(false);}
  };
  return <section className="delete-account"><h3>Delete account</h3><p>Permanently remove your Bond Lab profile, XP, saved drawings, and sessions on all devices. This does not delete your Google account. Signing in later creates a new Bond Lab account.</p>
    {!open?<button className="danger-button" onClick={()=>setOpen(true)}>Delete my account</button>:<form onSubmit={remove}><label htmlFor="delete-confirm">Type DELETE to confirm</label><input id="delete-confirm" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="off" disabled={busy}/><div><button className="danger-button" disabled={busy||confirm!=='DELETE'}>{busy?'Deleting…':'Permanently delete account'}</button><button type="button" className="secondary-button" disabled={busy} onClick={()=>{setOpen(false);setConfirm('');setError('');}}>Cancel</button></div></form>}
    {error&&<p role="alert">{error}</p>}{reauth&&<button className="secondary-button" onClick={async()=>{const result=await authClient.signIn.social({provider:'google',callbackURL:'/profile',errorCallbackURL:'/login?authError=1'});if(result.error)setError(result.error.message??'Could not start sign-in.');}}>Sign in again</button>}
  </section>;
}
