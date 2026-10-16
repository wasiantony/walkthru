@AGENTS.md

# Walkthru — project handoff

Read this first when resuming. It summarizes the build brief, where the work stands,
and what is waiting on a decision.

## What we're building

A web app that gives less tech-confident staff at social service organizations
step-by-step visual walkthroughs for common iPhone and Windows tasks. Sold to
organizations; staff open it when they get stuck.

- **Library first.** Answers come from a curated, human-verified library of
  walkthroughs. AI (smallest fast Claude model, server-side) only matches a
  question to a walkthrough. It never writes steps or answers free-form.
- **Staff flow:** one big text box + "Speak" button + popular topics → best match
  (or top 3 to choose from if confidence < 0.75) → one step per screen with a
  highlight, one short sentence, big Back/Next, "Step 3 of 7" in words → "Did this
  solve it?" Yes/No → No offers "Ask someone for help".
- **Admin:** add/edit/reorder/publish walkthroughs, set the org's devices, see
  unmatched questions, most used walkthroughs, "No" answers, monthly token usage.
- **Stack:** Next.js (App Router, TypeScript), Tailwind, Postgres via Prisma, S3-compatible
  storage (local disk in dev), email magic link for admins, access code for staff,
  Web Speech API for voice, Postgres full-text search as fallback, one Docker deployment.
- **Accessibility:** WCAG 2.2 AA; base text 20px, step text 24px, nothing under 18px;
  tap targets ≥ 56px; ≥ 7:1 contrast for step text; no sidebars, menus, pop-ups or
  auto-advance; every button has a text label.
- **Never:** let AI produce step text at runtime, mark anything verified (only a human
  does), store client names/phones/emails from questions, add analytics or trackers,
  or add features outside the brief without asking.

Build phases (finish each, check its acceptance criteria, report before the next):
1. Foundation ✅ — `docker compose up` runs the app; seed loads 3 sample walkthroughs.
2. Walkthrough player — samples play at 375px and 1366px, highlights stay aligned on
   resize, axe reports no violations.
3. Search and matching — 30 plain-language test phrasings map correctly ≥ 27 times;
   still works with the API key removed.
4. Admin tools — create and publish a walkthrough without code; unverified ones can't
   be published.
5. Library drafts — every P1 walkthrough (21 iPhone, 26 Windows) as a draft that passes
   the lint, plus a checklist of what a human must verify.
6. Pilot hardening — multi-org isolation, access codes, rate limits, personal-info
   stripping, error pages, backups that restore.

## Where things stand (Oct 15, 2026)

**Phase 1 is done.** `docker compose up --build` starts Postgres, runs migrations and
the library seed (one-shot `migrate` service), and serves the app on :3000 with a
healthy `/api/health`. The home page is a temporary list of walkthroughs; Phase 3
replaces it.

**Phase 2 is done.** The player is at `/w/<slug>`. `npm run test:e2e` (11 tests) passes
against both a production build and the Docker container: all 3 samples play at 375px
and 1366px, outlines stay on target after resizing, axe finds no WCAG 2.2 AA
violations, animations finish in the right end state with no console errors.

**Decided Oct 15: animated drawings instead of screenshots.** The owner chose this
over the brief's screenshot approach (which reverses two brief rules: "real screenshots
before publishing" and "never draw device screens"). What still holds: a human checks
every walkthrough on a real device and fills in `verified_by` / `verified_on` before
it can be published; AI never draws or writes anything at runtime. Screenshot steps
remain in the format for org-private apps (e.g. case management software) that have
no drawings, but the player doesn't render them yet (Phase 4, with uploads).

### How drawn steps work
- A step is `{ text, alt, scene, gesture, highlight }` (`src/scenes/format.ts`).
  `scene.screen` picks a screen from the kit: `iphone/home`, `iphone/list`,
  `iphone/text-size`, `windows/desktop` (with optional Start menu, search, windows,
  snip overlay, right-click menu, mouse picture, notification), `windows/lock`.
- `gesture` is tap / click / right-click / scroll / slide / type / drag-box.
  `highlight` and gesture targets name a `data-target` the kit draws.
- Kit: `src/scenes/kit/*.tsx` + `scenes.css`, drawn at a fixed design size
  (iPhone 390x844, Windows 1280x720) and scaled as one picture. `runner.ts` plays the
  gesture and places the outline in design coordinates, so it stays aligned at any size.
  `SceneView.tsx` fits the picture and zooms in on the step's area when the whole
  screen would be too small to read (phones), except for scroll/slide steps.
- New walkthroughs mostly reuse existing screens; a new kind of screen means adding a
  schema in `format.ts`, a component in the kit, and a case in `Scene.tsx`.
- Drawings are simplified and generic (no copied icons). Text in drawings keeps 4.5:1
  contrast. Each step needs `alt` text describing the picture.

### Not built yet (by design, later phases)
- "Ask someone for help" shows a not-set-up message; sending to the org's admin comes
  with orgs and admin (Phases 4 and 6). "Did this solve it?" isn't logged yet (Phase 3).
- Drafts show only when `SHOW_DRAFTS=true` (set in `.env` for local review). Player
  shows a "Draft: not checked on a real device" notice on drafts.

**Next: Phase 3 (search and matching).** Before starting, read the memo's AI matching
section (summarized above) and load the `claude-api` skill for current model IDs.

## Decisions already made

- Keyboard shortcuts go in a `bonus_tip` field, never in the main steps (the brief's
  own JSON example broke this rule; its Windows section wins).
- Arrow highlights are a point + direction (up/down/left/right). Boxes are x/y/w/h,
  all as percentages of the image.
- For screenshot steps only: placeholder images are named `*.placeholder.png` (grey
  "SCREENSHOT NEEDED" cards). The seed refuses to load a `published` walkthrough with
  placeholders or without `verified_by` / `verified_on`.
- A database check makes every step have exactly one picture: a scene or an image.
- Global library walkthroughs have `organization_id = null`; a partial unique index
  keeps their slugs unique. Orgs hide globals via `hidden_walkthroughs`.
- Seed never deletes walkthroughs that disappear from `/library`; it warns.
- Prisma is pinned to 7.10.0 (npm's "latest" tag pointed at an 8.0 release candidate).
- Next.js is 16.4 with Cache Components on: DB reads go inside `<Suspense>`, and
  route handlers call `connection()` before request-time work. Read
  `node_modules/next/dist/docs/` before writing Next code.
- Only the local-disk storage driver exists; the S3 driver comes with Phase 4 uploads.

## Open questions for the owner (from the brief)

- Product name and branding ("Walkthru" / "Tech Walkthrough" are placeholders).
- Pilot organization and its work apps (email, meetings, file storage, authenticator).
- Staff access by code, or by the org's Microsoft sign-in.
- Pilot hosting, and whether data must stay in Canada.
- Whether macOS walkthroughs are needed for the pilot.

## Setting up on a new computer

Needs Node.js 24, Git, and Docker Desktop (on Windows: WSL2 too).

```bash
git clone https://github.com/wasiantony/walkthru.git
cd walkthru
cp .env.example .env
npm install
docker compose up --build
```

Then open http://localhost:3000. For hot-reload development instead:
`docker compose up -d db`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`.

Checks: `npm run typecheck`, `npm run lint`, `npm run library:lint`, `npm run build`,
and `npm run test:e2e` (needs the database up and seeded; first run
`npx playwright install chromium`). The e2e tests build and start the app on :3100.
