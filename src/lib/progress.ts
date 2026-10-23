import { z } from 'zod';
import type { Mode } from '@/chemistry/types';
export type Progress = { completed:number; attempts:number; correct:number; xp:number; byMode:Record<Mode,number> };
export const freshProgress = ():Progress => ({completed:0,attempts:0,correct:0,xp:0,byMode:{products:0,conditions:0,synthesis:0}});
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const progressSchema = z.object({completed:count,attempts:count,correct:count,xp:count,byMode:z.object({products:count,conditions:count,synthesis:count})});
export function publicProgress(row: {completed:number; attempts:number; correct:number; xp:number; products:number; conditions:number; synthesis:number}):Progress {
  return {completed:row.completed,attempts:row.attempts,correct:row.correct,xp:row.xp,byMode:{products:row.products,conditions:row.conditions,synthesis:row.synthesis}};
}
