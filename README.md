# Tech Walkthrough

Step-by-step visual walkthroughs for common iPhone and Windows tasks, for staff at
social service organizations. Answers come from a curated, human-verified library;
AI only matches a question to a walkthrough. (Product name is a placeholder.)

Each step shows a simplified, animated drawing of the screen: a finger or mouse
pointer shows what to do, and an orange outline marks what to touch. Nothing is
drawn or written by AI at runtime.

Current status: **Phase 2 (walkthrough player) done.** See `CLAUDE.md` for details.

## Run it with Docker

```bash
cp .env.example .env        # then set a real POSTGRES_PASSWORD
docker compose up --build
```

This starts Postgres, runs migrations and loads `/library` into the database
(`migrate` service, exits when done), then starts the app on http://localhost:3000.
Health check: http://localhost:3000/api/health. Walkthroughs open at `/w/<slug>`.

Draft walkthroughs only show when `SHOW_DRAFTS=true` (the example `.env` sets it for
local review). Never set it in a real deployment.

## Run it for development

```bash
npm install
docker compose up -d db     # or any Postgres; set DATABASE_URL in .env
npm run db:migrate
npm run db:seed
npm run dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Load `/library` into the database (safe to re-run) |
| `npm run library:lint` | Check walkthrough files against the format and writing rules |
| `npm run library:placeholders` | Create "Screenshot needed" images for screenshot steps |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run test:e2e` | Play every walkthrough at phone and laptop sizes, check outline alignment and accessibility (axe). Needs the database up and seeded; run `npx playwright install chromium` once first. |

## The walkthrough library

Each walkthrough is a folder: `library/<device>/<slug>/walkthrough.json`. The format
is defined in `src/lib/walkthrough-format.ts` and `src/scenes/format.ts`.

- `slug` must match the folder name, and `device` must match the parent folder.
- Steps are numbered 1, 2, 3… in order.
- A drawn step has `text`, `alt` (describes the picture), `scene` (which screen to
  draw and what's on it), `gesture` (what the finger or mouse does) and `highlight`
  (which drawn element gets the orange outline). See the samples for examples.
- A screenshot step (for an organization's own apps) has `image` and a percentage-based
  `highlight` instead. Placeholder screenshots are named `step-NN.placeholder.png`.
- `bonus_tip` holds keyboard shortcuts and other extras. They never go in the main steps.
- A walkthrough can only be `published` once a human has checked it on a real device
  and filled in `verified_by` and `verified_on`. The seed refuses to load it otherwise.

### Step writing rules

One action per step. Under 20 words. Start with an action word (Tap, Click, Press,
Scroll, Type). Name things by what the user sees. No jargon. `npm run library:lint`
checks the mechanical parts of these rules.
