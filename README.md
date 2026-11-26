# Quasar Design System

A calm, modern look for Quasar 2 apps. It restyles Quasar's own components with design tokens, so you keep
writing plain Quasar markup. The default look follows Microsoft Fluent 2 (Windows 11), and six variants offer
other moods.

It is purely visual: no business logic, no extra components to learn.

[Live gallery](https://qds.osmova.com/) · [Component catalog](https://qds.osmova.com/histoire/) ·
[Guide](https://github.com/Osmova/quasar-design-system/blob/master/docs/guide.md)

## Install

```bash
pnpm add @osmova/quasar-design-system
```

Import Quasar's CSS first, then this package:

```ts
import 'quasar/src/css/index.sass'
import '@osmova/quasar-design-system/css'
```

Then set it up when your app starts:

```ts
import { configureDesignSystem } from '@osmova/quasar-design-system'

configureDesignSystem(app, { mode: 'system', variant: 'win', persist: true })
```

This handles light, dark and system mode, keeps Quasar's dark mode in sync, and remembers the user's choice.

For deeper integration, use the Sass variables in your app's `quasar.variables.scss`:

```scss
@use '@osmova/quasar-design-system/quasar-variables' as *;
```

## Variants

| Variant | Feel |
| --- | --- |
| `win` | Windows 11: neutral greys, one blue for the main action, acrylic menus. The default. |
| `glass` | Inspired by Apple: translucent bars and controls over opaque content, capsule buttons. |
| `one` | Inspired by Samsung One UI: rounded blocks, pill controls, true-black dark mode. |
| `zen` | Soft reading surface: linen and sage, generous radii, gentle depth. |
| `ink` | E-ink: one ink colour on flat paper, no colour except red for errors. |
| `term` | Developer UI: amber on cream or near-black, monospace feel. |
| `shadcn` | shadcn/ui New York look, with five base palettes. Needs Quasar 2.35+. |

Each variant ships as its own stylesheet, so you only load the one you use. Import it **instead of** `./css`:

```ts
import '@osmova/quasar-design-system/css/variants/zen'
```

Switching variants at runtime is covered in the [guide](https://github.com/Osmova/quasar-design-system/blob/master/docs/guide.md#switching-variants-at-runtime).

## A few conventions

- **Buttons are neutral by default.** Add `color="primary"` for the main action. `.qds-tonal` gives a soft tinted
  button or badge, `.qds-solid` a solid chip.
- **Field labels sit above the input.** Add `qds-field--float` to a field for Quasar's floating label.
- **Accessibility is built in.** Visible focus, reduced motion and transparency, forced colours and increased
  contrast are all respected.

## Icons and fonts

Icons use [Phosphor](https://phosphoricons.com/) instead of Material Icons:

```ts
import { qdsIconSet } from '@osmova/quasar-design-system'

app.use(Quasar, { iconSet: qdsIconSet })
```

Fonts are optional, self-hosted, and need no CDN:

```ts
import '@osmova/quasar-design-system/fonts/inter.css'
```

Without them you get a clean system font stack.

## Optional: windows

`QdsWindow` styles [`@quasar/quasar-ui-qwindow`](https://github.com/quasarframework/quasar-ui-qwindow) to match.
Install that package, then:

```ts
import '@quasar/quasar-ui-qwindow/index.css'
import '@osmova/quasar-design-system/css/extensions/qwindow'
import { QdsWindow } from '@osmova/quasar-design-system/qwindow'
```

## Going further

The [guide](https://github.com/Osmova/quasar-design-system/blob/master/docs/guide.md) covers CSS layers,
runtime variant switching, theming scope, rebranding, the shadcn and ink options, and known limitations.

## Development

```bash
pnpm install
pnpm gallery:dev    # example gallery
pnpm gallery:test   # visual tests
```

## License

MIT. The shadcn variant adapts MIT-licensed work from shadcn-vue; see the [notice](src/tokens/SHADCN-NOTICE.md).
