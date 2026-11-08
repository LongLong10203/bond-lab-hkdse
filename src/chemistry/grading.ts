import type { Answer, Compound, Grade, Mode } from './types';
import { generate, shortestRoute } from './generate';
import { reactionReviewTopic } from './library';
import { equivalent, validate, conditionsMatch } from './check';
import { molecule,name } from './molecules';
import { isAlcohol,isOrganicReagent } from './condition-options';
import { reactions } from './rules';
export function grade(seed:number,mode:Mode,family:string,answer:Answer):Grade{
  const {reaction,route,question}=generate(seed,mode,family);
  const reviewTopics = [reactionReviewTopic(reaction)];
  const nextReview = (current: Compound, remaining: number) => {
    const next = shortestRoute(current, route.at(-1)!.product, remaining)?.[0];
    return next ? [reactionReviewTopic(next)] : [];
  };
  const context=(c:Compound)=>({alcohol:isAlcohol(molecule(c)),provided:question.coReactants.map(r=>r.id)});
  if(mode==='synthesis'){
    const steps=answer.steps??[];if(steps.length!==route.length)return {correct:false,reviewTopics,message:`Use exactly ${route.length} transformations. Each step needs a product and conditions.`};
    let current:Compound=reaction.start;
    for(let i=0;i<steps.length;i++){
      const invalid=validate(steps[i].molecule);if(invalid)return {correct:false,reviewTopics:nextReview(current,steps.length-i),stepIndex:i,message:`Step ${i+1}: ${invalid}`};
      const possible=reactions(current).filter(r=>equivalent(molecule(r.product),steps[i].molecule));
      const accepted=possible.find(r=>conditionsMatch(steps[i].conditions,r.conditions,{alcohol:isAlcohol(molecule(current))}));
      if(!accepted){
        const needsCoReactant=possible.some(r=>r.conditions.some(set=>set.some(isOrganicReagent)));
        return {correct:false,reviewTopics:possible.length?[reactionReviewTopic(possible[0])]:nextReview(current,steps.length-i),stepIndex:i,message:`Step ${i+1}: ${possible.length?(needsCoReactant?'Check the co-reactant selected for this step, as well as its reagents and conditions.':'The intermediate is reachable. Check your conditions and remove any co-reactant not used in this step.'):'This intermediate does not follow a supported transformation from the previous molecule.'}`};
      }
      current=accepted.product;
    }
    return equivalent(molecule(current),molecule(route.at(-1)!.product))?{correct:true,xp:question.reward,message:'Route complete. Every transformation checks out.',explanation:'Your route uses valid structures and conditions at every step.'}:{correct:false,reviewTopics:nextReview(current,4),message:'Your transformations are valid, but the final molecule is not the target.'};
  }
  const alternatives=reactions(reaction.start).filter(r=>equivalent(molecule(r.product),molecule(reaction.product))&&(r.coProducts??[]).length===(reaction.coProducts??[]).length&&(r.coProducts??[]).every((c,i)=>equivalent(molecule(c),molecule(reaction.coProducts![i]))));
  const correct=mode==='conditions'?conditionsMatch(answer.conditions??[],alternatives.flatMap(r=>r.conditions),context(reaction.start)):!!answer.molecule&&equivalent(answer.molecule,molecule(reaction.product));
  if(mode==='products'&&answer.molecule){const invalid=validate(answer.molecule);if(invalid)return {correct:false,reviewTopics,message:invalid};}
  return {correct,...(correct?{xp:question.reward}:{reviewTopics}),message:correct?'That’s a good reaction.':mode==='conditions'?'Check the reagent, reaction medium and heating conditions. Select one valid alternative, without extra conditions.':'Check the functional group, carbon skeleton and bond orders.',...(correct?{explanation:reaction.explanation}:{})};
}
export function solution(seed:number,mode:Mode,family:string):Grade{
  const {reaction,route}=generate(seed,mode,family);
  return {correct:false,message:'Worked solution',explanation:reaction.explanation,expected:molecule(reaction.product),expectedConditions:reaction.conditions[0],...(mode!=='synthesis'?{reviewTopics:[reactionReviewTopic(reaction)]}:{}),...(mode==='synthesis'?{route:route.map(r=>({name:name(r.product),molecule:molecule(r.product),conditions:r.conditions[0],reviewTopic:reactionReviewTopic(r)}))}:{})};
}
