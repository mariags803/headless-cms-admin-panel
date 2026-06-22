# Development Diary

Chronological log of tasks and decisions. Newest entries at the bottom of the
log; ADRs collected at the top. See the format in `CLAUDE.md` §9.

---

## Architecture Decision Records

### ADR-001 — Entry data is keyed by `field.id`, not by field name   [accepted]
- **Context:** Schemas evolve. If entry data were keyed by field *name*, renaming
  a field would orphan every existing value, turning a harmless edit into data loss.
- **Decision:** Each `Field` has a stable uuid `id`. `Entry.data` is
  `Record<fieldId, value>`. The Read API resolves `fieldId → name` when serializing
  so consumers still get readable JSON.
- **Consequences:** Rename becomes a `safe`, non-destructive change. The evolution
  work narrows to the genuinely risky operations: retype, remove, required, and
  reference retarget.

### ADR-002 — Hexagonal architecture on both client and server   [accepted]
- **Context:** Front-end is the focus, but the brief rewards clear structure and
  testability, especially around schema evolution.
- **Decision:** Ports & adapters in both apps. `domain/` (models + port interfaces)
  and `application/` (use cases) are framework-free. React, Express, SQLite and
  `fetch` live only in `infrastructure/`. Composition roots wire the adapters.
- **Consequences:** Use cases test against in-memory fake repositories; UI tests
  inject fakes; domain rules test as pure functions. Frameworks are swappable.

### ADR-003 — Thin backend: Express + better-sqlite3 + SSE   [accepted]
- **Context:** "Keep the backend thin." The reviewer must run the project with one
  command, no external accounts or infra.
- **Decision:** Node + Express + TypeScript; `better-sqlite3` with JSON columns for
  storage; Server-Sent Events for real-time (server→client is all we need).
- **Consequences:** `npm install && npm run dev` just works. The Read API is native
  REST. Considered Firebase/Mongo — rejected for this take-home: they add setup
  friction and would require a separate layer for the read API.

### ADR-004 — Schema-evolution rules live in `shared/` and run on both sides   [accepted]
- **Context:** The client previews the risk of a schema change; the server must
  enforce it on apply. These must never disagree.
- **Decision:** `diffSchemas`, `classifyRisk`, `coerce`, `scanAffected`,
  `validateEntry` are pure functions in `shared/`, imported by both apps. Client
  uses them to build the preview; server re-runs them in `UpdateSchema` on apply.
- **Consequences:** Single source of truth for evolution logic, heavily unit-tested
  in one place. No drift between preview and enforcement.

### ADR-005 — Jest as the test runner, decoupled from the build tool   [accepted]
- **Context:** A Vite project would default to Vitest, but that couples the test suite
  to the build tooling. We want tests that survive a change of bundler.
- **Decision:** Use Jest across all workspaces, with ts-jest (or @swc/jest) for the
  TypeScript transform and jsdom for the client. Per-workspace `jest.config.ts`.
- **Consequences:** Tests stay independent of Vite; swapping the bundler later doesn't
  touch them. Cost: explicit Jest config (transform, ESM handling, `moduleNameMapper`
  for the `shared` package) instead of Vitest reusing the Vite config.

### ADR-006 — Native CSS (CSS Modules + tokens), no Tailwind or CSS-in-JS   [accepted]
- **Context:** Want full control over styling and a clean separation of concerns, with
  appearance kept out of components so they stay simple and reviewable.
- **Decision:** Native CSS only. Co-located CSS Modules for component scope, design
  tokens as `:root` custom properties, `@layer` for predictable specificity, container
  queries for component responsiveness. Components carry one class name plus `data-`/
  ARIA state attributes; no static inline styles, no Tailwind, no CSS-in-JS.
- **Consequences:** Styling responsibility lives entirely in CSS files; JSX stays thin.
  CSS Modules is bundler-processed but a cross-bundler standard, not Vite lock-in. The
  trade-off vs Tailwind is more files and naming discipline in exchange for full control.

### ADR-007 — Layered CLAUDE.md (root + per-package); skills as the rule library   [accepted]
- **Context:** A single growing root CLAUDE.md mixed repo-wide context with per-app
  detail and overlapped the skills. Wanted focused per-package guidance that loads when
  working in that subtree, without duplication.
- **Decision:** A root `CLAUDE.md` (the map: context, contract, layout, backlog,
  commands) plus a `CLAUDE.md` in each package (`backend`, `frontend`, `shared`) for its
  own structure and tasks. Detailed conventions stay in the three skills (hexagonal,
  css-conventions, cms-conventions) — no parallel `rules/` tree; the CLAUDE.md files
  point to the skills. `shared` is consumed source-only via path alias + Jest
  `moduleNameMapper` (no separate build).
- **Consequences:** Less duplication; each subtree gets focused, contextual guidance;
  the repo stays self-governing for a reviewer or a fresh agent. Cost: cross-references
  between files to keep in sync. Rule of thumb: facts & structure in CLAUDE.md, detailed
  how-to in skills.

---

## Log

### [2026-06-21] 0.0 — Project kickoff
- **Did:** Set the working agreement in `CLAUDE.md`: hexagonal architecture both
  sides, frozen contract in `shared/`, TDD on domain/application logic, one
  task = one commit = one diary entry.
- **Decisions:** ADR-001 through ADR-004 (above).
- **Tests:** none yet (scaffold pending).
- **Next:** Task 0.1 — monorepo scaffold (shared / backend / frontend workspaces +
  Vitest configs).
