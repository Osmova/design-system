import {
  DESIGN_SYSTEM_VARIANTS,
  INK_COLORS,
  SHADCN_BASE_COLORS,
  type DesignSystemMode,
  type DesignSystemVariantName,
  type InkColor,
  type ShadcnBaseColor,
} from '@osmova/quasar-design-system'

const tabs = ['tokens', 'typography', 'compare', 'components', 'forms', 'apps', 'catalog', 'variants', 'scenes', 'plugins', 'window', 'icons', 'fonts'] as const
export type GalleryTab = typeof tabs[number]
export type GalleryScheme = 'light' | 'dark'
export type CompareKey = 'a' | 'b'

const MODES: DesignSystemMode[] = ['light', 'dark', 'system']
const CANONICAL_VARIANTS = Object.values(DESIGN_SYSTEM_VARIANTS)

export interface GalleryConfig {
  tab: GalleryTab
  variant?: DesignSystemVariantName
  mode?: DesignSystemMode
  ink?: InkColor
  palette?: ShadcnBaseColor
  embed: boolean
  params: URLSearchParams
}

// Enumerable metadata contains only canonical variants, not legacy aliases.
function canonicalVariant(value: string | null): DesignSystemVariantName | undefined {
  return CANONICAL_VARIANTS.find(item => item.name === (value === 'fluent' ? 'win' : value))?.name
}

function inkColor(value: string | null): InkColor | undefined {
  return INK_COLORS.find(color => color.name === value)?.name
}

function basePalette(value: string | null): ShadcnBaseColor | undefined {
  return SHADCN_BASE_COLORS.find(color => color.name === value)?.name
}

function scheme(value: string | null): GalleryScheme | undefined {
  return value === 'light' || value === 'dark' ? value : undefined
}

function page(value: string | null): GalleryTab | undefined {
  return tabs.includes(value as GalleryTab) ? value as GalleryTab : undefined
}

export function parseGalleryHash(hash: string): GalleryConfig {
  const fragment = hash.replace(/^#\/?/, '')
  const separator = fragment.indexOf('?')
  const params = new URLSearchParams(separator < 0 ? '' : fragment.slice(separator + 1))
  const tab = page(separator < 0 ? fragment : fragment.slice(0, separator))
  const embed = params.get('embed') !== null && params.get('embed') !== '0'
  return {
    // An embedded compare page would embed compare frames inside itself.
    tab: embed && tab === 'compare' ? 'components' : tab ?? 'tokens',
    variant: canonicalVariant(params.get('variant')),
    mode: MODES.find(mode => mode === params.get('mode')),
    ink: inkColor(params.get('ink')),
    palette: basePalette(params.get('palette')),
    embed,
    params,
  }
}

export function galleryHash(tab: GalleryTab, variant: DesignSystemVariantName, hash: string): string {
  const { params } = parseGalleryHash(hash)
  // Win keeps the legacy page-only shape. Unknown parameters remain author-owned.
  params.delete('variant')
  if (variant !== 'win') params.set('variant', variant)
  const query = params.toString()
  return tab === 'tokens' && !query ? '' : `#${tab}${query ? `?${query}` : ''}`
}

export interface CompareSide {
  variant: DesignSystemVariantName | null
  mode: GalleryScheme | null
  ink: InkColor | null
  palette: ShadcnBaseColor | null
}

// A field is null when the author has not picked it: the side then follows the host theme.
export interface CompareSelection {
  page: GalleryTab | null
  reference: boolean
  sides: Record<CompareKey, CompareSide>
}

export interface ResolvedCompareSide extends CompareSide {
  variant: DesignSystemVariantName
  mode: GalleryScheme
  ink: InkColor
  palette: ShadcnBaseColor
}

export interface ResolvedCompareSelection {
  page: GalleryTab
  reference: boolean
  sides: Record<CompareKey, ResolvedCompareSide>
}

const COMPARE_KEYS = ['page', 'a', 'b', 'am', 'bm', 'ai', 'bi', 'ap', 'bp', 'ref'] as const

// Every gallery page can be framed except compare itself.
export const COMPARE_PAGES: { tab: GalleryTab, label: string }[] = tabs
  .filter((tab): tab is Exclude<GalleryTab, 'compare'> => tab !== 'compare')
  .map(tab => ({ tab, label: tab[0]!.toUpperCase() + tab.slice(1) }))

export function parseCompareSelection(hash: string): CompareSelection {
  const { params } = parseGalleryHash(hash)
  const side = (key: CompareKey): CompareSide => ({
    variant: canonicalVariant(params.get(key)) ?? null,
    mode: scheme(params.get(`${key}m`)) ?? null,
    ink: inkColor(params.get(`${key}i`)) ?? null,
    palette: basePalette(params.get(`${key}p`)) ?? null,
  })
  const frame = page(params.get('page'))
  return {
    // `compare` frames the gallery, so it is never offered as a frame page.
    page: frame && frame !== 'compare' ? frame : null,
    reference: params.get('ref') === 'fluent',
    sides: { a: side('a'), b: side('b') },
  }
}

// Compare owns its own keys and leaves every other author parameter untouched.
export function compareHash(hash: string, selection: ResolvedCompareSelection): string {
  const { params } = parseGalleryHash(hash)
  for (const key of COMPARE_KEYS) params.delete(key)
  params.set('a', selection.sides.a.variant)
  params.set('b', selection.sides.b.variant)
  params.set('page', selection.page)
  params.set('am', selection.sides.a.mode)
  params.set('bm', selection.sides.b.mode)
  for (const key of ['a', 'b'] as const) {
    const side = selection.sides[key]
    if (side.variant === 'ink') params.set(`${key}i`, side.ink)
    if (side.variant === 'shadcn') params.set(`${key}p`, side.palette)
  }
  if (selection.reference) params.set('ref', 'fluent')
  return `#compare?${params.toString()}`
}

// Every frame is the same gallery, embedded and themed from its own hash.
export function compareFrameUrl(location: { pathname: string, search: string }, tab: GalleryTab, side: ResolvedCompareSide): string {
  const params = new URLSearchParams()
  params.set('variant', side.variant)
  params.set('mode', side.mode)
  if (side.variant === 'ink') params.set('ink', side.ink)
  if (side.variant === 'shadcn') params.set('palette', side.palette)
  params.set('embed', '1')
  return `${location.pathname}${location.search}#${tab}?${params.toString()}`
}
