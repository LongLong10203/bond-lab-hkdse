# Chemistry scope and review notes

Bond Lab uses bounded examples based on compulsory HKDSE organic chemistry. It is not a universal reaction predictor or a curriculum-certified assessment service.

## Current coverage — generator 2026.7

- Acyclic chains and ester/amide total carbon counts up to eight carbons.
- Cyclopentane/cyclohexane derivatives: cycloalkenes, halocycloalkanes, cycloalkanols, cycloalkanones and vicinal dihalides. Ring retention is checked structurally. Small-ring reactivity, aromatic compounds, fused rings and stereochemistry are not generated.
- Hydrogenation and halogen/hydrogen-halide addition. Alkene hydration is excluded.
- Methane monosubstitution, haloalkane hydrolysis and alcohol-to-haloalkane substitution.
- Dehydration of primary alcohols or unsubstituted cycloalkanols. Haloalkane elimination using ethanolic hydroxide is excluded.
- Primary-alcohol and aldehyde oxidation; secondary/cyclic alcohol oxidation to ketones; carbonyl and carboxylic-acid reduction.
- Esterification and unsubstituted amide formation from an acid.
- Acidic/alkaline ester and amide hydrolysis, optionally followed by excess acid work-up.
- Direct acid/carboxylate and amine/ammonium acid–base interconversion.
- Cracking and complete combustion.
- Polymer questions and continuation pseudo-atoms have been removed at the project owner's request. The ring tool creates real carbon–carbon ring closure bonds.

## Multiple products and assessment

The prompt does not reveal the requested product class. Other molecular products are supplied and excluded from the assessed drawing. Hydrolysis can ask for the acid/carboxylate or the alcohol/amine/ammonium product. Acidic amide hydrolysis and excess acid work-up show protonated nitrogen products; alkaline hydrolysis shows neutral amines/ammonia. Spectator counter-ions are omitted. The condition grader checks both the target and the supplied coproduct, so acid and alkaline conditions cannot be interchanged merely because both yield an alcohol.

Cracking questions supply one possible alkane or alkene and ask for the other, conserving all atoms across the pair. Combustion supplies either water or carbon dioxide and asks for the other; coefficients are not assessed. Water is shown for esterification, amide formation, dehydration and selected acid–base steps. Inorganic reagent residues/spectator salts are outside the drawing task. This interface does not represent a complete balanced equation.

## Synthesis

Challenges require exactly 2–4 steps. A breadth-first search finds a shortest supported route to each sampled target, including the fallback target. The actual shortest route determines the stated count, worked solution and XP reward. The interface supplies that fixed number of steps, saved drafts must match it, and the server rejects any submission with fewer or more steps. Every submitted transformation and the final target are validated. In particular, haloalkane → primary alcohol → acid → carboxylate takes three steps; no esterification/hydrolysis detour is required. This is not a claim of a global shortest synthesis across chemistry outside the implemented rules.

Co-reactants are available for the route but must be selected only in the step where they are used. Alternative complete procedures are accepted within the supported selector. Extra irrelevant reagents fail. The final product is supplied, and earlier intermediates remain editable. Older generator seeds are rejected and refreshed; saved XP is independent of question drafts.

## References and boundaries

- [EDB Chemistry Notes for Teachers](https://www.edb.gov.hk/attachment/en/curriculum-development/kla/science-edu/ref-and-resources/Supplementory_note_for_Chem_20180818_Eng.pdf): Topics V and XI, reaction annex.
- [HKEAA 2021 Level 3 sample](https://www.hkeaa.edu.hk/DocLibrary/HKDSE/Subject_Information/chem/2021-Sample-CHEM-Level3-E.pdf): cyclohexene context. Candidate answers are not treated as a marking scheme.
- [OpenStax: Chemistry of Amides](https://openstax.org/books/organic-chemistry/pages/21-7-chemistry-of-amides): hydrolysis and protonation states.
- [OpenStax: Reactions of Alcohols](https://openstax.org/books/organic-chemistry/pages/17-6-reactions-of-alcohols) and [Oxidation of Alcohols](https://openstax.org/books/organic-chemistry/pages/17-7-oxidation-of-alcohols): dehydration and carbonyl products.

No mechanisms, stereochemistry, yields, arbitrary multifunctional molecules or aromatic chemistry are assessed. Some valid syllabus alternatives still require additional rules (for example HF addition, PI₃ substitution and ordered PCl₃/NH₃ amide preparation). Ether synthesis/cleavage is not implemented; the existing alcohol coproduct questions concern esters. Teacher review remains appropriate before classroom assessment.
