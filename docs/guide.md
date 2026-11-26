# Guide

The details behind the [README](../README.md).

## How the styling is layered

1. **Quasar Sass variables** (`quasar-variables`) change Quasar's own defaults where Quasar allows it.
2. **Design tokens** (`--qds-*` custom properties) hold every colour, size, radius and motion value.
3. **Component rules** cover what Quasar variables can't, scoped under the `.qds-ui` class that
   `configureDesignSystem()` adds to the body.

## CSS order and layers

The default `./css` bundle is unlayered. Quasar's CSS is unlayered too, so this package wins by coming
**after** Quasar, not through `@layer`. Always import it after Quasar's CSS.

If your app deliberately puts Quasar in a cascade layer, use the layered bundle instead. Declare the order before
importing anything:

```css
/* quasar-layered.css */
@layer qds-important, quasar, qds;
@import 'quasar/dist/quasar.css' layer(quasar);
```

```ts
import './quasar-layered.css'
import '@osmova/quasar-design-system/css/layered'
// or a variant: '@osmova/quasar-design-system/css/layered/variants/zen'
```

Pick one path: don't mix the layered and unlayered bundles, and don't put unlayered Quasar CSS next to the layered
bundle (a layer can't beat unlayered rules). Important declarations reverse layer order, which is why they live in
the earliest `qds-important` layer.

## Switching variants at runtime

A variant stylesheet **replaces** `./css`; loading both applies the default rules twice. To offer several variants,
either load everything as SCSS source:

```ts
import '@osmova/quasar-design-system/css/all'
```

or keep exactly one variant stylesheet loaded and swap it before calling `setVariant` (Vite `?url` imports shown):

```ts
import winUrl from '@osmova/quasar-design-system/css?url'
import zenUrl from '@osmova/quasar-design-system/css/variants/zen?url'

const urls = { win: winUrl, zen: zenUrl }

async function switchVariant(name: keyof typeof urls) {
  const previous = document.getElementById('qds-css')! // <link id="qds-css" rel="stylesheet" href="…">
  const next = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: urls[name] })
  previous.after(next)
  await new Promise((resolve, reject) => { next.onload = resolve; next.onerror = reject })
  previous.remove()
  next.id = 'qds-css'
  designSystem.setVariant(name)
}
```

The first `<link id="qds-css">` must come after Quasar's CSS. In development the runtime warns once if the active
variant's stylesheet is missing.

Old variant names still work and map to the current ones: `fluent`, `air`, `studio` → `win`; `feather` → `ink`;
`mobile` → `one`; `terminal` → `term`.

## Buttons, badges and chips

| Component | No `color` | With `color` | Opt-in |
| --- | --- | --- | --- |
| `QBtn` | neutral | solid role fill | `.qds-tonal` soft wash |
| `QBadge` | neutral tint | solid role fill | `.qds-tonal` soft wash |
| `QChip` | neutral tint | soft role tint | `.qds-solid` solid fill |

Buttons follow a 24/32/40px scale (`size="sm"`, default, `size="lg"`); `dense` uses 24px.

## Fields

Labels sit above a 32px control (24px dense). Other layouts, per field:

- `qds-field--float`: Quasar's floating label inside a 48px control
- `qds-field--stacked-animated`: the label moves to the top edge inside the control
- `qds-form--label-start` with `qds-field--start`: labels in a side column on wide screens

## Fonts

Inter is the default body and display face. Open Sans and Selawik are optional:

```ts
import '@osmova/quasar-design-system/fonts/open-sans.css'
import '@osmova/quasar-design-system/fonts/selawik.css'
```

To use Selawik for display text, set the token after the package CSS:

```css
:root { --qds-font-family-display: 'Selawik', var(--qds-font-family); }
```

## Materials

In `win`, menus, popups and notifications use an acrylic material, dialogs a thicker one and tooltips a thin one.
The page sits on a Mica backdrop. Cards stay solid; add `qds-material` (or `qds-material--thin` /
`qds-material--thick`) to opt an element in.

Materials become solid without `backdrop-filter` support, with reduced transparency, and in forced-colours mode.
`ink` is always solid, `term` keeps acrylic on menus only, and `one` keeps it on menus, tooltips and popups.

## Variant options

**shadcn** needs Quasar 2.35 or newer and has five palettes: Neutral (default), Gray, Zinc, Stone and Slate.

```ts
const theme = configureDesignSystem(app, { variant: 'shadcn', shadcnBaseColor: 'zinc' })
theme.setShadcnBaseColor('stone')
```

`SHADCN_BASE_COLORS` lists the palettes for a picker. Unlike `win`, a plain filled shadcn button is a primary action.

**ink** has three ink colours: `charcoal` (default), `black` and `navy`.

```ts
const theme = configureDesignSystem(app, { variant: 'ink', inkColor: 'navy' })
theme.setInkColor('black')
```

Ink shows media in greyscale. Add `qds-media-color`, `qds-media-color-hover` or `qds-media-color-reveal` to keep
colour. Handwriting is opt-in with `.qds-hand`; load its faces with `fonts/ink.css`.

**zen** has an opt-in `.qds-reading` class that removes decorative depth and motion.

**glass** keeps toolbars inside content plain; add `qds-glass-bar` to a `QToolbar` to float it.

## Without the runtime

You can apply a variant with classes alone:

```html
<body class="qds-ui qds-variant-shadcn qds-theme-light" data-qds-shadcn-base-color="neutral">
```

Use `qds-theme-dark` for dark mode. Without the runtime, nothing syncs Quasar's dark mode, follows the system
preference, or saves the user's choice; that's up to your app.

## Scope and limitations

- Keep the default **body** target so Quasar's dialogs, menus and notifications are styled too. A custom `target`
  only styles its own descendants.
- Put the variant, palette and mode on the **same element**.
- Separate, non-overlapping themed roots work. A themed root **nested inside** another one is not supported; use
  separate render roots or an iframe instead.
- To rebrand, override `--qds-color-*` on the body or the variant class, not only on `:root`.
- The runtime works without a DOM for SSR; it applies system preference and saved choices once on the client.

## QWindow

For layered setups use `css/extensions/qwindow/layered`, and import QWindow's own CSS into `layer(quasar)`.

QWindow 3.0.0's own minimize action throws an error, so `QdsWindow` hides it and treats `minimized` as state your
app controls (for example from a taskbar store).

## What isn't styled

Behaviour-only parts of Quasar have nothing to style and keep Quasar's defaults: `QNoSSR`, `QResponsive`, `QSpace`,
observers, non-visual plugins (Cookies, Meta, storage…) and directives. Material ripple is turned off.

A few gesture- and scroll-driven states are checked by hand rather than in the visual tests: `QPopupEdit`,
`QPageScroller`, `QSlideItem`, `QPullToRefresh` and `QInfiniteScroll` loading.

## shadcn reference

The shadcn values come from MIT-licensed
[shadcn-vue](https://github.com/unovue/shadcn-vue/tree/b251d9fd92aa496495e127137a7734704fb34a29) (New York v4).
A few text and focus colours were adjusted to meet contrast. The full notice is in
[`src/tokens/SHADCN-NOTICE.md`](../src/tokens/SHADCN-NOTICE.md).
