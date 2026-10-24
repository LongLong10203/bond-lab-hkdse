'use client';
import { useEffect,useRef,useState } from 'react';
import { ArrowRight,Atom,BookOpen,Check,ChevronLeft,FlaskConical,GitBranch,HelpCircle,LoaderCircle,Menu,Settings2,Sparkles,Trophy,X,AlertCircle } from 'lucide-react';
import type { ChallengeData,Grade,Mode,Molecule } from '@/chemistry/types';
import { FAMILIES } from '@/chemistry/rules';
import { displayConditions,isOrganicReagent } from '@/chemistry/condition-options';
import { coReactant } from '@/chemistry/context';
import { levelFor } from '@/chemistry/rewards';
import { answerFor,editStep,missingInput,newSession,type PracticeSession } from '@/lib/practice';
import { type Progress } from '@/lib/progress';
import { authClient } from '@/lib/auth-client';
import { useSavedPractice } from './use-saved-practice';
import type { Player } from './account';
import Tutorial from './tutorial';
import Editor from './editor';
import MoleculeView from './molecule';
import ConditionPicker from './conditions';
const MODES=[{id:'products' as const,name:'Build the product',icon:FlaskConical},{id:'conditions' as const,name:'Find the conditions',icon:Settings2},{id:'synthesis' as const,name:'Plan a synthesis',icon:GitBranch}];
export default function Lab({coverage,player}:{coverage:{variants:number;rules:number};player:Player|null}){
  const {mode,setMode,family,setFamily,sessions,setSessions,progress,setProgress,ready,storageWarning,saveStatus,saveError,flush,tutorialCompleted,completeTutorial}=useSavedPractice(player?.id);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[generation,setGeneration]=useState(0);
  const [error,setError]=useState(''),[inputMessage,setInputMessage]=useState(''),[accountBusy,setAccountBusy]=useState(false);
  const [dialog,setDialog]=useState<'library'|'progress'|'help'|null>(null),[mobileNav,setMobileNav]=useState(false),[levelUp,setLevelUp]=useState<number|null>(null);
  const [replayTour,setReplayTour]=useState(false);
  const closeRef=useRef<HTMLButtonElement>(null),requestId=useRef(0),submitLock=useRef(false);
  const session=sessions[mode],question=session?.question,active=MODES.find(m=>m.id===mode)!,level=levelFor(progress.xp);
  const showTour=ready&&!loading&&!!session&&!dialog&&(!tutorialCompleted||replayTour);
  const finishTour=async()=>{const saved=await completeTutorial();if(saved)setReplayTour(false);return saved;};
  useEffect(()=>{
    if(!ready)return;
    const id=++requestId.current;setError('');setInputMessage('');setLevelUp(null);
    if(sessions[mode]?.question.family===family){setLoading(false);return;}
    const controller=new AbortController();setLoading(true);
    fetch('/api/challenges',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,family}),signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error);if(id===requestId.current)setSessions(previous=>({...previous,[mode]:newSession(data as ChallengeData)}));}).catch(e=>{if(e.name!=='AbortError'&&id===requestId.current)setError(e.message);}).finally(()=>{if(id===requestId.current)setLoading(false);});
    return ()=>controller.abort();
    // Session edits must never fetch a new challenge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[mode,family,generation,ready]);
  useEffect(()=>{if(!dialog)return;const previous=document.activeElement as HTMLElement|null;closeRef.current?.focus();const handle=(e:KeyboardEvent)=>{if(e.key==='Escape')setDialog(null);if(e.key==='Tab'){const all=Array.from(document.querySelectorAll<HTMLElement>('.dialog button, .dialog a, .dialog input')).filter(el=>!el.hasAttribute('disabled'));const first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',handle);return()=>{document.removeEventListener('keydown',handle);previous?.focus();};},[dialog]);
  const update=(fn:(s:PracticeSession)=>PracticeSession)=>{setSessions(previous=>previous[mode]?{...previous,[mode]:fn(previous[mode]!)}:previous);setInputMessage('');};
  const chooseMode=(next:Mode)=>{if(busy)return;setMode(next);setFamily(sessions[next]?.question.family??'all');setMobileNav(false);};
  const nextChallenge=()=>{if(busy)return;setSessions(previous=>{const next={...previous};delete next[mode];return next;});setGeneration(g=>g+1);};
  const changeStep=(index:number)=>update(s=>({...s,activeStep:index}));
  const changeDrawing=(molecule:Molecule)=>update(s=>mode==='synthesis'?editStep(s,s.activeStep,{molecule}):{...s,drawing:molecule,feedback:null});
  const changeLayout=(molecule:Molecule)=>setSessions(previous=>{const s=previous[mode];if(!s||s.question.id!==question?.id||(mode==='synthesis'&&s.activeStep!==step))return previous;return {...previous,[mode]:mode==='synthesis'?{...s,steps:s.steps.map((item,i)=>i===s.activeStep?{...item,molecule}:item)}:{...s,drawing:molecule}};});
  const changeConditions=(conditions:string[])=>update(s=>mode==='synthesis'?editStep(s,s.activeStep,{conditions}):{...s,conditions,feedback:null});
  const submissionRetry=useRef<{body:string;id:string}|null>(null);
  const submit=async(reveal=false)=>{
    if(!session||submitLock.current)return;
    const missing=!reveal?missingInput(session):null;
    if(missing){setInputMessage(missing.message);if(missing.step!==undefined)setSessions(previous=>({...previous,[mode]:{...session,activeStep:missing.step!}}));return;}
    submitLock.current=true;setBusy(true);setError('');setInputMessage('');const current=requestId.current;
    try{
      if(player&&!(await flush()))throw Error('Save your draft before checking your answer.');
      const body=JSON.stringify({id:session.question.id,reveal,answer:answerFor(session)});
      if(submissionRetry.current?.body!==body)submissionRetry.current={body,id:crypto.randomUUID()};
      const response=await fetch('/api/submissions',{method:'POST',headers:{'Content-Type':'application/json',...(player?{'X-Bond-Lab-Account':player.id}:{})},body:JSON.stringify({...JSON.parse(body),requestId:submissionRetry.current.id}),signal:AbortSignal.timeout(15000)});
      const data:Grade&{error?:string;progress?:Progress;revealed?:boolean;awarded?:boolean}=await response.json();if(!response.ok)throw Error(data.error);if(current!==requestId.current)return;
      submissionRetry.current=null;
      const award=player?(data.xp??0):0;
      const firstGuestSolve=!player&&!reveal&&data.correct&&!session.revealed&&!session.awarded;
      if(player&&data.progress)setProgress(data.progress);
      else if(!reveal)setProgress(p=>{const nextXP=p.xp+award;return {...p,attempts:p.attempts+1,correct:p.correct+(data.correct?1:0),completed:p.completed+(firstGuestSolve?1:0),xp:nextXP,byMode:{...p.byMode,[mode]:p.byMode[mode]+(firstGuestSolve?1:0)}};});
      if(award&&levelFor(progress.xp+award).level>level.level)setLevelUp(levelFor(progress.xp+award).level);
      update(s=>({...s,revealed:data.revealed??(s.revealed||reveal),awarded:data.awarded??(s.awarded||firstGuestSolve),feedback:{...data,xp:award},activeStep:data.stepIndex??s.activeStep}));
    }catch(e){setError(e instanceof Error?e.message:'Could not check your answer. Please try again.');}finally{setBusy(false);submitLock.current=false;}
  };
  const signIn=()=>window.location.assign('/login');
  const signOut=async()=>{
    setAccountBusy(true);setError('');
    try{if(!(await flush()))throw Error('Your latest draft has not saved. Try saving again before signing out.');const result=await authClient.signOut();if(result.error)throw Error(result.error.message);try{sessionStorage.removeItem('bond-lab-guest');}catch{}window.location.assign('/login');}
    catch(e){setError(e instanceof Error?e.message:'Could not sign out.');setAccountBusy(false);}
  };
  const openCommunity=async(path:string)=>{
    setAccountBusy(true);if(!(await flush())){setAccountBusy(false);setError('Save your draft before leaving the game.');return;}window.location.assign(path);
  };
  const step=session?.activeStep??0,isFinal=mode==='synthesis'&&step===(question?.stepLimit??0)-1;
  const drawing=mode==='synthesis'?session?.steps[step]?.molecule:session?.drawing;
  const conditions=mode==='synthesis'?session?.steps[step]?.conditions??[]:session?.conditions??[];
  const currentStart=mode==='synthesis'&&step>0?session?.steps[step-1]?.molecule:question?.start;
  const feedback=session?.feedback;
  return <div className="app-shell compact-lab">
    <aside inert={!!dialog||showTour} className={'sidebar '+(mobileNav?'nav-open':'')}>
      <a href="/" className="brand" aria-label="Bond Lab home"><span className="brand-mark"><Atom size={27}/></span><span>BOND<span className="brand-light">LAB</span></span></a>
      <nav aria-label="Game modes">{MODES.map(m=><button disabled={busy} key={m.id} className={'nav-item '+(mode===m.id?'active':'')} aria-current={mode===m.id?'page':undefined} onClick={()=>chooseMode(m.id)}><m.icon size={19}/><span>{m.name}</span></button>)}</nav>
      <div className="nav-divider"/>
      <button className="nav-item" onClick={()=>{setDialog('library');setMobileNav(false);}}><BookOpen size={18}/>Reaction library</button>
      <button className="nav-item" onClick={()=>{setDialog('progress');setMobileNav(false);}}><Trophy size={18}/>Your progress</button>
      {player&&<button className="nav-item" disabled={busy||accountBusy} onClick={()=>void openCommunity('/leaderboard')}><Trophy size={18}/>Leaderboard</button>}
      <button className="help-nav" onClick={()=>setDialog('help')}><HelpCircle size={17}/>Help</button>
    </aside>
    <main inert={!!dialog||showTour} className="main">
      <header className="topbar"><button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={()=>setMobileNav(!mobileNav)}><Menu size={21}/></button><h1 data-tour="mode" className="mode-title">{active.name}</h1><div className="profile-progress">{player&&<button className="level-badge" aria-label={`Level ${level.level}, ${progress.xp} XP. View progress`} onClick={()=>setDialog('progress')}><Sparkles size={17}/><span>Level {level.level}<small>{progress.xp} XP</small></span><span className="level-meter" role="progressbar" aria-label="Progress to next level" aria-valuenow={level.withinLevel} aria-valuemin={0} aria-valuemax={level.required}><i style={{width:`${level.withinLevel/level.required*100}%`}}/></span></button>}<div className="account-controls">{player?<><button className="avatar" aria-label="View my profile" title="Your profile" disabled={busy||accountBusy} onClick={()=>void openCommunity('/profile')}>{(player.name||player.email).slice(0,1).toUpperCase()}</button><button className="account-button" disabled={busy||accountBusy||!ready} onClick={signOut}>Sign out</button></>:<button className="account-button" disabled={busy} onClick={signIn}>Sign in / register</button>}</div></div></header>
      <div className="main-content">
        <div className="account-note"><span>{player?player.email:'Guest practice · Drawings saved on this device'}</span>{player&&<span role="status">{saveStatus}</span>}</div>
        {saveError&&<div className="error-banner" role="alert"><span>{saveError}</span>{ready&&<button onClick={()=>void flush()}>Retry save</button>}<button onClick={()=>window.location.reload()}>Reload saved progress</button></div>}
        <div className="workbench-top"><span className="question-meta">{question&&<><span className="difficulty-label">{question.difficulty}</span>{player&&<span>+{question.reward} XP</span>}</>}</span>{mode!=='synthesis'&&<label className="family-label">Focus<select aria-label="Reaction family" value={family} disabled={busy||loading} onChange={e=>setFamily(e.target.value)}>{FAMILIES.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label>}{mode==='synthesis'&&!player&&<span className="save-note">{storageWarning?'Browser saving unavailable':'Draft saved on this device'}</span>}</div>
        {error&&<div className="error-banner" role="alert"><AlertCircle size={18}/><span>{error}</span><button onClick={nextChallenge}>New challenge</button></div>}
        {loading||!ready?<div className="loading-panel"><LoaderCircle className="spin" size={24}/><span>Loading challenge…</span></div>:session&&question&&question.family===family&&<>
          <div className="workbench">
            <section className="reaction-panel"><div className="panel-heading"><span className="section-number">01</span><h2>{mode==='synthesis'?'Your mission':'The reaction'}</h2>{mode==='synthesis'&&<span className="pill">{question.stepLimit} steps</span>}</div>
              {mode==='synthesis'&&<p className="panel-intro">{question.instruction}</p>}
              <div className="reactant-card"><span className="micro-label">{mode==='synthesis'&&step>0?`STEP ${step} INTERMEDIATE`:'STARTING COMPOUND'}</span>{currentStart?.atoms.length?<><MoleculeView molecule={currentStart} label={step>0?`Intermediate ${step}`:question.startName}/>{step===0&&<strong>{question.startName}</strong>}</>:<p className="empty-intermediate">Draw the intermediate in step {step} first.</p>}</div>
              {question.coReactants.length>0&&<div className="co-reactants"><span className="micro-label">{mode==='synthesis'?`CO-REACTANT FOR STEP ${step+1}`:'ALSO REACTS WITH'}</span>{mode==='synthesis'&&<p className="co-reactant-note">Select only if used in this step.</p>}{question.coReactants.map(c=><div key={c.id}><MoleculeView molecule={c.molecule} label={c.label}/><strong>{c.label}</strong>{mode==='synthesis'&&<label className="co-reactant-choice"><input type="checkbox" aria-label={`Use ${c.label} in step ${step+1}`} disabled={busy} checked={conditions.includes(c.id)} onChange={()=>changeConditions(conditions.includes(c.id)?conditions.filter(id=>id!==c.id):[...conditions,c.id])}/>Use in step {step+1}</label>}</div>)}{mode==='synthesis'&&<p className="co-reactant-status" aria-live="polite">{conditions.some(isOrganicReagent)?'Used in this step: '+conditions.filter(isOrganicReagent).map(id=>coReactant(id).label).join(', '):'None selected for this step'}</p>}</div>}
              <div className="reaction-arrow"><ArrowRight size={20}/></div>
              {mode==='products'?<div className="conditions-card"><span className="micro-label">REAGENTS & CONDITIONS</span><div className="condition-tags">{displayConditions(question.conditions??[],question.start).map(c=><span key={c}>{c}</span>)}</div></div>:<div className="reactant-card target-card"><span className="micro-label">TARGET PRODUCT</span><MoleculeView molecule={question.target!} label={question.targetName}/><strong>{question.targetName}</strong></div>}
              {question.coProducts.length>0&&<div className="co-reactants coproducts"><span className="micro-label">OTHER PRODUCT — NOT ASSESSED</span>{question.coProducts.map(c=><div key={c.id}><MoleculeView molecule={c.molecule} label={c.label}/><strong>{c.label}</strong></div>)}</div>}
              {mode==='products'&&question.extras&&<p className="reaction-note">{question.extras}</p>}
            </section>
            <section className="answer-panel"><div className="panel-heading"><span className="section-number">02</span><h2>{mode==='conditions'?'Reagents & conditions':mode==='synthesis'?`Step ${step+1}`:'Your product'}</h2>{mode==='synthesis'&&<span className="small-note">{session.steps.filter(s=>s.molecule.atoms.length&&s.conditions.length).length}/{session.steps.length} filled</span>}</div>
              {mode==='synthesis'&&<nav className="step-tabs" aria-label="Synthesis steps">{session.steps.map((s,i)=><button key={i} disabled={busy} aria-current={step===i?'step':undefined} className={(step===i?'active ':'')+(s.molecule.atoms.length&&s.conditions.length?'filled':'')} onClick={()=>changeStep(i)}>Step {i+1}{i===session.steps.length-1&&<small>Final</small>}<span className="draft-dot"/></button>)}</nav>}
              {mode!=='conditions'&&(isFinal?<div className="final-product"><span className="micro-label">FINAL PRODUCT SUPPLIED</span><MoleculeView molecule={question.target!} label={question.targetName}/><p>Choose the reagents and conditions for this last step.</p></div>:<Editor key={`${question.id}-${step}`} value={drawing!} onChange={changeDrawing} onLayout={changeLayout} starting={currentStart?.atoms.length?currentStart:undefined} disabled={busy}/>)}
              {mode!=='products'&&<ConditionPicker value={conditions} onChange={changeConditions} start={currentStart} disabled={busy}/>}
              {inputMessage&&<p className="input-message" role="alert">{inputMessage}</p>}
              {mode==='synthesis'&&<div className="step-actions">{step>0&&<button className="text-button" disabled={busy} onClick={()=>changeStep(step-1)}><ChevronLeft size={16}/>Previous step</button>}{step<session.steps.length-1&&<button className="step-next-button" disabled={busy} onClick={()=>changeStep(step+1)}>Next step<ArrowRight size={16}/></button>}</div>}
              <div className="answer-actions"><button className="solution-button" disabled={busy} onClick={()=>submit(true)}><BookOpen size={17} aria-hidden="true"/>Show solution</button><button className="primary-button" disabled={busy} onClick={()=>submit()}>{busy?<LoaderCircle size={17} className="spin"/>:<Check size={18}/>} {mode==='synthesis'?'Check route':'Check answer'}</button></div>
            </section>
          </div>
          {session.revealed&&<p className="practice-note">Solution viewed. You can edit and check your answer.{player&&' This challenge no longer earns XP.'}</p>}
          {feedback&&<section className={'feedback '+(feedback.correct?'correct':session.revealed?'solution':'retry')} aria-live="polite"><div className="feedback-title"><div><strong>{feedback.message}</strong>{feedback.explanation&&<p>{feedback.explanation}</p>}</div>{player&&!!feedback.xp&&<span className="xp-reward">+{feedback.xp} XP</span>}{feedback.stepIndex!==undefined&&<button className="secondary-button" onClick={()=>changeStep(feedback.stepIndex!)}>Edit step {feedback.stepIndex+1}</button>}</div>
            {session.revealed&&feedback.expected&&mode!=='synthesis'&&<div className="solution-row"><MoleculeView molecule={feedback.expected} label="Worked solution"/><div className="condition-tags">{displayConditions(feedback.expectedConditions??[],question.start).map(c=><span key={c}>{c}</span>)}</div></div>}
            {feedback.route&&<div className="solution-route">{feedback.route.map((s,i)=><div key={i}><span className="micro-label">STEP {i+1}</span><MoleculeView molecule={s.molecule} label={s.name}/><strong>{s.name}</strong><p>{[...s.conditions.filter(isOrganicReagent).map(id=>coReactant(id).label),...displayConditions(s.conditions,i===0?question.start:feedback.route![i-1].molecule)].join(' · ')}</p></div>)}</div>}
          </section>}
          {player&&levelUp&&<div className="level-up" role="status"><Trophy size={20}/>Level {levelUp} reached!</div>}
          <div className="below-workbench"><span className="save-note">{storageWarning?'Progress cannot be saved in this browser.':''}</span><button className="next-button" disabled={busy} onClick={nextChallenge}>New challenge<ArrowRight size={16}/></button></div>
        </>}
      </div>
    </main>
    {showTour&&<Tutorial mode={mode} signedIn={!!player} onFinish={finishTour}/>}
    {dialog&&<div className="dialog-backdrop" onClick={e=>{if(e.target===e.currentTarget)setDialog(null);}}><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button ref={closeRef} className="close-dialog" aria-label="Close dialog" onClick={()=>setDialog(null)}><X size={22}/></button><h2 id="dialog-title">{dialog==='library'?'Reaction library':dialog==='progress'?'Your progress':'How to play'}</h2>
      {dialog==='help'?<><button className="secondary-button" onClick={()=>{setDialog(null);setReplayTour(true);}}>Replay tutorial</button><p>Choose an atom and click the workspace, or drag it from the toolbar. Drag any atom to move it. Connected chains settle into a zigzag; loose atoms stay where you place them. Choose a bond and select its two atoms.</p><p>Use the eraser for atoms and bonds. Auto H fills unused valences. Undo/redo also support Ctrl/⌘ Z and Shift Z. With Move selected, arrow keys move the selected atom. Turn off Flexible layout if you prefer a stationary drawing.</p><p>Each synthesis step keeps its own drawing and conditions. Click any step to edit it. The final product is supplied. Drafts survive mode changes and reloads. Sign in with your school Google account to save them with your account.</p><p>For synthesis, tick “Use in step” beside a co-reactant only in the step where you use it. Each step saves its own choice. In single-reaction modes, co-reactants shown on the left are already provided. Select additional reagents, a catalyst and heating as needed. “Then H⁺(aq)” means a separate final acid work-up.</p><p>A solution can be viewed without locking your drawing.{player&&' That challenge will no longer award XP.'}</p></>:dialog==='progress'?<><div className="progress-grid">{player&&<><div><strong>{level.level}</strong><span>Level</span></div><div><strong>{progress.xp}</strong><span>Total XP</span></div></>}<div><strong>{progress.completed}</strong><span>Solved</span></div></div>{player&&<p>{level.toNext} XP to level {level.level+1}. Level costs rise: 100, 150, 200, 250 XP, and so on.</p>}{MODES.map(m=><div className="progress-row" key={m.id}><m.icon size={18}/><span>{m.name}</span><strong>{progress.byMode[m.id]}</strong></div>)}{player?<p className="small-note">Single reactions award 20, 35 or 50 XP. Synthesis routes award 50, 80 or 110 XP for 2, 3 or 4 steps. Each challenge earns XP once. These are practice scores, not HKDSE marks.</p>:<p className="small-note">Guest practice has no XP or levels. Sign in to save progress to your account and join the leaderboard.</p>}</>:<><p>{coverage.variants} bounded reaction variants from {coverage.rules} rules.</p><div className="library-list">{[['Addition','Hydrogenation; halogen and hydrogen halide addition.'],['Substitution','Methane monosubstitution, haloalkane hydrolysis and alcohol to haloalkane.'],['Oxidation & reduction','Primary/secondary alcohols, aldehydes, ketones and carboxylic acids.'],['Elimination','Primary-alcohol dehydration to terminal alkenes.'],['Esterification & amides','Formation and acid/alkaline hydrolysis; distinguish acids and carboxylates.'],['Polymers & other reactions','Addition/condensation repeat units, cracking and complete combustion.']].map(([title,description])=><div key={title}><h3>{title}</h3><p>{description}</p></div>)}</div><div className="scope-note"><strong>Scope</strong><p>Mostly straight-chain molecules, bounded at eight carbons. Stereochemistry, mechanisms and unrestricted multifunctional molecules are not assessed. Alternative procedures are accepted within the supported rules. Content still needs teacher review.</p><a href="https://www.edb.gov.hk/attachment/en/curriculum-development/kla/science-edu/ref-and-resources/Supplementory_note_for_Chem_20180818_Eng.pdf" target="_blank" rel="noreferrer">EDB curriculum notes</a></div></>}
    </section></div>}
  </div>;
}
