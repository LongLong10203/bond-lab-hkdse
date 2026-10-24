import { hydrogens } from '@/chemistry/molecules';
import type { Atom,Bond,Molecule } from '@/chemistry/types';
type Part={text:string;x:number;y:number;size:number;width:number;kind:'element'|'hydrogen'|'subscript'|'charge'};
type Box={left:number;right:number;top:number;bottom:number};
const widths:Record<Atom['element'],number>={C:16,H:16,O:17,N:16,F:14,Cl:21,Br:23,I:7,'*':12};
const directions=[{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1}];
export function atomLabelLayout(atom:Atom,molecule:Molecule){
  const original=molecule.atoms.find(a=>a.id===atom.id)??atom;
  const neighbours=molecule.bonds.filter(b=>b.a===atom.id||b.b===atom.id).map(b=>molecule.atoms.find(a=>a.id===(b.a===atom.id?b.b:b.a))).filter((a):a is Atom=>!!a);
  const vectors=neighbours.map(a=>{const dx=a.x-original.x,dy=a.y-original.y,len=Math.hypot(dx,dy)||1;return {x:dx/len,y:dy/len};});
  // Keep condensed carbon groups inline, including CH/CH2 in a chain.
  // Other elements keep hydrogen away from their bond where possible.
  const score=(d:{x:number;y:number})=>vectors.reduce((n,v)=>n+Math.pow(Math.max(0,d.x*v.x+d.y*v.y),4),0);
  const direction=atom.element==='C'?directions[0]:directions.reduce((best,d)=>score(d)<score(best)-0.001?d:best,directions[0]);
  const w=widths[atom.element],h=hydrogens(molecule,atom);
  const parts:Part[]=[{text:atom.element,x:0,y:8,size:22,width:w,kind:'element'}];
  if(h){
    const groupWidth=16+(h>1?8:0);
    const left=direction.x>0?w/2+2:direction.x<0?-w/2-2-groupWidth:-groupWidth/2;
    const baseline=8+direction.y*25;
    parts.push({text:'H',x:left+8,y:baseline,size:22,width:16,kind:'hydrogen'});
    if(h>1)parts.push({text:String(h),x:left+20,y:baseline+5,size:13,width:8,kind:'subscript'});
  }
  if(atom.charge)parts.push({text:atom.charge>0?'+':'−',x:w/2+7,y:-9,size:13,width:10,kind:'charge'});
  const boxes=parts.map(p=>({left:p.x-p.width/2-3,right:p.x+p.width/2+3,top:p.y-p.size*0.8-3,bottom:p.y+3}));
  const bounds={left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))};
  const center={x:(bounds.left+bounds.right)/2,y:(bounds.top+bounds.bottom)/2};
  const radius=Math.max(27,Math.hypot(bounds.right-bounds.left,bounds.bottom-bounds.top)/2+3);
  return {parts,boxes,bounds,direction,center,radius};
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
// Intersect a ray with the label's glyph rectangles. Parallel multiple bonds
// are clipped individually so neither short nor diagonal bonds cross text.
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
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  if(len<1)return [];
  const ux=dx/len,uy=dy/len,ab=atomLabelLayout(a,molecule).boxes,bb=atomLabelLayout(b,molecule).boxes;
  const offsets=bond.order===1?[0]:bond.order===2?[-3,3]:[-5,0,5];
  return offsets.flatMap(offset=>{
    const ox=-uy*offset,oy=ux*offset;
    const start=Math.max(...ab.map(box=>exitDistance(box,ox,oy,ux,uy)))+2;
    const end=Math.max(...bb.map(box=>exitDistance(box,ox,oy,-ux,-uy)))+2;
    if(start+end>=len)return [];
    return [{x1:a.x+ox+ux*start,y1:a.y+oy+uy*start,x2:b.x+ox-ux*end,y2:b.y+oy-uy*end}];
  });
}
