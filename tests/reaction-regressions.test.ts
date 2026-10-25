import test from 'node:test';
import assert from 'node:assert/strict';
import { generate,shortestRouteLength } from '../src/chemistry/generate';
import { reactions,startingCompounds,FAMILIES } from '../src/chemistry/rules';
import { molecule,formula,name } from '../src/chemistry/molecules';
import { equivalent,validate,conditionsMatch } from '../src/chemistry/check';
import { grade } from '../src/chemistry/grading';
import { reactionCoProducts } from '../src/chemistry/context';
import { moleculeSchema } from '../src/lib/validation';
import type { Compound,Molecule } from '../src/chemistry/types';
const combine=(items:Molecule[]):Molecule=>({atoms:items.flatMap((m,i)=>m.atoms.map(a=>({...a,id:`${i}-${a.id}`}))),bonds:items.flatMap((m,i)=>m.bonds.map(b=>({...b,a:`${i}-${b.a}`,b:`${i}-${b.b}`}))),autoH:true});

test('all primary haloalkanes reach carboxylate directly in three steps without an ester detour',()=>{
  for(let n=1;n<=8;n++)for(const halogen of ['Cl','Br','I'] as const){
    const start:Compound={kind:'haloalkane',n,halogen};
    const alcohol=reactions(start).find(r=>r.ruleId==='substitution:hydrolysis')!;
    const acid=reactions(alcohol.product).find(r=>r.ruleId==='oxidation:primary-acid')!;
    const salt=reactions(acid.product).find(r=>r.ruleId==='acid-base:neutralise')!;
    assert.deepEqual(salt.product,{kind:'carboxylate',n});
    assert(conditionsMatch(['aq-oh'],salt.conditions));
    assert.equal(shortestRouteLength(start,salt.product,4),3);
    assert.equal(shortestRouteLength(acid.product,salt.product,4),1);
    assert.equal(shortestRouteLength(salt.product,acid.product,4),1);
  }
});
test('generated synthesis routes have no shorter route in an independently traversed reaction graph',()=>{
  for(let seed=0;seed<100;seed++){
    const g=generate(seed,'synthesis'),target=molecule(g.route.at(-1)!.product);
    assert(g.question.coReactants.every(c=>!equivalent(c.molecule,target)),'The target must not already be a supplied co-reactant');
    assert(!g.route.some(r=>r.ruleId.startsWith('hydrolysis:')&&r.ruleId.endsWith('-other')),'Do not turn an added alcohol into a synthesis target');
    let frontier:Compound[]=[g.reaction.start];const seen=new Set<string>();
    for(let depth=1;depth<g.route.length;depth++){
      const next:Compound[]=[];
      for(const c of frontier)for(const r of reactions(c)){
        assert(!equivalent(molecule(r.product),target),`seed ${seed} has a shortcut at ${depth}`);
        const key=name(r.product);if(!seen.has(key)){seen.add(key);next.push(r.product);}
      }
      frontier=next;
    }
    assert(grade(seed,'synthesis','all',{steps:g.route.map(r=>({molecule:molecule(r.product),conditions:r.conditions[0]}))}).correct);
  }
});
test('N-propylbutanamide hydrolysis supplies the correct nitrogen product and can assess either side',()=>{
  const variants=reactions({kind:'amide',n:4,m:3});
  for(const medium of ['acid','base','workup']){
    const r=variants.find(r=>r.ruleId===`hydrolysis:amide-${medium}`)!;
    assert.equal(r.product.kind,medium==='base'?'carboxylate':'acid');
    assert.equal(r.coProducts![0].kind,medium==='base'?'amine':'ammonium');assert.equal(r.coProducts![0].n,3);
    const other=variants.find(x=>x.ruleId===r.ruleId+'-other')!;
    assert.deepEqual(other.product,r.coProducts![0]);assert.deepEqual(other.coProducts,[r.product]);
    const nitrogen=molecule(r.coProducts![0]).atoms.find(a=>a.element==='N')!;
    assert.equal(nitrogen.charge??0,medium==='base'?0:1);
    assert.equal(reactionCoProducts(r)[0].label,medium==='base'?'propylamine':'propylammonium ion');
  }
});
test('ester hydrolysis assesses either alcohol or acyl product; all supplied products are valid',()=>{
  for(const c of startingCompounds())for(const r of reactions(c)){
    for(const partner of r.coProducts??[])assert.equal(validate(molecule(partner)),null,r.ruleId);
    if(c.kind==='ester'&&r.ruleId.endsWith('-other'))assert.equal(r.product.kind,'alcohol');
  }
});
test('product questions supply the other product without naming the answer and reject it as an answer',()=>{
  const asked=new Set<string>();
  for(let seed=0;seed<100;seed++){
    const g=generate(seed,'products','hydrolysis');asked.add(g.reaction.product.kind);
    assert.equal(g.question.instruction,'');assert.equal(g.question.coProducts.length,1);
    assert(grade(seed,'products','hydrolysis',{molecule:molecule(g.reaction.product)}).correct);
    assert(!grade(seed,'products','hydrolysis',{molecule:g.question.coProducts[0].molecule}).correct);
  }
  for(const kind of ['acid','carboxylate','alcohol','amine','ammonium'])assert(asked.has(kind),kind);
});
test('conditions must match the displayed co-product as well as the assessed alcohol',()=>{
  for(let seed=0;seed<200;seed++){
    const g=generate(seed,'conditions','hydrolysis');
    if(g.reaction.product.kind==='alcohol'&&g.reaction.coProducts![0].kind==='carboxylate'){
      assert(grade(seed,'conditions','hydrolysis',{conditions:['aq-oh','heat']}).correct);
      assert(!grade(seed,'conditions','hydrolysis',{conditions:['dilute-acid','heat']}).correct);return;
    }
  }
  assert.fail('No alkaline alcohol question');
});
test('cracking conserves all atoms across requested and supplied products',()=>{
  for(let n=4;n<=8;n++)for(const r of reactions({kind:'alkane',n}).filter(r=>r.ruleId.startsWith('cracking:'))){
    const products=combine([molecule(r.product),...r.coProducts!.map(molecule)]);
    assert.equal(formula(products),formula(molecule(r.start)));
  }
});
test('cyclic compounds have correct formulas and are distinct from open-chain isomers',()=>{
  for(const n of [5,6]){
    assert.equal(formula(molecule({kind:'alkane',n,cyclic:true})),`C${n}H${2*n}`);
    assert.equal(formula(molecule({kind:'alkene',n,cyclic:true})),`C${n}H${2*n-2}`);
    assert.equal(formula(molecule({kind:'alcohol',n,cyclic:true})),`C${n}H${2*n}O`);
    assert.equal(formula(molecule({kind:'ketone',n,cyclic:true})),`C${n}H${2*n-2}O`);
    assert(!equivalent(molecule({kind:'alkane',n,cyclic:true}),molecule({kind:'alkene',n})));
    const r=reactions({kind:'alcohol',n,cyclic:true});assert(!r.some(x=>x.product.kind==='acid'||x.product.kind==='aldehyde'));
    assert(r.some(x=>x.product.kind==='ketone'&&x.product.cyclic));
    const ring=molecule({kind:'alkane',n,cyclic:true}),rotated=structuredClone(ring);rotated.atoms.reverse();for(const a of rotated.atoms){a.x=-a.x;a.y=-a.y;}assert(equivalent(ring,rotated));
  }
});
test('polymer questions and continuation pseudo-atoms are removed',()=>{
  assert(!FAMILIES.some(f=>f.id==='polymerisation'));
  assert(startingCompounds().flatMap(reactions).every(r=>!r.ruleId.startsWith('polymerisation:')));
  assert(!moleculeSchema.safeParse({atoms:[{id:'end',element:'*',x:0,y:0}],bonds:[],autoH:true}).success);
  for(let seed=0;seed<20;seed++)assert(generate(seed,'products','cyclic').reaction.start.cyclic);
});

test('cyclic questions occur in mixed practice and the cyclic focus in both single-step modes',()=>{
 for(const mode of ['products','conditions'] as const){
  let mixedRings=0;
  for(let seed=0;seed<100;seed++){
   if(generate(seed,mode,'all').reaction.start.cyclic)mixedRings++;
   const g=generate(seed,mode,'cyclic');assert(g.reaction.start.cyclic);assert(g.reaction.product.cyclic||g.reaction.ruleId.startsWith('combustion:'));
  }
  assert(mixedRings>0);
 }
 assert(startingCompounds().flatMap(reactions).every(r=>!/(?:Draw|draw) (?:only )?the (?:alkene|alcohol|amide|ester) product/.test(r.extras??'')));
});
