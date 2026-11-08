import { conditionsMatch } from './check';
import { CATALYSTS, HEATING, isAlcohol, isOrganicReagent, reagentOptions } from './condition-options';
import { reactionCoReactants } from './context';
import { molecule, name } from './molecules';
import { FAMILIES, familyOf, reactions, startingCompounds } from './rules';
import type { Reaction, ReviewTopic } from './types';

const titles: Record<string, string> = {
  'substitution:alkane': 'Methane substitution',
  'cracking:alkane': 'Cracking',
  'combustion:complete': 'Complete combustion',
  'addition:hydrogen': 'Alkene → alkane',
  'addition:halogen': 'Halogen addition',
  'addition:hydrogen-halide': 'Hydrogen halide addition',
  'substitution:hydrolysis': 'Haloalkane → alcohol',
  'substitution:alcohol': 'Alcohol → haloalkane',
  'elimination:dehydration': 'Alcohol → alkene',
  'oxidation:primary-aldehyde': 'Primary alcohol → aldehyde',
  'oxidation:primary-acid': 'Primary alcohol → carboxylic acid',
  'oxidation:secondary': 'Secondary alcohol → ketone',
  'oxidation:aldehyde': 'Aldehyde → carboxylic acid',
  'reduction:carbonyl-aldehyde': 'Aldehyde → primary alcohol',
  'reduction:carbonyl-ketone': 'Ketone → secondary alcohol',
  'reduction:acid': 'Carboxylic acid → primary alcohol',
  'esterification:acid': 'Esterification',
  'amide:formation': 'Amide formation',
  'hydrolysis:ester-acid': 'Ester hydrolysis · acidic',
  'hydrolysis:ester-base': 'Ester hydrolysis · alkaline',
  'hydrolysis:ester-workup': 'Ester hydrolysis · alkaline, then acid',
  'hydrolysis:amide-acid': 'Amide hydrolysis · acidic',
  'hydrolysis:amide-base': 'Amide hydrolysis · alkaline',
  'hydrolysis:amide-workup': 'Amide hydrolysis · alkaline, then acid',
  'acid-base:neutralise': 'Carboxylic acid → carboxylate',
  'acid-base:acidify': 'Carboxylate → carboxylic acid',
  'acid-base:amine': 'Amine → ammonium ion',
  'acid-base:ammonium': 'Ammonium ion → amine',
};
const cyclicTitles: Record<string, string> = {
  'addition:hydrogen': 'Cycloalkene → cycloalkane',
  'addition:halogen': 'Cycloalkene + halogen',
  'addition:hydrogen-halide': 'Cycloalkene + hydrogen halide',
  'substitution:hydrolysis': 'Halocycloalkane → cycloalkanol',
  'substitution:alcohol': 'Cycloalkanol → halocycloalkane',
  'elimination:dehydration': 'Cycloalkanol → cycloalkene',
  'oxidation:secondary': 'Cycloalkanol → cycloalkanone',
  'reduction:carbonyl-ketone': 'Cycloalkanone → cycloalkanol',
  'combustion:complete': 'Cycloalkane combustion',
};

export function reactionReviewTopic(reaction: Reaction): ReviewTopic {
  let key = reaction.ruleId.replace(/-other$/, '').replace(/-(Cl|Br|I)$/, '').replace(/:acid-[123]$/, ':acid');
  if (key === 'reduction:carbonyl') key += `-${reaction.start.kind}`;
  const title = (reaction.start.cyclic ? cyclicTitles : titles)[key];
  if (!title) throw new Error(`Missing library topic for ${reaction.ruleId}`);
  return { id: `${reaction.start.cyclic ? 'cyclic-' : ''}${key.replace(':', '-')}`, title };
}

export type LibraryMethod = {
  reagents: string[];
  catalyst: string;
  heating: string[];
  extra: string[];
};
export function libraryMethods(reaction: Reaction): LibraryMethod[] {
  const start = molecule(reaction.start);
  const methods: LibraryMethod[] = [];
  for (const conditions of reaction.conditions) {
    const selectedReagents = reagentOptions(start).filter(option => conditions.includes(option.id) ||
      (isAlcohol(start) && option.id === 'hcl' && conditions.includes('pcl3')) ||
      (isAlcohol(start) && option.id === 'hbr' && conditions.includes('pbr3')));
    const catalyst = CATALYSTS.find(option => option.id && option.values.some(value => conditions.includes(value) ||
      (value === 'pt' && conditions.some(id => ['ni', 'pd'].includes(id))))) ?? CATALYSTS[0];
    const heating = conditions.includes('distil') ? HEATING.find(option => option.id === 'distil')! :
      HEATING.find(option => option.id && conditions.includes(option.id)) ?? HEATING[0];
    const extra = [
      ...(conditions.includes('uv') ? ['UV light'] : []),
      ...(conditions.includes('workup') && !conditions.includes('lialh4') ? ['Then H⁺(aq)'] : []),
    ];
    // Verify that the displayed selector combination is accepted by the real grader.
    const selected = [...selectedReagents.flatMap(option => option.values), ...catalyst.values, ...heating.values,
      ...conditions.filter(isOrganicReagent), ...(conditions.includes('uv') ? ['uv'] : []),
      ...(conditions.includes('workup') ? ['workup'] : [])];
    if (!conditionsMatch(selected, reaction.conditions, { alcohol: isAlcohol(start) })) {
      throw new Error(`Unselectable library method for ${reaction.ruleId}`);
    }
    const reagents = [...reactionCoReactants([reaction]).map(partner => partner.label), ...selectedReagents.map(option => option.label)];
    const matching = methods.find(method => method.catalyst === catalyst.label &&
      method.reagents.join('|') === reagents.join('|') && method.extra.join('|') === extra.join('|'));
    if (matching) {
      if (!matching.heating.includes(heating.label)) matching.heating.push(heating.label);
    } else methods.push({ reagents, catalyst: catalyst.label, heating: [heating.label], extra });
  }
  return methods;
}

export type LibraryExample = {
  label: string;
  reactants: { label: string; molecule: ReturnType<typeof molecule> }[];
  products: { label: string; molecule: ReturnType<typeof molecule> }[];
  methods: LibraryMethod[];
};
export type LibraryEntry = ReviewTopic & {
  family: string;
  familyLabel: string;
  cyclic: boolean;
  note: string;
  examples: LibraryExample[];
};
function exampleScore(reaction: Reaction) {
  const start = reaction.start;
  const preferred = start.cyclic ? 6 : reaction.ruleId === 'cracking:alkane' ? 4 :
    start.kind === 'ketone' || start.position === 1 ? 3 : 2;
  return Math.abs(start.n - preferred) * 10 + Math.abs((start.m ?? 1) - 1);
}
function exampleKey(reaction: Reaction) {
  return `${reaction.ruleId}-${reaction.start.kind === 'amide' && reaction.start.m ? 'substituted' : 'plain'}`;
}
function exampleLabel(reaction: Reaction) {
  if (reaction.start.kind === 'amide') return reaction.start.m ? 'N-substituted amide' : 'Unsubstituted amide';
  const halogen = reaction.ruleId.match(/-(Cl|Br|I)$/)?.[1];
  if (halogen) return { Cl: 'Chlorine', Br: 'Bromine', I: 'Iodine' }[halogen]!;
  const partner = reactionCoReactants([reaction])[0];
  return partner?.label ?? 'Example';
}
function entryNote(reaction: Reaction) {
  if (reaction.ruleId.startsWith('hydrolysis:')) return 'Either product can be assessed. Draw the product that is not already supplied.';
  if (reaction.ruleId.startsWith('esterification:')) return 'In synthesis, select “Use in step” for the alcohol. Single-reaction questions supply it.';
  if (reaction.ruleId === 'cracking:alkane' || reaction.ruleId === 'combustion:complete') return 'The game supplies one product and asks for the other.';
  return '';
}

export function reactionLibrary(): LibraryEntry[] {
  const groups = new Map<string, Reaction[]>();
  for (const reaction of startingCompounds().flatMap(reactions)) {
    if (reaction.ruleId.endsWith('-other')) continue;
    const { id } = reactionReviewTopic(reaction);
    const group = groups.get(id) ?? [];
    group.push(reaction);
    groups.set(id, group);
  }
  return [...groups.values()].map(group => {
    const representatives = new Map<string, Reaction>();
    for (const reaction of group) {
      const key = exampleKey(reaction);
      const previous = representatives.get(key);
      if (!previous || exampleScore(reaction) < exampleScore(previous)) representatives.set(key, reaction);
    }
    const first = group[0];
    const family = familyOf(first.ruleId);
    return {
      ...reactionReviewTopic(first), family,
      familyLabel: FAMILIES.find(item => item.id === family)!.label,
      cyclic: !!first.start.cyclic, note: entryNote(first),
      examples: [...representatives.values()].map(reaction => ({
        label: exampleLabel(reaction),
        reactants: [{ label: name(reaction.start), molecule: molecule(reaction.start) }, ...reactionCoReactants([reaction])],
        products: [reaction.product, ...(reaction.coProducts ?? [])].map(compound => ({ label: name(compound), molecule: molecule(compound) })),
        methods: libraryMethods(reaction),
      })),
    };
  }).sort((a, b) => Number(a.cyclic) - Number(b.cyclic) || a.familyLabel.localeCompare(b.familyLabel) || a.title.localeCompare(b.title));
}
