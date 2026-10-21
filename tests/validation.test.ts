import test from 'node:test';
import assert from 'node:assert/strict';
import { readJson, submissionSchema } from '../src/lib/validation';

test('JSON reader accepts UTF-8 across stream chunks', async()=>{
  const bytes=new TextEncoder().encode('{"value":"H₂"}');
  const body=new ReadableStream({start(controller){for(const byte of bytes)controller.enqueue(new Uint8Array([byte]));controller.close();}});
  const request=new Request('http://localhost',{method:'POST',body,duplex:'half'} as RequestInit);
  assert.deepEqual(await readJson(request),{value:'H₂'});
});
test('JSON reader cancels oversized streamed requests before consuming the remainder',async()=>{
  let reads=0,cancelled=false;
  const body=new ReadableStream({pull(controller){reads++;controller.enqueue(new Uint8Array(33000));},cancel(){cancelled=true;}});
  const request=new Request('http://localhost',{method:'POST',body,duplex:'half'} as RequestInit);
  await assert.rejects(readJson(request),/too large/);assert.ok(cancelled);assert.ok(reads<=3);
});
test('JSON and answer validation reject malformed, oversized and non-finite input',async()=>{
  await assert.rejects(readJson(new Request('http://localhost',{method:'POST',body:'{'})));
  assert.equal(submissionSchema.safeParse({id:'test',answer:{conditions:Array(21).fill('heat')}}).success,false);
  assert.equal(submissionSchema.safeParse({id:'test',answer:{molecule:{atoms:[{id:'x',element:'C',x:Infinity,y:0}],bonds:[]}}}).success,false);
});
