'use client';
import { useEffect,useState } from 'react';
import { Atom,ArrowRight,FlaskConical,GitBranch,Settings2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { LIVE_ORIGIN,LEGACY_ORIGIN } from '@/lib/site-origin';
export default function Welcome({googleReady,loginError}:{googleReady:boolean;loginError:string}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(loginError);
  useEffect(()=>{
    const resume=()=>setBusy(false);
    window.addEventListener('pageshow',resume);
    return()=>window.removeEventListener('pageshow',resume);
  },[]);
  const signIn=async()=>{
    if(window.location.origin===LEGACY_ORIGIN){window.location.assign(LIVE_ORIGIN+'/login');return;}
    setBusy(true);setError('');
    try{const result=await authClient.signIn.social({provider:'google',callbackURL:'/',errorCallbackURL:'/login?authError=1'});if(result.error)throw Error(result.error.message);}
    catch(e){setError(e instanceof Error?e.message:'Could not start Google sign-in.');setBusy(false);}
  };
  const guest=()=>{try{sessionStorage.setItem('bond-lab-guest','yes');window.location.assign('/');}catch{setError('Allow browser storage to start guest play.');}};
  return <main className="welcome-page"><div className="welcome-brand"><Atom size={26}/><span>BOND<span>LAB</span></span></div><section className="welcome-card">
    <span className="welcome-eyebrow">HKDSE ORGANIC CHEMISTRY</span><h1>A little practice.<br/>A stronger bond.</h1><p className="welcome-intro">Build molecules, choose conditions, and find your own route to the product.</p>
    <div className="welcome-modes"><span><FlaskConical size={18}/>Build</span><span><Settings2 size={18}/>Choose</span><span><GitBranch size={18}/>Plan</span></div>
    <div className="welcome-signin"><h2>Sign in or create an account</h2><p>Save your progress, earn levels, and join the school leaderboard.</p><button className="google-signin" disabled={busy||!googleReady} onClick={signIn}><span className="google-letter" aria-hidden="true">G</span>{busy?'Opening Google…':'Continue with Google'}<ArrowRight size={18}/></button><p className="welcome-school">Use your @syss.edu.hk or @singyin.edu.hk school account. Your first sign-in creates your account.</p></div>
    {!googleReady&&<p className="account-notice">Google sign-in is not available yet. You can still play as a guest.</p>}
    {error&&<p className="account-notice" role="alert">{error}</p>}
    <div className="welcome-or"><span/>or<span/></div><button className="guest-play" disabled={busy} onClick={guest}>Play as guest<ArrowRight size={17}/></button><p className="welcome-guest-note">Practice freely. Drawings stay in this browser; levels and the leaderboard are for signed-in players.</p>
    <p className="welcome-privacy">The school leaderboard shows your nickname and practice stats. Signed-in school players can see your email on your profile. Your drawings stay private.</p>
  </section><p className="welcome-footer">An independent learning project. Not affiliated with HKEAA.</p></main>;
}
