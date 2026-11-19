// Mandatory normative recheck after the manifest owner installs colorjs.io@0.7.1.
// Intentionally fails on missing dependency; it does not silently skip a gate.
import assert from 'node:assert/strict'
import Color from 'colorjs.io'
import { sourceProfiles, emittedProfiles, parseRgb, roles, mix, contrast } from '../tests/runtime/shadcn-fixtures.mjs'

const emitted = emittedProfiles()
const rgb = (color) => {
  const srgb = color.to('srgb')
  return [...srgb.coords.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255)), srgb.alpha]
}
const firstPassing = (source, scheme, backgrounds, minimum, opacity = 1) => {
  const initial = new Color(source).to('oklch')
  for (let step = 0; step <= 1000; step++) {
    const l = initial.coords[0] + step * (scheme === 'dark' ? 0.001 : -0.001)
    if (l < 0 || l > 1) continue
    const candidate = rgb(new Color('oklch', [l, initial.coords[1], initial.coords[2]]))
    if (backgrounds.every((bg) => contrast(mix(candidate, bg, opacity), bg) >= minimum)) return candidate
  }
  throw new Error(`Normative contrast conflict: ${source}/${scheme}`)
}
const firstPassingFill = (fill, pair, container, weight) => {
  const start = mix(fill, container, weight)
  const initialRgb = start.slice(0, 3).map(Math.round).concat(1)
  if (contrast(pair, initialRgb) >= 4.5) return initialRgb
  const initial = new Color('srgb', start.slice(0, 3).map((v) => v / 255)).to('oklch')
  const direction = contrast(pair, [0, 0, 0, 1]) >= contrast(pair, [255, 255, 255, 1]) ? -1 : 1
  for (let step = 1; step <= 1000; step++) {
    const l = initial.coords[0] + direction * step * 0.001
    if (l < 0 || l > 1) continue
    const candidate = rgb(new Color('oklch', [l, initial.coords[1], initial.coords[2]]))
    if (contrast(pair, candidate) >= 4.5) return candidate
  }
  throw new Error('Normative fill/pair conflict')
}
let checked = 0
for (const [palette, schemes] of Object.entries(sourceProfiles())) {
  for (const [scheme, slots] of Object.entries(schemes)) {
    for (const [slot, value] of Object.entries(slots)) {
      const expected = rgb(new Color(value))
      assert.deepEqual(parseRgb(emitted[`${palette}-${scheme}`][`--ods-shadcn-${slot}`]), expected, `${palette}/${scheme}/${slot}`)
      checked++
    }
    const p = emitted[`${palette}-${scheme}`]
    const card = parseRgb(p['--ods-shadcn-card'])
    for (const role of roles) {
      for (const [state, weight] of [['hover', 0.9], ['pressed', 0.8]]) {
        assert.deepEqual(parseRgb(p[`--ods-color-${role}-${state}`]), firstPassingFill(parseRgb(p[`--ods-color-${role}`]), parseRgb(p[`--ods-text-on-${role}`]), card, weight), `${palette}/${scheme}/${role}/${state} minimal fill calibration`)
        checked++
      }
    }
    const backgrounds = ['background', 'card', 'popover', 'muted', 'accent'].map((slot) => parseRgb(p[`--ods-shadcn-${slot}`]))
    roles.forEach((role) => backgrounds.push(mix(parseRgb(p[`--ods-color-${role}`]), card, 0.1)))
    const foregroundSources = {
      '--ods-text-muted': slots['muted-foreground'],
      '--ods-fg-primary': slots.primary, '--ods-fg-secondary': slots['secondary-foreground'],
      '--ods-fg-accent': slots['accent-foreground'], '--ods-fg-negative': slots.destructive,
      '--ods-fg-positive': scheme === 'light' ? '#166534' : '#4ade80',
      '--ods-fg-warning': scheme === 'light' ? '#92400e' : '#fbbf24',
      '--ods-fg-info': scheme === 'light' ? '#1d4ed8' : '#93c5fd',
    }
    for (const [alias, source] of Object.entries(foregroundSources)) {
      assert.deepEqual(parseRgb(p[alias]), firstPassing(source, scheme, backgrounds, 4.5), `${palette}/${scheme}/${alias} first passing source-L step`)
      checked++
    }
    assert.deepEqual(parseRgb(p['--ods-stroke-strong']), firstPassing(slots.ring, scheme, backgrounds, 3, 0.5), `${palette}/${scheme}/painted ring`)
    checked++
  }
}
console.log(`Color.js normative conversion and first-passing correction: ${checked} slots/aliases passed.`)
