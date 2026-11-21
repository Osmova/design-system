// T189 replaced whole-bundle equality with immutable historical characterization
// plus an enumerated list of reviewed changes. The frozen baseline hashes are
// never regenerated; each entry below is applied to the baseline text so the
// rest of it must still match verbatim, and an unlisted change still fails.

// F01: the on-fill label no longer dilutes into the fill it sits on. Only Fluent
// reads this emission; every other profile re-declares 100% right after it.
const ON_FILL = ['--qds-text-on-fill-pressed-mix: 90%', '--qds-text-on-fill-pressed-mix: 100%']

// F02: the field clear/password action carries Quasar's no-outline utility, so
// its focus ring needs the same importance channel QBtn already uses. The
// unlayered bundle keeps the declaration inline; the layered bundle routes it
// into the earliest `qds-important` layer, which leaves the original rule
// holding only its offset and adds one rule matched by ADDED_IMPORTANT_RULE.
const FOCUS_RING = /(\.q-field__focusable-action:focus-visible\{)outline:var\(--qds-focus-ring-width\) solid var\(--qds-stroke-focus\);(outline-offset:)/g

// S01: the shadcn switch follows the v4 Switch (input track, primary when on, scheme-aware thumb).
const S = '.qds-variant-shadcn:is(.qds-ui,.qds-ui *) .q-toggle'
const SWITCH_BEFORE = [
  `${S} .q-toggle__track{border-color:var(--qds-control-stroke-strong);background:var(--qds-control-fill-hover)}`,
  `${S} .q-toggle__thumb::after{background:var(--qds-bg-canvas);box-shadow:var(--qds-shadow-sm)}`,
  `${S} .q-toggle__inner--indet{color:var(--qds-color-primary)}`,
  `${S} .q-toggle__inner--indet .q-toggle__track{background:currentColor;border-color:currentColor}`,
  `${S} .q-toggle__inner--indet .q-toggle__thumb::after{background:var(--qds-selection-on, var(--qds-text-on-primary))}`,
  `${S} :is(.q-toggle__inner--truthy,.q-toggle__inner--indet) .q-toggle__track{border-color:var(--qds-control-stroke-strong)}`,
].join('')
const SWITCH_AFTER = [
  `${S} .q-toggle__track{border-color:rgba(0,0,0,0);background:var(--qds-shadcn-input)}`,
  `${S}:not(.disabled):hover .q-toggle__inner--falsy .q-toggle__track{border-color:rgba(0,0,0,0)}`,
  `${S} .q-toggle__thumb::after{background:var(--qds-bg-canvas);box-shadow:none}`,
  `${S} .q-toggle__inner--falsy .q-toggle__thumb::after{box-shadow:0 0 0 1px var(--qds-text-muted)}`,
  `${S} .q-toggle__inner--indet{color:var(--qds-color-primary)}`,
  `${S} :is(.q-toggle__inner--truthy,.q-toggle__inner--indet) .q-toggle__track{background:currentColor;border-color:rgba(0,0,0,0)}`,
  `${S} :is(.q-toggle__inner--truthy,.q-toggle__inner--indet) .q-toggle__thumb::after{background:var(--qds-selection-on, var(--qds-text-on-primary))}`,
].join('')
const SWITCH_FOCUS = '.qds-variant-shadcn:is(.qds-ui,.qds-ui *) :is(.q-checkbox,.q-radio,.q-toggle):focus-visible :is(.q-checkbox__inner,.q-radio__inner,.q-toggle__inner){box-shadow:var(--qds-field-focus-halo);outline-width:var(--qds-border-width-control)}'
const SWITCH_SCHEME = `@supports(color: light-dark(#000, #fff)){${S} .q-toggle__track{background:light-dark(var(--qds-shadcn-input), color-mix(in srgb, var(--qds-shadcn-input) 80%, transparent))}${S} .q-toggle__inner--falsy .q-toggle__thumb::after{background:light-dark(var(--qds-shadcn-background), var(--qds-shadcn-foreground));box-shadow:0 0 0 1px light-dark(var(--qds-text-muted), transparent)}}`

export function applyDeclaredShadcnChanges(css) {
  if (!css.includes(SWITCH_BEFORE) || !css.includes(SWITCH_FOCUS)) throw new Error('S01: shadcn switch baseline rules not found')
  return css.replace(SWITCH_BEFORE, SWITCH_AFTER).replace(SWITCH_FOCUS, `${SWITCH_FOCUS}${SWITCH_SCHEME}`)
}
// F03: the dark-card chrome re-binds and the term bar step, characterized here.
const CARD_CHROME = [
  '--qds-surface-brand-soft: color-mix(in srgb, var(--qds-color-primary) 36%, var(--qds-text-strong));',
  '--qds-toolbar-bg: var(--qds-bg-card);--qds-mica-alt: var(--qds-bg-card);--qds-segmented-track-bg: var(--qds-bg-surface-2);--qds-segmented-thumb-bg: var(--qds-control-fill-default);--qds-surface-focus-block: var(--qds-bg-surface-2);',
]
const TERM_BAR = /((?:\.qds-variant-term\)\) )?\.q-bar:not\(\.q-bar--dark\)\{background:)var\(--qds-surface-0\)(\})/g

// F04: bare headings drop to element specificity, still ahead of Quasar by source order.
const HEADING_FAMILY = ['body.qds-ui :where(h1,h2,h3,h4,h5,h6),', ':where(body.qds-ui) :is(h1,h2,h3,h4,h5,h6),']
const HEADING_WEIGHT = /body\.qds-ui :where\((h[1-6])(:not\([^)]*\))\)/g
const HEADING_STEP = /body\.qds-ui :where\((h[1-6])\)\{/g
const headingChanges = (css) => css.replace(HEADING_FAMILY[0], HEADING_FAMILY[1]).replace(HEADING_WEIGHT, ':where(body.qds-ui) $1:where($2)').replace(HEADING_STEP, ':where(body.qds-ui) $1{')

// F05: the win fidelity additions are win-scoped and never edit a frozen rule.
export const ADDED_WIN_RULE = /^(?!.*qds-variant-(?!win\b)).*qds-variant-win\b/

export const ADDED_IMPORTANT_RULE = /^@layer qds-important\|[^|]*\.q-field__focusable-action:focus-visible\{outline:[^}]*!important\}$/

export function applyDeclaredFluentChanges(css, { layered = false } = {}) {
  const text = headingChanges(css.replaceAll(ON_FILL[0], ON_FILL[1]).replace(CARD_CHROME[0], CARD_CHROME.join('')))
  return layered
    ? text.replace(FOCUS_RING, '$1$2').replace(TERM_BAR, '$1var(--qds-bg-card)$2')
    : text.replace(FOCUS_RING, '$1outline:var(--qds-focus-ring-width) solid var(--qds-stroke-focus) !important;$2').replace(TERM_BAR, '$1var(--qds-bg-card)$2')
}

// The inverse of the enumerated changes, for gates that hash the historical text: only the first occurrence per block is historical.
export function revertDeclaredFluentChanges(css) {
  return css.split('}').map(block => block.replace(ON_FILL[1], ON_FILL[0])).join('}')
    .replace(CARD_CHROME.join(''), CARD_CHROME[0])
    .replace(TERM_BAR, '$1var(--qds-surface-0)$2')
    .replace(HEADING_FAMILY[1], HEADING_FAMILY[0])
    .replace(/:where\(body\.qds-ui\) (h[1-6]):where\((:not\([^)]*\))\)/g, 'body.qds-ui :where($1$2)')
    .replace(/:where\(body\.qds-ui\) (h[1-6])\{/g, 'body.qds-ui :where($1){')
}

// Rule-level declared fixes, applied to the flattened rule list as compiled.

export function applyDeclaredFixes(rules) {
  const out = []
  for (const rule of rules) {
    const layered = rule.startsWith('@layer')
    const head = layered ? rule.slice(0, rule.lastIndexOf('|') + 1) : ''
    const important = layered ? '@layer qds-important|' : ''
    // The mobile select dialog trades Quasar's 90vw for even space-lg gutters.
    if (rule.endsWith('.qds-ui .q-dialog__inner--minimized{padding:var(--qds-space-md)}')) {
      out.push(rule)
      out.push(layered ? `@media(max-width: 599.98px)|@layer qds-important|.qds-ui .q-select__dialog{width:calc(100vw - 2*var(--qds-space-lg)) !important}` : '@media(max-width: 599.98px)|.qds-ui .q-select__dialog{width:calc(100vw - 2*var(--qds-space-lg)) !important}')
      continue
    }
    out.push(rule)
  }
  return out
}
