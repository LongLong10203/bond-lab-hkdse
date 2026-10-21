import { reactions, startingCompounds, familyOf, VERSION } from './rules';
import { molecule,name } from './molecules';
import { reactionCoReactants,reactionCoProducts } from './context';
import { rewardFor } from './rewards';
import { equivalent } from './check';
import type { ChallengeData, Compound, Mode, Reaction } from './types';
export function random(seed:number){let t=seed>>>0;return ()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
const pool=startingCompounds().flatMap(reactions);
export const coverage=()=>({variants:pool.length,rules:new Set(pool.map(r=>r.ruleId)).size});
function same(a:Compound,b:Compound){return equivalent(molecule(a),molecule(b));}
function shortest(start:Compound,end:Compound,max:number){
  let queue=[start];const seen=[start];
  for(let d=1;d<=max;d++){const next:Compound[]=[];for(const c of queue)for(const r of reactions(c)){
    if(same(r.product,end))return d;
    if(!seen.some(c=>same(c,r.product))){seen.push(r.product);next.push(r.product);}
  }queue=next;}return Infinity;
}
export function generate(seed:number,mode:Mode,family='all'):{question:Omit<ChallengeData,'id'>;reaction:Reaction;route:Reaction[]}{
  const rng=random(seed);const pick=<T,>(a:T[])=>a[Math.floor(rng()*a.length)];
  let route:Reaction[]=[];
  if(mode==='synthesis'){
    const steps=2+Math.floor(rng()*3);
    // Enumerate bounded simple paths. Reject shorter solutions and reversible detours.
    const starters=startingCompounds().filter(c=>c.n>=2&&c.n<=5&&!['ester','amide','alkane'].includes(c.kind));
    for(let attempt=0;attempt<150&&!route.length;attempt++){
      const start=pick(starters);let current=start;const path:Reaction[]=[],visited=[start];
      for(let i=0;i<steps;i++){
        const options=reactions(current).filter(r=>!['combustion','polymerisation'].includes(familyOf(r.ruleId))&&!visited.some(c=>same(c,r.product)));
        if(!options.length)break;const r=pick(options);path.push(r);visited.push(r.product);current=r.product;
      }
      if(path.length===steps&&shortest(start,current,steps)===steps)route=path;
    }
    if(!route.length){const start:Compound={kind:'haloalkane',n:2+Math.floor(rng()*4),halogen:'Br'};const first=reactions(start)[0];const second=reactions(first.product).find(r=>r.ruleId==='oxidation:primary-acid')!;route=[first,second];}
  }else{
    const options=pool.filter(r=>family==='all'||familyOf(r.ruleId)===family);
    if(!options.length)throw new Error('Unknown reaction family');route=[pick(options)];
  }
  const reaction=route[0],last=route.at(-1)!;
  return {reaction,route,question:{mode,family:mode==='synthesis'?'all':family,version:VERSION,
    title:mode==='synthesis'?'Find a route':mode==='conditions'?'Set the conditions':'Build the product',
    start:molecule(reaction.start),startName:name(reaction.start),extras:mode==='synthesis'?'':reaction.extras,
    ...(mode==='products'?{conditions:reaction.conditions[Math.floor(rng()*reaction.conditions.length)]}:{target:molecule(last.product),targetName:name(last.product)}),
    ...(mode==='synthesis'?{stepLimit:route.length}:{}),
    instruction:mode==='synthesis'?`Plan a route in ${route.length} steps. Give each intermediate and its reagents and conditions.`:mode==='conditions'?'Select one complete set of reagents and conditions. Alternatives are accepted.':'Draw the requested product. Automatic hydrogens fill unused valences.',
    coReactants:reactionCoReactants(route),coProducts:mode==='synthesis'?[]:reactionCoProducts(reaction),...rewardFor(mode,route)}};
}
