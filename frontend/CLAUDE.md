# CLAUDE.md — frontend/

The **front-end — the whole point**: React + TypeScript SPA. Driving adapter = React;
driven adapters = HTTP repositories + SSE client. Components stay thin; data access goes
through use cases injected via a React provider (the composition root) — never `fetch`
inside a component.

Conventions live in the skills: `hexagonal-architecture` (layers, where code goes),
`css-conventions` (native CSS, no Tailwind), `cms-conventions` (field registry,
references, evolution preview, validation). This file covers frontend-specific structure
and tasks. Repo-wide context and the contract are in the root `CLAUDE.md`.

## Layout

```
frontend/src/
├── domain/
│   ├── schema/ Schema.ts · SchemaRepository.ts   # PORT
│   └── entry/  Entry.ts  · EntryRepository.ts     # PORT
├── application/
│   ├── schema/ · entry/                # use cases the UI calls
│   └── evolution/buildEvolutionPlan.ts # uses shared/evolution to drive the preview
├── infrastructure/
│   ├── http/   HttpSchemaRepository.ts · HttpEntryRepository.ts  # ADAPTERS (fetch)
│   ├── realtime/SseClient.ts           # ADAPTER (EventSource)
│   └── ui/                             # React lives ONLY here
│       ├── react/
│       │   ├── pages/
│       │   ├── components/fields/      # field registry
│       │   ├── hooks/useRealtime.ts
│       │   └── providers/              # composition root: inject repositories
│       └── App.tsx
└── main.tsx
```

Components consume use cases injected via context. A component never instantiates an
adapter, calls `fetch`, or knows an endpoint URL. See the `hexagonal-architecture` skill.

## UI patterns (rules in the `cms-conventions` skill)

- **Dynamic entry editor:** the form is generated from the schema via a **field
  registry** (`FieldType → input component`). Never hand-write a form per content type.
- **Reference fields:** value = target entry id; render a dropdown of the target
  schema's entries (shown by its first `text` field) plus a link to jump to the
  referenced entry.
- **Schema-evolution preview:** `application/evolution/buildEvolutionPlan` runs the
  shared `diffSchemas → classifyRisk → scanAffected` to show changes, risk badges,
  affected entries, and an inline fixer before applying. Handle a `schema.updated` event
  mid-edit with a banner + reconcile (never silently drop the user's input).
- **Real-time:** `useRealtime()` subscribes to the SSE stream and invalidates queries.

## Styling

Native CSS only, per the `css-conventions` skill: a component carries one class name +
`data-`/ARIA state attributes; appearance lives in co-located CSS Modules; tokens are
`:root` custom properties; `@layer` for specificity; container queries for component
responsiveness. No Tailwind, no CSS-in-JS, no static inline styles.

## Tasks (frontend slice of the backlog)

- 2.3 `useRealtime()` hook + query invalidation.
- 3.1 Routing; 3.2 data layer (TanStack Query) over the HTTP repositories.
- 4.x Schema builder: list, field editor (add/remove/reorder), reference target picker.
- 5.x Dynamic entry editor: registry, entry table, generated form, reference jump.
- 6.3–6.5 Evolution preview modal, fixer, mid-edit reconciliation.
- 7 Polish: empty/loading/error states, validation messages, styling, README.

## Tests

- **`application/`** — use cases against fake repositories (no network).
- **`ui/`** — Testing Library + jsdom: the form generates from a schema; the reference
  picker lists target entries; the evolution preview shows the right risk and affected
  count for the `text → number` case.

## Commands

```
npm run dev -w frontend
npm test -w frontend
```
