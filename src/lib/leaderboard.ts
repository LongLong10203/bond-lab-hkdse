import { z } from 'zod';
import { levelFor } from '@/chemistry/rewards';
export const displayNameSchema=z.string().trim().min(2).max(32).regex(/^[\p{L}\p{N} _.'’-]+$/u,'Use letters, numbers, spaces, apostrophes, underscores or hyphens.');
export function playerName(_id:string,displayName:string|null){return displayName??'Name not chosen';}
export type LeaderboardPlayer={id:string;displayName:string;xp:number;level:number;completed:number;rank:number};
export type PlayerDetails=LeaderboardPlayer&{email:string;byMode:{products:number;conditions:number;synthesis:number};joinedAt:string;isYou:boolean};
export function leaderboardPlayer(row:{userId:string;displayName:string|null;xp:number;completed:number},rank:number):LeaderboardPlayer{
  return {id:row.userId,displayName:playerName(row.userId,row.displayName),xp:row.xp,level:levelFor(row.xp).level,completed:row.completed,rank};
}
