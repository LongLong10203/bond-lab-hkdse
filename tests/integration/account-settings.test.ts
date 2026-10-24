import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fixtureAccount,accountRequest,base} from '../helpers/accounts';
import {db} from '../../src/lib/db';
const users:string[]=[],questions:string[]=[];
async function account(){const a=await fixtureAccount();users.push(a.id);return a;}
after(async()=>{await db.user.deleteMany({where:{id:{in:users}}});await db.challenge.deleteMany({where:{id:{in:questions}}});await db.$disconnect();});
test('new users must choose a name and can change it later; unnamed profiles are not listed',async()=>{
 const a=await account();let profile=await(await accountRequest('profile',a)).json();assert.equal(profile.displayName,null);
 const rows=await(await accountRequest('leaderboard',a)).json();assert(!rows.players.some((r:any)=>r.id===a.id));
 for(const name of ['Carbon Friend','New Name']){assert.equal((await accountRequest('profile',a,'PATCH',{displayName:name})).status,200);profile=await(await accountRequest('profile',a)).json();assert.equal(profile.displayName,name);}
});
test('delete account removes only its owner and cascades sessions, OAuth data, progress, and award records',async()=>{
 const a=await account(),b=await account();await accountRequest('profile',a,'PATCH',{displayName:'Delete Test'});
 const q=await(await accountRequest('challenges',a,'POST',{mode:'conditions',family:'addition'})).json();questions.push(q.id);
 await accountRequest('submissions',a,'POST',{id:q.id,reveal:true,requestId:randomUUID()});
 await db.account.create({data:{id:randomUUID(),accountId:randomUUID(),providerId:'google',userId:a.id}});
 assert.equal((await accountRequest('auth/delete-user',null,'POST',{})).status,401);
 assert.equal((await accountRequest('auth/delete-user',{...a,id:b.id},'POST',{})).status,403);
 assert.equal((await fetch(base+'/api/auth/delete-user',{method:'POST',headers:{Origin:'https://attacker.example',Cookie:a.cookie,'Content-Type':'application/json'},body:'{}'})).status,403);
 const response=await accountRequest('auth/delete-user',a,'POST',{});assert.equal(response.status,200);assert(response.headers.get('set-cookie')?.includes('Max-Age=0'));
 assert.equal(await db.user.count({where:{id:a.id}}),0);assert.equal(await db.user.count({where:{id:b.id}}),1);
 for(const table of [db.session,db.account,db.playerProgress,db.playerChallenge,db.submissionReceipt])assert.equal(await (table as any).count({where:{userId:a.id}}),0);
 assert.equal((await accountRequest('progress',a)).status,401);
});
test('Google sign-in can restart after abandoning an attempt, with an account chooser',async()=>{
 const headers={Origin:base,'Content-Type':'application/json'};
 const first=await fetch(base+'/api/auth/sign-in/social',{method:'POST',headers,body:JSON.stringify({provider:'google',callbackURL:'/'})});assert.equal(first.status,200);
 const data=await first.json(),url=new URL(data.url);assert.equal(url.searchParams.get('prompt'),'select_account');assert.equal(url.searchParams.has('hd'),false);assert.equal(url.searchParams.get('redirect_uri'),base+'/api/auth/callback/google');
 const cookie=first.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
 const retry=await fetch(base+'/api/auth/sign-in/social',{method:'POST',headers:{...headers,Cookie:cookie},body:JSON.stringify({provider:'google',callbackURL:'/'})});assert.equal(retry.status,200);assert.notEqual(new URL((await retry.json()).url).searchParams.get('state'),url.searchParams.get('state'));
});
