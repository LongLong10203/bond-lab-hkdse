'use client';
import { useEffect,useState } from 'react';
import { authClient } from '@/lib/auth-client';
import Lab from './lab';
import Welcome from './welcome';
export type Player={id:string;name:string;email:string};
export default function Account({coverage,googleReady,welcome=false}:{coverage:{variants:number;rules:number};googleReady:boolean;welcome?:boolean}){
  const {data:session,isPending,error,refetch}=authClient.useSession();
  const [guest,setGuest]=useState<boolean|null>(null),[loginError,setLoginError]=useState('');
  useEffect(()=>{
    try{setGuest(sessionStorage.getItem('bond-lab-guest')==='yes');}catch{setGuest(false);}
    const url=new URL(window.location.href);
    if(url.searchParams.has('authError')){
      setLoginError('Sign-in was not completed. Use your syss.edu.hk school Google account. If access is blocked, ask your school administrator to allow Bond Lab.');
      url.searchParams.delete('authError');url.searchParams.delete('error');url.searchParams.delete('error_description');
      window.history.replaceState(null,'',url);
    }
  },[]);
  const redirect=!isPending&&!error&&guest!==null&&((welcome&&!!session)||(!welcome&&!session&&!guest));
  useEffect(()=>{if(redirect)window.location.replace(welcome?'/':'/login');},[redirect,welcome]);
  if(isPending||guest===null||redirect)return <div className="account-loading" role="status">Loading Bond Lab…</div>;
  if(error)return <div className="account-loading" role="alert">Could not check your login.<button className="secondary-button" onClick={()=>refetch()}>Try again</button></div>;
  if(welcome)return <Welcome key={loginError} googleReady={googleReady} loginError={loginError}/>;
  return <Lab key={session?.user.id??'guest'} coverage={coverage} player={session?.user??null}/>;
}
