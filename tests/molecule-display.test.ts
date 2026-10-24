import test from 'node:test';
import assert from 'node:assert/strict';
import { atomLabelLayout,bondSegments } from '../src/lib/molecule-display';
import type { Molecule } from '../src/chemistry/types';
function pair(dx:number,dy:number,element:'O'|'C'|'N'='O',order:1|2|3=1):Molecule{return {atoms:[{id:'a',element,x:100,y:100},{id:'b',element:'C',x:100+dx,y:100+dy}],bonds:[{a:'a',b:'b',order}],autoH:true};}
test('horizontal element and H glyphs share size and baseline; only counts are lowered',()=>{
 const m=pair(100,0,'C'),parts=atomLabelLayout(m.atoms[0],m).parts;
 const c=parts.find(p=>p.kind==='element')!,h=parts.find(p=>p.kind==='hydrogen')!,n=parts.find(p=>p.kind==='subscript')!;
 assert.equal(c.y,h.y);assert.equal(c.size,h.size);assert(n.y>h.y);assert(h.x<c.x);
});
test('bonds attach to the element symbol in every direction and never terminate at implicit H',()=>{
 for(const element of ['O','C','N'] as const)for(const [dx,dy] of [[100,0],[-100,0],[0,100],[0,-100],[80,80],[-80,80],[80,-80],[-80,-80]]){
  const m=pair(dx,dy,element),layout=atomLabelLayout(m.atoms[0],m),s=bondSegments(m,m.bonds[0])[0];assert(s);
  assert.equal(layout.parts.find(p=>p.kind==='element')!.x,0);
  assert(Math.hypot(s.x1-100,s.y1-100)<24,element+' bond starts near the central element');
  assert((s.x1-100)*dx+(s.y1-100)*dy>0);
  assert(Math.abs((s.x1-100)*dy-(s.y1-100)*dx)<1e-6);
  assert(layout.direction.x*dx+layout.direction.y*dy<=0);
 }
});
test('multiple bonds stay parallel and overlapping atoms never produce reversed lines',()=>{
 for(const order of [2,3] as const){const m=pair(75,80,'C',order);assert.equal(bondSegments(m,m.bonds[0]).length,order);}
 const close=pair(8,0);assert.deepEqual(bondSegments(close,close.bonds[0]),[]);
 const overlap=pair(0,0);assert.deepEqual(bondSegments(overlap,overlap.bonds[0]),[]);
});
