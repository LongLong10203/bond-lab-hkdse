import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../src/chemistry/generate';
import { grade } from '../src/chemistry/grading';
import { molecule } from '../src/chemistry/molecules';
import { conditionsMatch } from '../src/chemistry/check';
import { isAlcohol,isOrganicReagent,reagentOptions } from '../src/chemistry/condition-options';
import { reactions,startingCompounds } from '../src/chemistry/rules';
import { answerFor,editStep,missingInput,newSession,restoreSessions,sessionsSchema } from '../src/lib/practice';
import { levelFor,rewardFor } from '../src/chemistry/rewards';
import { arrangedPositions,layoutTick,withPositions,type Positions } from '../src/lib/molecule-layout';

function synthesis(){for(let seed=0;seed<100;seed++){const g=generate(seed,'synthesis');if(g.route.length===3)return {seed,...g};}throw Error('No 3-step route');}
test('editing an earlier synthesis step preserves later drawings and conditions across reload',()=>{
  const g=synthesis();let session=newSession({...g.question,id:'draft-test'});
  g.route.forEach((r,index)=>{session=editStep(session,index,{molecule:molecule(r.product),conditions:r.conditions[0]});});
  const third=structuredClone(session.steps[2]);const wrong=molecule({kind:'alkane',n:1});
  session=editStep({...session,activeStep:1},1,{molecule:wrong});assert.deepEqual(session.steps[2],third);
  const saved=restoreSessions(JSON.stringify({synthesis:session})).synthesis!;assert.equal(saved.activeStep,1);assert.deepEqual(saved.steps[2],third);
  const repaired=editStep(saved,1,{molecule:molecule(g.route[1].product)});assert.equal(grade(g.seed,'synthesis','all',answerFor(repaired)).correct,true);assert.deepEqual(repaired.steps[2],third);
});
test('final synthesis product is supplied and cannot be overwritten while its conditions remain editable',()=>{
  const g=synthesis(),session=newSession({...g.question,id:'final-test'});assert.deepEqual(session.steps.at(-1)!.molecule,g.question.target);
  const edited=editStep(session,session.steps.length-1,{molecule:molecule({kind:'alkane',n:8}),conditions:['h2','pt']});
  assert.deepEqual(edited.steps.at(-1)!.molecule,g.question.target);assert.deepEqual(edited.steps.at(-1)!.conditions,['h2','pt']);
  assert.deepEqual(answerFor(edited).steps!.at(-1)!.molecule,g.question.target);
});
test('readiness identifies missing conditions without blocking step navigation or erasing drafts',()=>{
  const g=synthesis();let s=newSession({...g.question,id:'ready-test'});s=editStep(s,0,{molecule:molecule(g.route[0].product)});
  assert.match(missingInput(s)!.message,/choose reagents/);s={...s,activeStep:2};assert.equal(missingInput(s)!.step,0);
  s=editStep(s,0,{conditions:g.route[0].conditions[0]});assert.equal(missingInput(s)!.step,1);
});
test('invalid or old saved drafts are ignored and revealed/awarded flags survive reload',()=>{
  const g=synthesis(),s={...newSession({...g.question,id:'restore-test'}),revealed:true,awarded:true};
  assert.equal(restoreSessions('{').synthesis,undefined);assert.equal(restoreSessions(JSON.stringify({synthesis:{...s,activeStep:8}})).synthesis,undefined);
  assert.equal(restoreSessions(JSON.stringify({synthesis:{...s,question:{...s.question,version:'2026.2'}}})).synthesis,undefined);
  assert.equal(restoreSessions(JSON.stringify({synthesis:s})).synthesis!.revealed,true);assert.equal(restoreSessions(JSON.stringify({synthesis:s})).synthesis!.awarded,true);
});
test('merged catalysts and substitution choices are contextual, not universal reagent equivalences',()=>{
  assert.equal(conditionsMatch(['h2','pt'],[['h2','ni']]),true);
  assert.equal(conditionsMatch(['hcl'],[['pcl3']],{alcohol:true}),true);assert.equal(conditionsMatch(['hbr'],[['pbr3']],{alcohol:true}),true);
  assert.equal(conditionsMatch(['pcl3'],[['hcl']],{alcohol:false}),false);
  assert.ok(reagentOptions(molecule({kind:'alcohol',n:2})).some(o=>o.label==='HCl / PCl₃'));
  const explicit=molecule({kind:'alcohol',n:2});const oxygen=explicit.atoms.find(a=>a.element==='O')!;
  explicit.atoms.push({id:'hydrogen',element:'H',x:20,y:20});explicit.bonds.push({a:oxygen.id,b:'hydrogen',order:1});
  assert.equal(isAlcohol(explicit),true);assert.equal(isAlcohol(molecule({kind:'acid',n:2})),false);
  assert.ok(reagentOptions(molecule({kind:'alkene',n:2})).some(o=>o.label==='HCl'));
});
test('all reaction procedures remain selectable with supplied organic co-reactants and simplified conditions',()=>{
  for(const c of startingCompounds())for(const r of reactions(c)){
    const provided=r.conditions.flat().filter(isOrganicReagent);
    const answer=r.conditions.at(-1)!.filter(id=>!isOrganicReagent(id)&&id!=='excess').map(id=>['ni','pd'].includes(id)?'pt':isAlcohol(molecule(c))&&id==='pcl3'?'hcl':isAlcohol(molecule(c))&&id==='pbr3'?'hbr':id);
    assert.equal(conditionsMatch(answer,r.conditions,{provided,alcohol:isAlcohol(molecule(c))}),true,r.ruleId);
  }
});
test('ester questions place organic reagents in the question and accept conditions without reselecting them',()=>{
  for(const family of ['esterification'])for(let seed=0;seed<20;seed++){
    const g=generate(seed,'conditions',family);const conditions=g.reaction.conditions[0].filter(id=>!isOrganicReagent(id));assert.equal(grade(seed,'conditions',family,{conditions}).correct,true);
    if(g.reaction.conditions[0].some(isOrganicReagent))assert.ok(g.question.coReactants.length>0);
  }
});
test('harder questions earn more XP and exact level boundaries advance correctly',()=>{
  const two=generate(1,'synthesis').route.slice(0,2);assert.ok(rewardFor('synthesis',[...two,...two]).reward>rewardFor('synthesis',two).reward);
  const easy=reactions({kind:'alkene',n:2}).find(r=>r.ruleId==='addition:hydrogen')!,hard=reactions({kind:'alkene',n:6,cyclic:true}).find(r=>r.ruleId==='addition:hydrogen')!;
  assert.ok(rewardFor('products',[hard]).reward>rewardFor('products',[easy]).reward);
  assert.deepEqual(levelFor(99),{level:1,withinLevel:99,toNext:1,required:100});assert.deepEqual(levelFor(100),{level:2,withinLevel:0,toNext:150,required:150});assert.equal(levelFor(250).level,3);
});
test('guided layout separates bonded overlapping atoms without changing chemical connectivity',()=>{
  const m=molecule({kind:'alcohol',n:4});let positions:Positions=Object.fromEntries(m.atoms.map(a=>[a.id,{x:360,y:170}])),velocity:Positions={};
  for(let i=0;i<180;i++){const next=layoutTick(m,positions,velocity);positions=next.positions;velocity=next.velocity;}
  const result=withPositions(m,positions);assert.deepEqual(result.bonds,m.bonds);
  for(const a of result.atoms){assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y));assert.ok(a.x>=38&&a.x<=682&&a.y>=38&&a.y<=302);}
  assert.ok(Math.hypot(result.atoms[0].x-result.atoms[1].x,result.atoms[0].y-result.atoms[1].y)>35);
});
test('dragged atoms stay pinned and bonded neighbours follow the regular arrangement',()=>{
  const m=molecule({kind:'alkane',n:2});let positions:Positions={'0':{x:200,y:170},'1':{x:280,y:170}},velocity:Positions={};
  for(let i=0;i<40;i++){const next=layoutTick(m,positions,velocity,{id:'0',point:{x:400,y:120}});positions=next.positions;velocity=next.velocity;}
  assert.deepEqual(positions['0'],{x:400,y:120});assert.ok(positions['1'].x>300);
});

test('level costs grow and progress remains correct at every early boundary',()=>{
  let total=0;
  for(let level=1;level<=20;level++){
    const cost=100+(level-1)*50;
    assert.deepEqual(levelFor(total),{level,withinLevel:0,toNext:cost,required:cost});
    assert.equal(levelFor(total+cost-1).level,level);assert.equal(levelFor(total+cost-1).toNext,1);
    total+=cost;assert.equal(levelFor(total).level,level+1);
  }
  assert.equal(levelFor(-10).level,1);assert.equal(levelFor(NaN).level,1);
});
test('loose atoms stay exactly where placed, including while a connected component settles',()=>{
  const m=molecule({kind:'alkane',n:4});m.atoms.push({id:'loose',element:'O',x:300,y:180});
  let positions:Positions=Object.fromEntries(m.atoms.map(a=>[a.id,{x:a.x,y:a.y}]));
  for(let i=0;i<120;i++)positions=layoutTick(m,positions,{}).positions;
  assert.deepEqual(positions.loose,{x:300,y:180});
  m.bonds=[];assert.deepEqual(layoutTick(m,positions,{}).positions,positions);
});
test('connected carbon chains settle into a compact regular up-down zigzag without drift',()=>{
  const m=molecule({kind:'alkane',n:6}),start=Object.fromEntries(m.atoms.map(a=>[a.id,{x:a.x,y:a.y}]));
  const target=arrangedPositions(m,start);
  for(let i=1;i<6;i++){
    const previous=target[String(i-1)],current=target[String(i)];
    assert.equal(current.x-previous.x,66);assert.equal(Math.abs(current.y-previous.y),38);
    if(i>1)assert.equal(current.y,target[String(i-2)].y);
  }
  assert.deepEqual(arrangedPositions(m,target),target);
  let positions=start;for(let i=0;i<200;i++)positions=layoutTick(m,positions,{}).positions;
  for(const id of Object.keys(target))assert.ok(Math.hypot(target[id].x-positions[id].x,target[id].y-positions[id].y)<.2);
});
test('synthesis co-reactants are required only in the selected step and wrong or extra choices fail',()=>{
  let found=false;
  for(let seed=0;seed<300;seed++){
    const g=generate(seed,'synthesis');const index=g.route.findIndex(r=>r.conditions[0].some(isOrganicReagent));if(index<0)continue;found=true;
    const steps=g.route.map(r=>({molecule:molecule(r.product),conditions:[...r.conditions[0]]}));
    assert.equal(grade(seed,'synthesis','all',{steps}).correct,true);
    const missing=structuredClone(steps);missing[index].conditions=missing[index].conditions.filter(id=>!isOrganicReagent(id));
    const failed=grade(seed,'synthesis','all',{steps:missing});assert.equal(failed.correct,false);assert.equal(failed.stepIndex,index);assert.match(failed.message,/co-reactant/);
    const selected=steps[index].conditions.find(isOrganicReagent)!;
    const wrong=structuredClone(steps);wrong[index].conditions=wrong[index].conditions.map(id=>id===selected?(selected==='alcohol-1'?'alcohol-2':'alcohol-1'):id);
    assert.equal(grade(seed,'synthesis','all',{steps:wrong}).correct,false);
    const extra=structuredClone(steps),other=index===0?1:0;extra[other].conditions.push(selected);
    assert.equal(grade(seed,'synthesis','all',{steps:extra}).correct,false);
    let draft=newSession({...g.question,id:'co-draft'});steps.forEach((step,i)=>draft=editStep(draft,i,step));
    const restored=restoreSessions(JSON.stringify({synthesis:{...draft,activeStep:other}})).synthesis!;
    assert.ok(restored.steps[index].conditions.includes(selected));assert.ok(!restored.steps[other].conditions.includes(selected));
    break;
  }
  assert.ok(found,'A generated ester synthesis was tested');
});
test('old generator drafts are discarded instead of silently reinterpreted',()=>{
  const g=synthesis(),draft=newSession({...g.question,id:'old',version:'2026.4'});
  assert.equal(restoreSessions(JSON.stringify({synthesis:draft})).synthesis,undefined);
});
test('synthesis drafts require exactly the stated count across saving and restoration',()=>{
  const g=synthesis(),draft=newSession({...g.question,id:'exact-count'});
  assert.equal(draft.steps.length,g.question.stepLimit);
  assert.equal(restoreSessions(JSON.stringify({synthesis:draft})).synthesis!.steps.length,g.question.stepLimit);
  for(const count of [0,1,2,4]){
    const altered={...draft,steps:Array.from({length:count},()=>draft.steps[0])};
    assert.equal(restoreSessions(JSON.stringify({synthesis:altered})).synthesis,undefined);
    assert.equal(sessionsSchema.safeParse({synthesis:altered}).success,false);
    assert.match(missingInput(altered)!.message,/exactly 3/);
  }
  const missingCount={...draft,question:{...draft.question,stepLimit:undefined}};
  assert.equal(restoreSessions(JSON.stringify({synthesis:missingCount})).synthesis,undefined);
  const oldVersion={...draft,question:{...draft.question,version:'2026.6'}};
  assert.equal(restoreSessions(JSON.stringify({synthesis:oldVersion})).synthesis,undefined);
});
test('flexible layout preserves a regular ring and its outward substituent',()=>{
  for(const n of [5,6]){
    const m=molecule({kind:'alcohol',n,cyclic:true}),p=Object.fromEntries(m.atoms.map(a=>[a.id,{x:a.x,y:a.y}]));
    const target=arrangedPositions(m,p);const edges=m.bonds.filter(b=>Number(b.a)<n&&Number(b.b)<n);
    for(const b of edges)assert(Math.abs(Math.hypot(target[b.a].x-target[b.b].x,target[b.a].y-target[b.b].y)-76)<1e-6);
    assert(target[String(n)].y<target['0'].y);
    const next=arrangedPositions(m,target);for(const id in target)assert(Math.hypot(next[id].x-target[id].x,next[id].y-target[id].y)<1e-6);
    let positions=p;for(let i=0;i<200;i++)positions=layoutTick(m,positions,{}).positions;
    assert.deepEqual(withPositions(m,positions).bonds,m.bonds);
  }
});
