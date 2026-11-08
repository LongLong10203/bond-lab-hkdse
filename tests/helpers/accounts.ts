import 'dotenv/config';
import { config } from 'dotenv';
import { randomUUID, createHmac } from 'node:crypto';
import { db } from '../../src/lib/db';
// Match Next.js: local credentials take precedence over empty .env placeholders.
config({path:'.env.local',quiet:true,override:true});config({quiet:true});
export const base=process.env.TEST_BASE_URL??'http://localhost:3000';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname)||!['127.0.0.1','localhost'].includes(new URL(process.env.DATABASE_URL!).hostname))throw Error('Account tests require a local app and local database.');
// Test fixtures only: no login bypass is exposed by the application.
export async function fixtureAccount(domain='school.example',verified=true){
  const id=randomUUID(),token=randomUUID();
  await db.user.create({data:{id,name:'Local test student',email:`test-${id}@${domain}`,emailVerified:verified}});
  await db.session.create({data:{id:randomUUID(),userId:id,token,expiresAt:new Date(Date.now()+3600000)}});
  const signature=createHmac('sha256',process.env.BETTER_AUTH_SECRET!).update(token).digest('base64');
  return {id,cookie:`better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`};
}
export async function accountRequest(path:string,account:{id:string;cookie:string}|null,method='GET',body?:unknown){
  return fetch(`${base}/api/${path}`,{method,headers:{Origin:new URL(base).origin,...(account?{Cookie:account.cookie,'X-Bond-Lab-Account':account.id}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
}
