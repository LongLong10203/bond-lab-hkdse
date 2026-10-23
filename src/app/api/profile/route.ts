import { z } from 'zod';
import { accountSession,sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureProgress } from '@/lib/saved-progress';
import { displayNameSchema } from '@/lib/leaderboard';
import { readJson } from '@/lib/validation';
export const runtime='nodejs';
export async function PATCH(request:Request){
  const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
  if(!sameOrigin(request))return reply({error:'Invalid request origin.'},403);
  try{
    const session=await accountSession(request);if(!session)return reply({error:'Sign in again to edit your profile.'},401);
    let input;try{input=z.object({displayName:displayNameSchema}).strict().parse(await readJson(request,2000));}catch{return reply({error:'Choose a name with 2–32 letters, numbers, spaces, apostrophes, underscores or hyphens.'},400);}
    await ensureProgress(session.user.id);
    await db.playerProgress.update({where:{userId:session.user.id},data:input});
    return reply(input);
  }catch{return reply({error:'Could not save your display name. Please try again.'},503);}
}
