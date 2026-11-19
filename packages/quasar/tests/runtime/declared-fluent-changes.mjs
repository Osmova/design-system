// T189 replaced whole-bundle equality with immutable historical characterization
// plus an enumerated list of reviewed changes. The frozen baseline hashes are
// never regenerated; each entry below is applied to the baseline text so the
// rest of it must still match verbatim, and an unlisted change still fails.

// F01: the on-fill label no longer dilutes into the fill it sits on. Only Fluent
// reads this emission; every other profile re-declares 100% right after it.
const ON_FILL = ['--ods-text-on-fill-pressed-mix: 90%', '--ods-text-on-fill-pressed-mix: 100%']

// F02: the field clear/password action carries Quasar's no-outline utility, so
// its focus ring needs the same importance channel QBtn already uses. The
// unlayered bundle keeps the declaration inline; the layered bundle routes it
// into the earliest `ods-important` layer, which leaves the original rule
// holding only its offset and adds one rule matched by ADDED_IMPORTANT_RULE.
const FOCUS_RING = /(\.q-field__focusable-action:focus-visible\{)outline:var\(--ods-focus-ring-width\) solid var\(--ods-stroke-focus\);(outline-offset:)/g

// S01: the shadcn switch follows the v4 Switch (input track, primary when on, scheme-aware thumb).
const S = '.ods-variant-shadcn:is(.ods-ui,.ods-ui *) .q-toggle'
const SWITCH_BEFORE = [
  `${S} .q-toggle__track{border-color:var(--ods-control-stroke-strong);background:var(--ods-control-fill-hover)}`,
  `${S} .q-toggle__thumb::after{background:var(--ods-bg-canvas);box-shadow:var(--ods-shadow-sm)}`,
  `${S} .q-toggle__inner--indet{color:var(--ods-color-primary)}`,
  `${S} .q-toggle__inner--indet .q-toggle__track{background:currentColor;border-color:currentColor}`,
  `${S} .q-toggle__inner--indet .q-toggle__thumb::after{background:var(--ods-selection-on, var(--ods-text-on-primary))}`,
  `${S} :is(.q-toggle__inner--truthy,.q-toggle__inner--indet) .q-toggle__track{border-color:var(--ods-control-stroke-strong)}`,
].join('')
const SWITCH_AFTER = [
  `${S} .q-toggle__track{border-color:rgba(0,0,0,0);background:var(--ods-shadcn-input)}`,
  `${S}:not(.disabled):hover .q-toggle__inner--falsy .q-toggle__track{border-color:rgba(0,0,0,0)}`,
  `${S} .q-toggle__thumb::after{background:var(--ods-bg-canvas);box-shadow:none}`,
  `${S} .q-toggle__inner--falsy .q-toggle__thumb::after{box-shadow:0 0 0 1px var(--ods-text-muted)}`,
  `${S} .q-toggle__inner--indet{color:var(--ods-color-primary)}`,
  `${S} :is(.q-toggle__inner--truthy,.q-toggle__inner--indet) .q-toggle__track{background:currentColor;border-color:rgba(0,0,0,0)}`,
  `${S} :is(.q-toggle__inner--truthy,.q-toggle__inner--indet) .q-toggle__thumb::after{background:var(--ods-selection-on, var(--ods-text-on-primary))}`,
].join('')
const SWITCH_FOCUS = '.ods-variant-shadcn:is(.ods-ui,.ods-ui *) :is(.q-checkbox,.q-radio,.q-toggle):focus-visible :is(.q-checkbox__inner,.q-radio__inner,.q-toggle__inner){box-shadow:var(--ods-field-focus-halo);outline-width:var(--ods-border-width-control)}'
const SWITCH_SCHEME = `@supports(color: light-dark(#000, #fff)){${S} .q-toggle__track{background:light-dark(var(--ods-shadcn-input), color-mix(in srgb, var(--ods-shadcn-input) 80%, transparent))}${S} .q-toggle__inner--falsy .q-toggle__thumb::after{background:light-dark(var(--ods-shadcn-background), var(--ods-shadcn-foreground));box-shadow:0 0 0 1px light-dark(var(--ods-text-muted), transparent)}}`

export function applyDeclaredShadcnChanges(css) {
  if (!css.includes(SWITCH_BEFORE) || !css.includes(SWITCH_FOCUS)) throw new Error('S01: shadcn switch baseline rules not found')
  return css.replace(SWITCH_BEFORE, SWITCH_AFTER).replace(SWITCH_FOCUS, `${SWITCH_FOCUS}${SWITCH_SCHEME}`)
}
// F03: toolbars and segmented controls nested in a dark card flip with it. The
// change rebinds five surfaces the card's alias set did not cover, and drops the
// Ink/Term bar off the raw surface-0 step onto the card surface. Both edits land
// on rules that 150d952 already froze, so the alias block and the bar rule are
// characterised here rather than rewritten in place.
const CARD_CHROME = [
  '--ods-surface-brand-soft: color-mix(in srgb, var(--ods-color-primary) 36%, var(--ods-text-strong));',
  '--ods-toolbar-bg: var(--ods-bg-card);--ods-mica-alt: var(--ods-bg-card);--ods-segmented-track-bg: var(--ods-bg-surface-2);--ods-segmented-thumb-bg: var(--ods-control-fill-default);--ods-surface-focus-block: var(--ods-bg-surface-2);',
]
const TERM_BAR = /((?:\.ods-variant-term\)\) )?\.q-bar:not\(\.q-bar--dark\)\{background:)var\(--ods-surface-0\)(\})/g

// F04: bare headings drop to element specificity. `body.ods-ui :where(h3)` was
// (0,1,1) and overrode every class-styled heading in consuming apps (a card
// title class rendered at the h3 size). `:where(body.ods-ui) h3` is (0,0,1): it
// still beats Quasar's bare `h3` by source order and loses to any class.
const HEADING_FAMILY = ['body.ods-ui :where(h1,h2,h3,h4,h5,h6),', ':where(body.ods-ui) :is(h1,h2,h3,h4,h5,h6),']
const HEADING_WEIGHT = /body\.ods-ui :where\((h[1-6])(:not\([^)]*\))\)/g
const HEADING_STEP = /body\.ods-ui :where\((h[1-6])\)\{/g
const headingChanges = (css) => css.replace(HEADING_FAMILY[0], HEADING_FAMILY[1]).replace(HEADING_WEIGHT, ':where(body.ods-ui) $1:where($2)').replace(HEADING_STEP, ':where(body.ods-ui) $1{')

// F05: the WinUI fidelity rules (buttons, selection, toggle, slider, tabs,
// dialogs, dividers, disabled and subtle fills) are additions scoped to the
// win variant class, never edits of a frozen rule, so every other profile
// keeps its baseline paint. A matching rule may name no other variant.
export const ADDED_WIN_RULE = /^(?!.*ods-variant-(?!win\b)).*ods-variant-win\b/

export const ADDED_IMPORTANT_RULE = /^@layer ods-important\|[^|]*\.q-field__focusable-action:focus-visible\{outline:[^}]*!important\}$/

export function applyDeclaredFluentChanges(css, { layered = false } = {}) {
  const text = headingChanges(css.replaceAll(ON_FILL[0], ON_FILL[1]).replace(CARD_CHROME[0], CARD_CHROME.join('')))
  return layered
    ? text.replace(FOCUS_RING, '$1$2').replace(TERM_BAR, '$1var(--ods-bg-card)$2')
    : text.replace(FOCUS_RING, '$1outline:var(--ods-focus-ring-width) solid var(--ods-stroke-focus) !important;$2').replace(TERM_BAR, '$1var(--ods-bg-card)$2')
}

// The inverse of the enumerated changes, for gates that hash the historical
// text rather than compare it. Each emitting block declares the base value once
// and a profile may re-declare it after, so only the first occurrence per block
// is historical.
export function revertDeclaredFluentChanges(css) {
  return css.split('}').map(block => block.replace(ON_FILL[1], ON_FILL[0])).join('}')
    .replace(CARD_CHROME.join(''), CARD_CHROME[0])
    .replace(TERM_BAR, '$1var(--ods-surface-0)$2')
    .replace(HEADING_FAMILY[1], HEADING_FAMILY[0])
    .replace(/:where\(body\.ods-ui\) (h[1-6]):where\((:not\([^)]*\))\)/g, 'body.ods-ui :where($1$2)')
    .replace(/:where\(body\.ods-ui\) (h[1-6])\{/g, 'body.ods-ui :where($1){')
}
