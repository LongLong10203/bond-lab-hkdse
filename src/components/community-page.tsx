'use client';
import Link from 'next/link';
import { ArrowLeft,Atom } from 'lucide-react';
import type { Player } from './account';
import Leaderboard from './leaderboard';
export default function CommunityPage({player,ownProfile=false,profileId}:{player:Player;ownProfile?:boolean;profileId?:string}){
  return <main className="community-page"><header><Link className="brand" href="/"><span className="brand-mark"><Atom size={25}/></span>BONDLAB</Link><Link className="secondary-button" href="/"><ArrowLeft size={16}/>Back to practice</Link></header>
    <nav aria-label="Community"><Link href="/leaderboard" aria-current={!ownProfile&&!profileId?'page':undefined}>Leaderboard</Link><Link href="/profile" aria-current={ownProfile?'page':undefined}>My profile</Link></nav>
    <section className="community-card"><span className="welcome-eyebrow">OUR SCHOOL LAB</span><h1>{ownProfile?'My profile':profileId?'Player profile':'School leaderboard'}</h1><Leaderboard userId={player.id} initialProfile={ownProfile} profileId={profileId}/></section>
  </main>;
}
