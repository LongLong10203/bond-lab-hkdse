# Bond Lab

An interactive organic chemistry practice game for HKDSE learners. Build molecules, choose reaction conditions, and plan multi-step syntheses with immediate feedback.

**[Play Bond Lab](https://bond-lab-hkdse-longs-projects-0240e8f8.vercel.app)** — no account required.

## About the project

This project was generated with **ChatGPT Astra 6**, with direction and iterative feedback from Long.

Bond Lab provides three practice modes:

- **Build the product:** draw the product from the starting compound and supplied conditions.
- **Find the conditions:** choose reagents and conditions for a given transformation.
- **Plan a synthesis:** construct a 2–4-step route, choose conditions and any organic co-reactants for each step, and move freely between steps. The final product is supplied.

The molecule editor supports dragging, flexible arrangement, animated changes, and reduced-motion preferences. Harder questions earn more XP, and each level requires more XP than the previous one. Worked solutions remain available; viewing one removes that question’s XP reward.

Questions are generated from bounded chemistry rules and checked on the server. This is an independent educational project, not an official HKEAA resource. It covers selected HKDSE organic chemistry topics, not the entire syllabus or every valid reaction. See the [chemistry scope](docs/chemistry-scope.md) for supported transformations and limitations. Teacher review is recommended before classroom assessment; game XP does not represent examination marks.

## Saved progress and data

XP and unfinished answers are saved in the current browser. Synthesis drafts retain each step’s drawing and conditions when navigating or correcting answers. Progress is not synchronised across devices or site addresses, and clearing browser storage removes it.

The application database stores challenge IDs, seeds, modes, reaction families, generator versions, and creation times. Answers are regenerated on the server. The game does not require a player account.

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

Open [localhost:3000](http://127.0.0.1:3000). Stop the processes with Ctrl-C when finished.

The local database runs on `127.0.0.1:54329`, with database name, username, and password all set to `bondlab`. These credentials are for local development only. Data persists in `.postgres/data`, which is excluded from Git. To use another PostgreSQL server, set `DATABASE_URL` in `.env`, skip `db:start`, and run the remaining setup commands.

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

Unit tests do not require a database. Integration tests exercise challenge creation, saved-question regeneration, and grading through the local HTTP API, then remove the records they created. Set `TEST_BASE_URL` if the local app uses a different port. The integration runner rejects non-local URLs.

For a local production preview, stop the development app, run `npm run build`, and then `npm start` with PostgreSQL still running.

## Project structure

Built with **Next.js, React, TypeScript, PostgreSQL, and Prisma**.

- `src/chemistry/`: molecules, reaction rules, question generation, grading, and rewards.
- `src/components/`: game interface, molecule editor, and condition selector.
- `src/app/api/`: challenge creation and submission endpoints.
- `src/lib/`: database access, validation, and saved-practice handling.
- `prisma/`: database schema and migrations.
- `tests/`: chemistry, input, and integration checks.
- `docs/`: chemistry scope and verification notes.

When changing reaction rules, seeded question generation, or grading semantics, update the generator version in `src/chemistry/rules.ts` and handle saved-question compatibility deliberately. Add checks for accepted answers and incorrect near-misses. See [verification notes](docs/verification.md) for existing coverage and review needs.

## Deployment

The repository is connected to Vercel: pushes to `main` trigger production deployments. The production game is public; preview deployments require Vercel access.

Vercel builds the project root using Node.js 24 and `npm run build:vercel`. This applies checked-in Prisma migrations before building the application. Production uses Neon PostgreSQL through the Vercel Marketplace.

For another deployment, configure server-only `DATABASE_URL` and, when available, `DATABASE_URL_UNPOOLED` environment variables. The app uses the pooled connection; migrations prefer the unpooled connection. Keep credentials in environment settings, never in Git. Local environment files, database data, runtime files, and Vercel connection files are excluded from version control.

The current database connection is configured for production only. Preview deployments need their own test database connection to build and run. Review migrations before pushing because production deployments apply them automatically.
