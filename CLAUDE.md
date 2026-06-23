# CLAUDE.md — repo root

Working agreement for AI agents on this monorepo. This file is the **map**: project
context, the contract, where things live, the build order, and the commands. The
*detailed conventions* live in the skills; each package has its own `CLAUDE.md` with its
specifics.

**Before writing code, read:** this file, the `CLAUDE.md` of the package you're working
in (`backend/`, `frontend/`, or `shared/`), and let the relevant skill load
(`hexagonal-architecture`, `css-conventions`, `cms-conventions`). Don't change the
contract (§4) or the field-id decision (§5) without asking.

---

## 1. What we're building

The admin panel for a small **headless CMS** (think Contentful / Sanity / Strapi).
Users define their own content **schemas** (content types made of typed fields),
then create and manage **entries** through them.

Five capabilities, in priority order for this take-home:

- **A — Schema builder.** Create/edit schemas. Fields are named + typed:
  `text`, `number`, `boolean`, `date`, `reference` (points at another schema).
- **B — Dynamic entry editor.** CRUD entries. The form is **generated from the
  schema**, never hand-written per type. Jump between referenced entries.
- **C — Real-time.** What one client changes, every open client sees immediately,
  no refresh. Handle a schema change that hits an entry someone has open.
- **D — Schema evolution (the part that matters most).** When a field is renamed,
  deleted, retyped, made required, or a reference is retargeted, existing entries
  may no longer fit. Communicate the risk, surface affected entries, preview
  before applying, and let people fix data — including mid-edit.
- **E — Read API.** Plain REST proving the content is real:
  `GET /api/content/:schema` and `GET /api/content/:schema/:id`.

Front-end is the whole point; the backend stays thin.

---

## 2. Golden rules for the agent

1. **Contract first.** The types in §4 are the single source of truth. They live in
   `shared/`; each app re-exports them — never redefine them per app.
2. **One task = one commit.** Each task has an explicit acceptance criterion.
   Don't start the next until the current one is green.
3. **Tests are not optional.** Domain and application logic are TDD (test first).
   See §7. A task isn't "done" until its tests pass.
4. **Append to the diary** after every completed task. Format in §8. No exceptions.
5. **Respect the hexagon.** Domain code imports nothing from frameworks; React,
   Express, SQLite and `fetch` live only in `infrastructure/`. Full rules in the
   `hexagonal-architecture` skill.
6. **Data is keyed by `field.id`, never by field name** (see §5). The whole
   schema-evolution story rests on this.
7. Ask before adding a dependency, changing the contract, or introducing a new
   pattern that isn't already in the repo.
8. **Styling lives in CSS, not in components.** Native CSS only — no Tailwind, no
   CSS-in-JS. Full rules in the `css-conventions` skill.

---

## 3. Repo layout

Monorepo with npm workspaces. Three packages, dependencies pointing **inward**:
`infrastructure → application → domain`, with `shared/` (types + pure rules) used by
both apps.

```
/
├── shared/      # contract types + framework-free pure rules (used by both apps)
├── backend/     # thin Node/Express + SQLite + SSE service
├── frontend/    # the React front-end (the whole point)
├── docs/
│   └── DIARY.md
├── CLAUDE.md    # this file
└── README.md
```

Each package's **internal** structure (its hexagonal layers) is documented in its own
`CLAUDE.md`. Each app's `domain/` re-exports the `shared/` contract rather than
redefining it; the duplication of the *shape* is intentional (each app owns its model),
but logic is imported from `shared/`, never copied.

---

## 4. The contract (canonical types — implemented in `shared/src/contract/`)

```ts
// FieldType.ts
export type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'reference';

// Field.ts
export interface Field {
  id: string;          // stable uuid. DATA IS KEYED BY THIS, NOT BY name.
  name: string;        // label shown to users. Renaming is non-destructive.
  type: FieldType;
  required: boolean;
  refSchemaId?: string; // only when type === 'reference'
}

// Schema.ts
export interface Schema {
  id: string;
  name: string;        // "Car", "Person", "Article"...
  fields: Field[];
  createdAt: string;   // ISO 8601
  updatedAt: string;
}

// Entry.ts
export type FieldValue = string | number | boolean | null;
// A reference value is the target Entry's id (string) or null.

export interface Entry {
  id: string;
  schemaId: string;
  data: Record<string, FieldValue>; // key = Field.id  (NEVER Field.name)
  createdAt: string;
  updatedAt: string;
}

// events.ts — real-time payloads
export type DomainEvent =
  | { type: 'schema.created'; schema: Schema }
  | { type: 'schema.updated'; schema: Schema }
  | { type: 'schema.deleted'; schemaId: string }
  | { type: 'entry.created'; entry: Entry }
  | { type: 'entry.updated'; entry: Entry }
  | { type: 'entry.deleted'; entryId: string; schemaId: string };

// evolution types
export type SchemaChange =
  | { kind: 'field.added';           field: Field }
  | { kind: 'field.removed';         field: Field }
  | { kind: 'field.renamed';         fieldId: string; from: string; to: string }
  | { kind: 'field.retyped';         fieldId: string; from: FieldType; to: FieldType }
  | { kind: 'field.requiredChanged'; fieldId: string; required: boolean }
  | { kind: 'field.refRetargeted';   fieldId: string; from?: string; to?: string };

export type RiskLevel = 'safe' | 'warning' | 'destructive';

export interface AffectedEntry {
  entryId: string;
  fieldId: string;
  currentValue: FieldValue;
  coerced?: { ok: true; value: FieldValue } | { ok: false }; // for retypes
}
```

Authoritative home of these types and the rules over them: `shared/` (see
`shared/CLAUDE.md`).

---

## 5. Key decision — data keyed by `field.id`

Entry `data` is a `Record<fieldId, value>`, **not** `Record<fieldName, value>`.

- **Rename is free and non-destructive** — only the label changes; values stay bound to
  the stable id. It collapses to a `safe` change.
- The **Read API resolves `fieldId → name` at serialization time**, so consumers get
  readable JSON (`brand`, `year`, `owner`) while storage stays rename-proof.
- Evolution then only deals with the *genuinely* risky changes: retype, remove,
  required, reference retarget.

Recorded as ADR-001 in the diary; mention it in the README too.

---

## 6. Schema evolution model (the centerpiece)

The pure pipeline lives in `shared/src/evolution/` and runs on **both** sides — the
frontend uses it to preview, the backend re-runs it to enforce on apply — so the two can
never diverge:

`diffSchemas(old, next)` → `SchemaChange[]`, then `classifyRisk` per change, then
`scanAffected(changes, entries)` to surface what breaks, with `coerce` proposing
conversions for retypes.

Risk levels: `safe` (add optional, rename), `warning` (coercible retype, required→true
with empties, resolvable reference retarget), `destructive` (remove, non-coercible
retype, unresolvable references). The hard case: `year` text → number while entries hold
`"vintage"` / `"n/a"` — `coerce` returns `{ ok: false }`, and the UI must surface those
and let the user fix them before applying.

For any non-`safe` change the flow is always: communicate the risk → show affected
entries → preview before applying → offer a fixer → server re-validates with the same
`shared/` functions. A `schema.updated` event arriving mid-edit must not discard input:
banner + reconcile. Full rules in the `cms-conventions` skill.

---

## 7. Testing (repo-wide)

**Jest** everywhere, deliberately decoupled from the build tool so the suite never
depends on Vite. Test at the seams the hexagon gives you: `shared/` pure rules and
domain logic as plain unit tests (TDD); use cases against in-memory fake repositories;
adapters as integration tests. A task's acceptance criterion **is** its test; "done" =
green. Per-package test specifics (tooling, what to cover) are in each package's
`CLAUDE.md`.

---

## 8. Development diary protocol (`docs/DIARY.md`)

After **every** completed task, append an entry. Keep it terse.

```
### [YYYY-MM-DD] <task id> — <title>
- **Did:** one or two lines on what was built.
- **Decisions:** any choice worth remembering (or "none").
- **Tests:** what was covered.
- **Next:** the immediate follow-up, if any.
```

Significant architectural decisions also get a numbered ADR block at the top of the
diary (`## ADR-00X — <title> [accepted|superseded]` with Context / Decision /
Consequences). The diary is part of the deliverable — the trail showing *how* the work
was reasoned, which is what a senior take-home is judged on.

---

## 10. How this repo is documented

- **root `CLAUDE.md`** (this) — the map: context, contract, layout, backlog, commands.
- **`backend/CLAUDE.md`** — the thin backend's structure, persistence, Read API, tasks.
- **`frontend/CLAUDE.md`** — the front-end's structure, UI patterns, styling, tasks.
- **`shared/CLAUDE.md`** — the contract + pure rules, and what may/may not live there.
- **Skills** (`.claude/skills/`):
  - `hexagonal-architecture` — where code goes, ports & adapters, both sides.
  - `css-conventions` — native CSS, thin components.
  - `cms-conventions` — domain rules: field.id keying, field registry, schema
    evolution, Read API name resolution, DomainEvents, validation.

Rule of thumb: **facts & structure → `CLAUDE.md`; detailed how-to → skills.** Don't
duplicate one into the other.
