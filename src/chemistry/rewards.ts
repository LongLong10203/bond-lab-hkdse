import type { Mode, Reaction } from './types';
export function rewardFor(mode:Mode,route:Reaction[]){
  if(mode==='synthesis')return {reward:50+(route.length-2)*30,difficulty:route.length===2?'Foundation' as const:route.length===3?'Intermediate' as const:'Advanced' as const};
  const r=route[0],large=r.product.n+(r.product.m??0)>5;
  const advanced=['polyester','polyamide','addition-polymer','cracking'].includes(r.product.kind);
  const medium=large||['ester','amide','carboxylate'].includes(r.product.kind)||r.start.kind==='amide';
  return {reward:advanced?50:medium?35:20,difficulty:advanced?'Advanced' as const:medium?'Intermediate' as const:'Foundation' as const};
}
// Level costs rise by 50 XP: 100, 150, 200, 250, ...
export function levelFor(xp:number){
  const safe=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Number.isFinite(xp)?Math.floor(xp):0));
  const completed=Math.floor((Math.sqrt(9+4*safe/25)-3)/2);
  const threshold=25*completed*(completed+3),required=100+50*completed,withinLevel=safe-threshold;
  return {level:completed+1,withinLevel,toNext:required-withinLevel,required};
}
