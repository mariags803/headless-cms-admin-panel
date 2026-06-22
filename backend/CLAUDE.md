# CLAUDE.md — backend/

The **thin backend**: Node + Express + TypeScript over `better-sqlite3`, with SSE for
real-time. Driving adapter = HTTP; driven adapters = SQLite + SSE. Keep it thin —
business decisions live in use cases, not in controllers or SQL.

Conventions live in the skills: `hexagonal-architecture` (where code goes, ports &
adapters) and `cms-conventions` (field.id keying, Read API name resolution,
DomainEvents). This file covers backend-specific structure and tasks. Repo-wide context
and the contract are in the root `CLAUDE.md`.

## Layout

```
backend/src/
├── domain/
│   ├── schema/
│   │   ├── Schema.ts            # re-exports / wraps the shared contract
│   │   └── SchemaRepository.ts  # PORT (interface)
│   └── entry/
│       ├── Entry.ts
│       └── EntryRepository.ts   # PORT
├── application/
│   ├── ports/
│   │   └── EventPublisher.ts    # OUTPUT PORT for real-time
│   ├── schema/  CreateSchema · UpdateSchema · DeleteSchema · ListSchemas
│   └── entry/   CreateEntry · UpdateEntry · DeleteEntry · ListEntries · GetEntry
├── infrastructure/
│   ├── persistence/sqlite/
│   │   ├── db.ts                       # better-sqlite3 init + migrations
│   │   ├── SqliteSchemaRepository.ts   # ADAPTER implements SchemaRepository
│   │   └── SqliteEntryRepository.ts    # ADAPTER implements EntryRepository
│   ├── http/express/
│   │   ├── server.ts                   # Express app
│   │   ├── SchemaController.ts
│   │   ├── EntryController.ts
│   │   └── ContentController.ts        # the Read API (E)
│   └── realtime/
│       └── SseEventPublisher.ts        # ADAPTER implements EventPublisher
└── main.ts                             # composition root (wires everything)
```

## Use cases

Constructor-injected ports, one `execute`. No SQL, HTTP status codes, or JSON strings
inside a use case — those belong in adapters. `main.ts` is the only place that does
`new SomeAdapter()`. See the `hexagonal-architecture` skill for the full shape and the
in-memory fake pattern used in tests.

## Persistence

`better-sqlite3` with JSON columns — keeps the backend thin while preserving the
"data keyed by field.id" model. Repositories (de)serialize JSON at the adapter
boundary; the domain only ever sees `Schema` / `Entry` objects.

```sql
CREATE TABLE IF NOT EXISTS schemas (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  fields TEXT NOT NULL,            -- JSON: Field[]
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY, schema_id TEXT NOT NULL,
  data TEXT NOT NULL,              -- JSON: Record<fieldId, FieldValue>
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY (schema_id) REFERENCES schemas(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_entries_schema ON entries(schema_id);
PRAGMA foreign_keys = ON;
```

## Read API (E)

`GET /api/content/:schema` and `GET /api/content/:schema/:id`. ALWAYS resolve
`field.id → field.name` on serialization so consumers get readable JSON
(`{ brand, year, owner }`, not `{ f_8c1a, … }`). That mapping lives in the
serialization adapter (`ContentController`), never in the domain.

## Real-time

Every mutation publishes a `DomainEvent` through the `EventPublisher` output port;
`SseEventPublisher` streams it on `/events`. Publish from **inside the use case**, not
the controller, so any future transport stays consistent.

## Tasks (backend slice of the backlog)

- 0.3 SQLite init + migrations.
- 1.1–1.4 Schemas / Entries CRUD + Read API — each endpoint is one task with a `curl`
  acceptance check.
- 2.1 SSE endpoint `/events` + `EventPublisher` port & adapter.
- 2.2 Publish a `DomainEvent` from every mutation.

## Tests

- **`application/`** — use cases against in-memory **fake** repositories (same ports as
  the SQLite adapters). e.g. `UpdateEntry` rejects an invalid entry; `DeleteSchema`
  cascades.
- **`infrastructure/`** — SQLite repos against a `:memory:` or temp-file db; controllers
  via **supertest**, including the Read API name resolution.

## Commands

```
npm run dev -w backend
npm test -w backend
```
