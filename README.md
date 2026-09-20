# 🌱 Sprout — Plant Tracker

A mobile-first PWA for tracking houseplants: identify species with your phone camera, and get
reminders when each plant needs watering, fertilising or repotting.

## Features

- **👤 Accounts** — sign in with Google or email/password. Your plants are synced to your account
  and available across devices.
- **📷 Camera identification** — snap a leaf or flower; species recognition via the
  [PlantNet API](https://my.plantnet.org) with ranked matches and confidence scores.
- **🗓 Care engine** — per-plant water / fertilise / repot schedules, editable per plant. New plants
  start from reference data stored in the database (`care_reference`, seeded by migration), looked up
  by the identified genus, falling back to family and then to a generic 7/30/18 default — and the form
  says which of the three it used, so an unsourced default is never presented as plant-specific.
- **🔔 Reminders** — Web Push notifications when care is due (at most one per task per day), so they
  arrive with the app closed; a daily Vercel Cron sends what is due, and an in-app watcher also
  checks on open, on focus, and hourly while open.
- **📱 Installable PWA** — home-screen icon, standalone display, notification click handling.

## Run it

```sh
bun install
cp .env.example .env.local   # then fill in secrets (see below)
bun run db:up                # start Postgres (Docker)
bun run db:migrate           # create tables
bun run start                # http://localhost:3000
```

Full dockerized dev (app + db in two containers) is also available:

```sh
docker compose up -d --build # builds the dev image, starts db + next dev
bun run build                # production build (inside the container: docker compose run app bun run build)
docker compose --profile prod up --build app-prod # prod image (standalone) on :3001
```

To use it on your phone, run the app over HTTPS (camera and notifications require a secure
context), open it in the browser, and **Add to Home Screen**.

## Setup

Copy `.env.example` to `.env.local` and set:

| Variable | What for |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. The default matches the `db` compose service. |
| `BETTER_AUTH_SECRET` | Signs session cookies. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Base URL (`http://localhost:3000` in dev). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth ([console.cloud.google.com](https://console.cloud.google.com/apis/credentials)). Redirect URI: `http://localhost:3000/api/auth/callback/google`. |
| `PLANTNET_API_KEY` | Shared PlantNet key for plant recognition. Required for the Identify screen. |

- **Real plant recognition**: the app uses one shared key (created at
  [my.plantnet.org](https://my.plantnet.org)).
- **Notifications**: enable in **Settings → Care reminders**. On iOS (16.4+) you must install the
  app to the home screen first; web push in Safari only works from installed web apps.

## Architecture

| Piece | Where | Notes |
| --- | --- | --- |
| Framework | `src/app/` | Next.js 16 App Router (RSC + server actions); pages + API routes in one deployable |
| Data model | `src/types/index.ts` | `Plant` with `care` intervals + `lastCare` timestamps |
| Database | `src/lib/db/` | Postgres via Drizzle ORM; photos stored as `bytea` |
| Auth | `src/lib/auth/index.ts` | Better Auth (Google OAuth + email/password) with Drizzle adapter |
| Care engine | `src/helpers/care/` + `src/services/server/care-reference/` | Due-date math and the pure `resolveCare` (alias → genus → family → generic default); the reference data itself lives in the `care_reference` table and is loaded server-side |
| Identification | `src/services/server/plantnet/` | Server-only PlantNet client; `/api/identify/` is a thin handler that keeps the key out of the browser |
| Server services | `src/services/server/plants/` | Validation + plant mutations; thin server actions live in `src/lib/db/actions/` |
| Notifications | `src/services/notifications/` | Permission, de-duplicated due-task notifications, watcher |
| Service worker | `public/sw.js` | Cache-first for a small static allowlist (icons, manifest) only; never caches documents, `/api`, RSC payloads or `/_next/static`; dev unregisters any existing worker and purges its caches |
| UI | `src/containers/` | My Plants / Identify / Care / Detail / Settings screens |
| Design system | `src/design-system/` | Owned building blocks: `Button` (union button/anchor), `Select`, `AlertDialog`, `DatePicker` and `Popover` — all Base UI-backed except `Button`'s anchor branch, which stays `next/link`; feature code imports these, never a Base UI primitive directly |
| Styling | `src/app/globals.css` + `src/styles/shared/ui.css` + co-located `styles.module.css` | Tailwind v4 (`@theme static` tokens, preflight omitted) + `@utility ui-*` atoms applied via `@apply`; no inline utility strings |
| Font | `src/app/layout.tsx` + `src/app/globals.css` | Manrope (variable, latin) self-hosted via `next/font/local`; exposed as `--font-manrope` and wired to `--font-sans` in the `@theme static` block. No runtime request to a Google font host. |
| Boundaries | `src/app/{error,not-found,global-error}.tsx`; `src/app/(app)/{error,not-found,loading}.tsx` | Root and shell-preserving error / not-found boundaries; `global-error` covers root-layout failures. The model's gaps are noted under the architecture table. |
| Images | plain `<img>` in `src/components/` | Deliberately no `next/image`: the auth-gated photo route cannot be optimized, and previews use `blob:` URLs. |
| Local dev | `docker-compose.yml` | `db` (Postgres) + `app` (Next dev) containers |

Reminders arrive as Web Push, so they reach you with the app closed. On iOS 16.4+ the app must be
added to the Home Screen first, since Safari only delivers push to installed web apps. One Vercel
Cron sends a daily digest of everything due (Hobby plans allow cron jobs only once per day), and the
in-app watcher additionally checks on open and on focus.

Web Push needs four environment variables in the deployment — `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and `CRON_SECRET`. Without them the app runs normally, but
reminders only fire while it is open.

Known limitation, error/loading boundaries: `(app)/error.tsx` catches errors thrown by the page and
nested segments, but **not** by `(app)/layout.tsx` itself — those bubble to the root
`src/app/error.tsx`, and `src/app/global-error.tsx` covers failures in the root layout.
`(app)/loading.tsx` covers the page's own data fetch, but **not** the auth gate: `requireUser()`
reads `headers()`, so Next blocks navigation before the loading boundary can paint the skeleton. The
shell's due-count is streamed behind its own `Suspense` fallback and degrades to a `0` badge on a
query failure instead of blanking the shell.

