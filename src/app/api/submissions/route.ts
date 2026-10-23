import { NextResponse } from 'next/server';
import { accountSession,sameOrigin } from '@/lib/auth';
import { recordSubmission } from '@/lib/saved-progress';
import { db } from '@/lib/db';
import { readJson,submissionSchema } from '@/lib/validation';
import { grade,solution } from '@/chemistry/grading';
import { COMPATIBLE_VERSIONS } from '@/chemistry/rules';
import type { Mode } from '@/chemistry/types';
export const runtime='nodejs';
export async function POST(request:Request){
  let input;try{input=submissionSchema.parse(await readJson(request));}catch{return NextResponse.json({error:'The submitted drawing or conditions are not valid.'},{status:400});}
  try{const account=await accountSession(request);
    if(request.headers.has('X-Bond-Lab-Account')&&!account)return NextResponse.json({error:'Your session changed. Reload and sign in again.'},{status:401});
    if(account&&(!sameOrigin(request)||!input.requestId))return NextResponse.json({error:'Invalid submission. Reload and try again.'},{status:400});
    const row=await db.challenge.findUnique({where:{id:input.id}});if(!row)return NextResponse.json({error:'Challenge not found. Generate a new one.'},{status:404});if(!COMPATIBLE_VERSIONS.includes(row.version))return NextResponse.json({error:'This question uses an older generator. Generate a new one.'},{status:409});
    const result=input.reveal?solution(row.seed,row.mode as Mode,row.family):grade(row.seed,row.mode as Mode,row.family,input.answer??{});
    const {xp:guestReward,...guestResult}=result;void guestReward;
    return NextResponse.json(account?await recordSubmission(account.user.id,row.id,row.mode as Mode,!!input.reveal,result,input.requestId!):guestResult,{headers:{'Cache-Control':'no-store'}});
  }catch(error){console.error('Grading failed',error);return NextResponse.json({error:'Could not check the answer. Please try again.'},{status:503});}
}
