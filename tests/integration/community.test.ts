import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { fixtureAccount,accountRequest,base } from '../helpers/accounts';
import { db } from '../../src/lib/db';
import { generate } from '../../src/chemistry/generate';
const users:string[]=[],questions:string[]=[];
async function account(domain?:string,verified?:boolean){const a=await fixtureAccount(domain,verified);users.push(a.id);await accountRequest('progress',a);if(domain!=='gmail.com')await accountRequest('profile',a,'PATCH',{displayName:'Test Chemist'});return a;}
after(async()=>{await db.user.deleteMany({where:{id:{in:users}}});await db.challenge.deleteMany({where:{id:{in:questions}}});await db.$disconnect();});
test('guests cannot read school rankings or profiles, or update account data',async()=>{
  for(const path of ['leaderboard','leaderboard/someone'])assert.equal((await accountRequest(path,null)).status,401);
  assert.equal((await accountRequest('profile',null,'PATCH',{displayName:'Guest'})).status,401);
  assert.equal((await accountRequest('tutorial',null,'POST')).status,401);
});
test('leaderboard is descending by XP, stable at ties, and exposes only public stats',async()=>{
  const a=await account(),b=await account(),c=await account(),wrong=await account('gmail.com');
  for(const [player,xp] of [[a,350],[b,100],[c,350],[wrong,99999]] as const){
    await db.playerProgress.upsert({where:{userId:player.id},create:{userId:player.id,xp},update:{xp}});
  }
  const response=await accountRequest('leaderboard',a);assert.equal(response.status,200);
  const data=await response.json(),rows=data.players;
  for(let i=1;i<rows.length;i++){assert(rows[i-1].xp>=rows[i].xp);if(rows[i-1].xp===rows[i].xp)assert(rows[i-1].id<rows[i].id);}
  assert(!rows.some((r:any)=>r.id===wrong.id));
  const entry=rows.find((r:any)=>r.id===a.id);assert.equal(entry.isYou,true);
  assert.deepEqual(Object.keys(entry).sort(),['id','displayName','xp','level','completed','rank','isYou'].sort());
  const profile=await(await accountRequest(`leaderboard/${a.id}`,b)).json();
  assert.equal(profile.rank,entry.rank);assert.equal(profile.isYou,false);assert.deepEqual(profile.byMode,{products:0,conditions:0,synthesis:0});
  assert.equal(profile.email,`test-${a.id}@syss.edu.hk`);
  for(const viewer of [null,wrong,await account('syss.edu.hk',false)])assert.equal((await accountRequest(`leaderboard/${a.id}`,viewer)).status,401);
  for(const key of ['name','image','drafts','sessions','accounts','attempts','correct','token'])assert.equal(key in profile,false);
  assert.equal((await accountRequest(`leaderboard/${wrong.id}`,a)).status,404);
  assert.equal((await accountRequest('leaderboard?page=-1',a)).status,400);
  assert.equal((await accountRequest('leaderboard?page=2',a)).status,200);
});
test('nickname editing is owner-only, validated and protected against cross-origin writes',async()=>{
  const a=await account(),b=await account();
  assert.equal((await accountRequest('profile',a,'PATCH',{displayName:'Carbon Cat'})).status,200);
  assert.equal((await(await accountRequest(`leaderboard/${a.id}`,b)).json()).displayName,'Carbon Cat');
  for(const body of [{displayName:'someone@syss.edu.hk'},{displayName:'<b>hi</b>'},{displayName:'No',userId:b.id}])assert.equal((await accountRequest('profile',a,'PATCH',body)).status,400);
  const external=await fetch(`${base}/api/profile`,{method:'PATCH',headers:{Origin:'https://elsewhere.example',Cookie:a.cookie,'Content-Type':'application/json'},body:JSON.stringify({displayName:'Bad'})});assert.equal(external.status,403);
  assert.notEqual((await db.playerProgress.findUniqueOrThrow({where:{userId:b.id}})).displayName,'Carbon Cat');
});
test('tutorial completion persists without changing drafts, scores, or save revision',async()=>{
  const a=await account();const before=await(await accountRequest('progress',a)).json();assert.equal(before.tutorialCompleted,false);
  for(let i=0;i<2;i++)assert.equal((await accountRequest('tutorial',a,'POST')).status,200);
  const after=await(await accountRequest('progress',a)).json();assert.equal(after.tutorialCompleted,true);assert.equal(after.revision,before.revision);assert.deepEqual(after.sessions,before.sessions);assert.deepEqual(after.progress,before.progress);
});
test('guest grading returns feedback without XP rewards',async()=>{
  const question=await(await accountRequest('challenges',null,'POST',{mode:'conditions',family:'addition'})).json();questions.push(question.id);
  const row=await db.challenge.findUniqueOrThrow({where:{id:question.id}}),g=generate(row.seed,'conditions',row.family);
  const result=await(await accountRequest('submissions',null,'POST',{id:question.id,answer:{conditions:g.reaction.conditions[0]}})).json();assert.equal(result.correct,true);assert.equal('xp' in result,false);assert.equal('progress' in result,false);
});
