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

### [2026-06-23] fix — field.id must be server-generated, never trusted from the client
- **Did:** `validateSchemaInput.ts` was rejecting `POST /schemas` whenever a field
  arrived without an `id`, the opposite of the contract's intent (`field.id` is
  infrastructure, not user input). Fixed at the two places fields get an id:
  `CreateSchema` now always assigns a fresh `randomUUID()` to every incoming field,
  discarding any client-sent id; `UpdateSchema` preserves an existing id (so renames
  stay rename-safe) and generates one only for fields that arrive without one
  (newly added in the edit form). New `FieldInput = Omit<Field, 'id'> & { id?: string }`
  type in `validateSchemaInput.ts` makes `id` optional on input across both use cases.
  Checked entries for the same bug — none found: `Entry.id` was already
  server-generated, and `entry.data` only ever references existing field ids.
- **Decisions:** None beyond the above — this restores the existing
  `randomUUID()`-on-create pattern already used for `Schema.id`/`Entry.id` rather
  than introducing a new approach.
- **Tests:** Added cases for id-omitted and client-supplied-but-ignored ids on
  create, and id-preserved-across-rename / id-generated-for-new-field on update, plus
  a duplicate-field-id rejection test moved to `UpdateSchema.test.ts` (no longer
  reachable through `CreateSchema` once ids are always server-generated). Updated all
  call sites across `application/` and `infrastructure/http` test suites that
  hardcoded a client-supplied field id to read the generated id back off the created
  schema instead. 90 backend tests green; `tsc` clean.
- **Next:** none — resumes wherever `2.3` left off.

### [2026-06-23] 2.3 — `useRealtime()` hook + SSE client adapter
- **Did:** `infrastructure/realtime/SseClient.ts` (adapter): wraps `EventSource`,
  lazily opens the connection on first `subscribe(listener)`, parses each message
  as a `DomainEvent`, fans out to all listeners, closes the connection once the
  last listener unsubscribes. `infrastructure/ui/react/providers/RealtimeProvider.tsx`
  exposes an injected `SseClient` via context (`useRealtimeClient()`).
  `infrastructure/ui/react/hooks/useRealtime.ts` reads the client from context and
  subscribes/unsubscribes a caller-supplied `onEvent` callback in a `useEffect`.
  `domain/events/DomainEvent.ts` re-exports the shared type, mirroring the backend.
- **Decisions:** Backlog orders `2.3` before `3.2` (TanStack Query), so there is no
  query client yet to invalidate. `useRealtime(onEvent)` stays generic — it takes a
  plain callback rather than calling `queryClient.invalidateQueries` directly; `3.2`
  will pass an invalidation callback once the query layer exists. The provider takes
  an already-constructed `SseClient` as a prop rather than building one itself, so
  the composition root (still to be wired into `main.tsx` in a later task) stays the
  only place that does `new SseClient()`. Found `frontend/.swcrc` had no TypeScript
  parser config (`jsc.parser` was unset, so `@swc/jest` failed on any `.ts`/`.tsx`
  syntax) and `frontend/src/test/setup.ts` was missing despite being referenced by
  `jest.config.ts` — both pre-existing gaps, fixed as prerequisites for any frontend
  test to run at all.
- **Tests:** `SseClient.test.ts` — lazy connect, multi-listener fan-out, per-listener
  unsubscribe, connection close on last unsubscribe, reconnect after close, via a fake
  `EventSource`. `useRealtime.test.tsx` — subscribes through context, forwards events
  to `onEvent`, unsubscribes on unmount, throws outside a `RealtimeProvider`. 9
  frontend tests green; `tsc -b frontend` clean.
- **Next:** `3.1` routing, then `3.2` TanStack Query data layer — mounts
  `RealtimeProvider` in `main.tsx` and wires `useRealtime()` to
  `queryClient.invalidateQueries`.

### [2026-06-23] 3.1 — Routing: schema list / schema editor / entry list / entry editor
- **Did:** Added `react-router-dom` and wired 6 routes over 4 stub pages in
  `infrastructure/ui/react/pages/`: `SchemaListPage` (`/schemas`),
  `SchemaEditorPage` (`/schemas/new`, `/schemas/:schemaId/edit`),
  `EntryListPage` (`/schemas/:schemaId/entries`), `EntryEditorPage`
  (`/schemas/:schemaId/entries/new`, `/schemas/:schemaId/entries/:entryId/edit`);
  `/` redirects to `/schemas`. Moved `App.tsx` from `src/` into
  `infrastructure/ui/App.tsx` per the documented layout (it had never been
  relocated when that folder was scaffolded) and split the route table into
  `infrastructure/ui/AppRoutes.tsx` so it can be rendered without `BrowserRouter`
  in tests. Dropped the leftover Vite template markup/assets (`App.css`,
  `hero.png`, `react.svg`, `vite.svg`) — no longer referenced once `App.tsx`
  became the router root. Imported design from claude.ai/design
  (`CMS Admin Panel.dc.html`) as the visual reference for later tasks; this task
  only takes the page/route names and structure from it, not its inline-styled
  markup or its view-switching-via-state approach (incompatible with
  `css-conventions`/real routing) or its embedded evolution logic (belongs in
  `shared/src/evolution/`, not a component).
- **Decisions:** Pages are thin stubs (heading only) — porting the design's
  visuals and wiring real data is explicit follow-up work (3.2+), not part of
  routing. The "Live Sync Demo" panel from the design (manually simulated
  events) is dropped rather than ported: real SSE via `useRealtime` already
  exists from `2.3`. Added `@types/node` (devDependency only) and `"node"` to
  `tsconfig.app.json`'s `types` so `src/test/setup.ts` could polyfill
  `TextEncoder`/`TextDecoder`, which `jest-environment-jsdom` doesn't provide
  and `react-router` v7 requires at import time.
- **Tests:** `AppRoutes.test.tsx` renders at each of the 7 paths (including `/`)
  via `MemoryRouter` and asserts the matching page's heading. 16 frontend tests
  green; `tsc -p tsconfig.app.json --noEmit` and `npm run build` clean.
- **Next:** `3.2` — TanStack Query data layer over the HTTP repositories; mount
  `RealtimeProvider` in `main.tsx`.

### [2026-06-23] 3.2 — Data layer (TanStack Query) over HTTP repositories + realtime invalidation
- **Did:** Built the full client-side hexagon for `Schema`/`Entry`: domain ports
  (`domain/{schema,entry}/*Repository.ts`), framework-free use cases
  (`application/{schema,entry}/{List,Get,Create,Update,Delete}*.ts`), and `fetch`-based
  adapters (`infrastructure/http/Http{Schema,Entry}Repository.ts`). Added
  `@tanstack/react-query` and a query-hook layer
  (`infrastructure/ui/react/hooks/use{Schemas,Schema,CreateSchema,UpdateSchema,
  DeleteSchema,Entries,Entry,CreateEntry,UpdateEntry,DeleteEntry}.ts`) that calls the
  use cases through a new composition-root provider (`UseCasesProvider`). Added
  `useRealtimeInvalidation()`, which subscribes via the existing `useRealtime()` (2.3)
  and invalidates the matching query keys per `DomainEvent` type — the piece 2.3 was
  scaffolded for but never wired to a cache. Finally wired `QueryClientProvider`,
  `UseCasesProvider`, `RealtimeProvider` (instantiating the real `SseClient` — left
  unmounted since 2.3) and `useRealtimeInvalidation()` into `App.tsx`.
- **Decisions:** There's no `GET /schemas/:id` route on the backend (only list +
  mutate-by-id), so `HttpSchemaRepository.findById` fetches the list and filters
  client-side rather than adding a backend endpoint out of scope for this task. Query
  keys: `['schemas']` / `['schemas', id]` / `['entries', schemaId]` /
  `['entries', schemaId, entryId]`. Mutations invalidate their own keys on success
  *and* `useRealtimeInvalidation` invalidates on the matching SSE event — redundant for
  the originating client (whose own event will also arrive), but it's what makes other
  open clients update without a refresh, which is the point of phase C. Pages stay
  stubs; binding them to these hooks is 4.x/5.x.
- **Tests:** Use cases against in-memory fake repositories (no network); HTTP adapters
  against a mocked `fetch`, including the 204-delete-has-no-body case; `UseCasesProvider`
  context; representative query/mutation hooks (`useSchemas`, `useCreateSchema`,
  `useEntries`, `useDeleteEntry`) via `renderHook` + `QueryClientProvider` +
  `UseCasesProvider` with fake use cases; `useRealtimeInvalidation` for all six
  `DomainEvent` types via the existing fake-SSE-client pattern. 49 frontend tests green;
  `tsc -b --noEmit` clean.
- **Next:** `4.x` — schema builder UI (list, field editor, reference picker), binding
  `SchemaListPage`/`SchemaEditorPage` to the hooks built here.

### [2026-06-23] 4.1 — Schema list
- **Did:** Replaced the `SchemaListPage` stub with a real page bound to the 3.2 data
  layer: `useSchemas()` drives loading/error/empty states and a grid of schema cards
  (name, field count, Edit/View-entries links, Delete); `useDeleteSchema()` handles
  removal. Added `SchemaListPage.module.css` — the first CSS Module in the repo — using
  the existing `index.css` tokens (`--accent`, `--border`, `--shadow`, etc.) plus a new
  spacing/radius scale (`--space-1..8`, `--radius`) added to that same file, per
  `css-conventions`. The grid-of-cards layout and "New Content Type" CTA take their
  shape from the imported design's `dashboard` view; its inline styles, blue/slate
  palette, and app-wide sidebar were not ported — the sidebar is whole-app layout, out
  of scope for a single list page, and inline styles violate the styling convention.
- **Decisions:** Delete confirmation uses `window.confirm` rather than a new modal
  component — the design's confirm modal is a shared component not scoped to this task;
  `window.confirm` is the minimal accessible stand-in until a real modal is needed
  elsewhere. New tokens were added directly to the existing `index.css` rather than
  split into a separate `styles/tokens.css` as the skill's example layout shows —
  splitting the whole stylesheet is an unrelated refactor. `AppRoutes.test.tsx` now
  wraps rendered pages in `QueryClientProvider`/`UseCasesProvider` (via the existing
  `makeWrapper` test helper) with fake use cases, since `SchemaListPage` calls data
  hooks that need them — previously all four routed pages were dumb stubs with no
  provider dependency.
- **Tests:** New `SchemaListPage.test.tsx`: loading state, schema list with field
  counts, empty state, error state, "New Content Type" link target, a card's Edit link
  target, delete confirmed vs. declined (`window.confirm` mocked). 8 new tests; 57
  frontend tests green overall. Found and left an unrelated, pre-existing build break:
  `tsc` rejects constructor-parameter-property syntax under `erasableSyntaxOnly` in 12
  `application`/`infrastructure/http` files from `3.2` — confirmed via `git stash` that
  it predates this task and isn't touched by anything here, so fixing it is its own
  task rather than scope creep on a list page.
- **Next:** `4.2` — schema form (add/remove/reorder fields); separately, the
  `erasableSyntaxOnly` build break from `3.2` needs its own fix.

### [2026-06-23] 3.2-fix — `erasableSyntaxOnly` build break
- **Did:** `tsconfig.app.json` has `"erasableSyntaxOnly": true`, which rejects
  constructor parameter properties (`constructor(private readonly x: T) {}`)
  because they emit real assignment code (`this.x = x`), not purely-erasable type
  syntax — `tsc -p tsconfig.app.json --noEmit` and `npm run build -w frontend` were
  failing with `TS1294` in the 12 files from `3.2` that used the pattern: the 10
  `application/{schema,entry}/*.ts` use cases and the 2
  `infrastructure/http/Http{Schema,Entry}Repository.ts` adapters. Rewrote all 12 to
  an explicit field declaration + constructor-body assignment
  (`private readonly schemas: SchemaRepository; constructor(schemas: ...) { this.schemas = schemas; }`),
  same mechanical transform throughout; `HttpSchemaRepository`/`HttpEntryRepository`
  kept their `baseUrl` default value on the plain parameter.
- **Decisions:** No behavior or public API change (`new X(repo)` call sites
  untouched), so no new tests — the existing suite already covers these classes.
  Found via `4.1`'s diary entry, which flagged this as a pre-existing break
  confirmed (via `git stash`) to predate that task.
- **Tests:** 57 frontend tests still green, unchanged. `tsc -p tsconfig.app.json
  --noEmit` and `npm run build -w frontend` now both clean.
- **Next:** `4.2` — schema form (add/remove/reorder fields).

### [2026-06-23] 4.2 — Schema form (add/remove/reorder fields)
- **Did:** `SchemaEditorPage` is now a real form (was a title-only stub) serving both
  `/schemas/new` and `/schemas/:schemaId/edit`. Extracted a controlled
  `SchemaFieldRow` component (`infrastructure/ui/react/components/`) for the
  repeating field unit: name/type/required inputs, a reference-target `<select>`
  shown only for `type === 'reference'` (sourced from `useSchemas()`, full
  picker UX deferred to `4.3`), and move-up/move-down/remove controls (no
  drag-and-drop dependency). Edit mode seeds the form from `useSchema(schemaId)`
  once via a ref guarded on `schema.id`; submit wires to `useCreateSchema` /
  `useUpdateSchema` and navigates to `/schemas` on success.
- **Decisions:** Field `id` is assigned server-side (confirmed in
  `CreateSchema.ts`/`UpdateSchema.ts`), so the form keeps `id` on fields loaded
  from an existing schema and omits it on newly-added ones; widened the
  `NewSchemaInput`/`SchemaUpdateInput` `fields` type in
  `domain/schema/SchemaRepository.ts` from `Schema['fields']` (`Field[]`, `id`
  required) to a new `FieldInput = Omit<Field, 'id'> & { id?: string }`, matching
  the backend's actual wire contract — the old type was simply wrong and only
  surfaced once this task tried to send a fieldless-id payload. Added light
  client-side validation (schema name required, field name required, no
  duplicate field names) on submit only; this is UX sugar, not the source of
  truth — the server still re-validates.
- **Tests:** New `SchemaFieldRow.test.tsx` (rendering, onChange payloads,
  reference-select visibility, move/remove button behavior incl. boundary
  disabling, `toFieldPayload` id-omission rules) and `SchemaEditorPage.test.tsx`
  (new/edit mode rendering, add/remove/reorder, validation blocking submit,
  create/update payload shape incl. id handling, navigation on success,
  mutation-error alert, pending/disabled Save button). Updated
  `AppRoutes.test.tsx`'s fake `getSchema` use case, which previously had no
  `execute` — harmless against the old stub page, but the real form now awaits
  it. 81 frontend tests green; `npm run build -w frontend` clean.
- **Next:** `4.3` — reference target picker.

### [2026-06-24] fix-cors — frontend↔backend CORS error
- **Did:** Frontend (`localhost:5173`) couldn't reach backend (`localhost:3001`) —
  no CORS middleware on the Express app, so the browser blocked every
  `/schemas`, `/entries`, `/api/content`, and `/events` (SSE) request. Added
  the `cors` package (+ `@types/cors`) to `backend/`, applied
  `app.use(cors({ origin: 'http://localhost:5173' }))` as the first middleware
  in `server.ts`, before `express.json()` and all routers — covers REST and the
  SSE stream alike.
- **Decisions:** Used the `cors` npm package over hand-rolled headers (asked
  the user per `CLAUDE.md` §2.7 before adding the dependency); origin pinned to
  the Vite dev server rather than `*`, since this is a same-machine dev setup.
- **Tests:** No new automated test — this is infra wiring, not domain/app
  logic. Verified manually: backend + frontend dev servers running, schema
  list loads, SSE `/events` connects, no CORS error in the browser console.
- **Next:** none.

### [2026-06-24] 4.3 — Reference target picker
- **Did:** Extracted the reference-target `<select>` (inline in
  `SchemaFieldRow` since 4.2) into its own
  `ReferenceTargetPicker.tsx` + co-located `ReferenceTargetPicker.module.css`,
  with its own test file. `SchemaFieldRow` now renders it for
  `field.type === 'reference'`, same `aria-label`/behaviour as before.
  Added an empty state — "No hay otros tipos de contenido disponibles." — for
  when `schemas` is empty, instead of an unusable `<select>` with no options.
- **Decisions:** Self-referencing schemas (e.g. `Employee → manager:
  Employee`, `Category → parent: Category`) are a valid use case and are
  **not** excluded from the picker's options — `SchemaEditorPage` still passes
  `allSchemas` unfiltered. Loading state is already covered by TanStack
  Query's cache from `useSchemas()`, so it wasn't touched.
- **Tests:** New `ReferenceTargetPicker.test.tsx` — lists schemas as options,
  reflects selected value, calls `onChange` with the chosen id, shows the
  empty state with no `<select>` when `schemas=[]`. Existing
  `SchemaFieldRow.test.tsx` reference-select test still green unmodified. 85
  frontend tests green; `tsc -b --noEmit` clean.
- **Next:** `4.x` continues; flag for `5.4` (reference field: target dropdown
  + jump-to-entry link) — self/circular references (e.g. `Category → parent →
  parent → ...`) need a depth limit when resolving/rendering reference chains
  in the entry editor, to avoid infinite render loops.

### [2026-06-24] 5.1 — Field registry
- **Did:** Added `frontend/src/infrastructure/ui/react/components/fields/`:
  one component per `FieldType` (`TextInput`, `NumberInput`, `BooleanInput`,
  `DateInput`, `ReferenceInput`), all implementing the same `FieldInputProps`
  contract (`field`, `value`, `onChange`, `error`). `FIELD_INPUTS` is the
  `FieldType → component` map; `FieldInput` is the single dispatch wrapper
  that looks up `FIELD_INPUTS[field.type]` and renders it, so the schema-
  generated form (5.3) never branches on `field.type` itself. Co-located
  `FieldInput.module.css` shared by all five inputs (one input class +
  `data-invalid`), per `css-conventions`.
- **Decisions:** `ReferenceInput` renders as a plain text input holding the
  raw target entry id (string) for now — no dropdown, no lookup. Its prop
  signature is identical to the other four inputs and is considered final:
  `5.4` only swaps `ReferenceInput`'s internals (dropdown of target schema's
  entries + jump-to-entry link) without touching `FieldInputProps`,
  `FIELD_INPUTS`, or any caller.
- **Tests:** New `FieldRegistry.test.tsx` — `FIELD_INPUTS` covers all 5
  `FieldType`s; `FieldInput` dispatches to the right `<input type>` per
  field type; each input renders its current value and calls `onChange` with
  the correctly typed value (number input emits `null` not `NaN` when
  cleared; boolean toggles; reference treats value as a plain id string);
  error prop renders a `role="alert"`. 99 frontend tests green; `tsc -b` and
  `vite build` clean.
- **Next:** `5.2` (entry table per schema), then `5.3` wires `FieldInput`
  into the schema-generated entry form.
