import test,{after} from 'node:test';
import assert from 'node:assert/strict';

// This worker owns an independent Prisma client pointed at an unavailable local
// port. The real preview database is neither stopped nor modified.
process.env.BETTER_AUTH_URL='http://localhost:3000';
process.env.BETTER_AUTH_SECRET='unavailable-test-only-secret-not-for-real-sessions';
process.env.DATABASE_URL='postgresql://bondlab:bondlab@127.0.0.1:1/bondlab';
const {db}=await import('../../src/lib/db');
const {POST:create}=await import('../../src/app/api/challenges/route');
const {POST:submit}=await import('../../src/app/api/submissions/route');
after(()=>db.$disconnect());
test('database outage returns 503 instead of pretending to save or grade',async()=>{
  const original=console.error;const errors:unknown[][]=[];console.error=(...args)=>{errors.push(args);};
  try{
    const challenge=await create(new Request('http://localhost/api/challenges',{method:'POST',body:JSON.stringify({mode:'products',family:'all'})}));
    assert.equal(challenge.status,503);assert.match((await challenge.json()).error,/PostgreSQL/);
    const result=await submit(new Request('http://localhost/api/submissions',{method:'POST',body:JSON.stringify({id:'test-unavailable'})}));
    assert.equal(result.status,503);assert.match((await result.json()).error,/try again/);assert.equal(errors.length,2);
  }finally{console.error=original;}
});
