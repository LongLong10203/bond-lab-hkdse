import type { Compound, Reaction } from './types';
// Bump whenever rules, enumeration, seeded selection or grading semantics change.
export const VERSION='2026.4';
// 2026.3 uses identical seeds/routes. Keep its drafts; only co-reactant selection changes.
export const COMPATIBLE_VERSIONS=[VERSION,'2026.3'];
export const CONDITIONS:Record<string,string>={
  h2:'H₂',pt:'Pt catalyst',ni:'Ni catalyst',pd:'Pd catalyst',cl2:'Cl₂',br2:'Br₂',i2:'I₂',uv:'UV light',
  hcl:'HCl',hbr:'HBr',hi:'HI','aq-oh':'NaOH(aq)','pcl3':'PCl₃','pbr3':'PBr₃',
  heat:'Heat','conc-acid':'Concentrated H₂SO₄',alumina:'Al₂O₃',dichromate:'K₂Cr₂O₇(aq) / H⁺(aq)',
  distil:'Distil product as it forms',reflux:'Heat under reflux',excess:'Excess oxidising agent',
  nabh4:'NaBH₄(aq)',lialh4:'LiAlH₄ in dry ether',workup:'Then H⁺(aq)',
  'dilute-acid':'Dilute H⁺(aq)',ammonia:'NH₃',organic:'Organic solvent',
  'diol-2':'Ethane-1,2-diol','diamine-2':'Ethane-1,2-diamine','cracking-catalyst':'Silica / alumina catalyst','strong-heat':'Strong heating',
  'alcohol-1':'Methanol','alcohol-2':'Ethanol','alcohol-3':'Propan-1-ol',
  polymerise:'Suitable initiator, heat / pressure', oxygen:'Excess O₂',ignite:'Ignition',
};
export const FAMILIES=[
  {id:'all',label:'All reactions'}, {id:'addition',label:'Addition'}, {id:'substitution',label:'Substitution'},
  {id:'oxidation',label:'Oxidation'}, {id:'reduction',label:'Reduction'}, {id:'elimination',label:'Elimination'},
  {id:'esterification',label:'Esterification'}, {id:'hydrolysis',label:'Hydrolysis'}, {id:'amide',label:'Amide formation'},
  {id:'cracking',label:'Cracking'},{id:'polymerisation',label:'Polymerisation'}, {id:'combustion',label:'Combustion'},
];
export const familyOf=(id:string)=>id.split(':')[0];
export function reactions(start:Compound):Reaction[]{
  const out:Reaction[]=[];
  const add=(ruleId:string,product:Compound,conditions:string[][],explanation:string,hint:string,extras='')=>out.push({ruleId,start,product,conditions,explanation,hint,extras});
  const base={n:start.n},pos=start.position??0;
  if(start.kind==='alkane'){
    if(start.n>=4)for(let alkene=2;alkene<start.n;alkene++)add('cracking:alkane',{kind:'cracking',n:start.n-alkene,m:alkene},[['strong-heat','cracking-catalyst']],'Cracking can produce a mixture. Here, any one alkane plus one terminal alkene conserving all starting atoms is accepted. These are possible products, not a uniquely predicted mixture.','Split the chain into an alkane and an alkene; preserve the total number of carbons.','Draw one alkane and one terminal alkene. Any atom-balanced pair is accepted.');
    if(start.n===1)for(const h of ['Cl','Br'] as const)add('substitution:alkane-'+h,{...base,kind:'haloalkane',halogen:h},[[h==='Cl'?'cl2':'br2','uv']],`A hydrogen is replaced by ${h}. This question asks for the monosubstitution product only. Further substitution is possible in practice.`,'Replace one C–H bond with a carbon–halogen bond.','Monosubstitution only; omit the hydrogen halide by-product.');
    add('combustion:complete',{...base,kind:'combustion'},[['oxygen','ignite']],'Complete combustion forms carbon dioxide and water. The drawing shows the two distinct product species, not their stoichiometric coefficients.','Draw one molecule of each distinct product.','Draw one CO₂ and one H₂O; coefficients are not assessed.');
  }
  if(start.kind==='alkene'){
    add('addition:hydrogen',{...base,kind:'alkane'},[['h2','pt'],['h2','ni'],['h2','pd']],'Hydrogen adds across the C=C bond. Each carbon gains one hydrogen and the double bond becomes a single bond.','What happens to the carbon–carbon double bond?');
    for(const h of ['Cl','Br','I'] as const)add('addition:halogen-'+h,{...base,kind:'dihalo',halogen:h},[[h.toLowerCase()+'2','organic']],`The halogen adds across the C=C bond, placing one ${h} on each carbon. Stereochemistry is not assessed in this question.`,'Add one halogen atom to each carbon of the double bond.');
    for(const h of ['Cl','Br','I'] as const)add('addition:hydrogen-halide-'+h,{...base,kind:'haloalkane',halogen:h,position:start.n===2?0:1},[['h'+h.toLowerCase()]],'Apply Markovnikov’s rule: hydrogen attaches to the double-bond carbon already carrying more hydrogens. Draw the major constitutional product; stereochemistry is not assessed.','Which double-bond carbon already has more hydrogen atoms?');
    if(start.n<=3)add('polymerisation:addition',{...base,kind:'addition-polymer'},[['polymerise']],'The double bond opens to connect monomers. Draw one repeat unit with a continuation point (*) at each end. The initiation conditions shown are schematic, not a universal laboratory recipe.','Replace C=C with C–C and add a continuation point at each end.','Draw one repeat unit. Use * for both chain continuation points.');
  }
  if(start.kind==='haloalkane')add('substitution:hydrolysis',{...base,kind:'alcohol',position:pos},[['aq-oh','heat'],['aq-oh','reflux']],'Aqueous hydroxide replaces the halogen with an OH group.','Keep the carbon skeleton and replace the halogen.');
  if(start.kind==='alcohol'){
    for(const h of ['Cl','Br','I'] as const)add('substitution:alcohol-'+h,{...base,kind:'haloalkane',halogen:h,position:pos},[['h'+h.toLowerCase()],...(h==='I'?[]:[['p'+h.toLowerCase()+'3']])],'The hydroxyl group is replaced by a halogen. These are the syllabus-level reagent descriptions.','Replace the OH group without changing the carbon skeleton.');
    if(pos===0&&start.n>=2)add('elimination:dehydration',{...base,kind:'alkene'},[['conc-acid','heat'],['alumina','heat']],'Dehydration removes water and forms a carbon–carbon double bond. Only unambiguous terminal-alcohol examples are generated here.','Remove OH and a hydrogen from the adjacent carbon.','Draw the organic product only; omit water.');
    if(pos===0){
      add('oxidation:primary-aldehyde',{...base,kind:'aldehyde'},[['dichromate','heat','distil']],'Distilling the aldehyde as it forms limits further oxidation.','Turn the terminal C–OH group into C=O.');
      add('oxidation:primary-acid',{...base,kind:'acid'},[['dichromate','reflux']],'Acidified dichromate under reflux oxidises the primary alcohol to a carboxylic acid.','The terminal carbon needs both C=O and OH.');
    }else add('oxidation:secondary',{...base,kind:'ketone'},[['dichromate','heat'],['dichromate','reflux']],'A secondary alcohol is oxidised to a ketone. The carbon skeleton stays unchanged.','Replace C–OH with C=O at the same carbon.');
  }
  if(start.kind==='aldehyde'||start.kind==='ketone'){
    add('reduction:carbonyl',{...base,kind:'alcohol',position:start.kind==='ketone'?1:0},[['nabh4'],['lialh4','workup']],'Reduction converts C=O into an alcohol. LiAlH₄ requires dry conditions followed by an aqueous work-up; aqueous NaBH₄ is an alternative.','Convert the carbonyl group to an OH group.');
    if(start.kind==='aldehyde')add('oxidation:aldehyde',{...base,kind:'acid'},[['dichromate','heat'],['dichromate','reflux']],'The aldehyde is oxidised to a carboxylic acid.','Add an OH group to the carbonyl carbon.');
  }
  if(start.kind==='acid'){
    add('reduction:acid',{...base,kind:'alcohol',position:0},[['lialh4','workup']],'LiAlH₄ reduces the carboxylic acid to a primary alcohol after work-up. NaBH₄ is not accepted for this transformation.','The carboxyl carbon becomes a CH₂OH group.');
    for(let m=1;m<=3;m++)if(start.n+m<=8)add('esterification:acid-'+m,{...base,kind:'ester',m},[['alcohol-'+m,'conc-acid','heat'],['alcohol-'+m,'conc-acid','reflux']],'Esterification joins the acid and alcohol, with water as a by-product. The alcohol supplies the alkyl group attached to the ester oxygen.','Keep the acid carbonyl and attach the alcohol’s alkyl group through oxygen.','Draw the ester only; omit water.');
    add('amide:formation',{...base,kind:'amide'},[['ammonia','heat']],'Reaction with ammonia followed by heating forms an unsubstituted amide via an ammonium carboxylate intermediate.','Replace the acid OH with NH₂.','Heat the ammonium salt formed with ammonia; draw the amide only.');
  }
  if(start.kind==='diacid'){
    add('polymerisation:polyester',{kind:'polyester',n:start.n,m:2},[['diol-2','heat'],['diol-2','conc-acid','heat']],'A dicarboxylic acid and a diol form ester linkages. Draw one complete repeat unit with two chain continuation points; water is omitted.','Alternate the diol segment and the dicarboxylic acid segment, joined through ester bonds.','Additional monomer: ethane-1,2-diol. Draw one repeat unit using * at both ends; omit water.');
    add('polymerisation:polyamide',{kind:'polyamide',n:start.n,m:2},[['diamine-2','heat']],'A dicarboxylic acid and a diamine form amide linkages on heating. Draw one complete repeat unit with two chain continuation points; water is omitted.','Each amide linkage has a carbonyl carbon connected to nitrogen.','Additional monomer: ethane-1,2-diamine. Draw one repeat unit using * at both ends; omit water.');
  }
  if(start.kind==='ester'||start.kind==='amide'){
    const coproduct=start.kind==='ester'?'the alcohol':start.m?'the amine / alkylammonium species':'ammonia / ammonium';
    add('hydrolysis:'+start.kind+'-acid',{...base,kind:'acid'},[['dilute-acid','reflux'],['dilute-acid','heat']],'Acidic hydrolysis produces a carboxylic acid. The other product is omitted as instructed.','Identify the carbonyl-containing side of the original molecule.',`Draw the carboxylic acid product only; omit ${coproduct}.`);
    add('hydrolysis:'+start.kind+'-base',{...base,kind:'carboxylate'},[['aq-oh','reflux'],['aq-oh','heat']],'Alkaline hydrolysis produces a carboxylate ion, not the free acid. Draw O⁻ and omit the counter-ion.','The carboxyl group is deprotonated in alkaline solution.',`Draw the carboxylate ion only; omit the counter-ion and ${coproduct}.`);
    add('hydrolysis:'+start.kind+'-workup',{...base,kind:'acid'},[['aq-oh','reflux','workup'],['aq-oh','heat','workup']],'Acidification after alkaline hydrolysis converts the carboxylate to the free carboxylic acid.','The final acid work-up changes the charge on the carboxyl group.',`Draw the carboxylic acid after work-up; omit ${coproduct}.`);
  }
  return out;
}
export function startingCompounds():Compound[]{
  const a:Compound[]=[];
  for(let n=1;n<=8;n++){
    for(const kind of ['alkane','alcohol','aldehyde','acid','amide'] as const)a.push({kind,n});
    for(const h of ['Cl','Br','I'] as const)a.push({kind:'haloalkane',n,halogen:h});
    if(n>=2)a.push({kind:'alkene',n});
    if(n>=3&&n<=6)a.push({kind:'diacid',n});
    if(n>=3){a.push({kind:'alcohol',n,position:1},{kind:'ketone',n});for(const h of ['Cl','Br','I'] as const)a.push({kind:'haloalkane',n,position:1,halogen:h});}
    for(let m=1;m<=3;m++)if(n+m<=8)a.push({kind:'ester',n,m},{kind:'amide',n,m});
  }return a;
}
