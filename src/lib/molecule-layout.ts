import type { Molecule } from '@/chemistry/types';
export type Point={x:number;y:number};
export type Positions=Record<string,Point>;
export const clampPoint=(p:Point):Point=>({x:Math.max(38,Math.min(682,p.x)),y:Math.max(38,Math.min(302,p.y))});

// Chemical diagram targets, not a force graph: loose atoms never repel one another.
export function arrangedPositions(m:Molecule,positions:Positions,pinned?:{id:string;point:Point}):Positions{
  const targets:Positions=Object.fromEntries(m.atoms.map(a=>[a.id,{...(positions[a.id]??a)}]));
  const adjacent=new Map(m.atoms.map(a=>[a.id,[] as string[]]));
  for(const b of m.bonds){adjacent.get(b.a)?.push(b.b);adjacent.get(b.b)?.push(b.a);}
  const visited=new Set<string>();
  for(const atom of m.atoms){
    if(visited.has(atom.id))continue;
    const component=[atom.id];visited.add(atom.id);
    for(const id of component)for(const next of adjacent.get(id)??[])if(!visited.has(next)&&adjacent.has(next)){visited.add(next);component.push(next);}
    if(component.length===1){if(pinned?.id===atom.id)targets[atom.id]=clampPoint(pinned.point);continue;}
    const heavy=component.filter(id=>m.atoms.find(a=>a.id===id)?.element!=='H');
    const candidates=heavy.length>1?heavy:component,allowed=new Set(candidates);
    let backbone:string[]=[];
    // Longest shortest path supplies a stable backbone, including ester O/N links.
    for(const start of candidates){
      const paths=new Map<string,string[]>([[start,[start]]]),queue=[start];
      for(const id of queue)for(const next of adjacent.get(id)??[])if(allowed.has(next)&&!paths.has(next)){const path=[...paths.get(id)!,next];paths.set(next,path);queue.push(next);if(path.length>backbone.length)backbone=path;}
    }
    if(!backbone.length)backbone=[component[0]];
    // Peel branches to find a simple ring, then retain its closed polygon.
    const core=new Set(candidates);
    let changed=true;
    while(changed){changed=false;for(const id of core)if((adjacent.get(id)??[]).filter(n=>core.has(n)).length<2){core.delete(id);changed=true;}}
    const ring:string[]=[];
    if(core.size>=3&&[...core].every(id=>(adjacent.get(id)??[]).filter(n=>core.has(n)).length===2)){
      let id=[...core][0],previous='';
      do{ring.push(id);const next=(adjacent.get(id)??[]).find(n=>core.has(n)&&n!==previous)!;previous=id;id=next;}while(id!==ring[0]&&ring.length<=core.size);
      if(ring.length!==core.size)ring.length=0;
    }
    const local:Positions={};
    if(ring.length){const radius=76/(2*Math.sin(Math.PI/ring.length));ring.forEach((id,i)=>{const angle=-Math.PI/2+2*Math.PI*i/ring.length;local[id]={x:radius*Math.cos(angle),y:radius*Math.sin(angle)};});backbone=ring;}
    else backbone.forEach((id,i)=>{local[id]={x:i*66,y:i%2?19:-19};});
    const queue=[...backbone];
    for(const id of queue)for(const next of adjacent.get(id)??[]){
      if(local[next])continue;
      const parent=local[id],length=m.atoms.find(a=>a.id===next)?.element==='H'?52:66;
      const outward=Math.atan2(parent.y,parent.x)*180/Math.PI;
      const angles=ring.length?[outward,outward-45,outward+45,outward-90,outward+90]:parent.y<=0?[-90,-150,-30,90,150,30]:[90,150,30,-90,-150,-30];
      let best:Point|undefined,bestScore=-Infinity;
      for(const degrees of angles){const angle=degrees*Math.PI/180,p={x:parent.x+Math.cos(angle)*length,y:parent.y+Math.sin(angle)*length};const distance=Math.min(...Object.entries(local).filter(([key])=>key!==id).map(([,q])=>Math.hypot(p.x-q.x,p.y-q.y)),100);const score=Math.min(distance,60);if(score>bestScore){best=p;bestScore=score;}}
      local[next]=best!;queue.push(next);
    }
    const xs=component.map(id=>local[id].x),ys=component.map(id=>local[id].y);
    const scale=Math.min(1,644/Math.max(1,Math.max(...xs)-Math.min(...xs)),264/Math.max(1,Math.max(...ys)-Math.min(...ys)));
    const mean=(get:(id:string)=>number)=>component.reduce((sum,id)=>sum+get(id),0)/component.length;
    let dx=mean(id=>targets[id].x)-mean(id=>local[id].x)*scale,dy=mean(id=>targets[id].y)-mean(id=>local[id].y)*scale;
    if(pinned&&component.includes(pinned.id)){dx=pinned.point.x-local[pinned.id].x*scale;dy=pinned.point.y-local[pinned.id].y*scale;}
    else{dx=Math.max(38-Math.min(...xs)*scale,Math.min(682-Math.max(...xs)*scale,dx));dy=Math.max(38-Math.min(...ys)*scale,Math.min(302-Math.max(...ys)*scale,dy));}
    for(const id of component)targets[id]=clampPoint({x:local[id].x*scale+dx,y:local[id].y*scale+dy});
  }
  return targets;
}
export function layoutTick(m:Molecule,positions:Positions,_velocity:Positions,pinned?:{id:string;point:Point}){
  const targets=arrangedPositions(m,positions,pinned),next:Positions={},velocity:Positions={};let speed=0;
  for(const a of m.atoms){const p=positions[a.id]??a,target=targets[a.id];const distance=Math.hypot(target.x-p.x,target.y-p.y),fraction=distance<.2?1:Math.min(.16,4/distance);
    next[a.id]=pinned?.id===a.id?clampPoint(pinned.point):{x:p.x+(target.x-p.x)*fraction,y:p.y+(target.y-p.y)*fraction};
    velocity[a.id]={x:next[a.id].x-p.x,y:next[a.id].y-p.y};speed=Math.max(speed,Math.hypot(velocity[a.id].x,velocity[a.id].y));
  }
  return {positions:next,velocity,speed};
}
export function withPositions(m:Molecule,positions:Positions):Molecule{return {...m,atoms:m.atoms.map(a=>({...a,...positions[a.id]}))};}
