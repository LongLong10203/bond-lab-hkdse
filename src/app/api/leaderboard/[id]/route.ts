import { accountSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { leaderboardPlayer } from '@/lib/leaderboard';
import { eligiblePlayer,leaderboardSelect } from '@/lib/leaderboard-db';
export const runtime='nodejs';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  try{
    const session=await accountSession(request);if(!session)return reply({error:'Sign in with your school account to view profiles.'},401);
    const {id}=await params;
    if(id.length>128)return reply({error:'Player not found.'},404);
    const row=await db.playerProgress.findFirst({where:{...eligiblePlayer,userId:id},select:{...leaderboardSelect,products:true,conditions:true,synthesis:true,user:{select:{createdAt:true,email:true}}}});
    if(!row)return reply({error:'Player not found.'},404);
    const ahead=await db.playerProgress.count({where:{...eligiblePlayer,OR:[{xp:{gt:row.xp}},{xp:row.xp,userId:{lt:row.userId}}]}});
    return reply({...leaderboardPlayer(row,ahead+1),email:row.user.email,byMode:{products:row.products,conditions:row.conditions,synthesis:row.synthesis},joinedAt:row.user.createdAt.toISOString(),isYou:row.userId===session.user.id});
  }catch{return reply({error:'Could not load this profile. Please try again.'},503);}
}
