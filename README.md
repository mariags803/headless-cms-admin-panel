# Headless CMS — Admin Panel

A small headless CMS admin panel (think Contentful/Sanity, scoped down): define
content **schemas**, manage **entries** through a generated form, see changes
**in real time** across clients, and safely **evolve** schemas without losing
data — including a guided fixer for entries that no longer fit.

## Quick start

```bash
npm install
npm run dev
```

That starts both servers (backend on `:3001`, frontend on `:5173`) via
`concurrently`. Open `http://localhost:5173`.

Other root commands, all run across the three workspaces (`shared`, `backend`,
`frontend`):

```bash
npm test         # Jest, all workspaces
npm run typecheck  # tsc --noEmit, all workspaces
```

## Documentation

Full task-by-task history and ADRs: `docs/DIARY.md`.  
Backlog: `docs/BACKLOG.md`.  
Claude Code's conversations: `docs/conversations/`.

## How to see schema evolution in action (Point D)

This is the part of the brief that matters most — a schema change that some
existing entries no longer fit, walked end to end:

1. **Create a schema** named `Car` with one field `year`, type **text**.
2. **Create two entries**: one with `year = "2024"`, another with
   `year = "vintage"`.
3. **Edit the schema** and retype `year` from `text` to `number`.
4. The **evolution preview** opens: it shows the risk level for the retype and
   lists the affected entries. The `"2024"` entry is flagged as auto-coercible
   (`2024`); the `"vintage"` one can't be coerced and is flagged for manual
   fixing.
5. Use the **inline fixer** to type a valid number for the `"vintage"` row
   (e.g. `1925`). The "Apply" button enables once every affected row is
   resolved.
6. **Apply.** The schema and both entries update atomically. Open the entries
   list for `Car` — `year` is now a number on every row, including the one you
   just fixed.

If another browser tab has that same entry open mid-edit when step 6 happens,
it gets a banner instead of having its in-progress input silently discarded —
it can update to the new schema or dismiss and keep editing on the old one.

## Layout

```
shared/     contract types + pure rules (FieldType, Schema, Entry, evolution pipeline)
backend/    thin Node/Express + SQLite + SSE service
frontend/   the React admin panel
docs/       BACKLOG.md (task list) and DIARY.md (decisions + task log)
```
