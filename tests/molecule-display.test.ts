import test from 'node:test';
import assert from 'node:assert/strict';
import { atomLabelLayout,bondSegments,moleculeDisplayBounds,moleculeViewBox } from '../src/lib/molecule-display';
import type { Molecule } from '../src/chemistry/types';
function pair(dx:number,dy:number,element:'O'|'C'|'N'='O',order:1|2|3=1):Molecule{return {atoms:[{id:'a',element,x:100,y:100},{id:'b',element:'C',x:100+dx,y:100+dy}],bonds:[{a:'a',b:'b',order}],autoH:true};}
test('horizontal element and H glyphs share size and baseline; only counts are lowered',()=>{
 const m=pair(100,0,'C'),parts=atomLabelLayout(m.atoms[0],m).parts;
 const c=parts.find(p=>p.kind==='element')!,h=parts.find(p=>p.kind==='hydrogen')!,n=parts.find(p=>p.kind==='subscript')!;
 assert.equal(c.y,h.y);assert.equal(c.size,h.size);assert(n.y>h.y);assert(h.x>c.x);
});
test('bonds attach to the element symbol in every direction and never terminate at implicit H',()=>{
 for(const element of ['O','N'] as const)for(const [dx,dy] of [[100,0],[-100,0],[0,100],[0,-100],[80,80],[-80,80],[80,-80],[-80,-80]]){
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

test('middle CH and CH2 stay inline for horizontal, vertical, and branched chains',()=>{
 for(const neighbours of [[[0,100],[200,100]],[[100,0],[100,200]],[[0,100],[200,100],[100,0]]]){
  const m:Molecule={atoms:[{id:'c',element:'C',x:100,y:100},...neighbours.map(([x,y],i)=>({id:String(i),element:'C' as const,x,y}))],bonds:neighbours.map((_,i)=>({a:'c',b:String(i),order:1 as const})),autoH:true};
  const parts=atomLabelLayout(m.atoms[0],m).parts,c=parts.find(p=>p.kind==='element')!,h=parts.find(p=>p.kind==='hydrogen')!;
  assert.equal(c.y,h.y);assert(h.x>c.x);
  for(const bond of m.bonds)assert.equal(bondSegments(m,bond).length,1);
 }
});
test('selection rings enclose and center the complete label including counts and charges',()=>{
 for(const element of ['C','O','N','Cl'] as const){
  const m:Molecule={atoms:[{id:'a',element,x:50,y:70,charge:element==='N'?1:0}],bonds:[],autoH:true};
  const {bounds:b,center:c,radius:r}=atomLabelLayout(m.atoms[0],m);
  assert.equal(c.x,(b.left+b.right)/2);assert.equal(c.y,(b.top+b.bottom)/2);
  for(const x of [b.left,b.right])for(const y of [b.top,b.bottom])assert(Math.hypot(x-c.x,y-c.y)<r);
 }
});
test('previews center full labels even when minimum width or height adds space',()=>{
 const methane:Molecule={atoms:[{id:'a',element:'C',x:250,y:170}],bonds:[],autoH:true};
 for(const m of [methane,pair(200,0),pair(0,200),pair(-100,0),{...methane,autoH:false}]){
  const b=moleculeDisplayBounds(m),v=moleculeViewBox(m);
  assert(Math.abs(v.x+v.width/2-(b.left+b.right)/2)<1e-8);
  assert(Math.abs(v.y+v.height/2-(b.top+b.bottom)/2)<1e-8);
  assert(v.width>=100&&v.height>=100);
  assert(b.left-v.x>=15&&b.top-v.y>=15);
 }
});
