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
  assert(b.left-v.x>=15-1e-8&&b.top-v.y>=15-1e-8);
 }
});

test('carbon single bonds mirror symmetrically across either axis',()=>{
 const reference=pair(100,70,'C'),first=bondSegments(reference,reference.bonds[0])[0];
 for(const sx of [-1,1])for(const sy of [-1,1]){
  const m=pair(sx*100,sy*70,'C'),line=bondSegments(m,m.bonds[0])[0];
  for(const end of [1,2] as const){
   assert(Math.abs(line[`x${end}`]-100-sx*(first[`x${end}`]-100))<1e-8);
   assert(Math.abs(line[`y${end}`]-100-sy*(first[`y${end}`]-100))<1e-8);
  }
 }
});
test('double and triple bonds have equal lengths and aligned ends in every direction',()=>{
 for(const order of [2,3] as const)for(const element of ['C','O','N'] as const)for(const [dx,dy] of [[100,0],[-100,0],[0,100],[0,-100],[80,80],[-80,80],[80,-80],[-80,-80]]){
  const m=pair(dx,dy,element,order),lines=bondSegments(m,m.bonds[0]);assert.equal(lines.length,order);
  const length=(l:typeof lines[number])=>Math.hypot(l.x2-l.x1,l.y2-l.y1);
  for(const line of lines){
   assert(Math.abs(length(line)-length(lines[0]))<1e-8);
   assert(Math.abs((line.x1-lines[0].x1)*dx+(line.y1-lines[0].y1)*dy)<1e-8);
   assert(Math.abs((line.x2-lines[0].x2)*dx+(line.y2-lines[0].y2)*dy)<1e-8);
  }
 }
});
test('displaced nitrogen hydrogens each have an explicit bond clear of the text',()=>{
 for(const charge of [0,1]){
  const m:Molecule={atoms:[{id:'n',element:'N',x:100,y:100,charge},{id:'a',element:'C',x:0,y:100},{id:'b',element:'C',x:200,y:100}],bonds:[{a:'n',b:'a',order:1},{a:'n',b:'b',order:1}],autoH:true};
  // A third bonded neighbour is not needed: horizontal bonds place H above N.
  const layout=atomLabelLayout(m.atoms[0],m),hs=layout.parts.filter(p=>p.kind==='hydrogen');
  assert.equal(hs.length,charge+1);assert.equal(layout.hydrogenBonds.length,hs.length);
  assert(!layout.parts.some(p=>p.kind==='subscript'));
  for(const [i,line] of layout.hydrogenBonds.entries()){
   assert(Math.hypot(line.x2-line.x1,line.y2-line.y1)>10);
   assert(Math.hypot(line.x2-hs[i].x,line.y2-(hs[i].y-8))>10);
   for(const box of layout.boxes)for(let j=0;j<=10;j++){
    const x=line.x1+(line.x2-line.x1)*j/10,y=line.y1+(line.y2-line.y1)*j/10;
    assert(!(x>box.left&&x<box.right&&y>box.top&&y<box.bottom));
   }
  }
 }
});
