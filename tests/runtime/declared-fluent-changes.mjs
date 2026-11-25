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

// The five primary-derived aliases re-resolve at every palette-bearing scope.
const PRESSED_ANCHOR = '--qds-color-primary-pressed: color-mix(in srgb, var(--qds-color-primary) var(--qds-fill-pressed-mix), var(--qds-fill-state-base))'
const PRIMARY_ALIASES = '--qds-banner-accent: var(--qds-color-primary);--qds-banner-accent-rgb: var(--qds-color-primary-rgb);--qds-notify-accent: var(--qds-color-primary);--qds-notify-accent-rgb: var(--qds-color-primary-rgb);--qds-pagination-active-border: rgba(var(--qds-color-primary-rgb), var(--qds-tonal-border-opacity))'

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

// Inverse of the declared changes, for gates hashing the historical text.
const PRIMARY_ALIAS_BLOCK = '--qds-banner-accent: var(--qds-color-primary);\n    --qds-banner-accent-rgb: var(--qds-color-primary-rgb);\n    --qds-notify-accent: var(--qds-color-primary);\n    --qds-notify-accent-rgb: var(--qds-color-primary-rgb);\n    --qds-pagination-active-border: rgba(var(--qds-color-primary-rgb), var(--qds-tonal-border-opacity));\n    '
// The historical text carries exactly one alias re-emission per palette-bearing scope.
const PRIMARY_ALIAS_RE_EMISSIONS = 5
export function revertDeclaredFluentChanges(css) {
  const stripped = css.split(PRIMARY_ALIAS_BLOCK)
  if (stripped.length - 1 !== PRIMARY_ALIAS_RE_EMISSIONS) throw new Error(`A06: expected ${PRIMARY_ALIAS_RE_EMISSIONS} primary-derived alias re-emissions, found ${stripped.length - 1}`)
  return stripped.join('')
    .split('}').map(block => block.replace(ON_FILL[1], ON_FILL[0])).join('}')
    .replace(CARD_CHROME.join(''), CARD_CHROME[0])
    .replace(TERM_BAR, '$1var(--qds-surface-0)$2')
    .replace(HEADING_FAMILY[1], HEADING_FAMILY[0])
    .replace(/:where\(body\.qds-ui\) (h[1-6]):where\((:not\([^)]*\))\)/g, 'body.qds-ui :where($1$2)')
    .replace(/:where\(body\.qds-ui\) (h[1-6])\{/g, 'body.qds-ui :where($1){')
}

// Rule-level declared fixes, applied to the flattened rule list as compiled.
const SHADCN_DISABLED = '.qds-variant-shadcn:is(.qds-ui,.qds-ui *) .q-item.disabled{color:var(--qds-fg-disabled)}'
const PAGINATION_BASE_BEFORE_BODY = '.qds-ui .q-pagination .q-btn{flex:0 1 var(--qds-button-min-height);height:var(--qds-button-min-height);color:var(--qds-pagination-text, var(--qds-fg-default)) !important;background-color:var(--qds-pagination-bg, transparent) !important;border-color:rgba(0,0,0,0);font-weight:var(--qds-font-weight-regular)}'
const PAGINATION_ACTIVE_PLAIN_OLD = '.qds-ui .q-pagination .q-btn[aria-current=page]{color:var(--qds-pagination-active-text) !important;background-color:var(--qds-pagination-active-bg) !important;border-color:var(--qds-pagination-active-border);font-weight:var(--qds-font-weight-semibold)}'
const DISABLED_BEFORE = '.qds-ui .q-expansion-item>.q-expansion-item__container>.q-item.disabled{color:var(--qds-fg-disabled);cursor:not-allowed}'
const ALPHA_BEFORE = '.qds-ui .q-color-picker__alpha .q-slider__track{background-color:rgba(0,0,0,0) !important;background-size:0 0 !important}'
const SHADCN_HEADER_INPUT = '.qds-variant-shadcn:is(.qds-ui,.qds-ui *) .q-color-picker__header input{font:inherit;color:var(--qds-fg-default);background:var(--qds-control-fill-default);border:var(--qds-border-width-control) solid var(--qds-control-stroke-strong);border-radius:var(--qds-radius-sm)}'
const SHADCN_HEADER_INPUT_FOCUS = '.qds-variant-shadcn:is(.qds-ui,.qds-ui *) .q-color-picker__header input:focus-visible{outline:var(--qds-focus-ring-width) solid var(--qds-stroke-focus)}'

// F06: pills draw one stroke, since per-side elevation colours meet on a full radius in hard seams.
const CHIP_EDGE = ['border:var(--qds-border-width-control) solid;border-color:var(--qds-control-stroke-top) var(--qds-control-stroke-default) var(--qds-control-stroke-bottom);', 'border:var(--qds-border-width-control) solid color-mix(in srgb, var(--qds-control-stroke-top), var(--qds-control-stroke-bottom));']
const ACCENT_EDGE = '{border-color:var(--qds-control-stroke-on-accent-top) var(--qds-control-stroke-on-accent-top) var(--qds-control-stroke-on-accent-bottom)}'
const PILL_BUTTON_EDGE = '.qds-ui [class*=q-btn--round]{--qds-control-stroke-top: var(--qds-control-stroke-default);--qds-control-stroke-bottom: var(--qds-control-stroke-top);--qds-control-stroke-on-accent-bottom: var(--qds-control-stroke-on-accent-top)}'

export function applyDeclaredFixes(rules) {
  const out = []
  for (const rule of rules) {
    const layered = rule.startsWith('@layer')
    const head = layered ? rule.slice(0, rule.lastIndexOf('|') + 1) : ''
    const important = layered ? '@layer qds-important|' : ''
    if (/(?:^|\|)\.qds-ui \.q-chip\{/.test(rule) && rule.includes(CHIP_EDGE[0])) {
      out.push(rule.replace(CHIP_EDGE[0], CHIP_EDGE[1]))
      continue
    }
    if (rule.endsWith(ACCENT_EDGE) && rule.includes('.q-btn:is(.bg-primary')) {
      out.push(rule)
      out.push(`${head}${PILL_BUTTON_EDGE}`)
      continue
    }
    // The mobile select dialog trades Quasar's 90vw for even space-lg gutters.
    if (rule.endsWith('.qds-ui .q-dialog__inner--minimized{padding:var(--qds-space-md)}')) {
      out.push(rule)
      out.push(layered ? `@media(max-width: 599.98px)|@layer qds-important|.qds-ui .q-select__dialog{width:calc(100vw - 2*var(--qds-space-lg)) !important}` : '@media(max-width: 599.98px)|.qds-ui .q-select__dialog{width:calc(100vw - 2*var(--qds-space-lg)) !important}')
      continue
    }
    // The primary-derived aliases re-resolve at every palette-bearing scope.
    if (rule.includes(PRESSED_ANCHOR) && rule.includes('--qds-fill-state-base: var(--qds-fg-strong)') && !rule.includes('--qds-banner-accent:') && rule.includes('--qds-row-radius: var(--qds-radius-md);')) {
      out.push(rule.replace('--qds-row-radius: var(--qds-radius-md);', `${PRIMARY_ALIASES};--qds-row-radius: var(--qds-radius-md);`))
      continue
    }
    if (rule.includes('color-scheme:dark;--qds-color-primary: #1976ca') && rule.includes('--qds-toggle-thumb-inset: 0.1875rem')) {
      out.push(rule.replace('--qds-toggle-thumb-inset: 0.1875rem;', `--qds-toggle-thumb-inset: 0.1875rem;${PRIMARY_ALIASES};`))
      continue
    }
    if (rule.endsWith(DISABLED_BEFORE)) {
      out.push(`${head}.qds-ui .q-item.disabled{color:var(--qds-text-strong);cursor:not-allowed}`)
      out.push(`${head}@supports(color: light-dark(#000, #fff))|.qds-ui .q-item.disabled{color:light-dark(color-mix(in srgb, var(--qds-text-strong) 15%, #000), color-mix(in srgb, var(--qds-text-strong) 15%, #fff))}`)
      continue
    }
    if (layered && rule.endsWith('.qds-ui .q-pagination .q-btn{flex:0 1 var(--qds-button-min-height);height:var(--qds-button-min-height);border-color:rgba(0,0,0,0);font-weight:var(--qds-font-weight-regular)}')) {
      out.push(`${head}.qds-ui .q-pagination .q-btn{flex:0 0 var(--qds-button-min-height);height:var(--qds-button-min-height);font-weight:var(--qds-font-weight-regular)}`)
      continue
    }
    if (layered && rule.endsWith('.qds-ui .q-pagination .q-btn{color:var(--qds-pagination-text, var(--qds-fg-default)) !important;background-color:var(--qds-pagination-bg, transparent) !important}')) {
      out.push(`${important}.qds-ui .q-pagination .q-btn--flat{color:var(--qds-pagination-text, var(--qds-fg-default)) !important;background-color:var(--qds-pagination-bg, transparent) !important}`)
      continue
    }
    if (!layered && rule.endsWith(PAGINATION_BASE_BEFORE_BODY)) {
      out.push(`${head}.qds-ui .q-pagination .q-btn{flex:0 0 var(--qds-button-min-height);height:var(--qds-button-min-height);font-weight:var(--qds-font-weight-regular)}`)
      out.push(`${head}.qds-ui .q-pagination .q-btn--flat{color:var(--qds-pagination-text, var(--qds-fg-default)) !important;background-color:var(--qds-pagination-bg, transparent) !important}`)
      continue
    }
    if (layered && rule.endsWith('.qds-ui .q-pagination .q-btn[aria-current=page]{color:var(--qds-pagination-active-text) !important;background-color:var(--qds-pagination-active-bg) !important}')) {
      out.push(`${important}.qds-ui .q-pagination .q-btn[aria-current=page]:not(.q-btn--outline,.q-btn--push,.q-btn--unelevated){color:var(--qds-pagination-active-text) !important;background-color:var(--qds-pagination-active-bg) !important}`)
      out.push(`@layer qds.quasar|.qds-ui .q-pagination .q-field{flex:none}`)
      continue
    }
    if (!layered && rule.endsWith(PAGINATION_ACTIVE_PLAIN_OLD)) {
      out.push(`${head}.qds-ui .q-pagination .q-btn[aria-current=page]{border-color:var(--qds-pagination-active-border);font-weight:var(--qds-font-weight-semibold)}`)
      out.push(`${head}.qds-ui .q-pagination .q-btn[aria-current=page]:not(.q-btn--outline,.q-btn--push,.q-btn--unelevated){color:var(--qds-pagination-active-text) !important;background-color:var(--qds-pagination-active-bg) !important}`)
      out.push(`${head}.qds-ui .q-pagination .q-field{flex:none}`)
      continue
    }
    if (rule.endsWith(ALPHA_BEFORE)) {
      out.push(`${important}.qds-ui .q-color-picker__alpha .q-slider__track{background-size:0 0 !important}`)
      continue
    }
    if (rule.endsWith(SHADCN_DISABLED)) continue
    if (rule.endsWith(SHADCN_HEADER_INPUT) || rule.endsWith(SHADCN_HEADER_INPUT_FOCUS)) continue
    if (rule.endsWith('.qds-ui .q-time__now-button{box-shadow:none}')) {
      out.push(rule)
      out.push(`${head}.qds-ui .q-color-picker__header input{font:inherit;color:var(--qds-fg-default);background:var(--qds-bg-flyout);border:var(--qds-border-width-control) solid var(--qds-control-stroke-strong);border-radius:var(--qds-radius-sm)}`)
      out.push(`${head}.qds-ui .q-color-picker__header input:focus-visible{outline:var(--qds-focus-ring-width) solid var(--qds-stroke-focus)}`)
      continue
    }
    out.push(rule)
  }
  return out
}
