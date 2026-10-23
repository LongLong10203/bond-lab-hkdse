import { accountSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { leaderboardPlayer } from '@/lib/leaderboard';
import { eligiblePlayer,leaderboardSelect } from '@/lib/leaderboard-db';
export const runtime='nodejs';
export async function GET(request:Request){
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  try{
    const session=await accountSession(request);if(!session)return reply({error:'Sign in with your school account to view the leaderboard.'},401);
    const raw=new URL(request.url).searchParams.get('page')??'1';
    if(!/^\d+$/.test(raw)||Number(raw)<1||Number(raw)>10000)return reply({error:'Invalid leaderboard page.'},400);
    const page=Number(raw),size=50;
    const rows=await db.playerProgress.findMany({where:eligiblePlayer,orderBy:[{xp:'desc'},{userId:'asc'}],skip:(page-1)*size,take:size+1,select:leaderboardSelect});
    return reply({players:rows.slice(0,size).map((row,i)=>({...leaderboardPlayer(row,(page-1)*size+i+1),isYou:row.userId===session.user.id})),page,hasMore:rows.length>size});
  }catch{return reply({error:'Could not load the leaderboard. Please try again.'},503);}
}
