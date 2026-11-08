import { z } from 'zod';
import type { Answer,ChallengeData,Grade,Mode,Molecule } from '@/chemistry/types';
import { moleculeSchema } from './validation';
import { VERSION,COMPATIBLE_VERSIONS } from '@/chemistry/rules';
export type StepDraft={molecule:Molecule;conditions:string[]};
export type PracticeSession={question:ChallengeData;drawing:Molecule;conditions:string[];steps:StepDraft[];activeStep:number;revealed:boolean;awarded:boolean;feedback:Grade|null;solution:Grade|null};
export const emptyMolecule=():Molecule=>({atoms:[],bonds:[],autoH:true});
export function newSession(question:ChallengeData):PracticeSession{return {question,drawing:emptyMolecule(),conditions:[],steps:question.mode==='synthesis'?Array.from({length:question.stepLimit!},(_,i)=>({molecule:i===question.stepLimit!-1?structuredClone(question.target!):emptyMolecule(),conditions:[]})):[],activeStep:0,revealed:false,awarded:false,feedback:null,solution:null};}
export function withGrade(session:PracticeSession,result:Grade,reveal=false):PracticeSession {
  return reveal ? {...session,revealed:true,solution:gradeSchema.parse(result),feedback:null} :
    {...session,feedback:{...gradeSchema.parse(result),...(result.xp!==undefined?{xp:result.xp}:{})},activeStep:result.stepIndex??session.activeStep};
}
export function editStep(session:PracticeSession,index:number,patch:Partial<StepDraft>):PracticeSession{
  if(index<0||index>=session.steps.length)return session;
  return {...session,feedback:null,steps:session.steps.map((step,i)=>i===index?{...step,...patch,molecule:i===session.steps.length-1?structuredClone(session.question.target!):(patch.molecule??step.molecule)}:step)};
}
export function answerFor(session:PracticeSession):Answer{return session.question.mode==='synthesis'?{steps:session.steps.map((s,i)=>({...s,molecule:i===session.steps.length-1?session.question.target!:s.molecule}))}:{molecule:session.drawing,conditions:session.conditions};}
export function missingInput(session:PracticeSession){
  if(session.question.mode==='synthesis'){
    if(session.steps.length!==session.question.stepLimit)return {message:`Use exactly ${session.question.stepLimit} transformations.`};
    const index=session.steps.findIndex(s=>!s.molecule.atoms.length||!s.conditions.length);
    if(index>=0)return {step:index,message:`Step ${index+1}: ${!session.steps[index].molecule.atoms.length?'draw the intermediate':'choose reagents and conditions'}.`};
  }else if(session.question.mode==='products'&&!session.drawing.atoms.length)return {message:'Draw your product to check it.'};
  else if(session.question.mode==='conditions'&&!session.conditions.length)return {message:'Choose reagents and conditions to check your answer.'};
  return null;
}
const coSchema=z.object({id:z.string(),label:z.string(),molecule:moleculeSchema});
const reviewTopicSchema=z.object({id:z.string().max(120).regex(/^[a-z0-9-]+$/),title:z.string().max(200)});
// Keep display content, never server score/progress data or submission receipts.
const gradeSchema=z.object({correct:z.boolean(),message:z.string().max(2000),stepIndex:z.number().int().min(0).max(3).optional(),explanation:z.string().max(4000).optional(),reviewTopics:z.array(reviewTopicSchema).max(4).optional(),expected:moleculeSchema.optional(),expectedConditions:z.array(z.string()).max(20).optional(),route:z.array(z.object({name:z.string().max(200),molecule:moleculeSchema,conditions:z.array(z.string()).max(20),reviewTopic:reviewTopicSchema.optional()})).max(4).optional()});
const questionSchema=z.object({id:z.string().min(1).max(40),mode:z.enum(['products','conditions','synthesis']),family:z.string(),version:z.string().refine(v=>COMPATIBLE_VERSIONS.includes(v)),title:z.string(),start:moleculeSchema,startName:z.string(),extras:z.string(),conditions:z.array(z.string()).optional(),target:moleculeSchema.optional(),targetName:z.string().optional(),stepLimit:z.number().int().min(2).max(4).optional(),instruction:z.string(),coReactants:z.array(coSchema),coProducts:z.array(coSchema),reward:z.number().int().positive(),difficulty:z.enum(['Foundation','Intermediate','Advanced'])});
const sessionSchema=z.object({question:questionSchema,drawing:moleculeSchema,conditions:z.array(z.string()).max(20),steps:z.array(z.object({molecule:moleculeSchema,conditions:z.array(z.string()).max(20)})).max(4),activeStep:z.number().int().min(0).max(3),revealed:z.boolean(),awarded:z.boolean(),feedback:gradeSchema.nullable().catch(null),solution:gradeSchema.refine(value=>!!value.expected||!!value.route?.length).nullable().catch(null)}).refine(session=>session.question.mode!=='synthesis'||(
  !!session.question.target&&!!session.question.stepLimit&&
  session.steps.length===session.question.stepLimit&&session.activeStep<session.steps.length
),{message:'Synthesis drafts must contain exactly the required number of steps.'});
export const sessionsSchema=z.object({products:sessionSchema.optional(),conditions:sessionSchema.optional(),synthesis:sessionSchema.optional()}).strict();
export function restoreSessions(raw:string|null):Partial<Record<Mode,PracticeSession>>{
  if(!raw)return {};const output:Partial<Record<Mode,PracticeSession>>={};
  try{const stored=JSON.parse(raw);for(const mode of ['products','conditions','synthesis'] as const){const result=sessionSchema.safeParse(stored[mode]);if(!result.success||result.data.question.mode!==mode)continue;const s=result.data;if(mode!=='products'&&!s.question.target)continue;if(mode==='synthesis'&&(!s.question.stepLimit||s.steps.length!==s.question.stepLimit||s.activeStep>=s.steps.length))continue;const legacySolution=s.revealed&&(s.feedback?.expected||s.feedback?.route)?s.feedback:null;output[mode]={...s,question:{...s.question,version:VERSION},solution:s.revealed?s.solution??legacySolution:null,feedback:legacySolution?null:s.feedback};}}catch{}
  return output;
}
