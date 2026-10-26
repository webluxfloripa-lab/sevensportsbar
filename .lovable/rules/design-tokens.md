# Design Tokens

Token reference for **Sevensportsbar**. Use utility classes and CSS variables — never raw values.

## Colors

Apply with any color utility: `bg-<name>`, `text-<name>`, `border-<name>`, `ring-<name>`, `divide-<name>`, etc.

| Name | CSS variable |
|---|---|
| `background` | `--background` |
| `foreground` | `--foreground` |
| `card` | `--card` |
| `primary` | `--primary` |
| `primary-foreground` | `--primary-foreground` |
| `secondary` | `--secondary` |
| `muted` | `--muted` |
| `muted-foreground` | `--muted-foreground` |
| `accent` | `--accent` |
| `destructive` | `--destructive` |
| `border` | `--border` |
| `input` | `--input` |
| `glass` | `--glass` |
| `seven-green` | `--seven-green` |

## Typography

Typography classes (`font-*` for families, `text-*` for sizes):

| Class | CSS variable |
|---|---|
| `font-display` | `--font-display` |
| `font-sans` | `--font-sans` |

## Border Radius

Border-radius classes:

| Class | CSS variable |
|---|---|
| `rounded-sm` | `--radius-sm` |
| `rounded-md` | `--radius-md` |
| `rounded-xl` | `--radius-xl` |
| `rounded-2xl` | `--radius-2xl` |
| `rounded-3xl` | `--radius-3xl` |
| `rounded-4xl` | `--radius-4xl` |
| `rounded` | `--radius` |

## Other

Reference via `var(--name)` in inline styles or CSS.

| CSS variable |
|---|
| `--arrow-size` |
| `--arrow-opacity` |
| `--arrow-rotation` |

