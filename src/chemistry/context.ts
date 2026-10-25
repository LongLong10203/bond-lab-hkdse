import type { CoReactant, Reaction } from './types';
import { molecule,name } from './molecules';
import { isOrganicReagent } from './condition-options';
export function coReactant(id:string):CoReactant{
  const n=Number(id.split('-')[1]);
  return {id,label:name({kind:'alcohol',n}),molecule:molecule({kind:'alcohol',n})};
}
export function reactionCoReactants(route:Reaction[]){return [...new Set(route.flatMap(r=>r.conditions.flat().filter(isOrganicReagent)))].map(coReactant);}
export function reactionCoProducts(r:Reaction):CoReactant[]{
  return (r.coProducts??[]).map((c,i)=>({id:`product-${i}`,label:name(c),molecule:molecule(c)}));
}
