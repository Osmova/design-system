ODS Storybook (private catalog workspace)
=========================================

Development-only Storybook 10 catalog for the design system. Not shipped with
`@osmova/quasar-design-system`; its dependencies live in this workspace only.

Commands (from this directory, or the root `pnpm stories:sb` / `pnpm stories:sb:build`):

- `pnpm storybook`: rebuild the package runtime, then `storybook dev` on 127.0.0.1:6006.
- `pnpm build-storybook`: rebuild the package runtime, then build `storybook-static`.
- `pnpm typecheck`: `vue-tsc` over the config, stories, shared demos and tests.
- `pnpm test:smoke`: Playwright over the built `storybook-static` (served on 127.0.0.1:6198).
  Opens every story in two variants × two schemes (`SMOKE_VARIANTS=win,ink` by default) and fails on
  console, page or network errors and on serious or critical axe violations. It also proves that the
  toolbar globals repaint open portals in place and that each story change destroys the previous
  controller. Needs Python 3 and Playwright Chromium (`pnpm exec playwright install chromium`).

Setup mirrors the gallery: `@quasar/vite-plugin`, the gallery's single adoption stylesheet (native
Quasar, design system, QWindow extension), the optional fonts and `odsIconSet`.

Toolbar globals drive the real controller from the compiled package entrypoint. `setup()` creates one
controller per preview app (`configureDesignSystem(app, { persist: false })`), destroyed when that app
unmounts on a story change; a global change calls the matching setter on the live controller:
variant (`setVariant`), scheme (`setMode`), ink colour (`setInkColor`) and shadcn palette
(`setShadcnBaseColor`). The controller paints `document.body`, so Quasar portals repaint with the story.
Docs canvases render in their own iframes (`docs.story.inline: false`) so every canvas owns one document.

Layout:

- `stories/foundations`, `patterns`, `systems`, `optional`: gallery sections imported as-is.
- `stories/components`: one file per family. `Showcase` and `Gallery` stories render shared demos;
  the other stories render one Quasar component with Controls built from Quasar's own API
  description (`quasar/dist/api`).
- `demos/`: showcase components rendered by the family stories.
- `stories/catalog-proof.stories.ts` and `playwright.proof.config.ts`: the earlier shared-catalog proof.
