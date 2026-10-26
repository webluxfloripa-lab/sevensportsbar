# Sevensportsbar — Guidelines

## Components

The design system exports these components — import them from `@ws-finjt0mddapaz6jgfrhz/647afb2c-1c8e-48f4-a17a-dfe9eeaaf39a` and compose them before building anything from scratch:

`AdminPanorama`, `PanoramaBoundary`, `TourEditor`, `TourViewer`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-finjt0mddapaz6jgfrhz/647afb2c-1c8e-48f4-a17a-dfe9eeaaf39a/styles.css` (source — preferred import)
- `@ws-finjt0mddapaz6jgfrhz/647afb2c-1c8e-48f4-a17a-dfe9eeaaf39a/dist/tokens.css` (auto-generated flat list of CSS custom properties — a raw-values fallback only; does NOT carry framework-specific wiring that the source files above provide)

