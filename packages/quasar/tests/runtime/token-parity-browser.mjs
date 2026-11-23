// Every --ods-* custom property must resolve identically to a base ref, per variant x palette x scheme x media condition.
// Usage: node tests/runtime/token-parity-browser.mjs [base-ref, default HEAD]
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileEntry } from '../../scripts/css-partition.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const require = createRequire(import.meta.url)
const { chromium } = createRequire(join(root, '../../apps/gallery/package.json'))('@playwright/test')
const ref = process.argv[2] ?? 'HEAD'

const baseTree = mkdtempSync(join(tmpdir(), 'ods-parity-'))
execFileSync('sh', ['-c', `git archive "$1" src | tar -x -C "$2"`, 'sh', ref, baseTree], { cwd: root })
const bundles = {}
try {
  for (const entry of ['index', 'index.layered']) {
    bundles[entry] = { base: compileEntry(join(baseTree, `src/css/${entry}.scss`)), head: compileEntry(join(root, `src/css/${entry}.scss`)) }
  }
} finally { rmSync(baseTree, { recursive: true, force: true }) }

const quasarCss = readFileSync(require.resolve('quasar/dist/quasar.prod.css'), 'utf8')
const head = {
  index: (href) => `<link rel="stylesheet" href="/quasar.css"><link rel="stylesheet" href="${href}">`,
  'index.layered': (href) => `<style>@layer ods-important, quasar, ods; @import url(/quasar.css) layer(quasar);</style><link rel="stylesheet" href="${href}">`,
}

const SCHEMES = { light: 'ods-theme-light body--light', dark: 'ods-theme-dark body--dark' }
const STATES = [
  ...['win', 'one', 'term', 'zen', 'glass'].map((variant) => ({ variant })),
  ...['charcoal', 'black', 'navy'].map((ink) => ({ variant: 'ink', attrs: { 'data-ods-ink': ink } })),
  ...['neutral', 'gray', 'zinc', 'stone', 'slate'].flatMap((palette) => [
    { variant: 'shadcn', attrs: { 'data-ods-shadcn-base-color': palette } },
    { variant: 'shadcn', attrs: { 'data-ods-shadcn-base-color': palette, 'data-ods-shadcn-accent': 'blue' } },
  ]),
]
const CONDITIONS = {
  desktop: { context: {}, media: [] },
  touch: { context: { isMobile: true, hasTouch: true }, media: [] },
  'forced-colors': { context: {}, media: [{ name: 'forced-colors', value: 'active' }] },
  'contrast-more': { context: {}, media: [{ name: 'prefers-contrast', value: 'more' }] },
  'reduced-transparency': { context: {}, media: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] },
}

const propertyNames = (css) => new Set([...css.matchAll(/(--_?ods-[\w-]+|--q-[\w-]+)\s*:/g)].map((m) => m[1]))

async function open(context, condition, layout, css) {
  const page = await context.newPage()
  await page.route('http://qds.test/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head>${head[layout]('/qds.css')}</head><body><div id="local-dark" class="ods-theme-dark"></div></body></html>` })
    return route.fulfill({ contentType: 'text/css', body: path === '/quasar.css' ? quasarCss : css })
  })
  await page.goto('http://qds.test/')
  if (condition.media.length) {
    const session = await context.newCDPSession(page)
    await session.send('Emulation.setEmulatedMedia', { features: condition.media })
  }
  return page
}

const measure = (page, names) => page.evaluate(([states, schemes, names]) => {
  const out = {}
  for (const state of states) {
    for (const [scheme, schemeClass] of Object.entries(schemes)) {
      document.body.className = `ods-ui ods-variant-${state.variant} ${schemeClass}`
      for (const attr of [...document.body.attributes]) if (attr.name.startsWith('data-')) document.body.removeAttribute(attr.name)
      for (const [name, value] of Object.entries(state.attrs ?? {})) document.body.setAttribute(name, value)
      const key = `${state.variant}${Object.values(state.attrs ?? {}).map((v) => `/${v}`).join('')} ${scheme}`
      for (const [probe, element] of [['body', document.body], ['local-dark', document.getElementById('local-dark')]]) {
        const style = getComputedStyle(element)
        out[`${key} ${probe}`] = Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]))
      }
    }
  }
  return out
}, [STATES, SCHEMES, names])

function compare(actual, expected) {
  const rows = []
  let values = 0
  for (const [state, props] of Object.entries(expected)) {
    for (const [name, value] of Object.entries(props)) {
      values++
      if (actual[state][name] !== value) rows.push(`${state} ${name}: ${JSON.stringify(actual[state][name])} != ${JSON.stringify(value)}`)
    }
  }
  return { rows, values }
}

const browser = await chromium.launch()
let compared = 0
let resolved = 0
const failures = []
const desktop = {}
try {
  for (const [layout, { base, head: current }] of Object.entries(bundles)) {
    const names = [...new Set([...propertyNames(base), ...propertyNames(current)])].sort()
    for (const [conditionName, condition] of Object.entries(CONDITIONS)) {
      const context = await browser.newContext({ viewport: { width: 800, height: 600 }, ...condition.context })
      const [expected, actual] = [await measure(await open(context, condition, layout, base), names), await measure(await open(context, condition, layout, current), names)]
      for (const [state, props] of Object.entries(expected)) {
        if (state.endsWith(' body')) assert.equal(props['--_ods-variant'], state.split(/[/ ]/)[0], `${layout} ${state}: variant stylesheet did not apply`)
      }
      if (conditionName === 'desktop') desktop[layout] = expected
      else assert.ok(compare(expected, desktop[layout]).rows.length > 0, `${layout} ${conditionName}: emulated condition changed no value`)
      const { rows, values } = compare(actual, expected)
      compared += values
      resolved += Object.values(expected).reduce((n, props) => n + Object.values(props).filter(Boolean).length, 0)
      if (rows.length) failures.push(`${layout} ${conditionName}: ${rows.length} differences, first: ${rows.slice(0, 5).join(' | ')}`)

      if (layout === 'index' && conditionName === 'desktop') {
        const mutated = current.replace('--ods-radius-md: 8px', '--ods-radius-md: 9px')
        assert.notEqual(mutated, current, 'negative control could not find its target declaration')
        const control = compare(await measure(await open(context, condition, layout, mutated), names), expected)
        assert.ok(control.rows.some((row) => row.includes('--ods-radius-md: "9px" != "8px"')), 'negative control: a one-value change went undetected')
        console.log(`negative control: --ods-radius-md 8px -> 9px detected in ${control.rows.length} state/probe values`)
      }
      await context.close()
    }
    console.log(`${layout}: ${names.length} custom properties x ${STATES.length * 2} variant/scheme states x 2 probes x ${Object.keys(CONDITIONS).length} conditions`)
  }
} finally { await browser.close() }

assert.deepEqual(failures, [], `custom properties must resolve identically to ${ref}`)
console.log(`token parity vs ${ref}: ${compared} resolved values identical (${resolved} non-empty)`)
