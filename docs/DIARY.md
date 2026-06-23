# Development Diary

Chronological log of tasks and decisions. Newest entries at the bottom of the
log; ADRs collected at the top. See the format in `CLAUDE.md` §8.

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

### [2026-06-22] 0.2 — Contract (shared/src/contract)
- **Did:** Wrote the canonical contract types in `shared/src/contract/`: `FieldType`,
  `Field`, `Schema`, `Entry`/`FieldValue`, `events.ts` (`DomainEvent`), `evolution.ts`
  (`SchemaChange`, `RiskLevel`, `AffectedEntry`). Barrel at `contract/index.ts` and root
  `shared/src/index.ts` re-export everything via `export type` for `@cms/shared`.
- **Decisions:** Kept evolution types in their own `evolution.ts` file rather than
  bundling them into `Schema.ts`, since they belong to a separate domain (schema
  evolution) and mirror the `shared/src/evolution/` folder coming in Phase 6. All
  cross-file imports use `import type` per `verbatimModuleSyntax`.
- **Tests:** none — types only, no logic to test.
- **Next:** Task 0.3 — SQLite init + migrations.

### [2026-06-23] 0.3 — SQLite init + migrations
- **Did:** Added `infrastructure/persistence/sqlite/db.ts`: `createDb(filename)` opens
  a `better-sqlite3` connection, turns on `PRAGMA foreign_keys`, and runs the
  `schemas`/`entries` migration (JSON columns, FK with `ON DELETE CASCADE`,
  `idx_entries_schema` index) from `backend/CLAUDE.md`. Added the missing
  `src/test/setup.ts` referenced by `jest.config.ts`.
- **Decisions:** Scoped strictly to db init + migrations — repositories
  (`SqliteSchemaRepository`/`SqliteEntryRepository`) and their ports are deferred to
  tasks 1.1+, per the backend task list, so this stays one task = one commit.
- **Tests:** `db.test.ts` against `:memory:` — both tables exist, the index exists,
  deleting a schema cascades to its entries, and inserting an entry with a
  non-existent `schema_id` throws (proves `PRAGMA foreign_keys` actually took effect,
  since SQLite defaults it off).
- **Next:** Task 1.1 — Schemas CRUD endpoints (`GET/POST/PUT/DELETE /schemas`).

### [2026-06-23] 1.1 — Schemas CRUD (`GET/POST/PUT/DELETE /schemas`)
- **Did:** First application/infrastructure vertical slice. `domain/schema/`:
  `Schema` (re-export), `SchemaRepository` port, `SchemaNotFound`/`InvalidSchema`
  errors. `application/schema/`: `CreateSchema`, `ListSchemas`, `UpdateSchema`,
  `DeleteSchema` (TDD against an `InMemorySchemaRepository` fake), plus
  `validateSchemaInput` (manual checks: name required, field shape, reference
  needs `refSchemaId`, no duplicate field ids). `infrastructure/persistence/sqlite/
  SqliteSchemaRepository` (upsert via `ON CONFLICT`). `infrastructure/http/express/`:
  `SchemaController` (router), `errorHandler`, `server.ts`. `main.ts` composition
  root.
- **Decisions:** Established the error-response convention reused by 1.2–1.3:
  `404 { error: "NOT_FOUND", message }`, `400 { error: "VALIDATION_ERROR", message,
  details: string[] }`. `UpdateSchema` does a plain field/name replace, no
  evolution-risk classification — that's Phase 6's job, layered on top later.
  `DeleteSchema` 404s on an unknown id rather than silently no-op'ing, matching the
  controller's 404 contract. IDs via `node:crypto.randomUUID()`, no new dep. Closed
  a pre-existing gap: `backend/tsconfig.json` didn't exist, so `@cms/shared` only
  resolved inside Jest — added it (no `rootDir`/`outDir`, since `shared/` lives
  outside the backend tree and is source-only). Added `supertest` +
  `@types/supertest` as new devDependencies for controller tests.
- **Tests:** 4 use-case test files against the in-memory fake; `SqliteSchemaRepository`
  against `:memory:` (round-trip incl. nested `Field[]`, upsert, delete); `SchemaController`
  via supertest against the real use cases + SQLite repo, covering all 4 endpoints'
  happy and error paths. 31 tests total, all green; `tsc --noEmit` clean.
- **Next:** Task 1.2 — Entries: `GET /entries?schema=`, `GET /entries/:id`, `POST/PUT/DELETE /entries`.

### [2026-06-23] 1.2 — Entries CRUD (`GET /entries?schema=`, `GET /entries/:id`, `POST/PUT/DELETE /entries`)
- **Did:** Mirrors 1.1's slice for the `entry` aggregate, plus the first real use of
  `shared/`'s validation layer. `shared/src/validation/validateEntry.ts` (TDD): checks
  required fields and per-`FieldType` value matching (`text`/`date`→string,
  `number`→number, `boolean`→boolean, `reference`→`string | null`); added
  `shared/jest.config.ts` since `shared/` had no test runner config yet. New contract
  type `shared/src/contract/ValidationError.ts` (`{ fieldId?, message }`), exported
  from `shared/src/index.ts` alongside the new `validateEntry` function export.
  `domain/entry/`: `Entry` (re-export), `EntryRepository` port
  (`findBySchemaId`/`findById`/`save`/`delete`), `EntryNotFound`/`InvalidEntry` errors.
  `application/entry/`: `CreateEntry`, `ListEntries`, `GetEntry`, `UpdateEntry`,
  `DeleteEntry` (TDD against `InMemoryEntryRepository`), reusing
  `InMemorySchemaRepository`/`CreateSchema` from 1.1 in tests since entries need a
  schema to validate against. `infrastructure/persistence/sqlite/
  SqliteEntryRepository` (no new migration — the `entries` table already existed from
  0.3). `infrastructure/http/express/EntryController` mounted at `/entries`;
  `errorHandler`/`server.ts`/`main.ts` extended for the new error types and deps.
- **Decisions:** `validateEntry` returns `ValidationError[]`, not 1.1's `string[]`
  convention — `shared/CLAUDE.md` already documented this exact signature, so the
  contract type was added now rather than deferred. `CreateEntry`/`UpdateEntry` reuse
  `SchemaNotFound` from `domain/schema/SchemaErrors` for an unknown `schemaId` instead
  of defining a duplicate entry-scoped error — it's the same failure condition, and
  `errorHandler` already 404s it. `GET /entries?schema=<unknown-id>` returns `200 []`
  rather than 404 — listing against a schema with zero entries is indistinguishable at
  the repository level; only `create`/`update` validate schema existence. Unknown keys
  in `data` not matching any `field.id` are silently ignored, not rejected, by
  `validateEntry`. `schemaId` is immutable via `PUT /entries/:id` — only `data`
  changes; re-pointing an entry to a different schema isn't a requirement.
  Reference-field values are checked to be `string | null` but never checked for
  existence — dangling-reference detection is Phase 6's `scanAffected` job, explicitly
  out of scope here.
- **Tests:** 7 `validateEntry` unit tests (shared). Backend: 5 use-case test files
  against the in-memory fakes (including schema-validation paths in
  `CreateEntry`/`UpdateEntry`); `SqliteEntryRepository` against `:memory:`
  (round-trip incl. `data` JSON, `findBySchemaId` filtering, upsert, delete);
  `EntryController` via supertest against the real use cases + SQLite repos, covering
  all 5 endpoints' happy and error paths (missing `schema` param, unknown schema,
  validation failure, not-found). 61 backend tests total (up from 31), all green;
  `tsc --noEmit` clean on both `shared` and `backend`. Manual `curl` acceptance check
  against a running server: create schema → create/get/list/update/delete entry →
  confirmed 404 after delete.
- **Next:** Task 1.3 — Read API (E): `GET /api/content/:schema`, `/:schema/:id`
  (resolve `fieldId → name`).

### [2026-06-23] 1.3 — Read API (E) (`GET /api/content/:schema`, `/:schema/:id`)
- **Did:** `domain/schema/SchemaRepository` gained `findByName(name)`, implemented in
  `InMemorySchemaRepository` (linear scan) and `SqliteSchemaRepository`
  (`WHERE name = ?`) — `:schema` in the path is the schema *name*, not its id. New
  `application/content/`: `resolveEntryData(schema, entry)` (pure, TDD'd: maps each
  `field.id` key in `entry.data` to `field.name`, defaulting a missing value to
  `null`), `ListContent` and `GetContentEntry` use cases that look up the schema by
  name, fetch entries/entry, and layer `resolveEntryData` over the result.
  `infrastructure/http/express/ContentController` mounted at `/api/content` —
  `GET /:schema` → `ListContent`, `GET /:schema/:id` → `GetContentEntry`; both thin,
  errors forwarded to the existing `errorHandler`. `server.ts`/`main.ts` extended with
  the new `content` deps.
- **Decisions:** Resolution lives in `application/content/`, not directly in the
  controller — keeps it unit-testable against the in-memory fakes like every other
  use case, while still never touching the domain (`Entry`/`Schema` stay id-keyed).
  `GetContentEntry` 404s (`EntryNotFound`) when the entry exists but belongs to a
  different schema than the one named in the path, not just when the id is unknown —
  the Read API URL implies that scoping. `ListContent`/`GetContentEntry` both 404
  (`SchemaNotFound`) for an unknown schema name, unlike `GET /entries?schema=` in 1.2
  which returns `200 []` — here the schema name is the primary path resource, not a
  filter.
- **Tests:** `resolveEntryData` unit tests (mapping + missing-value default);
  `ListContent`/`GetContentEntry` against the in-memory fakes (happy path, unknown
  schema, unknown entry, cross-schema entry); `SqliteSchemaRepository.findByName`
  added to its existing suite; `ContentController` via supertest against the real use
  cases + SQLite repos. 76 backend tests total (up from 61), all green; manual `curl`
  acceptance check against a running server confirmed JSON keys are field names
  (`{"data":{"brand":"Toyota"}}`) and a 404 for an unknown schema name.
- **Next:** Phase 2 — `2.1` SSE endpoint `/events` + `EventPublisher` port & adapter.

### [2026-06-23] 2.1 — SSE endpoint + EventPublisher port & adapter
- **Did:** Added the real-time plumbing only — no use case publishes yet (that's
  2.2). `application/ports/EventPublisher.ts` defines the output port
  (`publish(event: DomainEvent): void`); `domain/events/DomainEvent.ts` re-exports
  the shared contract type, matching the existing `domain/schema/Schema.ts`
  pattern. `infrastructure/realtime/SseEventPublisher.ts` implements the port: it
  keeps a `Set<Response>` of open connections, writes `data: <json>\n\n` to all of
  them on `publish`, and drops a connection on its `close` event. New
  `EventsController.ts` exposes `GET /events`, which just calls
  `publisher.subscribe(res)`. `server.ts`/`main.ts` extended with a new `events`
  dep, mirroring how `content` was added in 1.3.
- **Decisions:** Kept the route un-nested under any resource router (`/events`,
  not under `/schemas` or `/entries`) since it isn't CRUD over an aggregate — it's
  a transport concern. The adapter owns raw Express `Response` objects directly
  (correct per hexagonal-architecture: this is infrastructure, domain/application
  never see it).
- **Tests:** `SseEventPublisher.test.ts` unit tests against fake `Response`-like
  objects (header set, broadcast to multiple subscribers, no write after
  `close`). `EventsController.test.ts` is a real integration test: spins up the
  Express app on an ephemeral port via `http.Server`, opens a real `GET /events`
  connection with `http.get`, asserts the `text/event-stream` header, then calls
  `publisher.publish(...)` directly and asserts the exact SSE-framed chunk
  arrives on the open socket. 84 backend tests total (up from 80 — also closed a
  pre-existing gap where `EntryController.test.ts`/`SchemaController.test.ts`
  were missing the `content` dep required by `ServerDeps`, caught by `tsc
  --noEmit`, which was clean before this task and is again now). All green;
  `npm test` (shared + backend) green.
- **Next:** `2.2` — make every mutation use case call `publish(...)` with the
  matching `DomainEvent`.

### [2026-06-23] 2.2 — Publish a DomainEvent from every mutation
- **Did:** All 6 Phase 1 mutation use cases (`CreateSchema`, `UpdateSchema`,
  `DeleteSchema`, `CreateEntry`, `UpdateEntry`, `DeleteEntry`) now take
  `EventPublisher` as a constructor dependency and call `publish(...)` with the
  matching `DomainEvent` right after the repository write succeeds (for deletes,
  after `delete` resolves). New `application/events/InMemoryEventPublisher.ts`
  fake (records published events in a public array) mirrors the existing
  in-memory repository fake pattern, used in tests. `main.ts` now passes the
  already-instantiated `SseEventPublisher` into all 6 use cases.
- **Decisions:** Publish from inside the use case, not the controller, per
  backend/CLAUDE.md — keeps any future transport (e.g. WebSocket) consistent
  without touching controllers. `DeleteSchema`/`DeleteEntry` publish using the
  id args (and the looked-up `schemaId` for `entry.deleted`) since the deleted
  aggregate no longer exists to read back.
- **Tests:** Added one assertion per use case verifying the exact `DomainEvent`
  (type + payload) lands in the fake publisher's `events` array. Updated every
  existing call site (other use case tests' setup helpers, the 4
  controller/SSE integration test files, `ListSchemas.test.ts`) to pass a
  publisher. 86 backend tests green (up from 84); `tsc --noEmit` clean.
- **Next:** `2.3` — `useRealtime()` hook in the front-end, wired to query
  invalidation on incoming `DomainEvent`s.
