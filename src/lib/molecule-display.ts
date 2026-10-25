import { hydrogens } from '@/chemistry/molecules';
import type { Atom,Bond,Molecule } from '@/chemistry/types';
type Part={text:string;x:number;y:number;size:number;width:number;kind:'element'|'hydrogen'|'subscript'|'charge'};
type Segment={x1:number;y1:number;x2:number;y2:number};
type Box={left:number;right:number;top:number;bottom:number};
const widths:Record<Atom['element'],number>={C:16,H:16,O:17,N:16,F:14,Cl:21,Br:23,I:7};
const directions=[{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1}];
export function atomLabelLayout(atom:Atom,molecule:Molecule){
  const original=molecule.atoms.find(a=>a.id===atom.id)??atom;
  const neighbours=molecule.bonds.filter(b=>b.a===atom.id||b.b===atom.id).map(b=>molecule.atoms.find(a=>a.id===(b.a===atom.id?b.b:b.a))).filter((a):a is Atom=>!!a);
  const directionalNeighbours=atom.element==='C'?neighbours.filter(a=>a.element==='O'||a.element==='N'):neighbours;
  const vectors=directionalNeighbours.map(a=>{const dx=a.x-original.x,dy=a.y-original.y,len=Math.hypot(dx,dy)||1;return {x:dx/len,y:dy/len};});
  // Carbon–carbon bonds use the condensed group. Keep H clear of any
  // carbon–oxygen/nitrogen bond, which must attach to the C glyph itself.
  const score=(d:{x:number;y:number})=>vectors.reduce((n,v)=>n+Math.pow(Math.max(0,d.x*v.x+d.y*v.y),4),0);
  const direction=directions.reduce((best,d)=>score(d)<score(best)-0.001?d:best,directions[0]);
  const w=widths[atom.element],h=hydrogens(molecule,atom);
  const parts:Part[]=[{text:atom.element,x:0,y:8,size:22,width:w,kind:'element'}];
  const hydrogenBonds:Segment[]=[];
  if(h){
    if(direction.y){
      // A displaced H is a separate atom in the drawing, so show its bond.
      // Multiple hydrogens are drawn individually rather than as a bonded H₂ group.
      for(let i=0;i<h;i++){
        const x=(i-(h-1)/2)*44,y=direction.y*46;
        parts.push({text:'H',x,y:8+y,size:22,width:16,kind:'hydrogen'});
      }
    }else{
      const groupWidth=16+(h>1?8:0);
      const left=direction.x>0?w/2+2:-w/2-2-groupWidth;
      parts.push({text:'H',x:left+8,y:8,size:22,width:16,kind:'hydrogen'});
      if(h>1)parts.push({text:String(h),x:left+20,y:13,size:13,width:8,kind:'subscript'});
    }
  }
  if(atom.charge)parts.push({text:atom.charge>0?'+':'−',x:w/2+(direction.y&&h>1?18:7),y:-9,size:13,width:10,kind:'charge'});
  const partBox=(p:Part):Box=>({left:p.x-p.width/2-3,right:p.x+p.width/2+3,top:p.y-p.size*0.8-3,bottom:p.y+3});
  const union=(boxes:Box[]):Box=>({left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))});
  if(direction.y){
    for(const part of parts.filter(p=>p.kind==='hydrogen')){
      const dx=part.x,dy=part.y-8,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
      const start=Math.max(...parts.filter(p=>p.kind==='element'||p.kind==='charge').map(p=>exitDistance(partBox(p),0,0,ux,uy)))+2;
      const end=exitDistance(partBox({...part,x:0,y:8}),0,0,-ux,-uy)+2;
      if(start+end<len)hydrogenBonds.push({x1:ux*start,y1:uy*start,x2:dx-ux*end,y2:dy-uy*end});
    }
  }
  if(atom.element==='C'){
    // Centre the full carbon label while retaining the actual C glyph position.
    const b=union(parts.map(partBox)),cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2;
    for(const part of parts){part.x-=cx;part.y-=cy;}
    for(const line of hydrogenBonds){line.x1-=cx;line.x2-=cx;line.y1-=cy;line.y2-=cy;}
  }
  const boxes=parts.map(partBox),bounds=union(boxes);
  const center={x:(bounds.left+bounds.right)/2,y:(bounds.top+bounds.bottom)/2};
  const radius=Math.max(27,Math.hypot(bounds.right-bounds.left,bounds.bottom-bounds.top)/2+3);
  return {parts,boxes,bounds,direction,center,radius,hydrogenBonds};
}
export function moleculeDisplayBounds(molecule:Molecule):Box{
  if(!molecule.atoms.length)return {left:0,right:0,top:0,bottom:0};
  const boxes=molecule.atoms.map(atom=>{const b=atomLabelLayout(atom,molecule).bounds;return {left:atom.x+b.left,right:atom.x+b.right,top:atom.y+b.top,bottom:atom.y+b.bottom};});
  return {left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};
}
export function moleculeViewBox(molecule:Molecule){
  const b=moleculeDisplayBounds(molecule),width=Math.max(100,b.right-b.left+30),height=Math.max(100,b.bottom-b.top+30);
  // Minimum-size padding must be added on both sides to preserve the center.
  return {x:(b.left+b.right-width)/2,y:(b.top+b.bottom-height)/2,width,height};
}
// Intersect a ray with the label's rectangles to keep bonds out of text.
function exitDistance(box:Box,x:number,y:number,ux:number,uy:number){
  let near=-Infinity,far=Infinity;
  for(const [p,u,lo,hi] of [[x,ux,box.left,box.right],[y,uy,box.top,box.bottom]]){
    if(Math.abs(u)<1e-8){if(p<lo||p>hi)return 0;continue;}
    const a=(lo-p)/u,b=(hi-p)/u;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
  }
  return far>=Math.max(0,near)?Math.max(0,far):0;
}
export function bondSegments(molecule:Molecule,bond:Bond){
  const a=molecule.atoms.find(a=>a.id===bond.a),b=molecule.atoms.find(a=>a.id===bond.b);
  if(!a||!b)return [];
  // Coincident graph nodes have no drawable bond, even if their labels differ.
  if(Math.hypot(b.x-a.x,b.y-a.y)<1)return [];
  const al=atomLabelLayout(a,molecule),bl=atomLabelLayout(b,molecule);
  const elementBond=(a.element==='C'&&(b.element==='O'||b.element==='N'))||(b.element==='C'&&(a.element==='O'||a.element==='N'));
  const anchor=(atom:Atom,label:ReturnType<typeof atomLabelLayout>)=>{
    const part=label.parts.find(p=>p.kind==='element')!;
    const offset=elementBond?{x:part.x,y:part.y-8}:{x:0,y:0};
    const boxes=atom.element==='C'&&!elementBond?[label.bounds]:label.boxes;
    return {x:atom.x+offset.x,y:atom.y+offset.y,boxes:boxes.map(b=>({left:b.left-offset.x,right:b.right-offset.x,top:b.top-offset.y,bottom:b.bottom-offset.y}))};
  };
  const ap=anchor(a,al),bp=anchor(b,bl),dx=bp.x-ap.x,dy=bp.y-ap.y,len=Math.hypot(dx,dy);
  if(len<1)return [];
  const ux=dx/len,uy=dy/len,ab=ap.boxes,bb=bp.boxes;
  const offsets=bond.order===1?[0]:bond.order===2?[-3,3]:[-5,0,5];
  // All parallel lines share the same clipping distance at either end.
  // This keeps double/triple bonds equal in length, including diagonals.
  const starts=offsets.map(o=>Math.max(...ab.map(box=>exitDistance(box,-uy*o,ux*o,ux,uy)))+2);
  const ends=offsets.map(o=>Math.max(...bb.map(box=>exitDistance(box,-uy*o,ux*o,-ux,-uy)))+2);
  const start=Math.max(...starts),end=Math.max(...ends);
  if(start+end>=len)return [];
  return offsets.map(offset=>{
    const ox=-uy*offset,oy=ux*offset;
    return {x1:ap.x+ox+ux*start,y1:ap.y+oy+uy*start,x2:bp.x+ox-ux*end,y2:bp.y+oy-uy*end};
  });
}
