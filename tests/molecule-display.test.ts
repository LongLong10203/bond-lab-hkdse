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
  const p=layout.parts.find(p=>p.kind==='element')!;
  assert(Math.hypot(s.x1-100-p.x,s.y1-100-p.y+8)<24,element+' bond starts near the central element');
  assert((s.x1-100-p.x)*dx+(s.y1-100-p.y+8)*dy>0);
  assert(Math.abs((s.x1-100-p.x)*dy-(s.y1-100-p.y+8)*dx)<1e-6);
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
  const vx=lines[0].x2-lines[0].x1,vy=lines[0].y2-lines[0].y1;
  const length=(l:typeof lines[number])=>Math.hypot(l.x2-l.x1,l.y2-l.y1);
  for(const line of lines){
   assert(Math.abs(length(line)-length(lines[0]))<1e-8);
   assert(Math.abs((line.x1-lines[0].x1)*vx+(line.y1-lines[0].y1)*vy)<1e-8);
   assert(Math.abs((line.x2-lines[0].x2)*vx+(line.y2-lines[0].y2)*vy)<1e-8);
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

test('C–O and C–N bonds target both element symbols, in either order and all directions',()=>{
 for(const element of ['O','N'] as const)for(const order of [1,2] as const)for(const [dx,dy] of [[110,0],[-110,0],[0,110],[0,-110],[85,85],[-85,85],[85,-85],[-85,-85]]){
  const m=pair(dx,dy,element,order),layouts=m.atoms.map(a=>atomLabelLayout(a,m));
  const anchors=layouts.map((l,i)=>{const p=l.parts.find(p=>p.kind==='element')!;return {x:m.atoms[i].x+p.x,y:m.atoms[i].y+p.y-8};});
  const lines=bondSegments(m,m.bonds[0]),reverse=bondSegments(m,{...m.bonds[0],a:'b',b:'a'});
  assert.equal(lines.length,order);
  const start={x:lines.reduce((n,l)=>n+l.x1,0)/order,y:lines.reduce((n,l)=>n+l.y1,0)/order};
  const end={x:lines.reduce((n,l)=>n+l.x2,0)/order,y:lines.reduce((n,l)=>n+l.y2,0)/order};
  for(const [point,anchor] of [[start,anchors[0]],[end,anchors[1]]]){
   assert(Math.hypot(point.x-anchor.x,point.y-anchor.y)<24,'bond stops at the element, not its H label');
   const vx=anchors[1].x-anchors[0].x,vy=anchors[1].y-anchors[0].y;
   assert(Math.abs((point.x-anchor.x)*vy-(point.y-anchor.y)*vx)<1e-8);
  }
  for(const line of lines){
   assert(reverse.some(r=>Math.abs(r.x2-line.x1)+Math.abs(r.y2-line.y1)+Math.abs(r.x1-line.x2)+Math.abs(r.y1-line.y2)<1e-8));
   for(const [i,layout] of layouts.entries())for(const box of layout.boxes)for(let j=0;j<=20;j++){
    const x=line.x1+(line.x2-line.x1)*j/20-m.atoms[i].x,y=line.y1+(line.y2-line.y1)*j/20-m.atoms[i].y;
    assert(!(x>box.left&&x<box.right&&y>box.top&&y<box.bottom),'bond must not cross label text');
   }
  }
 }
});
test('middle carbon retains group anchoring to C but symbol anchoring to O/N',()=>{
 for(const element of ['O','N'] as const){
  const m:Molecule={atoms:[{id:'c',element:'C',x:100,y:100},{id:'a',element:'C',x:0,y:100},{id:'b',element:'C',x:200,y:100},{id:'z',element,x:100,y:0}],bonds:[{a:'c',b:'a',order:1},{a:'c',b:'b',order:1},{a:'c',b:'z',order:1}],autoH:true};
  const layout=atomLabelLayout(m.atoms[0],m),c=layout.parts.find(p=>p.kind==='element')!,h=layout.parts.find(p=>p.kind==='hydrogen')!;
  assert.equal(c.y,h.y);
  for(const bond of m.bonds.slice(0,2)){const line=bondSegments(m,bond)[0];assert.equal(line.y1,100);assert.equal(line.y2,100);}
  const line=bondSegments(m,m.bonds[2])[0];
  assert(Math.abs(line.x1-100-c.x)<1e-8);assert.equal(line.x1,line.x2);
 }
});

test('element-anchored bonds preserve the drawn vertical, horizontal and diagonal directions',()=>{
 for(const element of ['O','N'] as const)for(const order of [1,2] as const)for(const [dx,dy] of [[100,0],[-100,0],[0,100],[0,-100],[80,80],[-80,80],[80,-80],[-80,-80]]){
  const m=pair(dx,dy,element,order);
  const anchors=m.atoms.map(a=>{const p=atomLabelLayout(a,m).parts.find(p=>p.kind==='element')!;return {x:a.x+p.x,y:a.y+p.y-8};});
  assert(Math.abs(anchors[1].x-anchors[0].x-dx)<1e-8);
  assert(Math.abs(anchors[1].y-anchors[0].y-dy)<1e-8);
  for(const l of bondSegments(m,m.bonds[0]))assert(Math.abs((l.x2-l.x1)*dy-(l.y2-l.y1)*dx)<1e-8);
 }
});
test('placement shifts an attached O/N branch together and leaves stored coordinates untouched',()=>{
 for(const element of ['O','N'] as const){
  const m:Molecule={atoms:[{id:'a',element:'C',x:0,y:100},{id:'c',element:'C',x:100,y:100},{id:'z',element,x:100,y:0},{id:'b',element:'C',x:200,y:0}],bonds:[{a:'a',b:'c',order:1},{a:'c',b:'z',order:1},{a:'z',b:'b',order:1}],autoH:true};
  const before=structuredClone(m);
  for(const b of m.bonds){const a=m.atoms.find(a=>a.id===b.a)!,c=m.atoms.find(a=>a.id===b.b)!,dx=c.x-a.x,dy=c.y-a.y;
   for(const l of bondSegments(m,b))assert(Math.abs((l.x2-l.x1)*dy-(l.y2-l.y1)*dx)<1e-8);
  }
  assert.deepEqual(m,before);
  const bounds=moleculeDisplayBounds(m),v=moleculeViewBox(m);assert(Math.abs(v.x+v.width/2-(bounds.left+bounds.right)/2)<1e-8);
 }
});
