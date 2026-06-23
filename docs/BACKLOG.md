# Task backlog (build in this order)

Slices are vertical: backend of a slice before its front-end, so the UI tests against
real data. Each line is one task / one commit / one diary entry. Per-package files
repeat their own slice.

**Phase 0 — Skeleton & contract**
- 0.1 Monorepo scaffold (`shared`, `backend`, `frontend` workspaces, per-workspace Jest configs).
- 0.2 Write the contract (§4) in `shared/contract`. *Frozen after this.*
- 0.3 SQLite init + migrations.

**Phase 1 — Backend CRUD** (each endpoint = a task with a `curl` acceptance check)
- 1.1 Schemas: `GET/POST/PUT/DELETE /schemas`.
- 1.2 Entries: `GET /entries?schema=`, `GET /entries/:id`, `POST/PUT/DELETE /entries`.
- 1.3 Read API (E): `GET /api/content/:schema`, `/:schema/:id` (resolve fieldId→name).

**Phase 2 — Real-time**
- 2.1 SSE endpoint `/events` + `EventPublisher` port & adapter.
- 2.2 Publish a `DomainEvent` from every mutation in Phase 1.
- 2.3 `useRealtime()` hook in the front-end; wire it to query invalidation.

**Phase 3 — Front-end base**
- 3.1 Routing: schema list / schema editor / entry list / entry editor.
- 3.2 Data layer (TanStack Query) over the HTTP repositories + realtime invalidation.

**Phase 4 — Schema builder (A)**
- 4.1 Schema list. 4.2 Schema form (add/remove/reorder fields). 4.3 Reference target picker.

**Phase 5 — Dynamic entry editor (B)**
- 5.1 Field registry. 5.2 Entry table per schema. 5.3 Schema-generated form.
  5.4 Reference field: target dropdown + jump-to-entry link.

**Phase 6 — Schema evolution (D) — the centerpiece**
- 6.1 `diffSchemas` + `classifyRisk` (TDD in `shared/`).
- 6.2 `scanAffected` + `coerce` (TDD in `shared/`).
- 6.3 Preview modal: changes, risk badges, affected count + list.
- 6.4 Fixer: inline edit / bulk transform before apply; server re-validates.
- 6.5 Mid-edit: incoming `schema.updated` while an entry is open ⇒ banner + reconcile.

**Phase 7 — Polish**
- Empty/loading/error states, validation messages, coherent minimal styling, README.
