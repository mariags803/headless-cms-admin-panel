---
name: cms-conventions
description: >
  Encodes the domain conventions for this headless CMS admin panel: entry data keyed
  by field.id (never by name), the shared contract types, the dynamic field registry,
  the schema-evolution rules that live in shared/, the Read API name resolution, and
  the real-time DomainEvent contract. Use this whenever working with schemas, fields,
  entries, the entry editor or generated form, reference fields, schema evolution /
  migration / diff / "the field changed type", the Read API, real-time / SSE updates,
  or the development diary — apply it even when the user only says "add a field",
  "edit an entry", "render the form", or "the year field should be a number".
---

# Headless CMS — Domain Conventions

This is the admin panel for a small headless CMS. Users define **schemas** (content
types made of typed fields) and manage **entries** through them. These conventions are
what keep the dynamic editor, the real-time sync, and the schema-evolution story
coherent. They sit on top of `CLAUDE.md` (architecture) and the types in `shared/`.

## The decision the whole project rests on: data is keyed by `field.id`

`Entry.data` is `Record<fieldId, value>` — keyed by the field's stable uuid, **never**
by its display name.

```ts
// CORRECT
entry.data = { "f_8c1a": "Tesla", "f_9d2b": 2024, "f_a3e0": "<personEntryId>" };
// WRONG — breaks on rename
entry.data = { "brand": "Tesla", "year": 2024, "owner": "<personEntryId>" };
```

Why it matters: renaming a field then changes only its `name` (a label). Values stay
bound to the id, so **rename is non-destructive** and collapses to a `safe` change.
This narrows real evolution risk to retype, remove, required, and reference retarget.

ALWAYS read and write entry values by `field.id`. NEVER key entry data, form state,
or validation by `field.name`.

## The contract (canonical in `shared/src/contract/`)

Don't redefine these per app — import from `shared`. Summary:

- `FieldType = 'text' | 'number' | 'boolean' | 'date' | 'reference'`
- `Field { id, name, type, required, refSchemaId? }` — `refSchemaId` only for references.
- `Schema { id, name, fields: Field[], createdAt, updatedAt }`
- `Entry { id, schemaId, data: Record<fieldId, FieldValue>, createdAt, updatedAt }`
- `FieldValue = string | number | boolean | null`; a reference value is the target
  entry's id (string) or null.

## Dynamic entry editor — field registry, never hand-written forms

The form is generated from the schema. ALWAYS render via a registry mapping
`FieldType → input component`. Adding a new field type must mean adding one registry
entry and nothing else.

```ts
const FIELD_INPUTS: Record<FieldType, FieldInputComponent> = {
  text:      TextInput,
  number:    NumberInput,
  boolean:   BooleanInput,
  date:      DateInput,
  reference: ReferenceInput,
};
```

NEVER write a per-type form (no `if (schema.name === 'Car')`). Iterate `schema.fields`
and look up the component. The form must re-render when the schema changes.

## Reference fields

- The stored value is the **target entry's id** (or null), pointing at the schema in
  `field.refSchemaId`.
- The input is a dropdown of that target schema's entries, shown by a **display field**
  (the schema's first `text` field, falling back to its id).
- ALWAYS provide a way to jump to the referenced entry (a link/route) so users can
  navigate between related content.

## Schema evolution (the part that matters most)

All evolution logic is **pure functions in `shared/src/evolution/`**, imported by both
the client (to preview) and the server (to enforce on apply). They must never diverge.

Pipeline: `diffSchemas(old, new)` → `SchemaChange[]`, then `classifyRisk` per change,
then `scanAffected(changes, entries)` to surface the entries that break, with `coerce`
proposing conversions for retypes.

Risk classification:

- `safe` — `field.added` (optional), `field.renamed` (id-keyed, so data survives).
- `warning` — `field.retyped` when values are coercible; `field.requiredChanged → true`
  with some entries empty; `field.refRetargeted` with resolvable references.
- `destructive` — `field.removed` (data loss); `field.retyped` with non-coercible
  values; references that no longer resolve.

The hard case: `year` text → number while entries hold `"vintage"` / `"n/a"`. `coerce`
returns `{ ok: false }` for those; the UI must surface them and let the user fix the
data before applying.

ALWAYS, for any non-`safe` change:
1. Communicate the risk (badge + plain-language explanation).
2. Show the count and list of affected entries.
3. Preview before applying — nothing is written until the user confirms.
4. Offer a fixer: inline edit, bulk transform (coerce), set a default, or clear.
5. Re-validate on the server in `UpdateSchema` using the same `shared/` functions, so
   an apply can't accept data the preview marked invalid.

Mid-edit case: if a `schema.updated` event arrives while a user has an entry open, do
NOT silently discard their input — show a banner and reconcile the open form against
the new schema (drop removed fields, add new ones, flag values that no longer fit).

## Read API — resolve `fieldId → name` on the way out

The Read API proves another app could consume the content, so its JSON must be readable
even though storage is id-keyed.

- `GET /api/content/:schema` → all entries of that schema.
- `GET /api/content/:schema/:id` → one entry.
- ALWAYS serialize by mapping each `field.id` back to `field.name`, producing
  `{ brand, year, owner }` rather than `{ f_8c1a, f_9d2b, f_a3e0 }`. This mapping lives
  in the serialization adapter, not in the domain.

## Real-time — the DomainEvent contract

Every mutation publishes a `DomainEvent` (see `shared/src/contract/events.ts`):
`schema.created | schema.updated | schema.deleted | entry.created | entry.updated |
entry.deleted`. ALWAYS publish from inside the use case (via the `EventPublisher`
output port), so HTTP and any future transport stay consistent. On the client, the SSE
adapter feeds these events into query invalidation so every open client updates without
a refresh.

## Validation

`validateEntry(data, schema)` (pure, in `shared/`) is the single source of truth:
required fields present, values match field types, references resolve. The client uses
it for inline feedback; the server uses it before persisting. NEVER duplicate
validation logic in a component or controller — call the shared function.

## Testing priorities (TDD on the pure core)

Highest value, write tests first:
- `coerce`: `"2024" → 2024`; `"vintage"`/`"n/a"` → number ⇒ `{ ok: false }`.
- `diffSchemas`: a rename yields `field.renamed`, not remove + add.
- `classifyRisk`: remove ⇒ destructive, rename ⇒ safe, retype ⇒ depends on values.
- `scanAffected`: returns exactly the entries that break, no more.
- `validateEntry`: required, type mismatch, dangling reference.
- Component tests: form generates from a schema; reference picker lists targets; the
  evolution preview shows the right risk and affected count for the text→number case.

## Development diary — append after every task

After completing any task, append an entry to `docs/DIARY.md` (format in `docs/BACKLOG.md`
): what was done, decisions, tests, next. Significant architectural choices get a
numbered ADR at the top of the diary. The diary is part of the deliverable — it's the
trail of how the work was reasoned, which is what a senior take-home is judged on.

## NEVER do these

- NEVER key entry data, form state, or the Read API storage by `field.name`.
- NEVER hand-write a form per content type — generate from the schema via the registry.
- NEVER duplicate evolution or validation logic; import the pure functions from `shared/`.
- NEVER apply a risky schema change without preview + affected entries + a fix path.
- NEVER drop a user's in-progress edit when a schema change arrives mid-edit.
- NEVER expose raw id-keyed data from the Read API; resolve names on serialization.
