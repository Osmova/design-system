/**
 * Canonical inventory of the public CSS custom-property contract.
 * Every `--ods-*` token the package emits is listed here so consumers can
 * discover, type, and override the full surface. The stable public contract
 * is the `--ods-*` prefix; Sass map names remain internal.
 *
 * Source of truth: the union of `--ods-*` properties emitted at `:root` in
 * `src/themes/fallbacks.scss` (base layer) and `src/themes/default.scss`
 * (default theme + derived tokens), plus variant-scoped primitives in
 * `src/themes/_shadcn.scss`. Tokens are grouped in a stable order; shadcn
 * primitives intentionally do not change the universal fallback output.
 */
export const ODS_TOKENS = [
  // Shadcn upstream slots (variant-scoped; aliases below remain universal).
  '--ods-shadcn-background',
  '--ods-shadcn-foreground',
  '--ods-shadcn-card',
  '--ods-shadcn-card-foreground',
  '--ods-shadcn-popover',
  '--ods-shadcn-popover-foreground',
  '--ods-shadcn-primary',
  '--ods-shadcn-primary-foreground',
  '--ods-shadcn-secondary',
  '--ods-shadcn-secondary-foreground',
  '--ods-shadcn-muted',
  '--ods-shadcn-muted-foreground',
  '--ods-shadcn-accent',
  '--ods-shadcn-accent-foreground',
  '--ods-shadcn-destructive',
  '--ods-shadcn-destructive-foreground',
  '--ods-shadcn-border',
  '--ods-shadcn-input',
  '--ods-shadcn-ring',
  '--ods-shadcn-chart-1',
  '--ods-shadcn-chart-2',
  '--ods-shadcn-chart-3',
  '--ods-shadcn-chart-4',
  '--ods-shadcn-chart-5',
  '--ods-shadcn-sidebar',
  '--ods-shadcn-sidebar-foreground',
  '--ods-shadcn-sidebar-primary',
  '--ods-shadcn-sidebar-primary-foreground',
  '--ods-shadcn-sidebar-accent',
  '--ods-shadcn-sidebar-accent-foreground',
  '--ods-shadcn-sidebar-border',
  '--ods-shadcn-sidebar-ring',
  '--ods-surface-secondary-soft',
  // Calibrated Shadcn role states; primary hover/pressed are listed below.
  '--ods-color-secondary-hover',
  '--ods-color-secondary-pressed',
  '--ods-color-accent-hover',
  '--ods-color-accent-pressed',
  '--ods-color-positive-hover',
  '--ods-color-positive-pressed',
  '--ods-color-negative-hover',
  '--ods-color-negative-pressed',
  '--ods-color-warning-hover',
  '--ods-color-warning-pressed',
  '--ods-color-info-hover',
  '--ods-color-info-pressed',
  '--ods-color-primary-hover-rgb',
  '--ods-color-primary-pressed-rgb',
  '--ods-color-secondary-hover-rgb',
  '--ods-color-secondary-pressed-rgb',
  '--ods-color-accent-hover-rgb',
  '--ods-color-accent-pressed-rgb',
  '--ods-color-positive-hover-rgb',
  '--ods-color-positive-pressed-rgb',
  '--ods-color-negative-hover-rgb',
  '--ods-color-negative-pressed-rgb',
  '--ods-color-warning-hover-rgb',
  '--ods-color-warning-pressed-rgb',
  '--ods-color-info-hover-rgb',
  '--ods-color-info-pressed-rgb',
  '--ods-text-on-primary-pressed-mix',
  '--ods-text-on-secondary-pressed-mix',
  '--ods-text-on-accent-pressed-mix',
  '--ods-text-on-positive-pressed-mix',
  '--ods-text-on-negative-pressed-mix',
  '--ods-text-on-warning-pressed-mix',
  '--ods-text-on-info-pressed-mix',
  // ── Colors ──────────────────────────────────────────────────────────
  '--ods-color-primary',
  '--ods-color-primary-light',
  '--ods-color-primary-dark',
  '--ods-color-primary-hover',
  '--ods-color-primary-pressed',
  '--ods-color-secondary',
  '--ods-color-accent',
  '--ods-color-positive',
  '--ods-color-negative',
  '--ods-color-warning',
  '--ods-color-info',

  // ── Colors (RGB) ────────────────────────────────────────────────────
  '--ods-color-primary-rgb',
  '--ods-color-primary-light-rgb',
  '--ods-color-primary-dark-rgb',
  '--ods-color-secondary-rgb',
  '--ods-color-accent-rgb',
  '--ods-color-positive-rgb',
  '--ods-color-negative-rgb',
  '--ods-color-warning-rgb',
  '--ods-color-info-rgb',

  // ── Surfaces ────────────────────────────────────────────────────────
  '--ods-surface-0',
  '--ods-surface-1',
  '--ods-surface-2',
  '--ods-surface-3',
  '--ods-surface-glass',
  '--ods-surface-brand-soft',
  '--ods-surface-accent-soft',
  '--ods-surface-positive-soft',
  '--ods-surface-warning-soft',
  '--ods-surface-negative-soft',
  '--ods-surface-info-soft',
  '--ods-surface-focus-block',
  '--ods-surface-transient',

  // ── Text ────────────────────────────────────────────────────────────
  '--ods-text',
  '--ods-text-strong',
  '--ods-text-muted',
  '--ods-text-on-solid',
  '--ods-text-on-primary',
  '--ods-text-on-secondary',
  '--ods-text-on-accent',
  '--ods-text-on-positive',
  '--ods-text-on-negative',
  '--ods-text-on-warning',
  '--ods-text-on-info',

  // ── Media ───────────────────────────────────────────────────────────
  '--ods-media-scrim',
  '--ods-media-scrim-strong',

  // ── Materials ───────────────────────────────────────────────────────
  '--ods-backdrop',
  '--ods-mica-alt',
  '--ods-material-thin-bg',
  '--ods-material-regular-bg',
  '--ods-material-thick-bg',
  '--ods-material-thin-blur',
  '--ods-material-regular-blur',
  '--ods-material-thick-blur',
  '--ods-material-thin-filter',
  '--ods-material-regular-filter',
  '--ods-material-thick-filter',
  '--ods-material-saturate',
  '--ods-material-stroke',
  '--ods-material-edge',

  // ── Borders ─────────────────────────────────────────────────────────
  '--ods-border',
  '--ods-border-subtle',

  // ── Spacing ─────────────────────────────────────────────────────────
  '--ods-space-xs',
  '--ods-space-sm',
  '--ods-space-md',
  '--ods-space-lg',
  '--ods-space-xl',

  // ── Radius ──────────────────────────────────────────────────────────
  '--ods-radius-xs',
  '--ods-radius-sm',
  '--ods-radius-md',
  '--ods-radius-lg',
  '--ods-radius-xl',
  '--ods-radius-full',
  '--ods-radius-control',

  // ── Shadows ─────────────────────────────────────────────────────────
  '--ods-shadow-sm',
  '--ods-shadow-md',
  '--ods-shadow-lg',
  '--ods-shadow-2',
  '--ods-shadow-4',
  '--ods-shadow-8',
  '--ods-shadow-16',
  '--ods-shadow-28',
  '--ods-shadow-64',

  // ── Typography ──────────────────────────────────────────────────────
  '--ods-font-family',
  '--ods-font-family-display',
  '--ods-font-family-accent',
  '--ods-font-weight-regular',
  '--ods-font-weight-medium',
  '--ods-font-weight-semibold',
  '--ods-font-weight-bold',

  // ── Motion ──────────────────────────────────────────────────────────
  '--ods-motion-fast',
  '--ods-motion-base',
  '--ods-motion-duration-fast',
  '--ods-motion-duration-base',
  '--ods-motion-duration-medium',
  '--ods-motion-duration-slow',
  '--ods-motion-ease-out',
  '--ods-motion-ease-in-out',

  // ── Focus ring ──────────────────────────────────────────────────────
  '--ods-focus-ring-width',
  '--ods-focus-ring-offset',
  '--ods-focus-ring-opacity',

  // ── State opacities ─────────────────────────────────────────────────
  '--ods-state-hover-opacity',
  '--ods-state-focus-opacity',
  '--ods-state-press-opacity',
  '--ods-disabled-opacity',

  // ── Tonal opacities ─────────────────────────────────────────────────
  '--ods-tonal-bg-opacity',
  '--ods-tonal-hover-opacity',
  '--ods-tonal-border-opacity',
  '--ods-tonal-text-mix',

  // ── Solid fill states ───────────────────────────────────────────────
  '--ods-fill-hover-mix',
  '--ods-fill-pressed-mix',
  '--ods-fill-state-base',
  '--ods-text-on-fill-pressed-mix',

  // ── Border widths ───────────────────────────────────────────────────
  '--ods-border-width-control',

  // ── Control ─────────────────────────────────────────────────────────
  '--ods-control-size-sm',
  '--ods-control-size-md',
  '--ods-control-size-lg',
  '--ods-control-font-size-sm',
  '--ods-control-icon-size-sm',
  '--ods-control-icon-size-md',
  '--ods-control-icon-size-lg',
  '--ods-control-icon-opacity',
  '--ods-control-icon-opacity-active',
  '--ods-control-letter-spacing',
  '--ods-control-text-transform',
  '--ods-control-content-line-height',

  // ── Control size helpers (derived) ───────────────────────────────────
  '--ods-button-size-sm',
  '--ods-button-size-md',
  '--ods-button-size-lg',
  '--ods-field-size-sm',
  '--ods-field-size-md',
  '--ods-field-size-lg',
  '--ods-field-label-size-rest',
  '--ods-field-label-size-float',
  '--ods-field-label-gap',
  '--ods-field-label-column',
  '--ods-field-value-inset-block-start',
  '--ods-field-value-inset-block-end',
  '--ods-field-value-inset-block-start-dense',
  '--ods-field-value-inset-block-end-dense',
  '--ods-field-transition',
  '--ods-field-label-weight',
  '--ods-field-shadow',
  '--ods-field-focus-stroke',
  '--ods-field-focus-halo',
  '--ods-field-description-color',
  '--ods-field-help-gap',
  '--ods-control-fill-input-active',
  '--ods-control-stroke-default',
  '--ods-control-stroke-secondary',
  '--ods-control-stroke-strong',
  '--ods-control-stroke-top',
  '--ods-control-stroke-bottom',
  '--ods-control-stroke-on-accent-top',
  '--ods-control-stroke-on-accent-bottom',
  '--ods-card-fill',
  '--ods-card-stroke',
  '--ods-control-halo',
  '--ods-row-gap',
  '--ods-row-radius',
  '--ods-row-inset',
  '--ods-progress-stripe',
  '--ods-spinner-static-arc',
  '--ods-spinner-static-offset',
  '--ods-icon-size-xs',
  '--ods-icon-size-sm',
  '--ods-icon-size-md',
  '--ods-icon-size-lg',
  '--ods-control-icon-color',
  '--ods-button-icon-size',
  '--ods-button-dense-icon-size',
  '--ods-field-icon-size',
  '--ods-field-dense-icon-size',
  '--ods-chip-icon-size',
  '--ods-chip-dense-icon-size',
  '--ods-compact-action-size',
  '--ods-compact-action-icon-size',

  // ── Inline icons ────────────────────────────────────────────────────
  '--ods-inline-icon-gap',
  '--ods-inline-icon-dense-gap',

  // ── Button ──────────────────────────────────────────────────────────
  '--ods-button-min-height',
  '--ods-button-padding-inline',
  '--ods-button-dense-min-height',
  '--ods-button-dense-padding-inline',
  '--ods-button-dense-radius',
  '--ods-button-dense-font-size',
  '--ods-button-round-size',
  '--ods-button-elevated-shadow',
  '--ods-button-elevated-shadow-hover',
  '--ods-fab-size',
  '--ods-fab-mini-size',

  // ── Avatar ──────────────────────────────────────────────────────────
  '--ods-avatar-initials-scale',

  // ── Card ────────────────────────────────────────────────────────────
  '--ods-card-acrylic-tint-rgb',
  '--ods-card-tonal-opacity',
  '--ods-card-fallback-tonal-opacity',
  '--ods-card-readable-tonal-opacity',
  '--ods-card-readable-surface-mix',
  '--ods-card-header-tonal-opacity',
  '--ods-card-header-surface-mix',
  '--ods-card-border-mix',
  '--ods-card-backdrop-blur',
  '--ods-card-backdrop-saturate',

  // ── Chrome ──────────────────────────────────────────────────────────
  '--ods-chrome-border-mix',
  '--ods-chrome-border-soft-mix',
  '--ods-chrome-surface-mix',
  '--ods-chrome-surface-strong-mix',
  '--ods-separator-mix',
  '--ods-handle-border-mix',
  '--ods-handle-primary-mix',

  // ── Badge ───────────────────────────────────────────────────────────
  '--ods-badge-min-height',
  '--ods-badge-padding',

  // ── Chip ────────────────────────────────────────────────────────────
  '--ods-chip-min-height',
  '--ods-chip-padding',
  '--ods-chip-dense-min-height',
  '--ods-chip-dense-padding',

  // ── Field ───────────────────────────────────────────────────────────
  '--ods-field-min-height',
  '--ods-field-dense-min-height',
  '--ods-field-padding-inline',
  '--ods-field-label-size',
  '--ods-field-focus-border-width',

  // ── Glass effects ───────────────────────────────────────────────────
  '--ods-glass-blur',
  '--ods-glass-saturate',
  '--ods-glass-border-mix',

  // ── Elevation (derived from shadows) ────────────────────────────────
  '--ods-elevation-1',
  '--ods-elevation-2',
  '--ods-elevation-3',

  // ── Interactive (derived from surfaces/text/border) ─────────────────
  '--ods-interactive-bg',
  '--ods-interactive-bg-hover',
  '--ods-interactive-bg-active',
  '--ods-interactive-border',
  '--ods-interactive-border-strong',
  '--ods-interactive-text',
  '--ods-interactive-text-muted',

  // ── Button (derived) ────────────────────────────────────────────────
  '--ods-button-icon-gap',
  '--ods-button-dense-icon-gap',
  '--ods-button-radius',

  // ── Chip (derived) ──────────────────────────────────────────────────
  '--ods-chip-icon-gap',
  '--ods-chip-dense-icon-gap',
  '--ods-chip-radius',

  // ── Badge (derived) ─────────────────────────────────────────────────
  '--ods-badge-icon-gap',
  '--ods-badge-dense-icon-gap',
  '--ods-badge-radius',

  // ── Banner (component) ──────────────────────────────────────────────
  '--ods-banner-accent',
  '--ods-banner-accent-rgb',
  '--ods-banner-text',

  // ── Card (derived) ──────────────────────────────────────────────────
  '--ods-card-bg',
  '--ods-card-bg-fallback',
  '--ods-card-bg-readable',
  '--ods-card-bg-opaque',
  '--ods-card-border',
  '--ods-card-border-strong',
  '--ods-card-header-bg',
  '--ods-card-header-bg-opaque',
  '--ods-card-header-border',
  '--ods-card-radius',
  '--ods-card-shadow',
  '--ods-card-shadow-value',

  // ── Chrome (derived) ────────────────────────────────────────────────
  '--ods-chrome-border',
  '--ods-chrome-border-soft',
  '--ods-chrome-surface',
  '--ods-chrome-surface-strong',
  '--ods-chrome-shadow',
  '--ods-chrome-shadow-value',
  '--ods-media-frame-shadow',
  '--ods-media-frame-shadow-value',
  '--ods-separator-color',
  '--ods-handle-color',

  // ── Menu (derived) ──────────────────────────────────────────────────
  '--ods-menu-bg',
  '--ods-menu-border',
  '--ods-menu-item-min-height',
  '--ods-menu-item-min-height-value',
  '--ods-menu-radius',
  '--ods-menu-shadow',

  // ── Notification (derived) ──────────────────────────────────────────
  '--ods-notification-radius',
  '--ods-notification-shadow',

  // ── Notification (component) ────────────────────────────────────────
  '--ods-notify-accent',
  '--ods-notify-accent-rgb',
  '--ods-notify-bg',
  '--ods-notify-text',

  // ── Pagination (component) ──────────────────────────────────────────
  '--ods-pagination-active-bg',
  '--ods-pagination-active-border',
  '--ods-pagination-active-text',

  // ── Scrollbar (component) ───────────────────────────────────────────
  '--ods-scrollbar-size',
  '--ods-scrollbar-thumb',
  '--ods-scrollbar-thumb-hover',

  // ── Selection controls (component) ──────────────────────────────────
  '--ods-selection-inner-size',
  '--ods-selection-mark-offset',
  '--ods-selection-mark-size',

  // ── Stepper (component) ─────────────────────────────────────────────
  '--ods-stepper-rail',
  '--ods-stepper-rail-active',

  // ── List (derived) ──────────────────────────────────────────────────
  '--ods-list-item-min-height',
  '--ods-list-item-min-height-value',

  // ── Expansion (derived) ─────────────────────────────────────────────
  '--ods-expansion-item-min-height',
  '--ods-expansion-item-min-height-value',

  // ── Table (derived) ─────────────────────────────────────────────────
  '--ods-table-header-height',
  '--ods-table-header-height-value',
  '--ods-table-row-height',
  '--ods-table-row-height-value',

  // ── Table (component) ───────────────────────────────────────────────
  '--ods-table-header-bg',
  '--ods-table-header-text',
  '--ods-table-row-hover-bg',
  '--ods-table-selected-bg',
  '--ods-table-sort-icon',

  // ── Timeline (component) ────────────────────────────────────────────
  '--ods-timeline-rail',

  // ── Chat (component) ────────────────────────────────────────────────
  '--ods-chat-bubble-bg',
  '--ods-chat-bubble-fg',

  // ── Toolbar (derived) ───────────────────────────────────────────────
  '--ods-toolbar-bg',
  '--ods-toolbar-dense-min-height',

  // ── Tile (component) ────────────────────────────────────────────────
  '--ods-tile-min-width',
  '--ods-tile-spark-height',

  // ── Field (derived) ─────────────────────────────────────────────────
  '--ods-field-label-bg',

  // ── Slider (derived) ────────────────────────────────────────────────
  '--ods-slider-label-bg',
  '--ods-slider-label-text',
  '--ods-slider-label-border',

  // ── Tab (derived) ───────────────────────────────────────────────────
  '--ods-tab-radius',
  '--ods-tab-min-height',
  '--ods-tab-hover-bg',
  '--ods-tab-active-bg',
  '--ods-tab-active-text',
  '--ods-tab-active-rail',

  // ── Toggle (derived) ────────────────────────────────────────────────
  '--ods-toggle-track-width',
  '--ods-toggle-track-height',
  '--ods-toggle-thumb-inset',

  // ── Semantic foreground ─────────────────────────────────────────────
  '--ods-fg-default',
  '--ods-fg-strong',
  '--ods-fg-muted',
  '--ods-fg-disabled',
  '--ods-fg-on-brand',
  '--ods-fg-brand',
  '--ods-fg-primary',
  '--ods-fg-secondary',
  '--ods-fg-accent',
  '--ods-fg-positive',
  '--ods-fg-negative',
  '--ods-fg-warning',
  '--ods-fg-info',

  // ── Semantic background ──────────────────────────────────────────────
  '--ods-bg-canvas',
  '--ods-bg-surface-1',
  '--ods-bg-surface-2',
  '--ods-bg-layer',
  '--ods-bg-flyout',
  '--ods-bg-overlay',
  '--ods-bg-card',
  '--ods-bg-card-hover',

  // ── Semantic stroke ─────────────────────────────────────────────────
  '--ods-stroke-default',
  '--ods-stroke-subtle',
  '--ods-stroke-strong',
  '--ods-stroke-focus',
  '--ods-stroke-error',
  '--ods-stroke-divider',

  // ── Semantic state layers ───────────────────────────────────────────
  '--ods-state-hover',
  '--ods-state-pressed',
  '--ods-state-selected',
  '--ods-state-disabled',
  '--ods-state-focus-indicator',

  // ── Semantic control fill ───────────────────────────────────────────
  '--ods-control-fill-default',
  '--ods-control-fill-hover',
  '--ods-control-fill-pressed',
  '--ods-control-fill-disabled',

  // ── Semantic segmented control ──────────────────────────────────────
  '--ods-segmented-track-bg',
  '--ods-segmented-thumb-bg',
  '--ods-bar-dark-bg',
  '--ods-bar-dark-fg',

  // ── Typography ramp ──────────────────────────────────────────────────
  '--ods-font-size-caption',
  '--ods-line-height-caption',
  '--ods-font-weight-caption',
  '--ods-font-size-body',
  '--ods-line-height-body',
  '--ods-font-weight-body',
  '--ods-font-size-body-strong',
  '--ods-line-height-body-strong',
  '--ods-font-weight-body-strong',
  '--ods-font-size-subtitle',
  '--ods-line-height-subtitle',
  '--ods-font-weight-subtitle',
  '--ods-font-size-title',
  '--ods-line-height-title',
  '--ods-font-weight-title',
  '--ods-font-size-title-large',
  '--ods-line-height-title-large',
  '--ods-font-weight-title-large',
  '--ods-font-size-display',
  '--ods-line-height-display',
  '--ods-font-weight-display',
  '--ods-font-size-h1',
  '--ods-line-height-h1',
  '--ods-font-weight-h1',
  '--ods-font-size-h2',
  '--ods-line-height-h2',
  '--ods-font-weight-h2',
  '--ods-font-size-h3',
  '--ods-line-height-h3',
  '--ods-font-weight-h3',
  '--ods-font-size-h4',
  '--ods-line-height-h4',
  '--ods-font-weight-h4',
  '--ods-font-size-h5',
  '--ods-line-height-h5',
  '--ods-font-weight-h5',
  '--ods-font-size-h6',
  '--ods-line-height-h6',
  '--ods-font-weight-h6',
  '--ods-font-size-subtitle1',
  '--ods-line-height-subtitle1',
  '--ods-font-weight-subtitle1',
  '--ods-font-size-subtitle2',
  '--ods-line-height-subtitle2',
  '--ods-font-weight-subtitle2',
  '--ods-font-size-body1',
  '--ods-line-height-body1',
  '--ods-font-weight-body1',
  '--ods-font-size-body2',
  '--ods-line-height-body2',
  '--ods-font-weight-body2',
  '--ods-font-size-overline',
  '--ods-line-height-overline',
  '--ods-font-weight-overline',
  '--ods-letter-spacing-display',
  '--ods-letter-spacing-h1',
  '--ods-letter-spacing-h2',
  '--ods-letter-spacing-h3',
  '--ods-letter-spacing-overline',

  // ── Elevation roles ─────────────────────────────────────────────────
  '--ods-elevation-card',
  '--ods-elevation-flyout',
  '--ods-elevation-dialog',
] as const

/** A public CSS custom-property name in the `--ods-*` contract. */
export type OdsToken = (typeof ODS_TOKENS)[number]

/** A partial override map keyed by public token name. */
export type OdsTokenMap = Partial<Record<OdsToken, string>>
