# Verification — 21 October 2026

Generator `2026.4`: **390 enumerated reaction variants, 35 rule variants, 11 families**.

## Automated checks

- `./scripts/run test`: **35 passing** chemistry, input, draft-state, reward and layout tests.
- `./scripts/run run test:integration`: **7 passing** against the development server and real PostgreSQL. Covers saved-question regeneration in all modes, repeated grading, reveal, malformed input, unknown IDs, generator-version rejection and an isolated unavailable-database check.
- `./scripts/run run typecheck`: passed.
- `./scripts/run run build`: passed after the final source changes, including Next.js TypeScript checks.

New regression coverage includes retaining later synthesis work during correction and reload; immutable automatic final product; missing-input identification; malformed/old saved-state rejection; contextual catalyst/halide equivalence including explicit OH hydrogen; organic co-reactant grading; difficulty rewards and level boundaries; and bounded zigzag arrangement without connectivity changes. New checks cover increasing level costs, stationary loose atoms, stable up/down chains, explicit per-step co-reactant grading, and compatibility with 2026.3 drafts. Existing structural, polymer, valence, conservation and request-size checks remain.

## Browser checks

Performed in the Codex in-app browser against the local app:

- Built a four-step 1-bromopropane → propanoate route with ethanol supplied on the left. Intentionally drew propanal for the full-oxidation step; checking identified step 2. Corrected it to propanoic acid, then jumped directly to step 3: the seven-atom ester and its selected conditions remained intact.
- Reload restored step 3, all four steps and their conditions. The final product was already supplied. The repaired route passed and awarded 110 XP, advancing to level 2. Rechecking did not award duplicate XP.
- Switched modes, revealed a dehydration solution, selected alumina and heat, then checked successfully. Viewing a solution no longer locks the controls and the revealed question awarded no XP. Returning to synthesis retained its draft.
- Dragged an atom with the atom tool selected: bonded neighbours responded. Undo restored the original coordinates in one action; redo worked. Turning off Flexible layout survived reload, then it was enabled again. In the latest pass, loose atoms remained at exactly their placed coordinates while choosing bond endpoints; connecting them worked without chasing moving atoms. Undo restored the original molecule. Dragging the completed ester preserved its correct grading.
- Verified additions, bond changes and erasing while constructing the synthesis route. The editor animates atom/bond entry and removal and respects reduced-motion preferences.
- Inspected the compact desktop and 390px phone layout. Measured 320px and 390px phone widths without page-level horizontal overflow.

- Restored the previous 2026.3 four-step draft with all drawings intact. Its omitted ethanol choice failed at step 3; selecting ethanol only in step 3 passed. Step 2 stayed unselected, and the step-3 selection survived navigation and reload.
- The existing 110 XP remained level 2, now with 140 XP remaining to level 3. The progress bar uses the current level’s 150-XP requirement.
- Atom clicks and drags consistently showed selection rings. Keyboard Enter selected an atom with a dashed circular focus ring; computed outline was `none`, without removing keyboard focus visibility.
- The 390px phone co-reactant control remained usable without horizontal overflow. Browser error/warning logs were empty after the checks. Temporary viewport overrides were reset.

[Desktop preview](preview-desktop.png)

## Changes

Replaced the hero/top mode tabs and hint UI with a compact sidebar-led workspace. Added XP/level display next to the profile, difficulty rewards, contextual merged reagent choices, supplied organic co-reactant diagrams, direct synthesis step navigation, persistent per-mode drafts, automatic final products, and flexible animated molecule editing. Incorrect and revealed answers remain editable and checkable; incomplete answers explain what is missing instead of silently disabling the button.

## Remaining limitations

This is a tested local prototype, not a curriculum-certified or publicly deployed service. Teacher content review, more devices/browsers and assistive-technology testing, and public-deployment protections remain outstanding. Browser flows above were exercised through the automation interface; they are not an unattended browser regression suite. Drafts are local to the browser/device. 2026.3 drafts remain compatible; older incompatible versions reset. See [chemistry scope](chemistry-scope.md) for bounded substrates, unsupported procedures and grading conventions.
