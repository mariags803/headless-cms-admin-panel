---
name: css-conventions
description: >
  Native-CSS styling conventions for this project: NO Tailwind, NO CSS-in-JS. Styling
  responsibility lives entirely in CSS files so components stay simple — they only
  toggle semantic class names and data-/ARIA attributes. Use this whenever writing or
  editing styles, creating or restyling a React component, adding a variant or state
  appearance, setting up design tokens/theme/dark mode, choosing layout, or making
  something responsive. Apply it even when the user just says "style this", "make it
  look like X", "add a danger button", "center this", or "add a dark theme" without
  mentioning CSS explicitly. If you are about to write `style={{…}}` or a Tailwind
  class, stop and consult this skill.
---

# CSS Conventions — Native CSS, thin components

Styling is native CSS only. No Tailwind, no CSS-in-JS. The reason is control and
separation of concerns: appearance lives in CSS files, components express *state*. A
component's only styling job is to pick a semantic class name or flip a `data-`/ARIA
attribute; the CSS file decides what that looks like. This keeps JSX readable and makes
the styling layer swappable and reviewable on its own.

## The core split: components express state, CSS expresses appearance

A component carries **one** class name and optionally some `data-`/ARIA attributes that
describe state. It does not carry appearance.

```tsx
// CORRECT — component states what it is; CSS owns how it looks
import styles from './Button.module.css';
export function Button({ variant = 'primary', loading, ...props }) {
  return (
    <button
      className={styles.button}
      data-variant={variant}
      data-loading={loading || undefined}
      {...props}
    />
  );
}
```

```css
/* Button.module.css — all appearance lives here */
.button { /* base */ }
.button[data-variant='primary'] { /* … */ }
.button[data-variant='danger']  { /* … */ }
.button[data-loading] { /* … */ }
```

```tsx
// WRONG — appearance leaking into the component
<button style={{ background: 'red', padding: 8 }}>     // static inline styles
<button className="bg-red-500 px-2 py-1 rounded">      // Tailwind utility soup
```

ALWAYS map state → class name / data-attribute and let CSS target it.
NEVER write static inline styles, Tailwind classes, or styled-components.

**Dynamic values exception:** for a value only known at runtime (a drag offset, a
computed percentage), set a CSS **custom property** inline and let the CSS file decide
how to use it — the stylesheet still owns the rule:

```tsx
<div className={styles.bar} style={{ '--progress': `${pct}%` }} />
```
```css
.bar { inline-size: var(--progress); }
```

## Mechanism: CSS Modules, co-located

Put `Component.module.css` next to `Component.tsx`. Import `styles`, reference
`styles.x`. Class names are scoped locally at build time, so there's no global leakage
and no need for BEM gymnastics. The CSS itself is plain and native — Modules only
hashes the class names; it's a cross-bundler standard (Vite, webpack, Parcel, esbuild),
not a lock-in.

Global, app-wide CSS (reset, tokens, base element styles, layer order) lives in
`frontend/src/styles/` and is imported once at the entry point — never duplicated per
component.

> Zero-build alternative: if you want the bundler to not touch styling at all, use
> plain global CSS with `@layer` + native `@scope` for encapsulation and BEM for
> naming. Same conventions below apply; only the scoping mechanism changes.

## Design tokens — the single source of truth

All values come from CSS custom properties on `:root`. NEVER hardcode a magic color,
space, or size in a component stylesheet — reference a token.

```css
/* styles/tokens.css */
:root {
  /* color */
  --color-bg: #ffffff;
  --color-fg: #1a1a1a;
  --color-muted: #6b7280;
  --color-accent: #2563eb;
  --color-danger: #dc2626;
  --color-border: #e5e7eb;
  /* spacing scale (use these, not raw px) */
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem;    --space-6: 1.5rem; --space-8: 2rem;
  /* type scale */
  --text-sm: 0.875rem; --text-base: 1rem; --text-lg: 1.25rem; --text-xl: 1.5rem;
  /* radii, shadow, motion, layering */
  --radius: 0.5rem;
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.06);
  --duration: 150ms;
  --z-modal: 1000;
}
```

Theming: override tokens under a selector and let everything inherit. Support both an
explicit toggle and the OS preference. Declare `color-scheme` so native controls and
scrollbars match, and use `accent-color` for native form controls (relevant for an
admin panel full of inputs).

```css
:root { color-scheme: light dark; }
[data-theme='dark'] {
  --color-bg: #0f1115; --color-fg: #f3f4f6; --color-border: #2a2e37;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) { /* dark token overrides */ }
}
input, select, textarea { accent-color: var(--color-accent); }
```

## Cascade layers — predictable specificity, no `!important`

Declare layer order once; later layers win regardless of selector specificity, so you
never fight the cascade or reach for `!important`.

```css
/* styles/base.css */
@layer reset, tokens, base, components, utilities;
```

Keep selectors flat. Use `:where()` for zero-specificity base rules so components can
override them trivially. NEVER use `!important`, ID selectors, or deep descendant
chains (`.card .header .title span`). If specificity feels hard, the layer or the
markup is wrong.

## Layout — Grid and Flexbox, intrinsic and fluid

- Grid for 2D layout, Flexbox for 1D. Space children with `gap`, not margins between.
- Prefer fluid sizing with `clamp()`, `min()`, `max()` over fixed pixel breakpoints
  where it reads naturally (e.g. fluid type: `font-size: clamp(1rem, 0.9rem + 1vw, 1.25rem)`).
- Use **logical properties** (`margin-inline`, `padding-block`, `inset`, `inline-size`)
  rather than physical ones — cleaner and writing-mode independent.

## Responsiveness — container queries first

For reusable components (a table, a card, an entry-form field), style against their
**container** with `@container`, not the viewport. A component should adapt to where
it's placed, not to the window. Reserve viewport `@media` queries for page-level layout
(sidebar collapse, overall grid).

```css
.card { container-type: inline-size; }
@container (min-width: 30rem) {
  .card__body { grid-template-columns: 1fr 1fr; }
}
```

## State and variants live in CSS, keyed off attributes

Expose state as `data-`/ARIA attributes and target them in CSS. This keeps the JSX to a
single class plus declarative state, and puts every visual variant in one place.

```css
.row[aria-selected='true'] { background: var(--color-accent); }
.field[data-invalid] { border-color: var(--color-danger); }
.dialog[data-state='open'] { /* … */ }
```

## Accessibility and motion (not optional)

- ALWAYS provide a visible `:focus-visible` style; never remove an outline without a
  replacement. Keyboard users navigate admin panels constantly.
- Respect motion preferences: wrap non-essential animation and disable it under
  `@media (prefers-reduced-motion: reduce)`.
- Ensure contrast through tokens (don't invent low-contrast greys inline).

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition: none !important; }
}
```
(The only sanctioned `!important` is this reduced-motion reset.)

## File organization

```
frontend/src/
├── styles/
│   ├── reset.css        # @layer reset
│   ├── tokens.css       # :root custom properties
│   ├── base.css         # @layer order + base element styles
│   └── index.css        # imports the above, loaded once at entry
└── …/components/
    └── Button/
        ├── Button.tsx
        └── Button.module.css   # @layer components
```

Name classes by **meaning**, not appearance: `.danger`, not `.redText`; `.toolbar`,
not `.flexRow`.

## NEVER do these

- NEVER use Tailwind or any utility-class framework.
- NEVER use CSS-in-JS (styled-components, emotion, inline `css` props).
- NEVER write static `style={{…}}` — dynamic values go through a CSS custom property.
- NEVER use `!important` (except the reduced-motion reset), ID selectors, or deep
  descendant selector chains.
- NEVER hardcode colors/spacing/sizes — reference tokens.
- NEVER put appearance logic in a component (`if (x) backgroundColor = …`); model it as
  a `data-`/ARIA attribute and style it in CSS.

## Quick checklist before committing styles

1. Does the component carry only a class name + state attributes (no appearance)?
2. Are all values tokens, not magic numbers?
3. Is the rule in the right `@layer`, with flat specificity and no `!important`?
4. Did I reach for a container query before a viewport media query?
5. Is there a `:focus-visible` style and a reduced-motion path?
