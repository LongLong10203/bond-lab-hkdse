'use client';
import { Check } from 'lucide-react';
import type { Molecule } from '@/chemistry/types';
import { CONDITIONS } from '@/chemistry/rules';
import { CATALYSTS,HEATING,reagentOptions,toggleOption } from '@/chemistry/condition-options';
export default function ConditionPicker({value,onChange,start,disabled=false}:{value:string[];onChange:(s:string[])=>void;start?:Molecule;disabled?:boolean}){
  const choose=(options:typeof HEATING,id:string)=>{const all=options.flatMap(o=>o.values);onChange([...value.filter(v=>!all.includes(v)),...(options.find(o=>o.id===id)?.values??[])]);};
  const heating=value.includes('distil')?'distil':HEATING.find(o=>o.id&&value.includes(o.id))?.id??'';
  const catalyst=value.some(v=>['pt','ni','pd'].includes(v))?'pt':CATALYSTS.find(o=>o.id&&value.includes(o.id))?.id??'';
  return <div className="condition-picker">
    <div className="condition-options">{reagentOptions(start).map(option=><button type="button" key={option.id} disabled={disabled} aria-pressed={value.includes(option.id)} className={value.includes(option.id)?'picked':''} onClick={()=>onChange(toggleOption(value,option))}><span className="check-box">{value.includes(option.id)&&<Check size={11}/>}</span>{option.label}</button>)}</div>
    <div className="condition-selects"><label>Catalyst<select aria-label="Catalyst" disabled={disabled} value={catalyst} onChange={e=>{const cleaned=value.filter(v=>!['ni','pd'].includes(v));const all=CATALYSTS.flatMap(o=>o.values);onChange([...cleaned.filter(v=>!all.includes(v)),...(CATALYSTS.find(o=>o.id===e.target.value)?.values??[])]);}}>{CATALYSTS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
      <label>Heating<select aria-label="Heating" disabled={disabled} value={heating} onChange={e=>choose(HEATING,e.target.value)}>{HEATING.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label></div>
    <div className="condition-options treatment-options">{['uv',...(value.includes('lialh4')?[]:['workup'])].map(id=><button type="button" key={id} disabled={disabled} aria-pressed={value.includes(id)} className={value.includes(id)?'picked':''} onClick={()=>onChange(value.includes(id)?value.filter(v=>v!==id):[...value,id])}><span className="check-box">{value.includes(id)&&<Check size={11}/>}</span>{CONDITIONS[id]}</button>)}</div>
  </div>;
}
