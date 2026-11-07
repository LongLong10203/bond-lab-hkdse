import 'dotenv/config';
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../src/lib/db';
import { generate } from '../../src/chemistry/generate';
import { molecule } from '../../src/chemistry/molecules';
import { solution } from '../../src/chemistry/grading';
import { VERSION } from '../../src/chemistry/rules';
import type { Mode } from '../../src/chemistry/types';

const base=process.env.TEST_BASE_URL??'http://localhost:3000';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Integration tests must target a local server.');
const created:string[]=[];
async function post(path:string,body:unknown){return fetch(`${base}/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
after(async()=>{try{await db.challenge.deleteMany({where:{id:{in:created}}});}finally{await db.$disconnect();}});

for(const mode of ['products','conditions','synthesis'] as Mode[])test(`${mode}: persisted question regenerates and grades through HTTP`,async()=>{
  const response=await post('challenges',{mode,family:mode==='synthesis'?'all':'hydrolysis'});
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const {id,...question}=await response.json();created.push(id);
  const row=await db.challenge.findUniqueOrThrow({where:{id}});
  assert.equal(row.version,VERSION);assert.equal(row.mode,mode);
  const generated=generate(row.seed,mode,row.family);assert.deepEqual(question,generated.question);
  assert.equal('reaction' in question,false);assert.equal('route' in question,false);
  const answer=mode==='products'?{molecule:molecule(generated.reaction.product)}:mode==='conditions'?{conditions:generated.reaction.conditions.at(-1)}:{steps:generated.route.map(r=>({molecule:molecule(r.product),conditions:r.conditions.at(-1)}))};
  for(let attempt=0;attempt<2;attempt++){
    const checked=await post('submissions',{id,answer});assert.equal(checked.status,200);assert.equal((await checked.json()).correct,true);
  }
  if(mode==='synthesis'){
    const shorter=await post('submissions',{id,answer:{steps:answer.steps!.slice(1)}});
    assert.equal(shorter.status,200);
    const result=await shorter.json();assert.equal(result.correct,false);
    assert.match(result.message,new RegExp(`exactly ${question.stepLimit}`));
  }
  const wrong=await post('submissions',{id,answer:{}});assert.equal(wrong.status,200);assert.equal((await wrong.json()).correct,false);
  const reveal=await post('submissions',{id,reveal:true});assert.deepEqual(await reveal.json(),solution(row.seed,mode,row.family));
});
test('old generator versions are rejected without silently interpreting their seeds',async()=>{
  const row=await db.challenge.create({data:{seed:134,mode:'products',family:'addition',version:'2026.1'}});created.push(row.id);
  for(const reveal of [false,true]){const response=await post('submissions',{id:row.id,reveal});assert.equal(response.status,409);assert.match((await response.json()).error,/older generator/);}
});
test('invalid requests and unknown challenges return useful HTTP errors',async()=>{
  for(const body of [{mode:'bad'},{mode:'products',family:'unknown'},{mode:'synthesis',family:'unknown'},null])assert.equal((await post('challenges',body)).status,400);
  assert.equal((await post('submissions',{id:'missing-integration-test'})).status,404);
  assert.equal((await post('submissions',{id:'x',answer:{steps:Array(5).fill({molecule:{atoms:[],bonds:[]},conditions:[]})}})).status,400);
  assert.equal((await post('submissions',{id:'x',answer:{molecule:{atoms:[{id:'a',element:'C',x:5000,y:0}],bonds:[]}}})).status,400);
  for(const path of ['challenges','submissions'])for(const body of ['{',JSON.stringify({padding:'x'.repeat(65001)})]){
    const response=await fetch(`${base}/api/${path}`,{method:'POST',body});assert.equal(response.status,400);assert.equal(typeof (await response.json()).error,'string');
  }
});

test('older generator questions are rejected instead of being reinterpreted',async()=>{
  const seed=134,mode='synthesis',family='all';const row=await db.challenge.create({data:{seed,mode,family,version:'2026.3'}});created.push(row.id);
  const g=generate(seed,mode,family),answer={steps:g.route.map(r=>({molecule:molecule(r.product),conditions:r.conditions[0]}))};
  const checked=await post('submissions',{id:row.id,answer});assert.equal(checked.status,409);assert.match((await checked.json()).error,/older generator/);
});
