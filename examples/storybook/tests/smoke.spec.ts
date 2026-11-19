import { readFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

interface IndexEntry { id: string, title: string, name: string, type: 'story' | 'docs' }

const index = JSON.parse(readFileSync(new URL('../storybook-static/index.json', import.meta.url), 'utf8')) as { entries: Record<string, IndexEntry> }
const stories = Object.values(index.entries).filter((entry) => entry.type === 'story')
const variants = (process.env.SMOKE_VARIANTS ?? 'win,ink').split(',')
const combos = variants.flatMap((variant) => ['light', 'dark'].map((scheme) => ({ variant, scheme })))

type Globals = Record<string, string>

// Known serious/critical findings per story, tolerated until fixed at their source; anything new fails.
const NATIVE_LIST = 'aria-required-children' // QList role=list around clickable items, expansion items, separators or virtual rows
const KNOWN: Record<string, string[]> = {
  'components-data-display--chip': ['nested-interactive'],
  'components-data-display--expansion-item': [NATIVE_LIST],
  'components-data-display--list': [NATIVE_LIST],
  'components-data-display--virtual-scroll': [NATIVE_LIST],
  'components-data-display--showcase': [NATIVE_LIST, 'color-contrast'],
  'components-data-display--scrolling-showcase': [NATIVE_LIST],
  'components-data-display--gallery': ['aria-progressbar-name', NATIVE_LIST, 'color-contrast'],
  'components-inputs--showcase': ['aria-input-field-name', 'color-contrast', 'label'],
  'components-inputs--gallery': ['aria-input-field-name', 'color-contrast', 'label'],
  'components-media--editor': ['aria-input-field-name'],
  'components-media--uploader': ['color-contrast', 'nested-interactive'],
  'components-media--showcase': ['aria-input-field-name', 'color-contrast'],
  'components-media--gallery': ['aria-input-field-name', 'aria-progressbar-name', 'color-contrast', 'frame-title', 'image-alt'],
  'components-navigation--showcase': ['scrollable-region-focusable'],
  'components-overlays--menu': [NATIVE_LIST],
  'components-overlays--showcase': ['color-contrast'],
  'components-pickers--color': ['color-contrast'],
  'components-pickers--date': ['color-contrast'],
  'components-pickers--time': ['color-contrast'],
  'components-plugins--bottom-sheet-plugin': ['aria-dialog-name', NATIVE_LIST],
  'components-plugins--dialog-plugin': ['aria-dialog-name'],
  'components-structure--showcase': ['scrollable-region-focusable'],
  'foundations--tokens': [NATIVE_LIST, 'color-contrast'],
  'foundations--typography': [NATIVE_LIST],
  'patterns--component-sheet': ['aria-input-field-name'],
  'patterns--native-conformance-sheet': ['aria-input-field-name', 'aria-progressbar-name', NATIVE_LIST, 'color-contrast', 'label', 'nested-interactive', 'scrollable-region-focusable'],
  'systems--variants': [NATIVE_LIST],
}

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`) })
  return errors
}

async function open(page: Page, id: string, globals: Globals) {
  const encoded = Object.entries(globals).map(([key, value]) => `${key}:${value}`).join(';')
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=${encoded}`)
  await page.waitForFunction((variant) => {
    const controller = (window as unknown as { __qdsCatalogController?: { state: { initialized: boolean, variant: string } } }).__qdsCatalogController
    const render = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }).__STORYBOOK_PREVIEW__?.currentRender
    return render?.phase === 'finished' && controller?.state.initialized && controller.state.variant === variant
  }, globals.variant)
  await expectPainted(page, globals)
}

async function setGlobals(page: Page, globals: Globals) {
  await page.evaluate((next) => {
    const channel = (window as unknown as { __STORYBOOK_ADDONS_CHANNEL__: { emit: (event: string, payload: unknown) => void } }).__STORYBOOK_ADDONS_CHANNEL__
    channel.emit('updateGlobals', { globals: next })
  }, globals)
  await expectPainted(page, globals)
}

async function expectPainted(page: Page, globals: Globals) {
  const body = page.locator('body')
  if (globals.variant) await expect(body).toHaveAttribute('data-qds-variant', globals.variant)
  if (globals.scheme) await expect(body).toHaveAttribute('data-qds-resolved', globals.scheme)
  if (globals.ink && globals.variant === 'ink') await expect(body).toHaveAttribute('data-qds-ink', globals.ink)
  if (globals.palette && globals.variant === 'shadcn') await expect(body).toHaveAttribute('data-qds-shadcn-base-color', globals.palette)
}

async function seriousViolations(page: Page, known: string[] = []): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations
    .filter((violation) => (violation.impact === 'serious' || violation.impact === 'critical') && !known.includes(violation.id))
    .map((violation) => `${violation.id} (${violation.impact}) ${violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(' | ')}`)
}

const paint = (page: Page, selector: string) => page.locator(selector).first().evaluate((element) => {
  const style = getComputedStyle(element)
  return ['background-color', 'color', 'border-radius', 'border-color', 'box-shadow', 'font-family'].map((name) => style.getPropertyValue(name)).join(' / ')
})

test.describe('every story', () => {
  for (const story of stories) {
    test(`${story.title} / ${story.name}`, async ({ page }) => {
      const errors = collectErrors(page)
      const findings: string[] = []
      for (const [step, combo] of combos.entries()) {
        if (step === 0) await open(page, story.id, combo)
        else await setGlobals(page, combo)
        findings.push(...(await seriousViolations(page, KNOWN[story.id])).map((finding) => `${combo.variant}/${combo.scheme}: ${finding}`))
      }
      expect(errors, 'console, page and network errors').toEqual([])
      expect(findings, 'serious or critical axe violations').toEqual([])
    })
  }
})

test.describe('runtime controller', () => {
  const portals = [
    { id: 'components-overlays--dialog', selector: '.q-dialog .q-card' },
    { id: 'components-overlays--menu', selector: '.q-menu' },
    { id: 'components-overlays--tooltip', selector: '.q-tooltip' },
    { id: 'components-plugins--notify-plugin', selector: '.q-notification' },
    { id: 'components-plugins--dialog-plugin', selector: '.q-dialog .q-card' },
    { id: 'components-plugins--bottom-sheet-plugin', selector: '.q-bottom-sheet' },
  ]

  for (const portal of portals) {
    test(`globals repaint the open portal of ${portal.id}`, async ({ page }) => {
      await open(page, portal.id, { variant: 'win', scheme: 'light' })
      const surface = page.locator(portal.selector).first()
      await expect(surface).toBeVisible()
      expect(await surface.evaluate((element) => element.closest('#storybook-root') === null), 'renders in a body portal').toBe(true)
      await surface.evaluate((element) => { (element as HTMLElement).dataset.smokeMark = 'kept' })
      const before = await paint(page, portal.selector)

      await setGlobals(page, { variant: 'ink', scheme: 'dark' })
      await expect(page.locator(`${portal.selector}[data-smoke-mark="kept"]`), 'same open surface, not remounted').toHaveCount(1)
      expect(await paint(page, portal.selector)).not.toBe(before)
    })
  }

  test('ink colour and shadcn palette globals repaint through the controller', async ({ page }) => {
    await open(page, 'components-actions--button', { variant: 'ink', scheme: 'light', ink: 'charcoal' })
    const charcoal = await paint(page, '.q-btn')
    await setGlobals(page, { variant: 'ink', scheme: 'light', ink: 'navy' })
    expect(await paint(page, '.q-btn')).not.toBe(charcoal)

    await setGlobals(page, { variant: 'shadcn', scheme: 'light', palette: 'neutral' })
    const neutral = await paint(page, 'body')
    await setGlobals(page, { variant: 'shadcn', scheme: 'light', palette: 'stone' })
    expect(await paint(page, 'body')).not.toBe(neutral)
  })

  test('one controller per document, destroyed when the story remounts', async ({ page }) => {
    await open(page, 'components-actions--button', { variant: 'zen', scheme: 'dark' })
    const origin = await page.evaluate(() => {
      const holder = window as unknown as Record<string, unknown>
      holder.__smokePrevious = holder.__qdsCatalogController
      const channel = holder.__STORYBOOK_ADDONS_CHANNEL__ as { emit: (event: string, payload: unknown) => void }
      channel.emit('forceRemount', { storyId: 'components-actions--button' })
      return performance.timeOrigin
    })
    await page.waitForFunction(() => {
      const holder = window as unknown as Record<string, { state: { initialized: boolean } } | undefined>
      return holder.__qdsCatalogController !== holder.__smokePrevious && holder.__qdsCatalogController?.state.initialized
    })
    const state = await page.evaluate(() => {
      const holder = window as unknown as Record<string, { state: { initialized: boolean, variant: string, resolvedMode: string } } | undefined>
      return { origin: performance.timeOrigin, previous: holder.__smokePrevious?.state.initialized, current: holder.__qdsCatalogController?.state }
    })
    expect(state.origin, 'same preview document').toBe(origin)
    expect(state.previous, 'previous controller destroyed').toBe(false)
    expect(state.current).toMatchObject({ initialized: true, variant: 'zen', resolvedMode: 'dark' })
    await expectPainted(page, { variant: 'zen', scheme: 'dark' })
  })
})
