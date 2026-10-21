import test from 'node:test';
import assert from 'node:assert/strict';
import { molecule } from '../src/chemistry/molecules';
import { equivalent,validate,conditionsMatch } from '../src/chemistry/check';
import { generate,coverage } from '../src/chemistry/generate';
import { grade } from '../src/chemistry/grading';
import { reactions,startingCompounds,FAMILIES } from '../src/chemistry/rules';
import type { Molecule } from '../src/chemistry/types';

test('all generated reactants and products obey valence rules',()=>{for(const c of startingCompounds())for(const r of reactions(c)){assert.equal(validate(molecule(r.start)),null,JSON.stringify(r.start));assert.equal(validate(molecule(r.product)),null,JSON.stringify(r.product));}});
test('equivalence ignores drawing coordinates, atom order, ids and direction',()=>{const a=molecule({kind:'ester',n:3,m:2});const b=structuredClone(a);b.atoms.reverse();for(const atom of b.atoms){atom.x=-atom.x;atom.y+=90;atom.id='new-'+atom.id;}b.bonds=b.bonds.reverse().map(b=>({a:'new-'+b.b,b:'new-'+b.a,order:b.order}));assert.ok(equivalent(a,b));});
test('explicit hydrogen and implicit hydrogen drawings match',()=>{const a=molecule({kind:'alcohol',n:1});const b:Molecule={atoms:[{id:'c',element:'C',x:0,y:0},{id:'o',element:'O',x:60,y:0},...Array.from({length:4},(_,i)=>({id:'h'+i,element:'H' as const,x:0,y:0}))],bonds:[{a:'c',b:'o',order:1},...Array.from({length:4},(_,i)=>({a:i===3?'o':'c',b:'h'+i,order:1 as const}))],autoH:false};assert.ok(equivalent(a,b));b.bonds.pop();assert.equal(equivalent(a,b),false);});
test('constitutional isomers and different protonation states remain distinct',()=>{assert.equal(equivalent(molecule({kind:'alcohol',n:3}),molecule({kind:'alcohol',n:3,position:1})),false);assert.equal(equivalent(molecule({kind:'acid',n:2}),molecule({kind:'carboxylate',n:2})),false);});
test('duplicate bonds and overbonded atoms are rejected',()=>{const a=molecule({kind:'alkane',n:2});a.bonds.push({...a.bonds[0]});assert.match(validate(a)!,/duplicate/);const b=molecule({kind:'alcohol',n:1});b.bonds[0].order=3;assert.match(validate(b)!,/too many/);});
test('alternative catalysts accepted without accepting missing or surplus conditions',()=>{const r=reactions({kind:'alkene',n:3}).find(r=>r.ruleId==='addition:hydrogen')!;assert.ok(conditionsMatch(['ni','h2'],r.conditions));assert.equal(conditionsMatch(['ni'],r.conditions),false);assert.equal(conditionsMatch(['h2','ni','pt'],r.conditions),false);});
test('reaction direction and reduction selectivity are correct',()=>{assert.equal(reactions({kind:'ketone',n:3}).some(r=>r.ruleId.startsWith('oxidation')),false);const acid=reactions({kind:'acid',n:3}).find(r=>r.ruleId==='reduction:acid')!;assert.equal(conditionsMatch(['nabh4'],acid.conditions),false);});
test('all families generate reproducible questions that grade correctly',()=>{for(const f of FAMILIES)for(const mode of ['products','conditions'] as const){const a=generate(134,mode,f.id),b=generate(134,mode,f.id);assert.deepEqual(a,b);assert.equal(grade(134,mode,f.id,mode==='products'?{molecule:molecule(a.reaction.product)}:{conditions:a.reaction.conditions.at(-1)}).correct,true);}});
test('synthesis generation is reproducible, solvable and grades each step',()=>{const counts=new Set<number>();for(let seed=1;seed<=12;seed++){const {route}=generate(seed,'synthesis');counts.add(route.length);const steps=route.map(r=>({molecule:molecule(r.product),conditions:r.conditions[0]}));assert.ok(grade(seed,'synthesis','all',{steps}).correct);steps[0].conditions=[];assert.equal(grade(seed,'synthesis','all',{steps}).correct,false);}assert.deepEqual([...counts].sort(),[2,3,4]);});
test('synthesis accepts a different valid reagent set',()=>{const {route}=generate(1,'synthesis');assert.ok(grade(1,'synthesis','all',{steps:route.map(r=>({molecule:molecule(r.product),conditions:r.conditions.at(-1)!}))}).correct);});
test('polyester has two ester carbonyls and correct repeat formula',async()=>{const {formula}=await import('../src/chemistry/molecules');const p=molecule({kind:'polyester',n:4,m:2});assert.equal(formula(p),'C6H8O4');assert.equal(p.bonds.filter(b=>b.order===2).length,2);assert.equal(p.atoms.filter(a=>a.element==='*').length,2);});
test('polymer repeat-unit boundaries may be shifted without changing the answer',()=>{const a=molecule({kind:'polyester',n:4,m:2});const b=structuredClone(a);const ends=b.atoms.filter(a=>a.element==='*');const neighbor=(id:string)=>{const edge=b.bonds.find(e=>e.a===id||e.b===id)!;return edge.a===id?edge.b:edge.a;};const x=neighbor(ends[0].id),y=neighbor(ends[1].id);const cut=b.bonds.find(e=>e.a==='2'&&e.b==='3')!;b.bonds=b.bonds.filter(e=>!ends.some(a=>e.a===a.id||e.b===a.id)&&e!==cut);b.bonds.push({a:x,b:y,order:1},{a:ends[0].id,b:cut.a,order:1},{a:ends[1].id,b:cut.b,order:1});assert.ok(equivalent(a,b));});
test('cracking conserves atoms for every generated pair',async()=>{const {formula}=await import('../src/chemistry/molecules');for(let n=4;n<=8;n++)for(const r of reactions({kind:'alkane',n}).filter(r=>r.ruleId==='cracking:alkane'))assert.equal(formula(molecule(r.product)),formula(molecule(r.start)));});
test('condition questions accept a different supported route to the same product',()=>{for(let seed=0;seed<100;seed++){const g=generate(seed,'conditions','hydrolysis');if(g.reaction.product.kind==='acid'){assert.ok(grade(seed,'conditions','hydrolysis',{conditions:['aq-oh','heat','workup']}).correct);assert.ok(grade(seed,'conditions','hydrolysis',{conditions:['dilute-acid','heat']}).correct);return;}}assert.fail('No acid hydrolysis question generated');});

test('extra disconnected hydrogen and product species cannot disappear during matching',()=>{
  const a=molecule({kind:'alkane',n:2}),b=structuredClone(a);
  b.atoms.push({id:'h1',element:'H',x:0,y:0},{id:'h2',element:'H',x:0,y:0});
  b.bonds.push({a:'h1',b:'h2',order:1});
  assert.equal(validate(b),null);assert.equal(equivalent(a,b),false);
  assert.equal(equivalent(b,structuredClone(b)),true);
  const combustion=molecule({kind:'combustion',n:2});
  const missingWater={...combustion,atoms:combustion.atoms.slice(0,-1)};
  assert.equal(equivalent(combustion,missingWater),false);
});
test('polymer validation rejects detached fragments and malformed continuation points',()=>{
  const a=molecule({kind:'addition-polymer',n:2});
  const detached=structuredClone(a);detached.bonds=detached.bonds.filter(b=>!(b.a==='1'&&b.b==='2'));
  assert.match(validate(detached)!,/connected/);assert.equal(equivalent(a,detached),false);
  const extra=structuredClone(a);extra.atoms.push({id:'extra',element:'C',x:0,y:0});
  assert.match(validate(extra)!,/connected/);
  const missing=structuredClone(a);missing.atoms=missing.atoms.filter(a=>a.id!=='0');missing.bonds=missing.bonds.filter(b=>b.a!=='0');
  assert.match(validate(missing)!,/exactly two/);
  assert.equal(equivalent(a,molecule({kind:'addition-polymer',n:3})),false);
  assert.equal(equivalent(molecule({kind:'polyester',n:4,m:2}),molecule({kind:'polyamide',n:4,m:2})),false);
});
test('every supported polymer backbone cut accepts a shifted boundary',()=>{
  for(const c of [{kind:'addition-polymer',n:2},{kind:'addition-polymer',n:3},{kind:'polyester',n:4,m:2},{kind:'polyamide',n:4,m:2}] as const){
    const a=molecule(c),ends=a.atoms.filter(a=>a.element==='*');
    const neighbor=(id:string)=>{const b=a.bonds.find(b=>b.a===id||b.b===id)!;return b.a===id?b.b:b.a;};
    for(const cut of a.bonds.filter(b=>b.order===1&&!ends.some(a=>a.id===b.a||a.id===b.b))){
      const b=structuredClone(a);b.bonds=b.bonds.filter(b=>!ends.some(a=>a.id===b.a||a.id===b.b)&&!(b.a===cut.a&&b.b===cut.b));
      b.bonds.push({a:neighbor(ends[0].id),b:neighbor(ends[1].id),order:1},{a:ends[0].id,b:cut.a,order:1},{a:ends[1].id,b:cut.b,order:1});
      // A side-branch cut does not define an open-chain repeat and must fail.
      if(validate(b)===null)assert.ok(equivalent(a,b),JSON.stringify(c));else assert.equal(equivalent(a,b),false);
    }
  }
});
