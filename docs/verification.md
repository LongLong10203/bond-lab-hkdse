# Verification

## Current release — generator 2026.6

636 enumerated assessed reaction variants, 46 rule variants; 12 reaction families plus the all-reactions selector. Polymer questions are removed; cyclic compounds and acid–base transformations are included.

- 62 unit/regression tests pass, including all generated reactant/product valences, amide coproduct charge states, variable assessed hydrolysis products, cracking conservation, ring formulas/graph equivalence, ring-preserving layout, shorter saved routes and obsolete-seed rejection.
- Independent breadth-first traversal checks 100 seeded synthesis routes for shortcuts. All 24 primary haloalkane/halogen homologues (C1–C8, Cl/Br/I) reach carboxylate in three transformations.
- All 20 local HTTP/PostgreSQL integration tests pass: grading, persistence, account isolation, XP idempotency, profiles, deletion, tutorial completion, invalid inputs and database failure handling. Test credentials now follow Next.js environment-file precedence.
- Browser checks cover the ring tool, converting a five-carbon ring from C5H10 to C5H8 by editing a bond, supplied amide coproducts, cyclic focus, and adjustable synthesis steps.
- Drawing checks verify mirrored carbon-group diagonals, equal-length double/triple bonds in eight directions, actual C/O/N symbol endpoints in both bond orders, C–halogen and explicit C–H endpoints, NH₄⁺ charge placement, preserved bond directions and attached-branch placement, explicit displaced N–H bonds, full-label selection circles and centred previews. Tall ring diagrams get extra vertical space.
- Older unfinished questions refresh under the new version. Existing account progress is retained.

## Historical verification (superseded chemistry rules)

# Verification — 24 October 2026

Generator `2026.4`: **390 enumerated reaction variants, 35 rule variants, 11 families**.

## Automated checks

- `./scripts/run test`: **43 passing** chemistry, input, draft-state, reward and layout tests.
- `./scripts/run run test:integration`: **20 passing** against the development server and real PostgreSQL. Covers saved-question regeneration in all modes, repeated grading, reveal, malformed input, unknown IDs, generator-version rejection and an isolated unavailable-database check.
- `./scripts/run run typecheck`: passed.
- `./scripts/run run build`: passed after the final source changes, including Next.js TypeScript checks.

New regression coverage includes retaining later synthesis work during correction and reload; immutable automatic final product; missing-input identification; malformed/old saved-state rejection; contextual catalyst/halide equivalence including explicit OH hydrogen; organic co-reactant grading; difficulty rewards and level boundaries; and bounded zigzag arrangement without connectivity changes. New checks cover increasing level costs, stationary loose atoms, stable up/down chains, explicit per-step co-reactant grading, and compatibility with 2026.3 drafts. Existing structural, polymer, valence, conservation and request-size checks remain.

## Accounts, onboarding and rankings

- Unit tests cover the exact school email/domain policy, verified Google profiles, progress validation, public profile mapping and nickname validation.
- HTTP/database integration tests cover anonymous rejection, cross-account access, session revocation, draft revision conflicts, concurrent XP awards, idempotent retries, removed reset endpoint, sorted rankings and stable ties, public-field privacy, nickname ownership, tutorial persistence without draft revision changes, and guest feedback with no XP.
- A real school Google login through its Microsoft SSO succeeded locally. An answer earned 20 XP and the account restored its saved state. Session fixtures are also used for isolated API tests; they do not replace real OAuth checks.
- Browser checked the welcome choices, signed-in five-step tour, guest tour, completion surviving reload, Help replay and skipping, guest progress with no levels/XP, and the signed-in leaderboard and clickable profile. Phone-width layouts were inspected.
- Production build and TypeScript checks passed. Production uses a separate database and OAuth configuration; a real login must also be checked at the live URL.

## Latest account and rendering checks

- Real local Google login: opened the chooser, went back, retried successfully, signed in, and reached the display-name prompt. Saved a temporary local nickname, opened the full leaderboard and profile routes, and changed the nickname. The temporary nickname was removed after the check.
- Account deletion tested with disposable accounts: owner-only, cross-origin rejection, cookie clearing, and cascading removal of sessions, OAuth data, progress, and score receipts. The real account was not deleted.
- Rendering regression checks cover baseline/size alignment and attachment to central elements across eight directions, parallel multiple bonds, and suppression of reversed lines for overlapping atoms. Visual comparison checked ethanol in horizontal, vertical, and diagonal placements.
- The standalone leaderboard and profile were checked at 320px, with no horizontal overflow. Profile editing and the account-deletion confirmation remain usable on mobile.
- The canonical production origin is now https://bond-lab-hkdse.vercel.app. The old project-team alias is redirected for app pages; OAuth callbacks use the short origin.

## Earlier chemistry browser checks

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

This is an educational prototype, not a curriculum-certified assessment service. Teacher content review, more devices/browsers and assistive-technology testing remain outstanding. Browser flows above were exercised through the automation interface; they are not an unattended browser regression suite. Guest drafts are local to the browser/device; school-account drafts are stored in PostgreSQL. The current 2026.5 release refreshes all earlier question drafts. See [chemistry scope](chemistry-scope.md) for bounded substrates, unsupported procedures and grading conventions.
