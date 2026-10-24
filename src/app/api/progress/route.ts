import { z } from 'zod';
import { accountSession, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';
import { ensureProgress } from '@/lib/saved-progress';
import { publicProgress } from '@/lib/progress';
import { restoreSessions, sessionsSchema } from '@/lib/practice';
import { readJson } from '@/lib/validation';
export const runtime = 'nodejs';
const reply = (body:unknown,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const patchSchema = z.object({revision:z.number().int().nonnegative(),activeMode:z.enum(['products','conditions','synthesis']),sessions:sessionsSchema}).strict();
export async function GET(request:Request) {
  try {
    const session = await accountSession(request);
    if (!session) return reply({error:'Sign in with your school Google account.'},401);
    const row = await ensureProgress(session.user.id);
    return reply({progress:publicProgress(row),sessions:restoreSessions(JSON.stringify(row.drafts)),activeMode:row.activeMode,revision:row.revision,tutorialCompleted:row.tutorialCompleted});
  } catch { return reply({error:'Could not load saved progress. Please try again.'},503); }
}
export async function PATCH(request:Request) {
  if (!sameOrigin(request)) return reply({error:'Invalid request origin.'},403);
  try {
    const session = await accountSession(request);
    if (!session) return reply({error:'Your session ended. Sign in again to save.'},401);
    let input;
    try { input=patchSchema.parse(await readJson(request,250000)); } catch { return reply({error:'Invalid saved drawing.'},400); }
    const drafts=restoreSessions(JSON.stringify(input.sessions));
    const result=await db.playerProgress.updateMany({where:{userId:session.user.id,revision:input.revision},data:{drafts:JSON.parse(JSON.stringify(drafts)),activeMode:input.activeMode,revision:{increment:1}}});
    if (!result.count) return reply({error:'Your progress changed in another tab or device. Reload to use the latest saved version.'},409);
    return reply({revision:input.revision+1});
  } catch { return reply({error:'Could not save. Keep this page open and try again.'},503); }
}
