import { expect, test, type Page } from '@playwright/test'
import { CANONICAL_VARIANTS, GALLERY_PAGES } from './helpers'

// Each side is the gallery itself, embedded and themed from its own frame hash.
const frame = (page: Page, key: 'a' | 'b') => page.frameLocator(`[data-test="qds-compare-frame-${key}"]`)
// The frames navigate with location.replace(), so the live address is mirrored on the element.
const frameSrc = (page: Page, key: 'a' | 'b') => page.getAttribute(`[data-test="qds-compare-frame-${key}"]`, 'data-qds-frame-url')
const openSide = (page: Page, key: 'a' | 'b', option: string) => async () => {
  await page.locator(`[data-test="qds-compare-variant-${key}"]`).click()
  await page.locator(`[data-test="qds-compare-variant-${key}-option-${option}"]`).click()
}
const pickOption = (page: Page, hook: string, option: string) => async () => {
  await page.locator(`[data-test="${hook}"]`).click()
  await page.locator(`[data-test="${hook}-option-${option}"]`).click()
}

async function setScheme(page: Page, key: 'a' | 'b', scheme: 'Light' | 'Dark') {
  await page.locator(`[data-test="qds-compare-scheme-${key}"]`).getByRole('button', { name: scheme, exact: true }).click()
}

test.describe('compare A/B', () => {
  test('unpicked sides follow the host variant, framed and without shell chrome', async ({ page }) => {
    await page.goto('/#compare?variant=zen')
    await expect(page.locator('[data-test="qds-compare-ab"]')).toBeVisible()

    // Loading a link must never rewrite the address bar.
    expect(new URL(page.url()).hash).toBe('#compare?variant=zen')
    expect(await frameSrc(page, 'a')).toContain('variant=zen')
    expect(await frameSrc(page, 'a')).toContain('embed=1')
    // Side B starts on a different system so the two frames are never a mirror.
    expect(await frameSrc(page, 'b')).toContain('variant=glass')

    for (const key of ['a', 'b'] as const) {
      const body = frame(page, key).locator('body')
      await expect(body).toHaveClass(new RegExp(`qds-variant-${key === 'a' ? 'zen' : 'glass'}`))
      // The embed flag hides the gallery header and page drawer inside the frame.
      await expect(frame(page, key).locator('.gallery-header')).toHaveCount(0)
      await expect(frame(page, key).locator('.gallery-nav')).toHaveCount(0)
      // Default page: Components on both sides.
      await expect(frame(page, key).locator('[data-test="qds-control-standard-button"]')).toBeVisible()
    }

    await expect(page.locator('[data-compare="button"]')).toHaveCount(0)
  })

  test('sides are themed independently and the result stays in the URL', async ({ page }) => {
    await page.goto('/#compare')
    await openSide(page, 'a', 'ink')()
    await expect(frame(page, 'a').locator('body')).toHaveClass(/qds-variant-ink/)
    await expect(frame(page, 'a').locator('body')).toHaveAttribute('data-qds-ink', 'charcoal')

    await setScheme(page, 'b', 'Dark')
    await expect(frame(page, 'b').locator('body')).toHaveClass(/qds-theme-dark/)
    await expect(frame(page, 'b').locator('body')).toHaveAttribute('data-qds-mode', 'dark')
    await expect(frame(page, 'a').locator('body')).toHaveClass(/qds-theme-light/)

    await pickOption(page, 'qds-compare-ink-a', 'navy')()
    await expect(frame(page, 'a').locator('body')).toHaveAttribute('data-qds-ink', 'navy')

    await openSide(page, 'b', 'shadcn')()
    await pickOption(page, 'qds-compare-palette-b', 'slate')()
    await expect(frame(page, 'b').locator('body')).toHaveClass(/qds-variant-shadcn/)
    await expect(frame(page, 'b').locator('body')).toHaveAttribute('data-qds-shadcn-base-color', 'slate')

    await expect(page).toHaveURL(/#compare\?a=ink&b=shadcn&page=components&am=light&bm=dark&ai=navy&bp=slate$/)

    // The same address reproduces the pair, per side, in a fresh document.
    await page.reload()
    await expect(frame(page, 'a').locator('body')).toHaveClass(/qds-variant-ink/)
    await expect(frame(page, 'a').locator('body')).toHaveAttribute('data-qds-ink', 'navy')
    await expect(frame(page, 'b').locator('body')).toHaveClass(/qds-variant-shadcn/)
    await expect(frame(page, 'b').locator('body')).toHaveAttribute('data-qds-shadcn-base-color', 'slate')
    await expect(frame(page, 'b').locator('body')).toHaveClass(/qds-theme-dark/)
    await expect(page.locator('[data-test="qds-compare-variant-a"]')).toHaveValue('Ink')
    await expect(page.locator('[data-test="qds-compare-variant-b"]')).toHaveValue('Shadcn')
  })

  test('one page selector drives both frames', async ({ page }) => {
    await page.goto('/#compare')
    await pickOption(page, 'qds-compare-page', 'forms')()
    expect((await frameSrc(page, 'a'))?.split('#')[1]).toMatch(/^forms\?/)
    expect((await frameSrc(page, 'b'))?.split('#')[1]).toMatch(/^forms\?/)
    for (const key of ['a', 'b'] as const) {
      await expect(frame(page, key).locator('[data-test="qds-forms-anatomy-field"]')).toBeVisible()
    }
    await expect(page).toHaveURL(/page=forms/)
    await expect(page.locator('[data-test="qds-compare-page"]')).toHaveValue('Forms')
    // Compare itself is never offered as a frame page: it would embed the compare page in itself.
    await page.locator('[data-test="qds-compare-page"]').click()
    await expect(page.locator('[data-test^="qds-compare-page-option-"]')).toHaveCount(GALLERY_PAGES.length - 1)
    await expect(page.locator('[data-test="qds-compare-page-option-compare"]')).toHaveCount(0)
  })

  test('per-side controls carry unique accessible names', async ({ page }) => {
    await page.goto('/#compare?a=ink&b=shadcn')
    for (const key of ['a', 'b'] as const) {
      const side = key.toUpperCase()
      await expect(page.getByRole('group', { name: `Side ${side}`, exact: true })).toHaveCount(1)
      await expect(page.getByLabel(`Side ${side} variant`)).toBeVisible()
      await expect(page.getByLabel(`Side ${side} scheme`)).toBeVisible()
      await expect(page.getByLabel(`Side ${side} ${key === 'a' ? 'ink colour' : 'base palette'}`)).toBeVisible()
    }
    // The page select's accessible name starts with its visible label (WCAG 2.5.3).
    await expect(page.getByLabel(/^Page \(/)).toBeVisible()
  })

  test('a shared address configures every side before any interaction', async ({ page }) => {
    await page.goto('/#compare?a=shadcn&ap=stone&b=ink&bi=black&page=forms&am=dark&bm=light&ref=fluent')
    expect(new URL(page.url()).hash).toBe('#compare?a=shadcn&ap=stone&b=ink&bi=black&page=forms&am=dark&bm=light&ref=fluent')

    await expect(frame(page, 'a').locator('body')).toHaveClass(/qds-variant-shadcn/)
    await expect(frame(page, 'a').locator('body')).toHaveClass(/qds-theme-dark/)
    await expect(frame(page, 'a').locator('body')).toHaveAttribute('data-qds-shadcn-base-color', 'stone')
    await expect(frame(page, 'b').locator('body')).toHaveClass(/qds-variant-ink/)
    await expect(frame(page, 'b').locator('body')).toHaveClass(/qds-theme-light/)
    await expect(frame(page, 'b').locator('body')).toHaveAttribute('data-qds-ink', 'black')
    await expect(frame(page, 'a').locator('[data-test="qds-forms-anatomy-field"]')).toBeVisible()
    await expect(page.locator('[data-test="qds-compare-variant-a"]')).toHaveValue('Shadcn')
    await expect(page.locator('[data-test="qds-compare-ink-b"]')).toHaveValue('Black')
    await expect(page.locator('[data-test="qds-compare-palette-b"]')).toHaveCount(0)
    await expect(page.locator('[data-test="qds-compare-palette-a"]')).toHaveValue('Stone')
    // The reference view is the only optional third source.
    await expect(page.locator('.compare--ready')).toBeVisible()
  })

  test('the Fluent 2 reference is off by default and opt-in', async ({ page }) => {
    await page.goto('/#compare')
    await expect(page.locator('.compare')).toHaveCount(0)
    await page.locator('[data-test="qds-compare-reference"]').click()
    await expect(page.locator('.compare--ready')).toBeVisible()
    await expect(page).toHaveURL(/ref=fluent$/)
    await page.locator('[data-test="qds-compare-reference"]').click()
    await expect(page.locator('.compare')).toHaveCount(0)
    expect(new URL(page.url()).hash).not.toContain('ref=fluent')
  })

  test('every variant is selectable on either side', async ({ page }) => {
    await page.goto('/#compare')
    for (const variant of CANONICAL_VARIANTS) {
      await openSide(page, 'a', variant)()
      await expect(frame(page, 'a').locator('body')).toHaveClass(new RegExp(`qds-variant-${variant}`))
      expect(await frameSrc(page, 'a')).toContain(`variant=${variant}`)
    }
  })

  test('an edited or restored address re-themes the live frames without stealing Back', async ({ page }) => {
    await page.goto('/#compare?a=win&b=glass&page=components')
    await expect(frame(page, 'a').locator('body')).toHaveClass(/qds-variant-win/)
    // Marker inside the frame document: a reload would erase it.
    await page.evaluate(() => {
      const frame = document.querySelector('[data-test="qds-compare-frame-a"]') as HTMLIFrameElement
      ;(frame.contentWindow as unknown as { marker: string }).marker = 'same-document'
    })

    await page.evaluate(() => { window.location.hash = '#compare?a=one&b=term&page=forms&am=dark&bm=light' })
    await expect(frame(page, 'a').locator('body')).toHaveClass(/qds-variant-one/)
    await expect(frame(page, 'a').locator('body')).toHaveClass(/qds-theme-dark/)
    await expect(frame(page, 'b').locator('body')).toHaveClass(/qds-variant-term/)
    await expect(frame(page, 'a').locator('[data-test="qds-forms-anatomy-field"]')).toBeVisible()
    expect(await page.evaluate(() => {
      const frame = document.querySelector('[data-test="qds-compare-frame-a"]') as HTMLIFrameElement
      return (frame.contentWindow as unknown as { marker?: string }).marker
    })).toBe('same-document')

    // The frames navigate by replacement, so Back still belongs to the gallery itself.
    await page.goBack()
    await expect(frame(page, 'a').locator('body')).toHaveClass(/qds-variant-win/)
    await expect(frame(page, 'b').locator('body')).toHaveClass(/qds-variant-glass/)
    await expect(page).toHaveURL(/#compare\?a=win&b=glass&page=components/)
  })

  test('frames stack on narrow screens and sit side by side on wide ones', async ({ page }) => {
    const width = page.viewportSize()!.width
    await page.goto('/#compare?a=term&b=zen&page=forms')
    const a = page.locator('[data-compare-side="a"]')
    const b = page.locator('[data-compare-side="b"]')
    await expect(frame(page, 'a').locator('[data-test="qds-forms-anatomy-field"]')).toBeVisible()
    const [boxA, boxB] = await Promise.all([a.boundingBox(), b.boundingBox()])
    expect(boxA && boxB).toBeTruthy()
    if (width < 900) {
      expect(boxB!.y).toBeGreaterThanOrEqual(boxA!.y + boxA!.height - 1)
    } else {
      expect(boxA!.x).toBeLessThan(boxB!.x)
      expect(Math.abs(boxA!.y - boxB!.y)).toBeLessThan(2)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  })
})
