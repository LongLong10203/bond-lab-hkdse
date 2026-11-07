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
export function shortestRoute(start: Compound, end: Compound, max: number): Reaction[] | null {
  if (same(start, end)) return [];
  let frontier: { compound: Compound; route: Reaction[] }[] = [{ compound: start, route: [] }];
  const seen = [start];
  for (let depth = 1; depth <= max; depth++) {
    const next: typeof frontier = [];
    for (const entry of frontier) {
      for (const reaction of reactions(entry.compound)) {
        const route = [...entry.route, reaction];
        if (same(reaction.product, end)) return route;
        if (seen.some(compound => same(compound, reaction.product))) continue;
        seen.push(reaction.product);
        next.push({ compound: reaction.product, route });
      }
    }
    frontier = next;
  }
  return null;
}
export function shortestRouteLength(start: Compound, end: Compound, max: number) {
  return shortestRoute(start, end, max)?.length ?? Infinity;
}
export function generate(seed:number,mode:Mode,family='all'):{question:Omit<ChallengeData,'id'>;reaction:Reaction;route:Reaction[]}{
  const rng=random(seed);const pick=<T,>(a:T[])=>a[Math.floor(rng()*a.length)];
  let route:Reaction[]=[];
  if(mode==='synthesis'){
    const steps=2+Math.floor(rng()*3);
    // Sample targets, then use an actual shortest route to set the required count.
    const starters=startingCompounds().filter(c=>c.n>=2&&(c.n<=5||c.cyclic)&&!['ester','amide','alkane'].includes(c.kind));
    for(let attempt=0;attempt<150&&!route.length;attempt++){
      const start=pick(starters);let current=start;const path:Reaction[]=[],visited=[start];
      for(let i=0;i<steps;i++){
        const options=reactions(current).filter(r=>familyOf(r.ruleId)!=='combustion'&&!(r.ruleId.startsWith('hydrolysis:')&&r.ruleId.endsWith('-other'))&&r.product.n>0&&!['water','carbon-dioxide','hydrogen-halide'].includes(r.product.kind)&&!visited.some(c=>same(c,r.product)));
        if(!options.length)break;const r=pick(options);path.push(r);visited.push(r.product);current=r.product;
      }
      if (path.length !== steps) continue;
      const minimum = shortestRoute(start, current, steps);
      if (!minimum || minimum.length < 2) continue;
      if (minimum.some(r => r.ruleId.startsWith('hydrolysis:') && r.ruleId.endsWith('-other'))) continue;
      route = minimum;
    }
    if (!route.length) {
      const n = 2 + Math.floor(rng() * 4);
      route = shortestRoute({ kind: 'haloalkane', n, halogen: 'Br' }, { kind: 'acid', n }, 4) ?? [];
      if (route.length < 2) throw new Error('No supported synthesis route found');
    }
  }else{
    const options=pool.filter(r=>family==='all'||(family==='cyclic'?r.start.cyclic:familyOf(r.ruleId)===family));
    if(!options.length)throw new Error('Unknown reaction family');route=[pick(options)];
  }
  const reaction=route[0],last=route.at(-1)!;
  return {reaction,route,question:{mode,family:mode==='synthesis'?'all':family,version:VERSION,
    title:mode==='synthesis'?'Find a route':mode==='conditions'?'Set the conditions':'Build the product',
    start:molecule(reaction.start),startName:name(reaction.start),extras:mode==='synthesis'?'':reaction.extras,
    ...(mode==='products'?{conditions:reaction.conditions[Math.floor(rng()*reaction.conditions.length)]}:{target:molecule(last.product),targetName:name(last.product)}),
    ...(mode==='synthesis'?{stepLimit:route.length}:{}),
    instruction:mode==='synthesis'?`Plan a route in exactly ${route.length} steps. Give each intermediate and its reagents and conditions.`:mode==='conditions'?'Select one complete set of reagents and conditions. Alternatives are accepted.':'',
    coReactants:reactionCoReactants(route),coProducts:mode==='synthesis'?[]:reactionCoProducts(reaction),...rewardFor(mode,route)}};
}
