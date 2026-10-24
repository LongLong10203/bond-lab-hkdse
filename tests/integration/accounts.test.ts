import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fixtureAccount,accountRequest,base } from '../helpers/accounts';
import { db } from '../../src/lib/db';
import { generate } from '../../src/chemistry/generate';
import { newSession } from '../../src/lib/practice';
const users:string[]=[],questions:string[]=[];
async function account(domain?:string,verified?:boolean){const a=await fixtureAccount(domain,verified);users.push(a.id);return a;}
after(async()=>{await db.user.deleteMany({where:{id:{in:users}}});await db.challenge.deleteMany({where:{id:{in:questions}}});await db.$disconnect();});

test('private progress rejects anonymous, forged, wrong-domain and unverified accounts',async()=>{
  assert.equal((await accountRequest('progress',null)).status,401);
  assert.equal((await accountRequest('progress',{id:'fake',cookie:'better-auth.session_token=fake'})).status,401);
  for(const a of [await account('gmail.com'),await account('syss.edu.hk',false)])assert.equal((await accountRequest('progress',a)).status,401);
});
test('drafts survive another browser session, remain private, and reject stale or forged writes',async()=>{
  const a=await account(),b=await account();
  const initial=await accountRequest('progress',a);assert.equal(initial.status,200);const saved=await initial.json();
  const response=await accountRequest('challenges',a,'POST',{mode:'synthesis',family:'all'});const question=await response.json();questions.push(question.id);
  const draft=newSession(question);draft.activeStep=1;draft.steps[0].conditions=['heat'];
  const body={revision:saved.revision,sessions:{synthesis:draft},activeMode:'synthesis'};
  assert.equal((await accountRequest('progress',a,'PATCH',body)).status,200);
  const restored=await (await accountRequest('progress',a)).json();assert.equal(restored.sessions.synthesis.activeStep,1);assert.deepEqual(restored.sessions.synthesis.steps[0].conditions,['heat']);
  const other=await(await accountRequest('progress',b)).json();assert.deepEqual(other.sessions,{});
  assert.equal((await accountRequest('progress',{...b,id:a.id},'PATCH',{...body,revision:0})).status,401);
  assert.equal((await accountRequest('progress',a,'PATCH',body)).status,409);
  assert.equal((await accountRequest('progress',a,'PATCH',{...body,revision:1,progress:{xp:9999}})).status,400);
  assert.equal((await fetch(`${base}/api/progress`,{method:'PATCH',headers:{Cookie:a.cookie,Origin:'https://attacker.example','Content-Type':'application/json'},body:JSON.stringify(body)})).status,403);
});
test('server awards XP once across simultaneous requests and retries, and persists scores',async()=>{
  const a=await account();await accountRequest('progress',a);
  const question=await(await accountRequest('challenges',a,'POST',{mode:'conditions',family:'addition'})).json();questions.push(question.id);
  const row=await db.challenge.findUniqueOrThrow({where:{id:question.id}});
  const generated=generate(row.seed,'conditions',row.family);
  const body={id:question.id,requestId:randomUUID(),answer:{conditions:generated.reaction.conditions[0]}};
  const replies=await Promise.all([accountRequest('submissions',a,'POST',body),accountRequest('submissions',a,'POST',body)]);
  for(const r of replies)assert.equal(r.status,200);
  const [first,retry]=await Promise.all(replies.map(r=>r.json()));assert.deepEqual(first,retry);assert.equal(first.xp,question.reward);
  const again=await(await accountRequest('submissions',a,'POST',{...body,requestId:randomUUID()})).json();assert.equal(again.xp,0);
  const current=await(await accountRequest('progress',a)).json();assert.equal(current.progress.xp,question.reward);assert.equal(current.progress.completed,1);assert.equal(current.progress.attempts,2);
  assert.equal((await accountRequest('submissions',{id:a.id,cookie:''},'POST',body)).status,401);
  assert.equal((await accountRequest('progress',a,'DELETE')).status,405);
  const afterReset=await(await accountRequest('submissions',a,'POST',{...body,requestId:randomUUID()})).json();assert.equal(afterReset.xp,0);assert.equal(afterReset.progress.xp,question.reward);
});
test('viewing a solution permanently removes its XP reward for that account',async()=>{
  const a=await account();
  const question=await(await accountRequest('challenges',a,'POST',{mode:'conditions',family:'addition'})).json();questions.push(question.id);
  const row=await db.challenge.findUniqueOrThrow({where:{id:question.id}}),g=generate(row.seed,'conditions',row.family);
  await accountRequest('submissions',a,'POST',{id:question.id,reveal:true,requestId:randomUUID()});
  const result=await(await accountRequest('submissions',a,'POST',{id:question.id,answer:{conditions:g.reaction.conditions[0]},requestId:randomUUID()})).json();
  assert.equal(result.correct,true);assert.equal(result.xp,0);assert.equal(result.revealed,true);
});
test('sign-out revokes the session and email/password registration is unavailable',async()=>{
  const a=await account();
  assert.equal((await accountRequest('auth/sign-out',a,'POST',{})).status,200);
  assert.equal((await accountRequest('progress',a)).status,401);
  assert.notEqual((await accountRequest('auth/sign-up/email',null,'POST',{name:'No',email:'x@syss.edu.hk',password:'test-password-never-used'})).status,200);
});
