import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compileString } from 'sass'
import { fileURLToPath } from 'node:url'
import { contrast, parseRgb, mix } from './shadcn-fixtures.mjs'
import { flattenRules } from './css-rules.mjs'

const root = new URL('../../', import.meta.url)
const loadPaths = [fileURLToPath(root)]
const compile = (source) => compileString(source, { loadPaths, style: 'compressed', silenceDeprecations: ['if-function'] }).css
const families = ['button', 'field', 'menu', 'tabs', 'capability']
const roles = ['primary', 'secondary', 'accent', 'positive', 'negative', 'warning', 'info']
const grammar = () => compile(`@use 'src/css/components/variants/glass';
  ${families.map((family) => `@include glass.${family};`).join('')}`)

test('the glass grammar compiles identically with or without the compatibility grammar loaded', () => {
  const standalone = grammar()
  const withCompatibility = compile(`@use 'src/css/components/variants/glass';
    ${['button', 'field', 'menu', 'tabs'].map((family) => `@use 'src/css/components/${family}';`).join('')}
    ${families.map((family) => `@include glass.${family};`).join('')}`)
  assert.equal(standalone, withCompatibility)
  for (const selector of ['.q-btn', '.q-field__control', '.q-tab--active', '.q-menu', '.q-btn-toggle']) {
    assert.ok(standalone.includes(selector), `glass grammar must own ${selector}`)
  }
})

const assertScoped = ([path, body]) => {
  assert.match(path, /\.qds-variant-glass|@keyframes qds-variant-glass-/, `unscoped glass rule: ${path}`)
  assert.doesNotMatch(path, /qds-variant-(fluent|ink|one|term|shadcn|zen)/, `glass borrowed another profile scope: ${path}`)
  assert.doesNotMatch(body, /!important/, `glass must win on specificity: ${path}`)
}

test('every glass rule is scoped to the glass profile, borrows no other scope and needs no !important', () => {
  for (const rule of flattenRules(grammar())) assertScoped(rule)
})

// Most glass grammar lives inline in its owning partials, so the whole bundle is checked too.
test('every glass rule in the full bundle, inline partials included, is scoped and needs no !important', () => {
  const css = compile(`@use 'src/css/index';`)
  const rules = flattenRules(css).filter(([path, body]) => !path.startsWith('@layer qds.tokens') && (path.includes('qds-variant-glass') || body.includes('--_qds-glass')))
  assert.ok(rules.length >= 80, `${rules.length} glass rules found`)
  for (const rule of rules) assertScoped(rule)
})

// Either placement may flip, so the spring is direction-neutral; reduced motion drops the scale.
test('menus spring from their centre and reduced motion drops the scale', () => {
  const css = grammar()
  assert.match(css, /\.q-menu\{transform-origin:center\}/)
  assert.match(css, /\.q-menu\.q-transition--fade-enter-from\{transform:scale3d\(0\.96, 0\.96, 1\)\}/)
  assert.match(css, /prefers-reduced-motion: ?reduce\)\{[^}]*\.q-menu\.q-transition--fade-enter-from\{transform:none\}/)
})

// Translucency is decoration only: each fallback resolves the glass scope to opaque materials.
test('no-filter, reduced transparency, forced colours and increased contrast all resolve to opaque glass', () => {
  const css = compile(`@use 'src/themes/default';`)
  const rules = flattenRules(css).filter(([path]) => path.includes('.qds-variant-glass'))
    .map(([path, body]) => [path.replace(/: /g, ':'), body.replace(/:\s+/g, ':')])
  const opaque = (pattern) => rules.filter(([path, body]) => pattern.test(path)
    && body.includes('--qds-material-thin-bg:var(--qds-surface-0)')
    && body.includes('--qds-material-thin-filter:none')
    && body.includes('--qds-material-regular-bg:var(--qds-surface-0)')
    && body.includes('--qds-material-regular-filter:none')
    && body.includes('--_qds-glass-sheen:none')
    && body.includes('--_qds-glass-bar-line:var(--qds-border)'))
  for (const [name, pattern] of [
    ['no backdrop-filter', /@supports not/],
    ['reduced transparency', /prefers-reduced-transparency:reduce/],
    ['forced colours', /forced-colors:active/],
    ['increased contrast', /prefers-contrast:more/],
  ]) {
    const paths = opaque(pattern).map(([path]) => path).join(' ')
    assert.match(paths, /\|\.qds-variant-glass,/, `${name} must reach the light glass scope`)
    assert.match(paths, /body\.qds-ui\.body--dark \.qds-variant-glass/, `${name} must reach the dark glass scope`)
  }
  const contrastRules = rules.filter(([path]) => /@media ?\(prefers-contrast:more\)\|/.test(path))
  assert.ok(contrastRules.some(([, body]) => body.includes('--qds-color-primary:#0040dd')), 'light increased-contrast accent')
  assert.ok(contrastRules.some(([, body]) => body.includes('--qds-color-primary:#8cc3ff')), 'dark increased-contrast accent')
  assert.ok(contrastRules.some(([, body]) => body.includes('--_qds-glass-control-edge:var(--qds-text-muted)')), 'increased contrast restores the strong control edge')
  assert.ok(contrastRules.filter(([, body]) => body.includes('--qds-color-primary:')).every(([, body]) => body.includes('--qds-stroke-strong:var(--qds-text-muted)')), 'both increased-contrast schemes also strengthen indicators')
  assert.ok(rules.filter(([path]) => /prefers-reduced-transparency:reduce/.test(path)).every(([, body]) => !body.includes('--_qds-glass-control-edge:')), 'opacity alone leaves decorative edges soft')
})

// ── Contrast is a hard gate, computed from the shipped token values ──────────
function glassTokens(scheme) {
  const prefix = scheme === 'dark' ? 'dark-' : 'light-'
  const palette = scheme === 'dark' ? 'dark-' : ''
  const keys = [
    ...[0, 1, 2, 3].map((step) => [`surface-${step}`, `${prefix}surface-${step}`]),
    ['text', `${prefix}text`], ['text-strong', `${prefix}text-strong`], ['text-muted', `${prefix}text-muted`],
    ['stroke-strong', `${prefix}stroke-strong`], ['hc-primary', `${prefix}hc-primary`],
    ...['button-fill', 'field-fill', 'standout-fill', 'field-label', 'selection-fill', 'selection-label', 'segmented-thumb']
      .map((name) => [name, `${prefix}${name}`]),
    ...['thin', 'regular', 'thick'].flatMap((level) => ['opacity', 'brightness'].map((key) =>
      [`${level}-${key}`, `${prefix}${level}-${key}`])),
    ...roles.map((role) => [role, `${palette}${role}`]),
    ['primary-dark', `${palette}primary-dark`],
    ...['brand', 'accent', 'positive', 'warning', 'negative', 'info'].map((wash) => [`soft-${wash}`, `${palette}soft-${wash}`]),
  ]
  const css = compile(`@use 'sass:map';@use 'src/tokens/default' as t;
    $glass: map.get(t.$variants, glass);
    .probe{${keys.map(([name, key]) => `--${name}:#{map.get($glass, '${key}')};`).join('')}
    ${roles.map((role) => `--on-${role}:#{map.get(map.get($glass, '${prefix}on-fill'), ${role})};`).join('')}}`)
  return Object.fromEntries([...css.matchAll(/--([\w-]+):\s*([^;}]+)/g)].map(([, name, value]) =>
    [name, /-(opacity|brightness)$/.test(name) ? parseFloat(value) : parseRgb(value.trim())]))
}

const FILL_STATES = { hover: 0.88, pressed: 0.76 }
const ROLE_FG_MIX = 0.86
const DARK_TRACK_MIX = 0.8

export function glassPairs(scheme) {
  const token = glassTokens(scheme)
  const pairs = []
  const add = (group, pair, a, b, minimum) => pairs.push({ group, pair, ratio: contrast(a, b), minimum })
  const surfaces = [0, 1, 2].map((step) => [`surface-${step}`, token[`surface-${step}`]])
  for (const [name, surface] of [...surfaces, ['surface-3', token['surface-3']]]) {
    add('text', `text/${name}`, token.text, surface, 4.5)
  }
  for (const [name, surface] of surfaces) add('text', `text-muted/${name}`, token['text-muted'], surface, 4.5)
  for (const role of roles) {
    const fill = token[role]
    const label = token[`on-${role}`]
    add('role fill', `on-${role}/rest`, label, fill, 4.5)
    // Primary hover and pressed resolve to primary-dark; the other roles mix toward strong text.
    for (const [state, proportion] of Object.entries(FILL_STATES)) {
      const paint = role === 'primary' ? token['primary-dark'] : mix(fill, token['text-strong'], proportion)
      add('role fill', `on-${role}/${state}`, label, paint, 4.5)
    }
    const foreground = role === 'primary' ? fill : mix(fill, token['text-strong'], ROLE_FG_MIX)
    for (const [name, surface] of surfaces) add('role text', `fg-${role}/${name}`, foreground, surface, 4.5)
    const wash = role === 'primary' ? 'brand' : role
    if (token[`soft-${wash}`]) add('role text', `fg-${role}/soft-${wash}`, foreground, token[`soft-${wash}`], 4.5)
    add('control edge', `${role} fill/surface-0`, fill, token['surface-0'], 3)
  }
  // Strong strokes still draw state indicators and must read on glass and opaque surfaces.
  for (const [name, surface] of surfaces) {
    add('control edge', `stroke/${name}`, token['stroke-strong'], surface, 3)
  }
  for (const level of ['thin', 'regular', 'thick']) {
    const back = scheme === 'dark' ? 255 * token[`${level}-brightness`] : 0
    const fill = mix(token['surface-0'], [back, back, back], token[`${level}-opacity`] / 100)
    const sheen = scheme === 'dark' ? mix([255, 255, 255], fill, 0.05) : mix([16, 19, 34], fill, 0.04)
    const muted = mix(token['text-muted'], token['text-strong'], 0.65)
    add('material text', `text/${level}`, token.text, sheen, 4.5)
    add('material text', `muted/${level}`, muted, sheen, 4.5)
    for (const role of roles) {
      add('material text', `${role}/${level}`, mix(token[role], token['text-strong'], 0.65), sheen, 4.5)
    }
    add('material focus', `focus/${level}`, token.primary, sheen, 3)
    if (level === 'regular') {
      const selection = mix(token['selection-fill'], sheen, token['selection-fill'][3])
      add('material text', 'selected label/regular', token['selection-label'], selection, 4.5)
      add('state indicator', 'stroke/regular', token['stroke-strong'], sheen, 3)
      const track = scheme === 'dark' ? mix(token.primary, token['surface-0'], DARK_TRACK_MIX) : token.primary
      add('state indicator', 'on track/regular', track, sheen, 3)
    }
  }
  add('control edge', 'stroke/segmented track', token['stroke-strong'], token['surface-2'], 3)
  add('state indicator', 'knob/switch off track', parseRgb('#ffffff'), token['stroke-strong'], 3)
  // Dark tracks shade the role toward the page so the light knob keeps its edge.
  const track = scheme === 'dark' ? mix(token.primary, token['surface-0'], DARK_TRACK_MIX) : token.primary
  add('state indicator', 'knob/switch on track', parseRgb('#ffffff'), track, 3)
  add('state indicator', 'slider thumb/selection', parseRgb('#ffffff'), track, 3)
  for (const name of ['surface-0', 'surface-1', 'surface-2']) add('state indicator', `on track/${name}`, track, token[name], 3)
  // The empty slider track is the stroke colour, so it reads on the surfaces a slider sits on.
  for (const name of ['surface-0', 'surface-1']) add('state indicator', `slider track/${name}`, token['stroke-strong'], token[name], 3)
  add('state indicator', 'slider thumb/empty track', parseRgb('#ffffff'), token['stroke-strong'], 3)
  add('increased contrast', 'off switch knob and slider thumb edge/empty track', scheme === 'dark' ? token['surface-0'] : parseRgb('#ffffff'), token['text-muted'], 3)
  for (const [name, surface] of surfaces) {
    add('increased contrast', `edge/${name}`, token['text-muted'], surface, 4.5)
    for (const [fill, ink] of [['button-fill', 'text'], ['field-fill', 'field-label'], ['standout-fill', 'field-label'], ['selection-fill', 'selection-label']]) {
      const paint = mix(token[fill], surface, token[fill][3])
      const pair = `${fill}/${name}`
      add('text', `${ink}/${pair}`, token[ink], paint, 4.5)
      add('focus indicator', `focus/${pair}`, token.primary, paint, 3)
      add('increased contrast', `edge/${pair}`, token['text-muted'], paint, 3)
      add('increased contrast', `focus/${pair}`, token['hc-primary'], paint, 3)
      if (ink === 'field-label') add('state indicator', `error/${pair}`, mix(token.negative, token['text-strong'], ROLE_FG_MIX), paint, 3)
    }
    add('text', `field label/${name}`, token['field-label'], surface, 4.5)
    add('focus indicator', `focus/${name}`, token.primary, surface, 3)
  }
  const thumb = token['segmented-thumb']
  add('text', 'selected label/thumb', token['selection-label'], thumb, 4.5)
  // The selected segment also uses a semibold accent label. Its raised fill only needs to differ from the track.
  add('selection cue', 'thumb/track', thumb, token['surface-2'], 1)
  add('focus indicator', 'focus/thumb', token.primary, thumb, 3)
  add('increased contrast', 'edge/thumb', token['text-muted'], thumb, 3)
  const contrastTrack = scheme === 'dark' ? mix(token['hc-primary'], token['surface-0'], 0.7) : token['hc-primary']
  add('increased contrast', 'white knob/on track', parseRgb('#ffffff'), contrastTrack, 3)
  add('increased contrast', 'on-primary/hc fill', token['on-primary'], token['hc-primary'], 7)
  return pairs
}

for (const scheme of ['light', 'dark']) {
  test(`glass ${scheme}: text, role fills, control edges and state indicators clear their minimums`, () => {
    const pairs = glassPairs(scheme)
    const failures = pairs.filter(({ ratio, minimum }) => ratio < minimum).map(({ pair, ratio, minimum }) => `${pair}: ${ratio.toFixed(2)} < ${minimum}`)
    assert.deepEqual(failures, [], `${pairs.length} ${scheme} pairings checked`)
    assert.ok(pairs.find(({ pair }) => pair === 'thumb/track').ratio > 1, 'the raised thumb differs from its track')
    assert.ok(pairs.length >= 82, `${pairs.length} pairings`)
  })
}
