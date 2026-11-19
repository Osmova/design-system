# Osmova Design System

> **1.0.0-alpha.** The 1.0 line is in development; the 0.x `quasar-design-system` package stays available.

Design tokens, framework skins and a runtime theme controller with light/dark/system schemes and variants.

| Path | Content |
|---|---|
| [`packages/quasar`](packages/quasar/README.md) | `@osmova/ds-quasar`, the Quasar 2 package |
| `apps/gallery` | Quasar gallery and Playwright visual gate (private) |
| `apps/storybook` | Storybook catalog (private) |
| `examples/shadcn-reference` | pinned upstream shadcn-vue reference (private) |
| `scripts/rename-map.json` | 0.x → 1.0 rename map (`qds` → `ods`) |

```bash
pnpm install
pnpm build
pnpm gallery:test
```

Releases use [changesets](https://github.com/changesets/changesets) in `alpha` pre mode: `pnpm changeset`, then `pnpm changeset version`.

MIT licensed.
