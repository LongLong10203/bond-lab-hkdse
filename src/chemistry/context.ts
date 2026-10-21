import type { CoReactant, Reaction } from './types';
import { molecule } from './molecules';
import { isOrganicReagent } from './condition-options';
export function coReactant(id:string):CoReactant{
  const n=Number(id.split('-')[1]);
  if(id.startsWith('alcohol-'))return {id,label:['','CH₃OH','CH₃CH₂OH','CH₃CH₂CH₂OH'][n],molecule:molecule({kind:'alcohol',n})};
  if(id==='diol-2')return {id,label:'HOCH₂CH₂OH',molecule:molecule({kind:'diol',n:2})};
  return {id,label:'H₂NCH₂CH₂NH₂',molecule:{atoms:[{id:'n1',element:'N',x:30,y:100},{id:'c1',element:'C',x:100,y:100},{id:'c2',element:'C',x:170,y:125},{id:'n2',element:'N',x:240,y:125}],bonds:[{a:'n1',b:'c1',order:1},{a:'c1',b:'c2',order:1},{a:'c2',b:'n2',order:1}],autoH:true}};
}
export function reactionCoReactants(route:Reaction[]){return [...new Set(route.flatMap(r=>r.conditions.flat().filter(isOrganicReagent)))].map(coReactant);}
export function reactionCoProducts(r:Reaction){
  return r.start.kind==='ester'&&r.ruleId.startsWith('hydrolysis:')?[coReactant('alcohol-'+r.start.m)]:[];
}
