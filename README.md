# Bond Lab

An interactive organic chemistry practice game for HKDSE learners. Build molecules, choose reaction conditions, and plan multi-step syntheses with immediate feedback.

**[Play Bond Lab](https://bond-lab-hkdse.vercel.app)** — choose school sign-in or guest practice.

## About the project

This project was generated with **ChatGPT Astra 6**, with direction and iterative feedback from Long.

Bond Lab provides three practice modes:

- **Build the product:** draw the product from the starting compound and supplied conditions.
- **Find the conditions:** choose reagents and conditions for a given transformation.
- **Plan a synthesis:** solve a challenge in exactly the stated 2–4 steps, choose conditions and any organic co-reactants for each step, and move freely between steps. The final product is supplied. The required count and worked solution come from a shortest-path search of the supported reaction graph, including direct acid–base transformations. Shorter or longer submissions are rejected.

Alkene hydration and haloalkane elimination with ethanolic hydroxide are excluded from practice. Alcohol dehydration remains available.

Product questions show supplied coproducts without naming the answer’s functional group. Ester and amide hydrolysis can assess either product, including alcohols, amines, and ammonium ions in the appropriate medium. Cracking and combustion likewise ask for one product and display the other.

Cyclic practice covers five- and six-membered carbon rings: alkanes, alkenes, haloalkanes, alcohols and ketones. Use **Cyclic compounds** in the focus selector. The editor's **Add ring** tool inserts a closed 3–8-carbon ring; bonds and substituents remain editable. Polymer questions and the `*` continuation tool have been removed.

Generator `2026.7` refreshes older unfinished questions because their seeds now mean different questions. Account XP, scores, profiles, and tutorial completion are preserved.

The molecule editor supports dragging, flexible arrangement, animated changes, and reduced-motion preferences. Element symbols and adjacent hydrogen labels share a baseline; only counts are subscripted. Carbon–carbon bonds connect condensed CH, CH₂ and CH₃ groups. Bonds from carbon to any other element (including O, N, F, Cl, Br, I and explicit H) attach to the actual element symbols at both ends; hydrogen labels move out of the way without crossing bond lines. Attached labels and branches shift together so vertical, horizontal and diagonal bonds keep their intended directions. Other elements keep bonds anchored to their element symbol; hydrogens placed above or below them have explicit bonds. Charges sit snugly at the upper-right of the final full-size letter, above any subscript, such as NH₄⁺. Parallel double and triple bonds have equal lengths, and condensed carbon groups are centred for symmetric diagonal connections. Selection circles enclose the whole label, and molecule previews and copied reactants are centered using their full visible labels. Signed-in players earn XP for harder questions, and each level requires more XP than the previous one. Guest practice has no XP or levels. Worked solutions remain available; viewing one removes that question’s account XP reward. Answer controls and the highlighted next-challenge button stay in a fixed bar at the bottom of the screen, including when the page is at the top. Space beneath the content adjusts to the bar height. A five-step spotlight tutorial introduces the controls on first play, with a replay option in Help.

Questions are generated from bounded chemistry rules and checked on the server. This is an independent educational project, not an official HKEAA resource. It covers selected HKDSE organic chemistry topics, not the entire syllabus or every valid reaction. See the [chemistry scope](docs/chemistry-scope.md) for supported transformations and limitations. Teacher review is recommended before classroom assessment; game XP does not represent examination marks.

The [reaction methods guide](output/pdf/Bond-Lab-Reaction-Methods.pdf) provides reagent-to-reaction and reaction-to-condition tables, with [editable LaTeX source](output/pdf/reaction-methods/main.tex).

**Reaction library** opens a visual reference at `/library`, available to guests and signed-in players. Its 37 topics include nine cyclic reactions, searchable diagrams, example variants, all supplied products, and tables using the game's exact reagent, catalyst, heating and extra-option labels. Each table row is a complete accepted method; alternatives within a cell are joined by “or”. The entries are built from the same reaction rules used for practice. A downloadable [visual PDF guide](public/guides/bond-lab-reactions.pdf) is also available from the library.

Incorrect answers and worked solutions include **Review this reaction** links to the relevant entry; synthesis solutions include a link for each step. These links appear after feedback, not in the initial question. Opening the library from practice saves the current draft first, and **Back to practice** returns to it. Revealed solutions stay open across navigation, reloads, mode changes, edits and subsequent checks in all three modes. Answer feedback also survives navigation until the answer is edited. Older drafts that only stored the “solution viewed” flag recover their solution automatically. Starting a new challenge clears its predecessor's solution.

The visual PDF carries **© 2026 Long (LongLong10203)** on every page and uses this repository's MIT license. After replacing the PDF, run `python3 scripts/stamp-guide-copyright.py` (requires `pypdf` and `reportlab`) to apply the notice and synchronize the downloadable copy.

## Saved progress and data

Every new visit starts at a sign-in/register page with Google and guest choices. Guests keep unfinished answers and solved counts in their current browser, without XP or levels. Signed-in players save XP, solved counts, drawings, conditions, and their active game mode to their account. Synthesis drafts retain every step. Returning on another browser restores the account’s saved progress. Guest progress stays separate and is not automatically imported into an account.

Google sign-in accepts verified school accounts with an exact `syss.edu.hk` or `singyin.edu.hk` email domain and a matching Google Workspace domain. Private exceptions can be configured through the server-only `AUTH_ALLOWED_EMAILS` environment variable, using comma-separated exact email addresses. Exceptions still require Google-verified email ownership. Store the values in ignored `.env.local` for local use and as a sensitive Vercel production environment variable before deployment. Only an empty placeholder belongs in `.env.example`. The same access policy applies to sessions, saved progress, rankings, profiles and account deletion. The first successful sign-in creates the account. Accounts, sessions, practice drafts, and scores are stored in PostgreSQL. Answers and XP awards are checked on the server; each challenge awards XP once per account, and viewing its solution removes its reward. Signing out ends the session.

Account drafts save automatically after a short pause. Wait for “Saved to your account” before leaving. Failed saves show a retry option. A stale tab cannot overwrite a newer saved draft: reload it to continue from the latest saved version. Score reset is not available. To permanently remove your game data, open **My profile → Delete account**, type **DELETE**, and confirm. Deletion removes your profile, saved work, XP, OAuth records, and all sessions; it does not delete your Google account. A session older than one day requires a fresh Google sign-in before deletion. Signing in after deletion creates a new account.

## School leaderboard and profiles

Signed-in school players can open the full **Leaderboard** page in the navigation. Rankings use descending account XP, with a stable player-ID order for ties. Select a player to see their school email, level, XP, rank, solved counts by mode, and exact joining date (Hong Kong time). Emails appear in profiles, not in the game header or leaderboard rows. New players choose a display name before playing and can change it any time on **My profile**. Accounts without a chosen name are excluded from rankings; Google names, saved drawings, and login information are not published in profiles. Guests cannot access these endpoints.

Tutorial completion is saved per account, or in the guest browser. Skipping the tour also marks it complete; **Help → Replay tutorial** opens it again.

## Run locally

Requirements: **Node.js 24.x**, npm, and PostgreSQL. A local PostgreSQL launcher is included through `embedded-postgres`; alternatively, use your own PostgreSQL server.

From a checkout of this repository:

```sh
npm ci
cp .env.example .env
npm run db:start
```

Only copy `.env.example` when `.env` does not already exist. Keep the database terminal open. In a second terminal, from the same directory:

```sh
npm run setup
npm run dev
```

Open [localhost:3000](http://localhost:3000). Use this hostname consistently for Google sign-in. Stop the processes with Ctrl-C when finished.

The local database runs on `127.0.0.1:54329`, with database name, username, and password all set to `bondlab`. These credentials are for local development only. Data persists in `.postgres/data`, which is excluded from Git. To use another PostgreSQL server, set `DATABASE_URL` in `.env`, skip `db:start`, and run the remaining setup commands.

### Google sign-in for local testing

Follow [the Google login setup guide](docs/google-login-local.md). Add `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` to the ignored `.env.local` file. Until Google credentials are configured, guest practice remains available and the sign-in button is disabled.

## Development checks

```sh
npm test
npm run typecheck
npm run build
```

With both the app and its development database running, also run:

```sh
npm run test:integration
```

Unit tests do not require a database. Integration tests exercise challenge creation, grading, account privacy, session revocation, saved drafts, account deletion, login retries, concurrent awards, retry handling, leaderboard ordering and privacy, nickname ownership, tutorial completion, and guest grading without XP through the local HTTP API, then remove their temporary records. Account tests require the same `BETTER_AUTH_SECRET` as the local server. They create local session fixtures; they do not simulate a real successful Google login. Set `TEST_BASE_URL` if the local app uses a different port. The integration runner rejects non-local URLs.

For a local production preview, stop the development app, run `npm run build`, and then `npm start` with PostgreSQL still running.

## Project structure

Built with **Next.js, React, TypeScript, PostgreSQL, and Prisma**.

- `src/chemistry/`: molecules, reaction rules, question generation, grading, and rewards.
- `src/components/`: game interface, molecule editor, and condition selector.
- `src/app/api/`: challenges, grading, authentication, saved progress, profiles, and rankings.
- `src/lib/`: database access, validation, and saved-practice handling.
- `prisma/`: database schema and migrations.
- `tests/`: chemistry, input, and integration checks.
- `docs/`: chemistry scope and verification notes.

When changing reaction rules, seeded question generation, or grading semantics, update the generator version in `src/chemistry/rules.ts` and handle saved-question compatibility deliberately. Add checks for accepted answers and incorrect near-misses. See [verification notes](docs/verification.md) for existing coverage and review needs.

## Deployment

The repository is connected to Vercel: pushes to `main` trigger production deployments. The production game is public; preview deployments require Vercel access.

Vercel builds the project root using Node.js 24 and `npm run build:vercel`. This applies checked-in Prisma migrations before building the application. Production uses Neon PostgreSQL through the Vercel Marketplace.

Follow the [production Google sign-in guide](docs/google-login-production.md) for exact console steps and URLs. Before deploying Google login, configure a fresh `BETTER_AUTH_SECRET`, the production `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`, and register the exact production `/api/auth/callback/google` URI with Google. Do not reuse the local database for deployment.

For another deployment, configure server-only `DATABASE_URL` and, when available, `DATABASE_URL_UNPOOLED` environment variables. The app uses the pooled connection; migrations prefer the unpooled connection. Keep credentials in environment settings, never in Git. Local environment files, database data, runtime files, and Vercel connection files are excluded from version control.

The current database connection is configured for production only. Preview deployments need their own test database connection to build and run. Review migrations before pushing because production deployments apply them automatically.

## License

[MIT](LICENSE). You may use, modify, and share the project while retaining the copyright and license notice. Third-party dependencies retain their own licenses.
