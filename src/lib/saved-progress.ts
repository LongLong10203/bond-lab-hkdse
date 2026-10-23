import { db } from './db';
import { publicProgress } from './progress';
import type { Prisma } from '@/generated/prisma/client';
import type { Grade, Mode } from '@/chemistry/types';

export async function ensureProgress(userId:string) {
  return db.playerProgress.upsert({where:{userId},create:{userId},update:{}});
}
// Serialize scoring and reset operations per player so retries and simultaneous
// tabs cannot award the same challenge twice or lose increments.
export async function lockProgress(tx:Prisma.TransactionClient,userId:string) {
  await tx.$queryRaw`SELECT "userId" FROM "PlayerProgress" WHERE "userId" = ${userId} FOR UPDATE`;
}
export async function recordSubmission(userId:string,challengeId:string,mode:Mode,reveal:boolean,result:Grade,requestId:string) {
  await ensureProgress(userId);
  return db.$transaction(async tx => {
    await lockProgress(tx,userId);
    const receipt = await tx.submissionReceipt.findUnique({where:{userId_requestId:{userId,requestId}}});
    if (receipt) return receipt.result;
    const previous = await tx.playerChallenge.findUnique({where:{userId_challengeId:{userId,challengeId}}});
    const award = !reveal && result.correct && !previous?.revealed && !previous?.awarded ? result.xp ?? 0 : 0;
    await tx.playerChallenge.upsert({where:{userId_challengeId:{userId,challengeId}},create:{userId,challengeId,revealed:reveal,awarded:award>0},update:{revealed:Boolean(previous?.revealed||reveal),awarded:Boolean(previous?.awarded||award)}});
    const row = await tx.playerProgress.update({where:{userId},data:reveal ? {} : {
      attempts:{increment:1}, correct:{increment:result.correct?1:0}, xp:{increment:award}, completed:{increment:award?1:0}, [mode]:{increment:award?1:0},
    }});
    const response = {...result,xp:award,progress:publicProgress(row),revealed:Boolean(previous?.revealed||reveal),awarded:Boolean(previous?.awarded||award)};
    await tx.submissionReceipt.create({data:{userId,requestId,result:JSON.parse(JSON.stringify(response))}});
    return response;
  });
}
