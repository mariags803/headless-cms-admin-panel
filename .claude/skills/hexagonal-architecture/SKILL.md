---
name: hexagonal-architecture
description: >
  Enforces hexagonal (ports & adapters) architecture across both the React client
  and the Node/Express server in this monorepo. Use this whenever creating or editing
  any .ts/.tsx file, deciding which folder a file belongs in, defining a port or an
  adapter, writing a use case, wiring dependencies in a composition root, or whenever
  a file is about to import a framework (react, express, better-sqlite3, fetch). Apply
  it even when the user only says "add an endpoint", "create a component", "write the
  repository", or "save to the database" without mentioning architecture at all.
---

# Hexagonal Architecture (Ports & Adapters)

This repo uses ports & adapters on **both** sides. The whole point is that business
rules don't know what framework, database, or transport they run on, so they stay
testable and the I/O is swappable. If you're putting `react`, `express`, SQL, or
`fetch` into a `domain/` or `application/` file, stop — that's the mistake this skill
exists to prevent.

## The one rule everything follows

Dependencies point **inward only**:

```
infrastructure  →  application  →  domain
   (adapters)       (use cases)     (model + ports)
```

- `domain/` depends on **nothing** outside itself. No framework, no library with I/O.
- `application/` depends only on `domain/` (and its own port interfaces).
- `infrastructure/` may depend on everything inward, plus frameworks.

A `domain/` or `application/` file may import types, pure functions from `shared/`,
and other inner files. It may **never** import `react`, `react-dom`, `express`,
`better-sqlite3`, `fetch`, an HTTP client, or any module that performs I/O.

## Where a file goes (decide before writing it)

| If the file… | It lives in | It is a… |
|---|---|---|
| Defines an entity/value object or a pure rule | `domain/<aggregate>/` | domain model |
| Declares an interface for persistence or transport | `domain/<aggregate>/XRepository.ts` | **port** |
| Declares an interface the app needs the outside to fulfil (e.g. publish events) | `application/ports/` | **output port** |
| Orchestrates a single business operation | `application/<aggregate>/DoX.ts` | use case |
| Implements a port using a framework/DB/network | `infrastructure/…` | **adapter** |
| Is a React component, Express controller, SSE handler | `infrastructure/…` | driving/driven adapter |
| Instantiates concrete adapters and injects them | `main.ts` / `main.tsx` / a provider | composition root |

If you can't place a file using this table, ask before writing it.

## Ports and adapters

A **port** is an interface owned by the inside (domain or application). An **adapter**
is a concrete implementation owned by `infrastructure/`. The inside depends on the
port; the adapter depends on the port too (it implements it). Neither the inside nor
the adapter depends on the other directly — they meet at the interface.

```ts
// domain/schema/SchemaRepository.ts  — PORT (no framework imports)
export interface SchemaRepository {
  findAll(): Promise<Schema[]>;
  findById(id: string): Promise<Schema | null>;
  save(schema: Schema): Promise<void>;
  delete(id: string): Promise<void>;
}

// infrastructure/persistence/sqlite/SqliteSchemaRepository.ts  — ADAPTER
import Database from 'better-sqlite3';
import type { SchemaRepository } from '../../../domain/schema/SchemaRepository';
export class SqliteSchemaRepository implements SchemaRepository { /* … */ }
```

## Use case shape

A use case takes its ports through the constructor (dependency injection) and exposes
one `execute`. It contains orchestration and business decisions — never SQL strings,
HTTP status codes, or JSX.

```ts
// application/entry/CreateEntry.ts
export class CreateEntry {
  constructor(
    private readonly entries: EntryRepository,
    private readonly schemas: SchemaRepository,
    private readonly events: EventPublisher, // output port
  ) {}

  async execute(input: NewEntry): Promise<Entry> {
    const schema = await this.schemas.findById(input.schemaId);
    if (!schema) throw new SchemaNotFound(input.schemaId);
    const errors = validateEntry(input.data, schema); // pure rule from shared/
    if (errors.length) throw new InvalidEntry(errors);
    const entry = /* build entity */;
    await this.entries.save(entry);
    this.events.publish({ type: 'entry.created', entry });
    return entry;
  }
}
```

## Composition root

Exactly one place per app constructs concrete adapters and wires them into use cases.
Nothing else uses `new SqliteSchemaRepository()` or `new HttpEntryRepository()`.

- Backend: `backend/src/main.ts` builds the DB, repositories, the SSE publisher, the
  use cases, then hands the use cases to the Express controllers.
- Frontend: a React provider (`infrastructure/ui/react/providers/`) builds the HTTP
  repositories and the SSE client and exposes use cases via context. Components call
  use cases from context — they never instantiate an adapter or call `fetch` directly.

## Client-specific mapping

The browser is just another set of adapters around the same shape:

- **Driving adapter:** React (`infrastructure/ui/react/`). React lives ONLY here.
- **Driven adapters:** `HttpSchemaRepository` / `HttpEntryRepository` (implement the
  client-side ports with `fetch`), and `SseClient` (real-time).
- Components consume use cases injected via context. A component that needs data calls
  a use case; it must not import an HTTP client or know an endpoint URL.

## Testing follows the seams

The architecture exists to make this cheap — write the tests at the ports:

- **Domain & `shared/` rules:** pure unit tests, no mocks needed. TDD here.
- **Use cases:** test against in-memory **fake** repositories that implement the same
  ports as the real adapters. No DB, no network, no React.
- **Adapters:** integration-test them directly (SQLite repo against `:memory:`,
  controllers via supertest, HTTP repo against a stubbed server).

```ts
// A fake adapter for use-case tests — same port, in-memory
export class InMemorySchemaRepository implements SchemaRepository {
  private store = new Map<string, Schema>();
  async findAll() { return [...this.store.values()]; }
  async findById(id: string) { return this.store.get(id) ?? null; }
  async save(s: Schema) { this.store.set(s.id, s); }
  async delete(id: string) { this.store.delete(id); }
}
```

## NEVER do these

- NEVER import `react`, `express`, `better-sqlite3`, or `fetch` from `domain/` or
  `application/`. If a use case "needs" the DB, it needs a **port**, not the driver.
- NEVER put SQL, JSON (de)serialization, HTTP status codes, or routing inside a use
  case or domain object. That belongs in an adapter.
- NEVER call `new SomeAdapter()` outside the composition root.
- NEVER let a React component call `fetch` or hold an endpoint URL.
- NEVER make `domain/` depend on `application/` or `infrastructure/` (inward only).

## Quick decision checklist before writing code

1. Which layer does this belong to? (use the table)
2. If it touches I/O — is there a port for it, and am I in an adapter?
3. Am I importing a framework into an inner layer? If yes, redesign.
4. Where does it get wired? (composition root)
5. What's the test, and at which seam? (write it first for domain/use cases)
