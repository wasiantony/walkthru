# Tech Walkthrough

Step-by-step visual walkthroughs for common iPhone and Windows tasks, for staff at
social service organizations. Answers come from a curated, human-verified library;
AI only matches a question to a walkthrough. (Product name is a placeholder.)

The build brief is the source of truth for scope. Current status: **Phase 1 (Foundation)**.

## Run it with Docker

```bash
cp .env.example .env        # then set a real POSTGRES_PASSWORD
docker compose up --build
```

This starts Postgres, runs migrations and loads `/library` into the database
(`migrate` service, exits when done), then starts the app on http://localhost:3000.
Health check: http://localhost:3000/api/health

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
| `npm run library:placeholders` | Create "Screenshot needed" images for missing placeholders |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |

## The walkthrough library

Each walkthrough is a folder: `library/<device>/<slug>/walkthrough.json` plus its
screenshots. The format is defined in `src/lib/walkthrough-format.ts`.

- `slug` must match the folder name, and `device` must match the parent folder.
- Steps are numbered 1, 2, 3… in order.
- `highlight` is `null`, a box `{ "type": "box", "x", "y", "w", "h" }`, or an arrow
  `{ "type": "arrow", "x", "y", "direction": "up" | "down" | "left" | "right" }`.
  All coordinates are percentages (0–100) of the image's width and height.
- `bonus_tip` holds keyboard shortcuts and other extras. They never go in the main steps.
- Placeholder screenshots are named `step-NN.placeholder.png`. They are grey cards
  that say "SCREENSHOT NEEDED" and mark the guessed highlight area with a dashed
  outline. They are never drawings of a device screen.
- A walkthrough can only be `published` when every screenshot is real and a human
  has filled in `verified_by` and `verified_on`. The seed refuses to load it otherwise.

### Step writing rules

One action per step. Under 20 words. Start with an action word (Tap, Click, Press,
Scroll, Type). Name things by what the user sees. No jargon. `npm run library:lint`
checks the mechanical parts of these rules.
