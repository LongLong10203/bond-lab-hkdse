import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { readJson } from '@/lib/validation';
import { generate } from '@/chemistry/generate';
import { FAMILIES,VERSION } from '@/chemistry/rules';
import type { Mode } from '@/chemistry/types';
export const runtime='nodejs';
export async function POST(request:Request){
  let input:{mode:Mode;family:string};try{input=z.object({mode:z.enum(['products','conditions','synthesis']),family:z.string().default('all')}).parse(await readJson(request));if(!FAMILIES.some(f=>f.id===input.family))throw Error();}catch{return NextResponse.json({error:'Choose a valid game mode and reaction family.'},{status:400});}
  try{const seed=randomInt(2147483647),family=input.mode==='synthesis'?'all':input.family;const {question}=generate(seed,input.mode,family);const row=await db.challenge.create({data:{seed,mode:input.mode,family,version:VERSION}});return NextResponse.json({...question,id:row.id},{headers:{'Cache-Control':'no-store'}});}catch(error){console.error('Challenge creation failed',error);return NextResponse.json({error:'The question service is unavailable. Check that PostgreSQL is running and migrations have been applied.'},{status:503});}
}
