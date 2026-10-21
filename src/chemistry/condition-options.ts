import type { Molecule } from './types';
import { CONDITIONS } from './rules';

export const ORGANIC_REAGENTS = ['alcohol-1','alcohol-2','alcohol-3','diol-2','diamine-2'];
export const isOrganicReagent=(id:string)=>ORGANIC_REAGENTS.includes(id);
export function isAlcohol(m?:Molecule){
  if(!m)return false;
  return m.atoms.some(o=>o.element==='O'&&!o.charge&&m.bonds.filter(b=>(b.a===o.id||b.b===o.id)&&m.atoms.find(a=>a.id===(b.a===o.id?b.b:b.a))?.element!=='H').length===1&&m.bonds.some(b=>{
    if(b.order!==1)return false;
    const c=b.a===o.id?b.b:b.b===o.id?b.a:null;
    return c!==null&&m.atoms.some(a=>a.id===c&&a.element==='C')&&!m.bonds.some(e=>e.order===2&&(e.a===c||e.b===c)&&m.atoms.some(a=>a.id===(e.a===c?e.b:e.a)&&a.element==='O'));
  }));
}
export type ConditionOption={id:string;label:string;values:string[]};
export function reagentOptions(start?:Molecule):ConditionOption[]{
  const alcohol=isAlcohol(start);
  return ['h2','cl2','br2','i2','hcl','hbr','hi','aq-oh','dichromate','nabh4','lialh4','conc-acid','dilute-acid','ammonia','oxygen'].map(id=>({id,
    label:id==='hcl'&&alcohol?'HCl / PCl₃':id==='hbr'&&alcohol?'HBr / PBr₃':id==='lialh4'?'1. LiAlH₄, dry ether → 2. H⁺(aq)':['cl2','br2','i2'].includes(id)&&!isMethane(start)?`${CONDITIONS[id]} (organic solvent)`:CONDITIONS[id],
    values:id==='lialh4'?['lialh4','workup']:['cl2','br2','i2'].includes(id)&&!isMethane(start)?[id,'organic']:[id]}));
}
function isMethane(m?:Molecule){return !!m&&m.atoms.filter(a=>a.element!=='H').length===1&&m.atoms.some(a=>a.element==='C');}
export const HEATING=[{id:'',label:'None',values:[]},{id:'heat',label:'Heat',values:['heat']},{id:'reflux',label:'Heat under reflux',values:['reflux']},{id:'distil',label:'Heat and distil',values:['heat','distil']},{id:'strong-heat',label:'Strong heat',values:['strong-heat']},{id:'ignite',label:'Ignition',values:['ignite']}];
export const CATALYSTS=[{id:'',label:'None',values:[]},{id:'pt',label:'Pt / Ni / Pd',values:['pt']},{id:'alumina',label:'Al₂O₃',values:['alumina']},{id:'cracking-catalyst',label:'Silica / alumina',values:['cracking-catalyst']}];
export function toggleOption(value:string[],option:ConditionOption){
  const next=value.includes(option.id)?value.filter(id=>!option.values.includes(id)):[...new Set([...value,...option.values])];
  // A shared solvent remains selected while any halogen solution is selected.
  if(option.values.includes('organic')&&['cl2','br2','i2'].some(id=>next.includes(id))&&!next.includes('organic'))next.push('organic');
  return next;
}
export function displayConditions(value:string[],start?:Molecule){
  const alcohol=isAlcohol(start),seen=new Set<string>();
  return value.filter(id=>!isOrganicReagent(id)&&id!=='excess').map(id=>{
    if(['pt','ni','pd'].includes(id))return 'Pt / Ni / Pd';
    if(alcohol&&['hcl','pcl3'].includes(id))return 'HCl / PCl₃';
    if(alcohol&&['hbr','pbr3'].includes(id))return 'HBr / PBr₃';
    return CONDITIONS[id]??id;
  }).filter(label=>{if(seen.has(label))return false;seen.add(label);return true;});
}
