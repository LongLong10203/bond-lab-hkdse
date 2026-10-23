import { accountSession,sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureProgress } from '@/lib/saved-progress';
export const runtime='nodejs';
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  try{
    const session=await accountSession(request);if(!session)return Response.json({error:'Sign in again to save tutorial progress.'},{status:401});
    await ensureProgress(session.user.id);
    await db.playerProgress.update({where:{userId:session.user.id},data:{tutorialCompleted:true}});
    return Response.json({completed:true},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Could not save tutorial progress. Please try again.'},{status:503});}
}
