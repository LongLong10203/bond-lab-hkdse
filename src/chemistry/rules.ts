import type { Compound, Reaction } from './types';
// Bump whenever rules, enumeration, seeded selection or grading semantics change.
export const VERSION='2026.6';
// Seeded questions changed: old drafts must not be regraded under new rules.
export const COMPATIBLE_VERSIONS=[VERSION];
export const CONDITIONS:Record<string,string>={
  h2:'H₂',pt:'Pt catalyst',ni:'Ni catalyst',pd:'Pd catalyst',cl2:'Cl₂',br2:'Br₂',i2:'I₂',uv:'UV light',
  hcl:'HCl',hbr:'HBr',hi:'HI','aq-oh':'NaOH(aq)','pcl3':'PCl₃','pbr3':'PBr₃',
  heat:'Heat','conc-acid':'Concentrated H₂SO₄',alumina:'Al₂O₃',dichromate:'K₂Cr₂O₇(aq) / H⁺(aq)',
  distil:'Distil product as it forms',reflux:'Heat under reflux',excess:'Excess oxidising agent',
  nabh4:'NaBH₄(aq)',lialh4:'LiAlH₄ in dry ether',workup:'Then H⁺(aq)',
  'dilute-acid':'Dilute H⁺(aq)',ammonia:'NH₃',organic:'Organic solvent',
  'cracking-catalyst':'Silica / alumina catalyst','strong-heat':'Strong heating',
  'alcohol-1':'Methanol','alcohol-2':'Ethanol','alcohol-3':'Propan-1-ol',
  'ethanolic-oh':'KOH in ethanol',water:'H₂O', oxygen:'Excess O₂',ignite:'Ignition',
};
export const FAMILIES=[
  {id:'all',label:'All reactions'}, {id:'addition',label:'Addition'}, {id:'substitution',label:'Substitution'},
  {id:'oxidation',label:'Oxidation'}, {id:'reduction',label:'Reduction'}, {id:'elimination',label:'Elimination'},
  {id:'esterification',label:'Esterification'}, {id:'hydrolysis',label:'Hydrolysis'}, {id:'amide',label:'Amide formation'},
  {id:'cracking',label:'Cracking'},{id:'acid-base',label:'Acid–base'}, {id:'cyclic',label:'Cyclic compounds'}, {id:'combustion',label:'Combustion'},
];
export const familyOf=(id:string)=>id.split(':')[0];
export function reactions(start:Compound):Reaction[]{
  const out:Reaction[]=[];
  const add=(ruleId:string,product:Compound,conditions:string[][],explanation:string,hint:string,extras='',coProducts:Compound[]=[])=>out.push({ruleId,start,product,conditions,explanation,hint,extras,coProducts});
  const base={n:start.n,...(start.cyclic?{cyclic:true}:{})},pos=start.position??0;
  if(start.kind==='alkane'){
    if(!start.cyclic&&start.n>=4)for(let alkene=2;alkene<start.n;alkene++)add('cracking:alkane',{kind:'alkane',n:start.n-alkene},[['strong-heat','cracking-catalyst']],'Cracking produces smaller hydrocarbons. Use the supplied other product and conserve the starting atoms.','Split the chain into an alkane and an alkene; preserve the total number of carbons.','',[{kind:'alkene',n:alkene}]);
    if(start.n===1)for(const h of ['Cl','Br'] as const)add('substitution:alkane-'+h,{...base,kind:'haloalkane',halogen:h},[[h==='Cl'?'cl2':'br2','uv']],`A hydrogen is replaced by ${h}. This question asks for the monosubstitution product only. Further substitution is possible in practice.`,'Replace one C–H bond with a carbon–halogen bond.','Monosubstitution only. The hydrogen halide by-product is supplied.',[{kind:'hydrogen-halide',n:0,halogen:h}]);
    add('combustion:complete',{kind:'carbon-dioxide',n:1},[['oxygen','ignite']],'Complete combustion forms carbon dioxide and water. The drawing shows the two distinct product species, not their stoichiometric coefficients.','Draw one molecule of each distinct product.','Coefficients are not assessed.',[{kind:'water',n:0}]);
  }
  if(start.kind==='alkene'){
    add('addition:hydrogen',{...base,kind:'alkane'},[['h2','pt'],['h2','ni'],['h2','pd']],'Hydrogen adds across the C=C bond. Each carbon gains one hydrogen and the double bond becomes a single bond.','What happens to the carbon–carbon double bond?');
    for(const h of ['Cl','Br','I'] as const)add('addition:halogen-'+h,{...base,kind:'dihalo',halogen:h},[[h.toLowerCase()+'2','organic']],`The halogen adds across the C=C bond, placing one ${h} on each carbon. Stereochemistry is not assessed in this question.`,'Add one halogen atom to each carbon of the double bond.');
    for(const h of ['Cl','Br','I'] as const)add('addition:hydrogen-halide-'+h,{...base,kind:'haloalkane',halogen:h,position:start.cyclic||start.n===2?0:1},[['h'+h.toLowerCase()]],'Apply Markovnikov’s rule: hydrogen attaches to the double-bond carbon already carrying more hydrogens. Draw the major constitutional product; stereochemistry is not assessed.','Which double-bond carbon already has more hydrogen atoms?');
  }
  if(start.kind==='alkene')add('addition:hydration',{...base,kind:'alcohol',position:start.cyclic||start.n===2?0:1},[['water','dilute-acid','heat']],'Acid-catalysed hydration adds H and OH across the double bond, giving the Markovnikov alcohol.','Replace C=C with C–C and add OH.');
  if(start.kind==='haloalkane'&&(start.cyclic||pos===0)&&start.n>=2)add('elimination:haloalkane',{...base,kind:'alkene'},[['ethanolic-oh','heat'],['ethanolic-oh','reflux']],'Hot ethanolic hydroxide eliminates a hydrogen halide to form an alkene.','Remove the halogen and an adjacent hydrogen.','Spectator salts are omitted.');
  if(start.kind==='haloalkane')add('substitution:hydrolysis',{...base,kind:'alcohol',position:pos},[['aq-oh','heat'],['aq-oh','reflux']],'Aqueous hydroxide replaces the halogen with an OH group.','Keep the carbon skeleton and replace the halogen.');
  if(start.kind==='alcohol'){
    for(const h of ['Cl','Br','I'] as const)add('substitution:alcohol-'+h,{...base,kind:'haloalkane',halogen:h,position:pos},[['h'+h.toLowerCase()],...(h==='I'?[]:[['p'+h.toLowerCase()+'3']])],'The hydroxyl group is replaced by a halogen. These are the syllabus-level reagent descriptions.','Replace the OH group without changing the carbon skeleton.');
    if((start.cyclic||pos===0)&&start.n>=2)add('elimination:dehydration',{...base,kind:'alkene'},[['conc-acid','heat'],['alumina','heat']],'Dehydration removes water and forms a carbon–carbon double bond. Only unambiguous terminal-alcohol and unsubstituted-ring examples are generated here.','Remove OH and a hydrogen from the adjacent carbon.','',[{kind:'water',n:0}]);
    if(pos===0&&!start.cyclic){
      add('oxidation:primary-aldehyde',{...base,kind:'aldehyde'},[['dichromate','heat','distil']],'Distilling the aldehyde as it forms limits further oxidation.','Turn the terminal C–OH group into C=O.');
      add('oxidation:primary-acid',{...base,kind:'acid'},[['dichromate','reflux']],'Acidified dichromate under reflux oxidises the primary alcohol to a carboxylic acid.','The terminal carbon needs both C=O and OH.');
    }else add('oxidation:secondary',{...base,kind:'ketone'},[['dichromate','heat'],['dichromate','reflux']],'A secondary alcohol is oxidised to a ketone. The carbon skeleton stays unchanged.','Replace C–OH with C=O at the same carbon.');
  }
  if(start.kind==='aldehyde'||start.kind==='ketone'){
    add('reduction:carbonyl',{...base,kind:'alcohol',position:start.kind==='ketone'&&!start.cyclic?1:0},[['nabh4'],['lialh4','workup']],'Reduction converts C=O into an alcohol. LiAlH₄ requires dry conditions followed by an aqueous work-up; aqueous NaBH₄ is an alternative.','Convert the carbonyl group to an OH group.');
    if(start.kind==='aldehyde')add('oxidation:aldehyde',{...base,kind:'acid'},[['dichromate','heat'],['dichromate','reflux']],'The aldehyde is oxidised to a carboxylic acid.','Add an OH group to the carbonyl carbon.');
  }
  if(start.kind==='carboxylate')add('acid-base:acidify',{...base,kind:'acid'},[['dilute-acid'],['hcl']],'Acidification protonates the carboxylate ion to form the free acid.','Replace O⁻ with OH.');
  if(start.kind==='acid'){
    add('acid-base:neutralise',{...base,kind:'carboxylate'},[['aq-oh']],'Hydroxide deprotonates the carboxylic acid directly, forming a carboxylate ion and water. No ester intermediate is needed.','Replace the acid OH with O⁻.','Omit the spectator counter-ion.',[{kind:'water',n:0}]);
    add('reduction:acid',{...base,kind:'alcohol',position:0},[['lialh4','workup']],'LiAlH₄ reduces the carboxylic acid to a primary alcohol after work-up. NaBH₄ is not accepted for this transformation.','The carboxyl carbon becomes a CH₂OH group.');
    for(let m=1;m<=3;m++)if(start.n+m<=8)add('esterification:acid-'+m,{...base,kind:'ester',m},[['alcohol-'+m,'conc-acid','heat'],['alcohol-'+m,'conc-acid','reflux']],'Esterification joins the acid and alcohol, with water as a by-product. The alcohol supplies the alkyl group attached to the ester oxygen.','Keep the acid carbonyl and attach the alcohol’s alkyl group through oxygen.','',[{kind:'water',n:0}]);
    add('amide:formation',{...base,kind:'amide'},[['ammonia','heat']],'Reaction with ammonia followed by heating forms an unsubstituted amide via an ammonium carboxylate intermediate.','Replace the acid OH with NH₂.','',[{kind:'water',n:0}]);
  }
  if(start.kind==='ester'||start.kind==='amide'){
    const partner=(acid:boolean):Compound=>({kind:start.kind==='ester'?'alcohol':acid?'ammonium':'amine',n:start.m??0});
    add('hydrolysis:'+start.kind+'-acid',{...base,kind:'acid'},[['dilute-acid','reflux'],['dilute-acid','heat']],'Acid hydrolysis forms a carboxylic acid and an alcohol or protonated nitrogen product.','Split the acyl–oxygen or acyl–nitrogen bond.','Counter-ions are omitted.',[partner(true)]);
    add('hydrolysis:'+start.kind+'-base',{...base,kind:'carboxylate'},[['aq-oh','reflux'],['aq-oh','heat']],'Alkaline hydrolysis forms a carboxylate ion and an alcohol, amine or ammonia.','Use O⁻ on the carboxylate; the nitrogen product is uncharged.','Counter-ions are omitted.',[partner(false)]);
    add('hydrolysis:'+start.kind+'-workup',{...base,kind:'acid'},[['aq-oh','reflux','workup'],['aq-oh','heat','workup']],'Excess acid work-up protonates both the carboxylate and any amine or ammonia.','Check the final protonation states after acidification.','The final work-up uses excess acid; counter-ions are omitted.',[partner(true)]);
  }
  if(start.kind==='amine')add('acid-base:amine',{...base,kind:'ammonium'},[['dilute-acid'],['hcl']],'The nitrogen accepts a proton to form an ammonium ion.','Add a positive charge to nitrogen.');
  if(start.kind==='ammonium')add('acid-base:ammonium',{...base,kind:'amine'},[['aq-oh']],'Hydroxide removes a proton from the ammonium ion.','Remove the positive charge from nitrogen.','Counter-ions are omitted.',[{kind:'water',n:0}]);
  // Each organic hydrolysis product can be the assessed product. The other is supplied.
  // Cracking and combustion likewise ask for one clearly identified product.
  for(const r of [...out])if(r.ruleId.startsWith('hydrolysis:')||r.ruleId==='cracking:alkane'||r.ruleId==='combustion:complete'){
    const partner=r.coProducts?.[0];if(partner)out.push({...r,ruleId:r.ruleId+'-other',product:partner,coProducts:[r.product]});
  }
  return out;
}
export function startingCompounds():Compound[]{
  const a:Compound[]=[];
  for(let n=1;n<=8;n++){
    for(const kind of ['alkane','alcohol','aldehyde','acid','amide'] as const)a.push({kind,n});
    for(const h of ['Cl','Br','I'] as const)a.push({kind:'haloalkane',n,halogen:h});
    if(n>=2)a.push({kind:'alkene',n});
    if(n>=3){a.push({kind:'alcohol',n,position:1},{kind:'ketone',n});for(const h of ['Cl','Br','I'] as const)a.push({kind:'haloalkane',n,position:1,halogen:h});}
    for(let m=1;m<=3;m++)if(n+m<=8)a.push({kind:'ester',n,m},{kind:'amide',n,m});
  }
  for(const n of [5,6])for(const kind of ['alkane','alkene','alcohol','ketone','haloalkane'] as const)a.push({kind,n,cyclic:true,...(kind==='haloalkane'?{halogen:'Br' as const}:{})});
  for(let n=1;n<=8;n++)a.push({kind:'carboxylate',n},{kind:'amine',n},{kind:'ammonium',n});
  return a;
}
