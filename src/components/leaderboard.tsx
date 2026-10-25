'use client';
import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import DeleteAccount from './delete-account';
import { ArrowLeft,ChevronLeft,ChevronRight,UserRound } from 'lucide-react';
import { levelFor } from '@/chemistry/rewards';
import type { LeaderboardPlayer,PlayerDetails } from '@/lib/leaderboard';
export default function Leaderboard({userId,initialProfile=false,profileId}:{userId:string;initialProfile?:boolean;profileId?:string}){
  const router=useRouter(),selected=profileId??(initialProfile?userId:null);
  const setSelected=(id:string|null)=>router.push(id?(id===userId?'/profile':'/leaderboard/'+encodeURIComponent(id)):'/leaderboard');
  const [page,setPage]=useState(1),[refresh,setRefresh]=useState(0);
  const [rows,setRows]=useState<(LeaderboardPlayer&{isYou:boolean})[]>([]),[hasMore,setHasMore]=useState(false),[profile,setProfile]=useState<PlayerDetails|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[name,setName]=useState(''),[saving,setSaving]=useState(false),[notice,setNotice]=useState('');
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');setNotice('');setProfile(null);setRows([]);
    fetch(selected?`/api/leaderboard/${encodeURIComponent(selected)}`:`/api/leaderboard?page=${page}`,{signal:controller.signal,cache:'no-store',headers:{'X-Bond-Lab-Account':userId}}).then(async response=>{
      const data=await response.json();if(!response.ok)throw Error(data.error);
      if(selected){setProfile(data);setName(data.displayName);}else{setRows(data.players);setHasMore(data.hasMore);}
    }).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Could not load the leaderboard.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[selected,page,refresh,userId]);
  const saveName=async(event:React.FormEvent)=>{
    event.preventDefault();setSaving(true);setNotice('');setError('');
    try{const response=await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json','X-Bond-Lab-Account':userId},body:JSON.stringify({displayName:name})});const data=await response.json();if(!response.ok)throw Error(data.error);setProfile(p=>p?{...p,displayName:data.displayName}:p);setName(data.displayName);setNotice('Display name saved.');}
    catch(e){setError(e instanceof Error?e.message:'Could not save your name.');}finally{setSaving(false);}
  };
  return <div className="leaderboard-content">{selected&&<button className="profile-back" onClick={()=>setSelected(null)}><ArrowLeft size={16}/>Back to leaderboard</button>}
    {error&&<div className="account-notice" role="alert">{error}<button className="text-button" onClick={()=>setRefresh(n=>n+1)}>Try again</button></div>}
    {loading?<p role="status">Loading {selected?'profile':'leaderboard'}…</p>:selected&&profile?<>
      <div className="player-heading"><span className="player-avatar"><UserRound size={26}/></span><div><h3>{profile.displayName}{profile.isYou&&<small>You</small>}</h3><p className="profile-email">{profile.email}</p><p>Rank #{profile.rank} · Joined {new Intl.DateTimeFormat('en-HK',{month:'short',year:'numeric',timeZone:'Asia/Hong_Kong'}).format(new Date(profile.joinedAt))}</p></div></div>
      <div className="progress-grid"><div><strong>{profile.level}</strong><span>Level</span></div><div><strong>{profile.xp.toLocaleString()}</strong><span>Total XP</span></div><div><strong>{profile.completed}</strong><span>Solved</span></div></div>
      <p className="profile-next-level">{levelFor(profile.xp).toNext} XP to level {profile.level+1}</p><h4>Solved by game mode</h4>
      {([['products','Build the product'],['conditions','Find the conditions'],['synthesis','Plan a synthesis']] as const).map(([key,label])=><div className="progress-row" key={key}><span>{label}</span><strong>{profile.byMode[key]}</strong></div>)}
      {profile.isYou&&<form className="display-name-form" onSubmit={saveName}><label htmlFor="display-name">Your leaderboard name</label><div><input id="display-name" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={32} required autoComplete="off"/><button className="secondary-button" disabled={saving}>{saving?'Saving…':'Save name'}</button></div><p>Choose a nickname. Your school email is visible on your profile to signed-in school players. Your drawings stay private.</p><span role="status">{notice}</span></form>}{profile.isYou&&<DeleteAccount userId={userId}/>}
    </>:!selected?<><p className="leaderboard-intro">Most XP first. Select a player to view their profile.</p>{!rows.length?<p className="leaderboard-empty">The lab is just getting started. Solve a question to earn your first XP.</p>:<ol className="leaderboard-list" start={(page-1)*50+1}>{rows.map(row=><li key={row.id}><button className={row.isYou?'leaderboard-row is-you':'leaderboard-row'} onClick={()=>setSelected(row.id)}><span className="leaderboard-rank">{row.rank}<span className="sr-only">Rank {row.rank}</span></span><span className="leaderboard-name">{row.displayName}{row.isYou&&<small>You</small>}<span>Level {row.level} · {row.completed} solved</span></span><strong>{row.xp.toLocaleString()}<small>XP</small></strong><ChevronRight size={17}/></button></li>)}</ol>}
      <div className="leaderboard-pages"><button className="secondary-button" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={16}/>Previous</button><span>Page {page}</span><button className="secondary-button" disabled={!hasMore} onClick={()=>setPage(p=>p+1)}>Next<ChevronRight size={16}/></button></div><button className="text-button" onClick={()=>setSelected(userId)}>View my profile</button><p className="leaderboard-privacy">Visible to signed-in school players only. Ties use a stable player order. Practice XP is not an examination mark.</p>
    </>:null}</div>;
}
