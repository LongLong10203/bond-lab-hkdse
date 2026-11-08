import test from 'node:test';
import assert from 'node:assert/strict';
import { reactionLibrary, reactionReviewTopic, libraryMethods } from '../src/chemistry/library';
import { reactions, startingCompounds, FAMILIES } from '../src/chemistry/rules';
import { CATALYSTS, HEATING, reagentOptions, isAlcohol } from '../src/chemistry/condition-options';
import { reactionCoReactants } from '../src/chemistry/context';
import { conditionsMatch, validate } from '../src/chemistry/check';
import { generate } from '../src/chemistry/generate';
import { grade, solution } from '../src/chemistry/grading';
import { molecule } from '../src/chemistry/molecules';

const entries = reactionLibrary();
const topics = new Map(entries.map(entry => [entry.id, entry]));

test('every assessed reaction maps to a library page, including the alternate hydrolysis products and rings', () => {
  assert.equal(entries.length, 37);
  assert.equal(entries.filter(entry => entry.cyclic).length, 9);
  assert.equal(topics.size, entries.length);
  for (const reaction of startingCompounds().flatMap(reactions)) {
    const topic = reactionReviewTopic(reaction);
    assert.equal(topics.get(topic.id)?.title, topic.title, reaction.ruleId);
    assert.equal(topics.get(topic.id)?.cyclic, !!reaction.start.cyclic);
  }
  assert.equal(entries.some(entry => /hydration|ethanolic|polymer/i.test(entry.title)), false);
  for (const entry of entries) for (const example of entry.examples) {
    for (const species of [...example.reactants, ...example.products]) assert.equal(validate(species.molecule), null);
    if (entry.family === 'hydrolysis') assert.equal(example.products.length, 2);
  }
});

test('every displayed option row reconstructs an accepted answer using the actual picker labels', () => {
  for (const reaction of startingCompounds().flatMap(reactions)) {
    const start = molecule(reaction.start);
    const options = reagentOptions(start);
    const partners = reactionCoReactants([reaction]);
    for (const method of libraryMethods(reaction)) for (const heating of method.heating) {
      const selected = [
        ...method.reagents.flatMap(label => {
          const option = options.find(option => option.label === label);
          const partner = partners.find(partner => partner.label === label);
          assert.ok(option || partner, label);
          return option?.values ?? [partner!.id];
        }),
        ...CATALYSTS.find(option => option.label === method.catalyst)!.values,
        ...HEATING.find(option => option.label === heating)!.values,
        ...method.extra.map(label => {
          assert.ok(['UV light', 'Then H⁺(aq)'].includes(label));
          return label === 'UV light' ? 'uv' : 'workup';
        }),
      ];
      assert.ok(conditionsMatch(selected, reaction.conditions, { alcohol: isAlcohol(start) }), `${reaction.ruleId}: ${selected}`);
    }
  }
});

test('single-reaction feedback links to the correct entry without adding hints to the initial question', () => {
  for (const family of FAMILIES) for (const mode of ['products', 'conditions'] as const) {
    const { reaction, question } = generate(134, mode, family.id);
    assert.equal('reviewTopics' in question, false);
    const expected = [reactionReviewTopic(reaction)];
    assert.deepEqual(grade(134, mode, family.id, {}).reviewTopics, expected);
    assert.deepEqual(solution(134, mode, family.id).reviewTopics, expected);
    const answer = mode === 'products' ? { molecule: molecule(reaction.product) } : { conditions: reaction.conditions[0] };
    assert.equal(grade(134, mode, family.id, answer).correct, true);
  }
});

test('synthesis reviews the failed transformation and supplies a separate reference for each solution step', () => {
  for (let seed = 1; seed <= 15; seed++) {
    const { route } = generate(seed, 'synthesis');
    const revealed = solution(seed, 'synthesis', 'all');
    assert.deepEqual(revealed.route!.map(step => step.reviewTopic), route.map(reactionReviewTopic));
    const steps = route.map(reaction => ({ molecule: molecule(reaction.product), conditions: reaction.conditions[0] }));
    const index = steps.length - 1;
    steps[index].conditions = [];
    const feedback = grade(seed, 'synthesis', 'all', { steps });
    assert.equal(feedback.correct, false);
    assert.equal(feedback.stepIndex, index);
    assert.ok(feedback.reviewTopics?.length);
    assert.ok(topics.has(feedback.reviewTopics![0].id));
  }
});
