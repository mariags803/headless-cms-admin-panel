# CLAUDE.md — shared/

The single source of truth for what the frontend and backend must agree on: the
**contract types** and the **pure rules** for schema evolution and validation. It exists
so the front-end preview and the back-end enforcement of a schema change run the *same
code* and can never drift — which matters because schema evolution is the centerpiece.

## What may live here — and what may not

- **MAY:** type definitions and pure functions only.
- **MUST NOT:** any framework or I/O — no `react`, `express`, `better-sqlite3`, `fetch`;
  no repositories, adapters, or use cases; nothing with side effects.

This keeps the shared surface the *least-coupling* kind of sharing: each app still owns
its own `domain/`/`application/` layers and merely agrees with the other through these
types and pure functions. If something here would need I/O, it doesn't belong here.

## Contents

```
shared/src/
├── contract/    # FieldType, Field, Schema, Entry, FieldValue, DomainEvent
│                # (canonical listing in the root CLAUDE.md §4)
├── evolution/
│   ├── diffSchemas.ts    # (old, next) -> SchemaChange[]
│   ├── classifyRisk.ts   # SchemaChange -> RiskLevel
│   ├── coerce.ts         # (value, targetType) -> { ok: true; value } | { ok: false }
│   └── scanAffected.ts   # (changes, entries) -> AffectedEntry[]
└── validation/
    └── validateEntry.ts  # (data, schema) -> ValidationError[]
```

The detailed semantics (risk levels, the hard `text → number` case, what counts as
affected) are in the `cms-conventions` skill.

## Consumption — source-only, path-mapped

`shared/` is **not** a separately built or published package. It is TypeScript source
consumed by both apps via a `tsconfig` path alias, and in tests via a Jest
`moduleNameMapper` pointing at `shared/src`. No build step of its own — each app
compiles it as part of its own build. This keeps the third workspace from adding
bundler/publish overhead, while preserving the single source of truth.

## Tests — TDD, the highest coverage in the repo

These pure functions are trivial to test and the most important to get right. Write the
test first.

- `coerce`: `"2024" → 2024`; `"vintage"` / `"n/a"` → number ⇒ `{ ok: false }`.
- `diffSchemas`: a rename yields `field.renamed`, not remove + add.
- `classifyRisk`: remove ⇒ `destructive`, rename ⇒ `safe`, retype ⇒ depends on values.
- `scanAffected`: returns exactly the entries that break — no more, no fewer.
- `validateEntry`: required fields, type mismatch, dangling reference.

## Tasks (shared slice of the backlog)

- 0.2 Write the contract. **Frozen after this.**
- 6.1 `diffSchemas` + `classifyRisk` (TDD).
- 6.2 `scanAffected` + `coerce` (TDD).

## Commands

```
npm test -w shared    # run constantly during Phase 6
```
