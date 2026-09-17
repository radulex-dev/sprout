# Agent Instructions

## Roadmap

- [ ] **Add a `useMemo`/`useCallback` optimisation pass**: audit components for values that can be memoised with `useMemo` and ensure every computed value / handler is as stable as the conventions already enforce for handlers.
- [ ] **Move the production database to Neon**: swap the `pg` driver for `@neondatabase/serverless` and update `DATABASE_URL`.
- [ ] **Add Web Push (VAPID)** for reliable reminders while the app is closed (see the README limitation note).
- [ ] **Expand unit-test coverage**: the Vitest + React Testing Library + jsdom harness is in place (`vitest.config.ts`, `test/vitest/setup.ts`, `test:coverage` in the pre-push hook and CI) with suites under `src/**/test.unit.ts*`; remaining work is broader component coverage (`handle*` handlers, `classNames` conditionals) and ratcheting the coverage thresholds.
- [ ] **Integration tests**: recommended tool is **Vitest** (single runner shared with unit tests) + **`next-test-api-route-handler`** for `/api/*` route handlers and `lib/db` queries against the Docker Postgres. Run them against a test database to avoid clobbering dev data. (Alternative if a separate HTTP layer is preferred: `supertest` against `bun run start:prod`.)
- [ ] **E2E tests**: add Playwright (already available via the Playwright MCP server). Cover the critical journey: sign-up → identify (mocked PlantNet response) → add plant → care due → mark done.
- [ ] **Migrate Better Auth → Keycloak**: replace Better Auth with Keycloak as the authentication/authorization layer, per the global `frontend-code-conventions` skill. Touches `src/lib/auth/index.ts`, `src/lib/auth/auth-client.ts`, `src/proxy.ts`, the generated auth schema, and the sign-in/sign-up UI.

## Done

- [X] **Migrate Vite PWA → Next.js 16 App Router** (in place). Routes, server actions, auth (Better Auth), Postgres (Drizzle), PWA hardening, Dockerized local dev.
- [X] **Auth** — Better Auth with Google OAuth + email/password; per-user scoping on every query.
- [X] **Dockerized local dev** — `docker compose up -d db` + `bun run start`, or `docker compose up -d --build` for both containers.
- [X] **Handlers & style conventions enforced by lint** — all event handlers are `handle*` arrow functions wrapped in `useCallback` (no inline handlers), all class names come from `*.module.css` via `styles.x`, no single-line object literals, blank line before every `return`, curly braces on all blocks. Enforced by custom rules in `eslint-rules/` (`no-literal-classname`, `no-inline-object-literal`, `no-inline-handlers`) + `@stylistic/padding-line-between-statements` + `curly`.
- [X] **React conventions** — every component is `React.FunctionComponent<Props>` with `Props extends React.ComponentProps<'element'>` (or `Omit`), destructures and spreads `{...props}` on its root element. One component per `index.tsx` (own folder each); style/style constants live in sibling `constants.ts` files. Enums over magic strings (`CareKind.Water` not `'water'`). `lodash-es` over hand-rolled utils. `classNames` for every multi-class/conditional class via `const X = classNames(styles.root, { [styles.x]: cond })` at the top of the component above the `useState` calls (never inline in JSX, object-map form for conditionals, single class stays inline). All icons are `lucide-react` components (`CARE_META` holds `icon: LucideIcon`, not emoji strings). These are codified globally in the `frontend-code-conventions` opencode skill (`~/.config/opencode/skills/frontend-code-conventions`). See the Tools table below.
- [X] **Dependency updates** — `renovate.json` (`config:recommended`) keeps dependencies current.
- [X] **CI with GitHub Actions** — `.github/workflows/ci.yml` runs `build:rules` → `lint` → `test:coverage` → `build` → `test:size` on pushes to `master` and on pull requests.
- [X] **Accessibility pass** — layout-owned `<main>` + skip link, accessible names on icon-only controls, `:focus-visible` styling, reduced-motion support, and browser zoom across every screen. See the Phase 8 entry in `.omo/plans/plant-app-normalization.md`.
- [X] **Conventional commits enforced** — Husky hooks (`pre-commit` → `lint:staged`, `commit-msg` → commitlint, `pre-push` → lint + `test:coverage` + build + `test:size`) with `@commitlint/config-conventional`.
- [X] **Design-system blocks** — `Button` (union button/anchor; `Default`/`Primary`/`Secondary`/`Danger`/`Soft`/`Outline`/`Unstyled`), `Select`, `AlertDialog`, `DatePicker` and `Popover`, all in `src/design-system/`. Every block wraps a Base UI primitive except `Button`'s anchor branch, which stays `next/link`: Base UI's Button enforces button semantics and its docs say it should not be used for links.
- [X] **React #418 hydration warning — closed** (pinned 2026-09-12, closed 2026-09-17). Two causes, both gone. (1) The reproducible hit (Wave 1: `/settings`, both visits) came from client-only state read during render in `useState` initialisers — `getPlantNetKey()` (`localStorage`, server `''`) and `Notification.permission` (server `'denied'`, since Node's `navigator` has no `serviceWorker`) — removed in `b7d7222`, which dropped the user-supplied PlantNet key for the shared one and replaced the permission read with the hydration-safe `useNotifications` hook (`undefined`/`'default'` initial state, real values applied in an effect). (2) The `<div>`-inside-`<button>` nesting in `TaskRow` (the original suspect) is gone: the unstyled `Button` holds only `<span>`s and `PlantPhoto` always renders `<img>`. No browser API is read during render now, so nothing else diverges deterministically. Residual, deliberately not fixed: `useClock`'s `Date.now()`. Every clock-derived string is day-granular (`formatDue`, `formatDaysAgo`) and flips only when hydration straddles local midnight — an SSR → `hydrateRoot` probe rendered `In 7 days` server-side vs `In 6 days` client-side for `23:59:59.5 → 00:00:00.5`, because `lastCare` is local midnight and intervals are whole-day multiples. React regenerates the subtree client-side; eliminating it would mean seeding `useClock`'s initial state with a server-computed `now`.

## Notes

- ESLint is type-aware and slow; `bun run lint` (not `--fix` in a loop) is the reliable check.
- `next build` does **not** run ESLint; lint is a separate `bun run lint`.
- Component styles are Tailwind CSS modules: every `styles.module.css` must start with `@reference "<relative>/app/globals.css";` or its `@apply` will not resolve. `src/app/globals.css` deliberately omits Tailwind preflight (the app ships its own reset).
- The proxy matcher in `src/proxy.ts` must stay a plain string constant (Turbopack requirement); `unicorn/prefer-string-raw` is disabled for that file in `eslint.config.mjs`.
- `src/lib/db/auth-schema.ts` is generated by Better Auth CLI and lint-ignored; don't edit by hand.
- Server actions need `bodySizeLimit` (5 MB) for photo uploads — configured in `next.config.ts`.
- The plant photo Route Handler lives at `src/app/(app)/plants/[id]/photo/route.ts`, not under `/api`. That path is the stored `Plant.photo` URL produced by `queries.rowToPlant`; route groups scope layouts, not Route Handlers.
- **No `next/image`** (deliberate deviation): the `requireUser()`-gated `bytea` photo route can't be read by the Image Optimizer because it forwards no cookies, and the two capture-preview `<img>` sites use unsupported `blob:` URLs. Keep `PlantPhoto` and the previews as plain `<img>`.
- **Font** is self-hosted Manrope via `next/font/local` in `src/app/layout.tsx` (loader inlined there, not `next/font/google`): `--font-manrope` is wired to `--font-sans` in the `@theme static` block. Never add a runtime Google font request.
- **Boundary model:** `(app)/error.tsx` does not catch `(app)/layout.tsx` errors (they reach the root `error.tsx`); `src/app/global-error.tsx` covers root-layout failures; `(app)/loading.tsx` covers the page's data fetch but not the auth gate (`requireUser()` reads `headers()`, which blocks navigation before the loading boundary).

## Tools

Reference for the toolchain. Each entry: what it is, why we chose it, and the gotchas that matter.

### Runtime & package management

| Tool         | Version | Used for                               | Notes                                                                                                          |
| ------------ | ------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Bun          | 1.3.x   | Installer, script runner, JS runtime   | `bun install`, `bun run <script>`, `bunx <cli>`. Reads `.env.local` automatically. Never use npm/yarn. |
| Node         | 24.x    | Underlying runtime (Next runs on it)   | Only relevant when debugging Next's server directly.                                                           |
| Next.js      | 16.3.x  | App Router framework (Turbopack build) | Middleware was renamed to**proxy**; `proxy.ts` lives in `src/`. `next build` does not run ESLint.  |
| React        | 19.2.x  | UI library                             | Server components by default; client components opt in with`'use client'`.                                   |
| TypeScript   | 6.x     | Types                                  | `tsc` runs via `bun run build` (after `build:rules`); `tsconfig.json` has `@/*` → `./src/*`.      |
| classnames   | 2.5.x   | Conditional class composition          | `classNames(styles.root, { [styles.x]: cond })` — never inline in JSX; see conventions.                     |
| lucide-react | 1.31.x  | Icons                                  | Tree-shakeable, server-compatible.`CARE_META` and `TABS` hold `LucideIcon` refs, not emoji strings.      |
| lodash-es    | —      | Utilities over hand-rolled helpers     | E.g.`capitalize`; see conventions.                                                                           |

### Database

| Tool                   | Version                     | Used for                 | Notes                                                                                        |
| ---------------------- | --------------------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| Postgres               | 16 (`postgres:16-alpine`) | Data store               | Runs in Docker (`db` compose service).                                                     |
| Drizzle ORM            | 0.45.x                      | Query builder + types    | Schema in`src/lib/db/schema.ts`; queries in `src/lib/db/queries.ts`.                     |
| drizzle-kit            | 0.31.x                      | Migrations + studio      | `db:generate`, `db:migrate`, `db:studio`.                                              |
| `pg` (node-postgres) | 8.x                         | Postgres driver          | Maps`bytea` ↔ `Buffer` natively. Prod swaps to `@neondatabase/serverless`. |
| Neon                   | (planned)                   | Serverless prod Postgres | Not used yet — see roadmap.                                                                 |

Gotchas: Drizzle's pg driver has **no binary column type** — `schema.ts` defines a custom `bytea` type via `customType`. The database is `sprout` (user/pass `sprout/sprout` locally).

### Auth

| Tool                | Version | Used for              | Notes                                                                                                |
| ------------------- | ------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| Better Auth         | 1.6.x   | Auth server + client  | `src/lib/auth/index.ts`; Drizzle adapter.                                                          |
| @better-auth/cli    | 1.4.x   | Generates auth schema | `bunx @better-auth/cli generate` → `src/lib/db/auth-schema.ts` (lint-ignored, don't hand-edit). |
| better-auth/react   | —      | Client hooks          | `authClient` in `src/lib/auth/auth-client.ts` (signIn/signUp/signOut).                           |
| better-auth/cookies | —      | Proxy cookie check    | `getSessionCookie` for the optimistic `src/proxy.ts` check.                                      |

Security model: three layers — `proxy.ts` (cookie-only, no DB), `requireUser()` in every server component/action/route, and per-user `userId` scoping on every query.

### Linting & formatting

| Tool                     | Version                         | Used for                                                                                                                                                 | Notes                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint                   | 10.8.x                          | JS/TS/React linting                                                                                                                                      | Flat config; type-aware and slow.                                                                                                                                                                                      |
| @onefinity/eslint-config | 4.x                             | Base flat config + custom`import-grouping` rule                                                                                                        | Groups imports by kind (Constants/Components/Helpers/Hooks/Services/Lib/Styles/Types + Schema).                                                                                                                        |
| eslint-plugin-react      | 7.x                             | React rules                                                                                                                                              | `function-component-definition` requires arrow functions everywhere.                                                                                                                                                 |
| Custom rules             | —                              | `eslint-rules/` (`jsx-props-inline`, `use-component-props-string`, `no-literal-classname`, `no-inline-object-literal`, `no-inline-handlers`) | Written in TS, compiled to JS by`build:rules` (`tsc -p tsconfig.eslint-rules.json`). Lint-ignored themselves. Enforce the handle*/useCallback, styles-module, multiline-object, and no-inline-handler conventions. |
| eslint-config-next       | 16.3.x                          | Reference only                                                                                                                                           | Installed but the project relies on the custom onefinity config; not wired in.                                                                                                                                         |
| Stylelint                | via @onefinity/stylelint-config + @dreamsicle.io/stylelint-config-tailwindcss | CSS linting (incl. Tailwind v4 directives)                                                                          | Run with`bun run lint:css` / `lint:fix`. A `**/*.module.css` override keeps camelCase `selector-class-pattern`.                                                                                                    |
| eslint-plugin-better-tailwindcss | 4.7.x                  | Tailwind class order + canonical classes in `@apply`                                                                                                    | Enabled on `**/*.css` through `@eslint/css` + `tailwind-csstree`; `entryPoint` is `src/app/globals.css`. `lint:fix` sorts `@apply`.                                                                                |

Gotcha: `eslint --fix` will happily mangle files — prefer targeted edits, then run `bun run lint` once.

### Styling (Tailwind v4 + CSS Modules)

| Tool                  | Used for                       | Notes                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailwind CSS          | 4.3.x — utilities + tokens     | Entry `src/app/globals.css` via `@tailwindcss/postcss`. Imports only `tailwindcss/theme.css` (layer `theme`) + `tailwindcss/utilities.css` (layer `utilities`) — **preflight is deliberately omitted**. Tokens are declared with `@theme static` so they emit as live `:root` vars. |
| `@utility ui-*` atoms | Shared, repeated patterns      | `src/styles/shared/ui.css`, bare-imported (no `layer()`) by `globals.css`; component modules `@apply` them. **Never put class-descendant selectors in a shared `@utility`** — CSS-module hashing makes them silently stop matching.                                                 |
| CSS Modules           | Component-scoped styles        | Co-located `styles.module.css` with `@reference "<relative>/app/globals.css";` at the top and `@apply` for every rule. No inline utility strings in JSX (enforced by `sprout/no-literal-classname`).                                                                               |

SCSS is fully retired: no `sass`, no `.module.scss`, no `src/styles/shared/*` partials and no `globals.scss`. Owned design-system blocks live in `src/design-system/` (`Button`, `Select`, `AlertDialog`); `@base-ui/react` is the headless primitive layer those blocks wrap — never import a Base UI primitive directly in feature code.

Use relative units — prefer `rem`, so the UI stays responsive when the viewport is resized. `px` is the exception, for what genuinely must not scale (e.g. `1px` hairline borders); never hardcode `px` for spacing, type, widths or radii, and avoid arbitrary `px` utilities like `p-[16px]` (use the Tailwind scale or a `rem` value). React numeric style values are pixels — use relative strings (`{ gap: '0.75rem' }`) and pass relative strings to `lucide-react`'s `size` prop (`size="1rem"`); only `0` stays a bare number.

### Docker

| Tool              | Used for                | Notes                                                                                                                          |
| ----------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Docker Compose v2 | Local dev orchestration | `db` (Postgres) + `app` (Next dev) services; `app-prod` (profile `prod`) serves the production image on :3001.         |
| Dockerfile        | Multi-stage build       | `dev` target (bind-mounted source, HMR) and `prod` target (standalone output on `oven/bun:1-alpine`, `bun server.js`). |

Gotchas: inside compose the DB hostname is `db`, not `localhost` (`DATABASE_URL=postgres://sprout:sprout@db:5432/sprout`). macOS volume-mount HMR is slower than native dev. Prod parity locally: `docker compose --profile prod up --build app-prod` (serves :3001).

### PWA

| Tool             | Used for                | Notes                                                                                                                                                                                    |
| ---------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service worker   | `public/sw.js`        | Cache`sprout-v4`: cache-first for a small static allowlist (icons, manifest) only; **never** caches documents, `/api`, RSC payloads or `/_next/static`. Dev unregisters any existing worker and purges caches (`SiteCore`). Handles notification clicks + periodic sync `sprout-care-check`. |
| Web App Manifest | `src/app/manifest.ts` | Generated route (`MetadataRoute.Manifest`) replacing the static `manifest.webmanifest`.                                                                                              |
| Notification API | —                      | Permission,`showNotification`, periodic background sync (Chromium/Android installed PWAs only).                                                                                        |

### External services

| Service      | Used for             | Notes                                                                                                                        |
| ------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| PlantNet API | Plant identification | Proxied server-side by`src/app/api/identify/route.ts`; key from `PLANTNET_API_KEY` env.     |
| Google OAuth | Sign-in              | Better Auth social provider; needs`GOOGLE_CLIENT_ID/SECRET` + redirect `http://localhost:3000/api/auth/callback/google`. |

### Scripts (`package.json`)

| Script                                           | Command                                    | Purpose                                      |
| ------------------------------------------------ | ------------------------------------------ | -------------------------------------------- |
| `start`                                        | `next dev`                               | Dev server (Turbopack).                      |
| `build`                                        | `build:rules && next build`          | Compile ESLint rules, then production build. |
| `start:prod`                                   | `next start`                             | Serve the production build.                  |
| `lint` / `lint:fix`                          | `lint:js ; lint:css`                    | Run both linters (JS/TS then CSS).           |
| `lint:js`                                      | `eslint "src/**/*.{ts,tsx}" …`          | ESLint on TS/TSX only.                       |
| `lint:css`                                     | `stylelint "src/**/*.css" ; eslint …`   | Stylelint + Tailwind class order on CSS.     |
| `db:up` / `db:down`                          | `docker compose up -d db` / `down`     | Start/stop the dev Postgres.                 |
| `docker:build:prod`                            | `docker build --target prod -t sprout .` | Build the standalone production image.       |
| `db:migrate` / `db:generate` / `db:studio` | `drizzle-kit …`                         | Apply / create migrations; inspect data.     |
| `build:rules`                                  | `tsc -p tsconfig.eslint-rules.json`      | Compile custom ESLint rules.                 |
