import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { after, before, test } from 'node:test'
import * as sass from 'sass'
import { palettes, roles, emittedProfiles, parseRgb, contrast } from './shadcn-fixtures.mjs'

// Reuse the release gate's existing browser dependency, without changing any
// gallery code or manifests. This is a standalone token fixture, not a catalog.
const root = new URL('../../', import.meta.url)
const galleryRequire = createRequire(new URL('../../apps/gallery/package.json', root))
const require = createRequire(import.meta.url)
const { chromium } = galleryRequire('@playwright/test')
const quasar = readFileSync(require.resolve('quasar/dist/quasar.css'), 'utf8')
const expected = emittedProfiles()
const sassOptions = { loadPaths: [root.pathname], silenceDeprecations: ['if-function'] }
const locals = sass.compileString(`@use 'src/themes/shadcn'; ${palettes.map((p) => `.local-${p}-dark { @include shadcn.scheme('${p}', dark); }`).join('\n')}`, sassOptions).css
const roleStyles = roles.map((role) => `
  .role-fill[data-role='${role}'] { background-color:var(--ods-color-${role}); color:var(--ods-text-on-${role}); --ods-text-on-fill-pressed-mix:var(--ods-text-on-${role}-pressed-mix); }
  .role-fill[data-role='${role}'].state-hover { background-color:var(--ods-color-${role}-hover); }
  .role-fill[data-role='${role}'].state-pressed { background-color:var(--ods-color-${role}-pressed); color:color-mix(in srgb,var(--ods-text-on-${role}) var(--ods-text-on-fill-pressed-mix),var(--ods-fill-state-base)); }
`).join('\n')
// Native inversion has specificity 3. The independent complete oracle must be
// unlayered, appended after it AND scoped at equivalent specificity; a lone
// .full-reference (specificity 1) would still measure the old Fluent inversion.
const referenceScope = ':is(.ods-ui.ods-variant-shadcn, .ods-ui .ods-variant-shadcn)'
const grouped = sass.compileString(`@use 'src/themes/shadcn';
  @include shadcn.local-scopes(':is(.grouped-a,.grouped-b)');
  ${referenceScope} .full-reference { @include shadcn.scheme('neutral',dark); }
  ${palettes.filter((p) => p !== 'neutral').map((p) => `${referenceScope}[data-ods-shadcn-base-color='${p}'] .full-reference { @include shadcn.scheme('${p}',dark); }`).join('\n')}`, sassOptions).css
// Historical specificity diagnostic only. A separate document loads this CSS
// alone: no production bundle, no local-scopes() repair and no fixture grouped
// repair. Preserve the original native inversion's foreground branch verbatim.
const negativeControl = sass.compileString(`@use 'src/themes/shadcn';
  body.ods-ui.ods-theme-light { @include shadcn.scheme('neutral',light); }
  .ods-ui.ods-theme-light :is(.q-card--dark, .q-table--dark, .q-tree--dark, .q-stepper--dark, .q-list--dark, .q-menu--dark, .q-uploader--dark, .q-date--dark, .q-time--dark) {
    --ods-fg-default: var(--ods-surface-0);
    color: var(--ods-fg-default);
  }
  .underscoped-control { @include shadcn.scheme('neutral',dark); }`, sassOptions).css
let browser
before(async () => { browser = await chromium.launch({ headless: true }) })
after(async () => { await browser?.close() })

for (const entry of ['index.scss', 'index.layered.scss']) {
  test(`${entry}: actual browser cascade covers five palettes, schemes, CSS-only fallback, explicit light and local-dark rebinding`, async () => {
    const bundle = sass.compile(new URL(`src/css/${entry}`, root).pathname, sassOptions).css
    const page = await browser.newPage()
    try {
      if (entry === 'index.scss') {
        const isolated = await browser.newPage()
        try {
          await isolated.setContent(`<style>${negativeControl}</style><body class="ods-ui ods-variant-shadcn ods-theme-light"><div class="q-card q-card--dark underscoped-control"></div></body>`)
          const diagnostic = await isolated.evaluate(() => {
            const style = getComputedStyle(document.querySelector('.underscoped-control'))
            return { foreground: style.getPropertyValue('--ods-fg-default').trim(), color: style.color, stylesheets: document.styleSheets.length }
          })
          assert.equal(diagnostic.stylesheets, 1, 'historical control must load only its isolated baseline stylesheet')
          assert.deepEqual(parseRgb(diagnostic.foreground), parseRgb(expected['neutral-dark']['--ods-shadcn-background']), 'isolated original inversion wins despite later underscoped source order')
          assert.deepEqual(parseRgb(diagnostic.color), parseRgb(diagnostic.foreground), 'historical failure must also reach the painted foreground')
          assert.notDeepEqual(parseRgb(diagnostic.foreground), parseRgb(expected['neutral-dark']['--ods-shadcn-foreground']), 'historical underscoped emitter is not a valid complete oracle')
        } finally { await isolated.close() }
      }
      await page.setContent(`<style>${quasar}\n${bundle}
        .paint { background: var(--ods-bg-card); color: var(--ods-text); height: var(--ods-control-size-md); }
        .native-inversion { --ods-text: red; --ods-color-primary: hotpink; --ods-card-bg: red; --ods-control-fill-default: red; }
        ${locals}\n${roleStyles}</style><main class="paint" id="paint">${roles.map((role) => `<span class="role-fill" data-role="${role}">${role}</span>`).join('')}</main>`)
      const read = () => page.evaluate(() => {
        const style = getComputedStyle(document.querySelector('#paint'))
        const names = ['--ods-shadcn-background', '--ods-shadcn-card', '--ods-control-size-md', '--ods-card-radius', '--ods-material-regular-filter', '--ods-card-bg', '--ods-control-fill-default', '--q-primary', '--q-secondary', '--q-accent', '--q-positive', '--q-negative', '--q-warning', '--q-info']
        return { color: style.color, background: style.backgroundColor, height: style.height, values: Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()])) }
      })
      const setScope = (palette, scheme, extra = '') => page.evaluate(({ palette, scheme, extra }) => {
        document.body.className = `ods-ui ods-variant-shadcn ods-theme-${scheme} ${extra}`
        document.body.dataset.odsResolved = scheme
        if (palette === null) delete document.body.dataset.odsShadcnBaseColor
        else document.body.dataset.odsShadcnBaseColor = palette
        document.querySelector('#paint').className = 'paint'
      }, { palette, scheme, extra })
      for (const palette of palettes) {
        for (const scheme of ['light', 'dark']) {
          await setScope(palette, scheme)
          const actual = await read()
          const p = expected[`${palette}-${scheme}`]
          assert.deepEqual(parseRgb(actual.background), parseRgb(p['--ods-shadcn-card']), `${entry}/${palette}/${scheme} card`)
          assert.deepEqual(parseRgb(actual.color), parseRgb(p['--ods-shadcn-foreground']), `${entry}/${palette}/${scheme} text`)
          assert.deepEqual(parseRgb(actual.values['--ods-shadcn-background']), parseRgb(p['--ods-shadcn-background']))
          assert.equal(actual.height, '36px')
          assert.equal(actual.values['--ods-card-radius'], '0.875rem')
          assert.equal(actual.values['--ods-material-regular-filter'], 'none')
          for (const role of roles) assert.deepEqual(parseRgb(actual.values[`--q-${role}`]), parseRgb(p[`--ods-color-${role}`]), `${entry} bridge ${role}`)
          for (const state of ['default', 'hover', 'pressed']) {
            const paints = await page.evaluate((state) => [...document.querySelectorAll('.role-fill')].map((element) => {
              element.className = `role-fill state-${state}`
              const style = getComputedStyle(element)
              return { role: element.dataset.role, background: style.backgroundColor, foreground: style.color }
            }), state)
            for (const paint of paints) {
              const expectedFill = p[`--ods-color-${paint.role}${state === 'default' ? '' : `-${state}`}`]
              assert.deepEqual(parseRgb(paint.background), parseRgb(expectedFill), `${entry}/${palette}/${scheme}/${paint.role}/${state} consumed fill`)
              // Chromium may serialize the 100% color-mix as color(srgb ...).
              const foreground = paint.foreground.startsWith('color(srgb')
                ? paint.foreground.match(/[\d.]+/g).slice(0, 3).map((n) => Number(n) * 255).concat(1)
                : parseRgb(paint.foreground)
              const pair = parseRgb(p[`--ods-text-on-${paint.role}`])
              foreground.slice(0, 3).forEach((value, i) => assert.ok(Math.abs(value - pair[i]) < 0.0002, 'foreground must not fade or flip'))
              assert.ok(contrast(foreground, parseRgb(paint.background)) >= 4.5, `${entry}/${palette}/${scheme}/${paint.role}/${state} browser pair`)
            }
          }
        }
      }
      for (const invalid of [null, '', 'unknown', 'Gray']) {
        for (const scheme of ['light', 'dark']) {
          await setScope(invalid, scheme)
          const actual = await read()
          assert.deepEqual(parseRgb(actual.background), parseRgb(expected[`neutral-${scheme}`]['--ods-shadcn-card']), `${entry} fallback ${invalid}/${scheme}`)
        }
      }
      // Explicit light must beat Quasar's stale body--dark class.
      await setScope('stone', 'light', 'body--dark')
      assert.deepEqual(parseRgb((await read()).color), parseRgb(expected['stone-light']['--ods-shadcn-foreground']))
      // CSS-only adoption: no mode/palette attributes, Quasar dark class only.
      await page.evaluate(() => { document.body.className = 'ods-ui ods-variant-shadcn body--dark'; delete document.body.dataset.odsResolved; delete document.body.dataset.odsShadcnBaseColor })
      assert.deepEqual(parseRgb((await read()).background), parseRgb(expected['neutral-dark']['--ods-shadcn-card']))
      // Child unknown/no-attribute variant must not leak its parent's Zinc.
      await setScope('zinc', 'dark')
      await page.evaluate(() => { document.querySelector('#paint').className = 'paint ods-variant-shadcn' })
      assert.deepEqual(parseRgb((await read()).background), parseRgb(expected['neutral-dark']['--ods-shadcn-card']))
      for (const palette of palettes) {
        await setScope(palette, 'light')
        await page.evaluate((p) => { document.querySelector('#paint').className = `paint native-inversion local-${p}-dark` }, palette)
        const actual = await read()
        const p = expected[`${palette}-dark`]
        assert.deepEqual(parseRgb(actual.background), parseRgb(p['--ods-shadcn-card']), `${entry}/${palette} local dark surface`)
        assert.deepEqual(parseRgb(actual.color), parseRgb(p['--ods-shadcn-foreground']), `${entry}/${palette} local dark foreground`)
        assert.deepEqual(parseRgb(actual.values['--q-primary']), parseRgb(p['--ods-color-primary']), `${entry}/${palette} local bridge`)
        assert.deepEqual(parseRgb(actual.values['--ods-card-bg']), parseRgb(p['--ods-shadcn-card']), `${entry}/${palette} card alias rebind`)
        assert.deepEqual(parseRgb(actual.values['--ods-control-fill-default']), parseRgb(p['--ods-shadcn-background']), `${entry}/${palette} control rebind`)
      }
      // Complete grouped color boundary against the actual native local-dark
      // inversion, not just synthetic aliases; compare every public token to
      // the full emitter. Root geometry and invariant shadows remain inherited.
      await page.setContent(`<style>${quasar}\n${bundle}\n${grouped}</style>
        <div class="q-card q-card--dark grouped-a"></div><div class="q-table--dark grouped-b"></div>
        <div class="q-card q-card--dark full-reference"></div>`)
      for (const palette of [...palettes, null, 'invalid']) {
        await page.evaluate((palette) => {
          document.body.className = 'ods-ui ods-variant-shadcn ods-theme-light'
          document.body.dataset.odsResolved = 'light'
          if (palette === null) delete document.body.dataset.odsShadcnBaseColor
          else document.body.dataset.odsShadcnBaseColor = palette
        }, palette)
        const comparisons = await page.evaluate((names) => [...document.querySelectorAll('.grouped-a,.grouped-b,.full-reference')].map((el) => {
          const style = getComputedStyle(el)
          return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim().replace(/\s+/g, ' ')]))
        }), Object.keys(expected['neutral-dark']))
        const profile = expected[`${palettes.includes(palette) ? palette : 'neutral'}-dark`]
        // Do not let two equally wrong cascades serve as a passing oracle.
        // Reference and compact targets must independently match the pinned
        // profile and calibrated fills/foregrounds after actual native inversion.
        for (const [i, values] of comparisons.entries()) {
          const target = ['compact card','compact table','complete oracle'][i]
          for (const [token, source] of [
            ['--ods-fg-default','--ods-shadcn-foreground'],
            ['--ods-fg-strong','--ods-shadcn-foreground'],
            ['--ods-bg-card','--ods-shadcn-card'],
            ['--ods-bg-flyout','--ods-shadcn-popover'],
            ['--ods-control-fill-default','--ods-shadcn-background'],
            ['--ods-control-stroke-strong','--ods-stroke-strong'],
          ]) assert.deepEqual(parseRgb(values[token]), parseRgb(profile[source]), `${entry}/${palette}/${target} ${token} pinned oracle`)
          for (const role of roles) {
            for (const token of [`--ods-fg-${role}`, `--ods-text-on-${role}`, `--ods-color-${role}`, `--ods-color-${role}-hover`, `--ods-color-${role}-pressed`]) {
              assert.deepEqual(parseRgb(values[token]), parseRgb(profile[token]), `${entry}/${palette}/${target} ${token} calibrated oracle`)
            }
          }
        }
        for (const actual of comparisons.slice(0, 2)) assert.deepEqual(actual, comparisons[2], `${entry}/${palette} grouped native inversion parity`)
      }
    } finally { await page.close() }
  })
}
