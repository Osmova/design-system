import { expect, test, type Locator, type Page } from '@playwright/test'
import { CANONICAL_VARIANTS, applyTheme, computed, customProperty, expectGalleryPage, resolvedColor, waitForThemePaint } from './helpers'

test.describe('QDS variant distinctiveness lab', () => {
  test('mounts five canonical comparison cards with deliberate visual systems', async ({ page }) => {
    await page.goto('/#variants')
    await applyTheme(page, 'light', 'win')

    await expectGalleryPage(page, 'Variants')
    for (const variant of CANONICAL_VARIANTS) {
      await expect(page.locator(`[data-test="qds-variant-card-${variant}"]`), `${variant} card`).toBeVisible()
      await expect(page.locator(`[data-test="qds-variant-roles-${variant}"]`), `${variant} role fixtures`).toBeVisible()
      await expect(page.locator(`[data-test="qds-variant-progress-${variant}"] .q-linear-progress`), `${variant} progress fixtures`).toHaveCount(2)
    }
    await expect(page.locator('[data-test="qds-variant-card-air"], [data-test="qds-variant-card-feather"]')).toHaveCount(0)

    const fluent = page.locator('[data-test="qds-variant-card-win"]')
    expect.soft(await computed(page, '[data-test="qds-variant-card-win"] .variant-card__nested', 'backdrop-filter'), 'Fluent content has no blur').toBe('none')
    expect.soft(await computed(page, '[data-test="qds-variant-card-win"] .variant-card__nested', 'box-shadow'), 'Fluent content has no resting small shadow').toBe('none')
    expect.soft(await computed(page, '[data-test="qds-variant-card-win"] .q-card', 'border-radius'), 'Fluent compact card radius').toBe(await customProperty(page, '--qds-card-radius'))
    expect.soft(await fluent.evaluate((el) => getComputedStyle(el).getPropertyValue('--qds-card-border-mix').trim()), 'Fluent uses low-border content').toBe('22%')

    const ink = page.locator('[data-test="qds-variant-card-ink"]')
    const inkTitleFont = await computed(page, '[data-test="qds-variant-card-ink"] .variant-card__title', 'font-family')
    expect.soft(inkTitleFont, 'Ink display titles are handwritten').toMatch(/Caveat/)
    expect.soft(await ink.evaluate((el) => getComputedStyle(el).getPropertyValue('--qds-surface-positive-soft').trim()), 'Ink role surfaces are the paper itself').toBe('#ebeae6')
    expect.soft(await ink.locator('.variant-role--positive').evaluate((el) => getComputedStyle(el).boxShadow), 'Ink role fixture is outlined in ink').not.toBe('none')
    expect.soft(await computed(page, '[data-test="qds-variant-card-ink"] .variant-card__nested', 'backdrop-filter'), 'Ink is flat, not blurred').toBe('none')
    expect.soft(await computed(page, '[data-test="qds-variant-card-ink"] .variant-card__nested', 'box-shadow'), 'Ink content is matte').toBe('none')

    const one = page.locator('[data-test="qds-variant-card-one"]')
    const fluentRow = await fluent.locator('.q-list .q-item').first().evaluate((el) => getComputedStyle(el).minHeight)
    const oneRow = await one.locator('.q-list .q-item').first().evaluate((el) => getComputedStyle(el).minHeight)
    expect.soft(parseFloat(oneRow), 'One list rows are touch-forward').toBeGreaterThanOrEqual(44)
    expect.soft(parseFloat(oneRow), 'One rows exceed Fluent density').toBeGreaterThan(parseFloat(fluentRow))
    expect.soft(await one.evaluate((el) => getComputedStyle(el).getPropertyValue('--qds-surface-focus-block').trim()), 'One focus-block token is available').toBe('#efefef')

    const term = page.locator('[data-test="qds-variant-card-term"]')
    expect.soft(await term.evaluate((el) => getComputedStyle(el).getPropertyValue('--qds-font-family').trim()), 'Term body font token is monospace').toContain('ui-monospace')
    expect.soft(await term.evaluate((el) => getComputedStyle(el).getPropertyValue('--qds-control-text-transform').trim()), 'Term controls request uppercase').toBe('uppercase')
    expect.soft(await computed(page, '[data-test="qds-variant-card-term"] .q-btn', 'text-transform'), 'Term button renders uppercase').toBe('uppercase')

    const glass = page.locator('[data-test="qds-variant-card-glass"]')
    expect.soft(await glass.evaluate((el) => getComputedStyle(el).getPropertyValue('--qds-font-family').trim()), 'Glass uses the native system stack').toContain('-apple-system')
    const glassRow = await glass.locator('.q-list .q-item').first().evaluate((el) => getComputedStyle(el).minHeight)
    expect.soft(parseFloat(glassRow), 'Glass grouped rows stay roomy').toBeGreaterThanOrEqual(44)
    expect.soft(await computed(page, '[data-test="qds-variant-card-glass"] .q-item.q-item--active', 'background-color'), 'Glass active row takes a neutral wash').toBe('rgba(120, 120, 128, 0.16)')
    expect.soft(await computed(page, '[data-test="qds-variant-card-glass"] .variant-card__nested', 'box-shadow'), 'Glass content nests without a second drop').toBe('none')
    expect.soft(await glass.evaluate((el) => getComputedStyle(el).getPropertyValue('--_qds-glass-knob').trim()), 'Glass keeps a light switch knob').toBe('#ffffff')

    expect.soft(await resolvedColor(page, '--qds-color-primary'), 'Win primary follows the Windows 11 accent').toBe('rgb(0, 95, 184)')
  })

  // Body-level grammar only shows once the whole page is glass.
  test('glass nests concentric shapes, keeps capsules and floats bars on glass', async ({ page }) => {
    await page.goto('/#variants')
    await applyTheme(page, 'dark', 'glass')

    expect.soft(await customProperty(page, '--_qds-glass-knob'), 'the knob stays light against a dark track').toBe('#ffffff')
    expect.soft(await computed(page, '[data-test="qds-variant-card-glass"]', 'border-radius'), 'blocks use the large radius').toBe('26px')
    expect.soft(await computed(page, '[data-test="qds-variant-card-glass"] .variant-card__nested', 'border-radius'), 'a nested block is its card radius minus the padding').toBe('10px')
    expect.soft(await computed(page, '[data-test="qds-variant-card-glass"] .q-btn:not(.q-btn--dense)', 'border-radius'), 'prominent buttons are capsules').toBe('9999px')
    expect.soft(await computed(page, '.q-header', 'background-color'), 'the bar carries no fill of its own').toBe('rgba(0, 0, 0, 0)')
    expect.soft(await computed(page, '.q-header', 'backdrop-filter', '::before'), 'the scroll edge blurs content under the bar').not.toBe('none')
    expect.soft(await computed(page, '.q-header', 'mask-image', '::before'), 'the scroll edge is a uniform bar, not a fade').toBe('none')
    expect.soft(await computed(page, '.q-header', 'box-shadow', '::before'), 'the scroll edge rules a hairline divider').toContain('inset')
  })

  // A bare-class fallback (0,1,0) never beats the dark scope (0,3,1).
  for (const mode of ['light', 'dark'] as const) {
    test(`glass ${mode} keeps labels legible over the painted gallery backdrop`, async ({ page, isMobile }) => {
      await page.goto('/#components?variant=glass')
      await applyTheme(page, mode, 'glass')
      const toolbar = page.locator('.gallery-header .q-toolbar')
      await expect(toolbar).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
      await expect(page.locator('.gallery-layout')).toHaveCSS('background-image', /glass-landscape/)
      await expectMaterialText(page, '.gallery-title span, .gallery-switcher__label')
      await page.locator('.gallery-switcher').click()
      const menu = page.getByRole('menu', { name: 'Variant', exact: true })
      await expect(menu).toHaveCSS('backdrop-filter', /blur\(24px\).*saturate/)
      await expect(menu).toHaveCSS('background-image', /radial-gradient/)
      await expectMaterialText(page, '.gallery-variant-menu .q-item__label')
      await page.keyboard.press('Escape')
      await expect(menu).toBeHidden()

      if (isMobile) await page.getByRole('button', { name: 'Pages', exact: true }).click()
      await expect(page.locator('.gallery-nav')).toBeInViewport()
      await expectMaterialText(page, '.gallery-nav__header, .gallery-nav .q-tab__label')
    })

    test(`glass drops translucency under forced colors in ${mode}`, async ({ page }) => {
      await page.goto('/#components?variant=glass')
      await applyTheme(page, mode, 'glass')
      await page.emulateMedia({ forcedColors: 'active' })

      expect.soft(await customProperty(page, '--qds-material-thin-filter'), 'the acrylic filter is dropped').toBe('none')
      expect.soft(await customProperty(page, '--qds-control-fill-default'), 'control fills become opaque').not.toContain('color-mix')
      expect.soft(await customProperty(page, '--_qds-glass-bar-line'), 'bars keep a permanent divider once glass is opaque').not.toBe('transparent')
    })

    test(`glass ${mode} paints every header and footer composition with reduced transparency`, async ({ page }) => {
      test.setTimeout(75_000)
      await page.goto('/#components?variant=glass')
      await applyTheme(page, mode, 'glass')
      await page.locator('.gallery-header .q-toolbar').evaluate(el => el.classList.remove('qds-glass-bar'))
      await page.evaluate(() => window.scrollTo(0, 0))
      await waitForThemePaint(page)
      expect(await computed(page, '.gallery-header', 'opacity', '::before')).toBe('0')

      const session = await page.context().newCDPSession(page)
      await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })
      const surface = await resolvedColor(page, '--qds-surface-0')
      const rows = {
        transparent: '<div class="q-toolbar bg-transparent"><div class="q-toolbar__title">Transparent toolbar</div></div>',
        transparentCapsule: '<div class="q-toolbar qds-glass-bar bg-transparent"><div class="q-toolbar__title">Transparent capsule</div></div>',
        plain: '<div class="q-toolbar"><div class="q-toolbar__title">Title</div></div>',
        capsule: '<div class="q-toolbar qds-glass-bar"><div class="q-toolbar__title">Title</div></div>',
        tintedToolbar: '<div class="q-toolbar bg-positive"><div class="q-toolbar__title">Tinted toolbar</div></div>',
        tintedCapsule: '<div class="q-toolbar qds-glass-bar bg-warning"><div class="q-toolbar__title">Tinted capsule</div></div>',
        tabs: '<div class="q-tabs q-tabs--horizontal">Tabs</div>',
        bar: '<div class="q-bar">Bar</div>',
        darkBar: '<div class="q-bar q-bar--dark bg-primary">Dark bar</div>',
        transparentBar: '<div class="q-bar bg-transparent">Transparent bar</div>',
        transparentTabs: '<div class="q-tabs q-tabs--horizontal bg-transparent">Transparent tabs</div>',
        wrapped: '<section><div class="q-toolbar">Wrapped title</div></section>',
      }
      const kinds = Object.keys(rows) as (keyof typeof rows)[]
      const compositions = kinds.flatMap(first => [[first], ...kinds.map(second => [first, second])])
      await page.evaluate(({ rows, compositions }) => {
        for (const [tag, tint] of [['header', ''], ['footer', ''], ['header', 'bg-primary'], ['footer', 'bg-positive'], ['header', 'bg-transparent'], ['footer', 'bg-transparent'], ['header', 'bg-dark'], ['footer', 'bg-dark']]) {
          for (const composition of compositions) {
            const bar = document.createElement(tag)
            bar.className = `q-${tag} ${tint}`.trim()
            bar.dataset.glassComposition = composition.join('+')
            bar.style.cssText = 'position:absolute; z-index:0'
            bar.innerHTML = composition.map(row => rows[row]).join('') + '<div class="q-layout__shadow"></div>'
            document.body.append(bar)
          }
        }
      }, { rows, compositions })
      for (const top of [0, 16, 64]) {
        await page.evaluate(top => window.scrollTo(0, top), top)
        await waitForThemePaint(page)
        expect(await page.evaluate(() => window.scrollY)).toBe(top)
        const results = await page.locator('[data-glass-composition]').evaluateAll(elements =>
          elements.map(el => {
            const style = getComputedStyle(el, '::before')
            return {
              name: el.tagName, composition: (el as HTMLElement).dataset.glassComposition!,
              tint: el.matches('.bg-primary, .bg-positive, .bg-dark'), opacity: style.opacity, fill: style.backgroundColor, filter: style.backdropFilter,
            }
          }),
        )
        expect(results).toHaveLength(compositions.length * 8)
        for (const { name, composition, tint, opacity, fill, filter } of results) {
          const covered = tint || !composition.split('+').some(row => ['plain', 'wrapped', 'transparent', 'transparentBar', 'transparentTabs'].includes(row))
          const label = `${name} ${composition} (${tint ? 'coloured' : 'neutral'}) at ${top}px`
          expect.soft(opacity, label).toBe(covered ? '0' : '1')
          expect.soft(fill, label).toBe(surface)
          expect.soft(filter, label).toBe('none')
        }
      }
      const singleRow = page.locator('[data-glass-composition]:not([data-glass-composition*="+"])')
      const paintedRows = [
        ...await glassPaints(singleRow.locator('> .q-toolbar.qds-glass-bar:not(.bg-warning)'), '::before'),
        ...await glassPaints(singleRow.locator('> :is(.q-toolbar.bg-positive, .q-toolbar.bg-warning, .q-tabs:not(.bg-transparent), .q-bar:not(.bg-transparent))')),
      ]
      expect(paintedRows).toHaveLength(56)
      for (const paint of paintedRows) {
        expect.soft(paint.fill, 'self-painted row is opaque').toMatch(/^rgb\(/)
        expect.soft(paint.filter).toBe('none')
        expect.soft(paint.textContrast).toBeGreaterThanOrEqual(4.5)
      }
      const plainRow = ':is(.q-toolbar:not(.qds-glass-bar, .bg-positive), .q-tabs.bg-transparent, .q-bar.bg-transparent)'
      for (const tinted of [false, true]) {
        const fill = '.bg-primary, .bg-positive, .bg-dark'
        const mixedBars = page.locator(`[data-glass-composition]:${tinted ? 'is' : 'not'}(${fill})`).filter({ has: page.locator(plainRow) })
        const paints = await glassPaints(mixedBars, tinted ? undefined : '::before', { selector: plainRow, within: '[data-glass-composition]', property: 'color' })
        expect(paints.length).toBeGreaterThan(0)
        for (const paint of paints) {
          expect.soft(paint.fill).toMatch(/^rgb\(/)
          expect(paint.adjacentContrasts.length).toBeGreaterThan(0)
          for (const contrast of paint.adjacentContrasts) expect.soft(contrast, 'plain toolbar text on bar paint').toBeGreaterThanOrEqual(4.5)
        }
      }
      await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<div class="q-toolbar" data-standalone-toolbar>Tools</div>'))
      const standalone = await glassPaint(page.locator('[data-standalone-toolbar]'))
      expect.soft(standalone.fill).toBe(surface)
      expect.soft(standalone.textContrast).toBeGreaterThanOrEqual(4.5)
      await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', `
        <section class="q-card--dark" data-local-toolbar>
          <div class="q-toolbar">Plain</div>
          <div class="q-toolbar qds-glass-bar">Capsule</div>
        </section>`))
      for (const row of await page.locator('[data-local-toolbar] .q-toolbar').all()) {
        const pseudo = await row.evaluate(el => el.classList.contains('qds-glass-bar') ? '::before' : undefined)
        const paint = await glassPaint(row, pseudo)
        expect.soft(paint.fill).toMatch(/^rgb\(/)
        expect.soft(paint.filter).toBe('none')
        expect.soft(paint.textContrast).toBeGreaterThanOrEqual(4.5)
      }
      await session.detach()
    })

    test(`glass resolves increased contrast to opaque glass and a deeper accent in ${mode}`, async ({ page }) => {
      await page.goto('/#components?variant=glass')
      await applyTheme(page, mode, 'glass')
      await page.emulateMedia({ contrast: 'more' })

      expect.soft(await customProperty(page, '--qds-material-regular-filter'), 'no blur behind controls').toBe('none')
      expect.soft(await resolvedColor(page, '--qds-color-primary'), 'the accent moves to its increased-contrast value').toBe(mode === 'light' ? 'rgb(0, 64, 221)' : 'rgb(140, 195, 255)')
      expect.soft(await resolvedColor(page, '--qds-control-stroke-default'), 'control edges take the muted text colour').toBe(await resolvedColor(page, '--qds-text-muted'))
      const checkbox = page.getByRole('checkbox', { name: 'Checkbox selected', exact: true })
      await checkbox.click()
      await page.mouse.move(0, 0)
      await waitForThemePaint(page)
      const indicator = await resolvedColor(page, '--qds-text-muted')
      await expect(checkbox.locator('.q-checkbox__bg')).toHaveCSS('border-top-color', indicator)
      await expect(page.locator('.q-slider__inner').first()).toHaveCSS('background-color', indicator)
      const toggle = page.getByRole('switch', { name: 'Enable tonal surfaces' })
      await toggle.click()
      await page.mouse.move(0, 0)
      await expect(toggle.locator('.q-toggle__track')).toHaveCSS('background-color', indicator)
      await waitForThemePaint(page)
      expect.soft(await computed(page, '.q-toggle__inner--falsy .q-toggle__thumb', 'background-color', '::after')).toBe(
        await resolvedColor(page, mode === 'dark' ? '--qds-surface-0' : '--_qds-glass-knob'),
      )
    })
  }

  // A dark block on a light glass page must re-point glass's own tokens, not keep the light root's.
  test('glass keeps nested blocks, switches and segments readable inside a dark card on a light page', async ({ page }) => {
    await page.goto('/#components?variant=glass')
    await applyTheme(page, 'light', 'glass')
    await expect(page.locator('[data-test="qds-toggle-color"]')).toBeVisible()

    const ratios = await page.evaluate(() => {
      const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
      const paint = (color: string, base = '#808080') => {
        context.fillStyle = base
        context.fillRect(0, 0, 1, 1)
        context.fillStyle = color
        context.fillRect(0, 0, 1, 1)
        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3)
      }
      const luminance = (rgb: number[]) => {
        const [r, g, b] = rgb.map((v) => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const ratio = (a: number[], b: number[]) => {
        const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
        return (high + 0.05) / (low + 0.05)
      }
      const card = document.createElement('div')
      card.className = 'q-card q-card--dark'
      card.innerHTML = '<div class="q-card__section q-card__section--vert"><div class="q-card" data-nested><div class="q-card__section q-card__section--vert">Nested block</div></div></div>'
      const toggle = document.querySelector('input[name="components-toggle"]')!.closest('.q-toggle')!.cloneNode(true) as HTMLElement
      const inner = toggle.querySelector('.q-toggle__inner')!
      inner.classList.remove('q-toggle__inner--truthy')
      inner.classList.add('q-toggle__inner--falsy')
      const segments = document.querySelector('[data-test="qds-toggle-color"]')!.cloneNode(true) as HTMLElement
      card.firstElementChild!.append(toggle, segments)
      document.querySelector('.q-page')!.prepend(card)

      const cardBg = paint(getComputedStyle(card).backgroundColor)
      const nested = card.querySelector<HTMLElement>('[data-nested]')!
      const nestedBg = paint(getComputedStyle(nested).backgroundColor, `rgb(${cardBg})`)
      const track = paint(getComputedStyle(toggle.querySelector('.q-toggle__track')!).backgroundColor, `rgb(${cardBg})`)
      const knob = paint(getComputedStyle(toggle.querySelector('.q-toggle__thumb')!, '::after').backgroundColor, `rgb(${track})`)
      const segmentTrack = paint(getComputedStyle(segments).backgroundColor, `rgb(${cardBg})`)
      const active = segments.querySelector<HTMLElement>('.q-btn[aria-pressed="true"]')!
      const idle = segments.querySelector<HTMLElement>('.q-btn:not([aria-pressed="true"]):not(.disabled)')!
      const thumb = paint(getComputedStyle(active).backgroundColor, `rgb(${segmentTrack})`)
      const result = {
        nestedText: ratio(paint(getComputedStyle(nested).color, `rgb(${nestedBg})`), nestedBg),
        nestedLift: ratio(nestedBg, cardBg),
        knobOnOffTrack: ratio(knob, track),
        offTrackOnCard: ratio(track, cardBg),
        segmentIdleText: ratio(paint(getComputedStyle(idle).color, `rgb(${segmentTrack})`), segmentTrack),
        segmentActiveText: ratio(paint(getComputedStyle(active).color, `rgb(${thumb})`), thumb),
      }
      card.remove()
      return result
    })

    expect.soft(ratios.nestedText, 'nested block text').toBeGreaterThanOrEqual(4.5)
    expect.soft(ratios.nestedLift, 'the nested block is a darker-on-dark step, not a light slab').toBeLessThan(2)
    expect.soft(ratios.knobOnOffTrack, 'switch knob against its off track').toBeGreaterThanOrEqual(3)
    expect.soft(ratios.offTrackOnCard, 'switch off track against the dark card').toBeGreaterThanOrEqual(3)
    expect.soft(ratios.segmentIdleText, 'idle segment label on the segmented track').toBeGreaterThanOrEqual(4.5)
    expect.soft(ratios.segmentActiveText, 'selected segment label on its thumb').toBeGreaterThanOrEqual(4.5)
  })

  for (const mode of ['light', 'dark'] as const) {
    test(`glass ${mode} control edges are soft at rest and legible in contrast modes`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: mode })
      await page.goto('/#forms?variant=glass')
      await applyTheme(page, mode, 'glass')
      const field = (name: string) => page.locator(`[data-test="qds-forms-variant-${name}-default"] .q-field__control`)
      const fields = ['outlined', 'filled', 'standout', 'borderless', 'ghost'] as const
      const [outlined, filled, standout, borderless, ghost] = await Promise.all(fields.map(name => glassPaint(field(name))))
      for (const [name, paint] of Object.entries({ outlined, filled, standout })) {
        expect.soft(paint.borderWidth, `${name} keeps its sizing slot`).toBe('1px')
        expect.soft(paint.edgeContrast, `${name} edge at rest`).toBeLessThan(3)
      }
      expect.soft(outlined.fill).toBe('rgba(0, 0, 0, 0)')
      expect.soft(outlined.border).toBe(mode === 'light' ? 'rgba(60, 60, 67, 0.12)' : 'rgba(235, 235, 245, 0.1)')
      expect.soft(filled.fill).not.toBe(outlined.fill)
      expect.soft(standout.fill).not.toBe(filled.fill)
      for (const paint of [borderless, ghost]) {
        expect.soft(paint.fill).toBe(outlined.fill)
        expect.soft(paint.borderWidth).toBe('0px')
      }

      for (const name of ['filled', 'standout']) {
        const control = field(name)
        await control.evaluate(el => {
          const input = el.querySelector('input')!
          for (const part of ['prefix', 'suffix']) {
            const text = document.createElement('div')
            text.className = `q-field__${part}`
            text.textContent = part
            input.insertAdjacentElement(part === 'prefix' ? 'beforebegin' : 'afterend', text)
          }
        })
        for (const surface of ['--qds-surface-0', '--qds-surface-1', '--qds-surface-2']) {
          await control.evaluate((el, surface) => el.closest<HTMLElement>('[data-test]')!.style.backgroundColor = `var(${surface})`, surface)
          const paint = await glassPaint(control)
          expect(Object.keys(paint.fieldText)).toEqual(['placeholder', 'prefix', 'suffix', 'label'])
          for (const [part, contrast] of Object.entries(paint.fieldText)) {
            expect.soft(contrast, `${name} ${part} over ${surface}`).toBeGreaterThanOrEqual(4.5)
          }
        }
      }

      const readonly = await glassPaint(page.locator('[data-test="qds-forms-state-readonly"] .q-field__control'))
      expect.soft(readonly.fill).toBe(await resolvedColor(page, '--qds-bg-surface-2'))
      expect.soft(readonly.borderStyle).toBe('dashed')
      const readonlyField = page.locator('[data-test="qds-forms-state-readonly"] .q-field--readonly')
      const fieldLabel = await resolvedColor(page, '--_qds-glass-field-label')
      for (const style of ['filled', 'standout']) {
        await readonlyField.evaluate((el, style) => {
          el.classList.remove('q-field--outlined', 'q-field--filled', 'q-field--standout')
          el.classList.add(`q-field--${style}`)
        }, style)
        const paint = await glassPaint(readonlyField.locator('.q-field__control'))
        expect.soft(paint.borderStyle, style).toBe('dashed')
        expect.soft(paint.border, style).toBe(fieldLabel)
        expect.soft(paint.edgeContrast, style).toBeGreaterThanOrEqual(3)
      }
      const pin = page.getByRole('textbox', { name: 'Digit 4' })
      await expect(pin).toHaveValue('')
      const pinControl = page.locator('[data-test="qds-forms-pin"] .q-field__control').filter({ has: pin })
      expect.soft((await glassPaint(pinControl)).edgeContrast, 'empty PIN boundary').toBeGreaterThanOrEqual(3)

      await field('standout').locator('input').focus()
      await waitForThemePaint(page)
      const focused = await glassPaint(field('standout'))
      expect.soft(focused.outlineWidth, 'the keyboard focus ring is visible').not.toBe('0px')
      expect.soft(focused.outlineContrast, 'the focus ring reads against the field and surrounding paint').toBeGreaterThanOrEqual(3)
      await field('standout').locator('input').blur()
      const error = page.locator('[data-test="qds-forms-state-error"] .q-field__control')
      const errorRing = await glassPaint(error, '::before')
      expect.soft(errorRing.outlineContrast, 'the unfocused error ring stays visible').toBeGreaterThanOrEqual(3)
      await error.locator('input').focus()
      await waitForThemePaint(page)
      const errorFocus = await glassPaint(error)
      expect.soft(errorFocus.outlineWidth).toBe('2px')
      expect.soft(parseFloat(errorFocus.outlineOffset)).toBeGreaterThanOrEqual(parseFloat(errorRing.outlineWidth))
      expect.soft(errorFocus.outlineContrast).toBeGreaterThanOrEqual(3)
      expect.soft((await glassPaint(error, '::before')).outline).toBe(errorRing.outline)
      await error.locator('input').blur()
      await expect.soft(error.locator('.q-field__append .q-icon')).toBeVisible()

      const outlines = [
        { contrast: 'more', forcedColors: 'none' },
        { contrast: 'no-preference', forcedColors: 'active' },
      ] as const
      for (const media of outlines) {
        await page.emulateMedia(media)
        await waitForThemePaint(page)
        for (const name of fields) {
          const paint = await glassPaint(field(name))
          expect.soft(paint.borderWidth, `${name} ${JSON.stringify(media)} edge width`).toBe('1px')
          expect.soft(paint.edgeContrast, `${name} ${JSON.stringify(media)} edge contrast`).toBeGreaterThanOrEqual(3)
        }
        for (const control of await page.locator('.qds-field-group :is(.q-field__control,.q-btn), .qds-option-group--card :is(.q-checkbox,.q-radio,.q-toggle):not(.disabled)').all()) {
          const paint = await glassPaint(control)
          expect.soft(paint.borderWidth, 'group member border').toBe('1px')
          expect.soft(paint.edgeContrast, 'group member boundary against its fill').toBeGreaterThanOrEqual(3)
        }
      }

      await page.emulateMedia({ contrast: 'no-preference', forcedColors: 'none' })
      await page.goto('/#components?variant=glass')
      await applyTheme(page, mode, 'glass')
      await page.locator('.qds-button-row .q-btn.disabled').first().evaluate(el => {
        const outline = el.cloneNode(true) as HTMLElement
        outline.classList.replace('q-btn--standard', 'q-btn--outline')
        outline.setAttribute('aria-label', 'Disabled outline')
        el.after(outline)
      })
      const button = (label: string) => page.locator('.qds-button-row').first().getByRole('button', { name: label, exact: true })
      const [standard, outline, disabled] = await Promise.all(['Default', 'Outline', 'Disabled'].map(label => glassPaint(button(label))))
      expect.soft(standard.fill).not.toBe(outline.fill)
      expect.soft(standard.edgeContrast, 'the neutral capsule has a transparent edge').toBe(1)
      expect.soft(standard.shadow).toBe('none')
      expect.soft(outline.fill).toBe('rgba(0, 0, 0, 0)')
      expect.soft(outline.borderWidth).toBe('1px')
      expect.soft(outline.border).toContain('/ 0.45')
      expect.soft(disabled.edgeContrast, 'the disabled capsule only has a fill').toBe(1)
      expect.soft(disabled.shadow).toBe('none')
      expect.soft((await glassPaint(button('Disabled outline'))).fill).toBe('rgba(0, 0, 0, 0)')
      expect.soft(await computed(page, '.q-toolbar.qds-card .q-btn--flat', 'backdrop-filter'), 'toolbars inside content stay plain').toBe('none')
      expect.soft(await computed(page, '.gallery-header .q-toolbar', 'backdrop-filter', '::before'), 'one glass capsule holds the toolbar').toContain('blur(12px)')
      expect.soft(await computed(page, '.gallery-header .gallery-switcher', 'backdrop-filter'), 'toolbar buttons share the capsule').toBe('none')
      expect.soft(await computed(page, '.gallery-header .gallery-switcher', 'border-radius'), 'the shell follows glass capsules').toBe('9999px')

      const session = await page.context().newCDPSession(page)
      await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })
      await waitForThemePaint(page)
      expect.soft(await customProperty(page, '--qds-material-regular-filter')).toBe('none')
      expect.soft((await glassPaint(button('Default'))).edgeContrast, 'reduced transparency keeps soft edges').toBe(1)
      await session.send('Emulation.setEmulatedMedia', { features: [] })
      await session.detach()
      for (const media of outlines) {
        await page.emulateMedia(media)
        await waitForThemePaint(page)
        for (const label of ['Default', 'Outline', 'Subtle', 'Disabled', 'Disabled outline']) {
          const paint = await glassPaint(button(label))
          expect.soft(paint.borderWidth, `${label} ${JSON.stringify(media)} edge width`).toBe('1px')
          expect.soft(paint.edgeContrast, `${label} ${JSON.stringify(media)} edge contrast`).toBeGreaterThanOrEqual(3)
        }
        const nested = await glassPaint(page.locator('.q-card .q-card:not(.q-card--bordered)').first())
        expect.soft(nested.borderWidth, 'nested card edge').toBe('1px')
        expect.soft(nested.edgeContrast, 'nested card edge contrast').toBeGreaterThanOrEqual(3)

        const tab = page.locator('[data-test="qds-tabs-horizontal"] .q-tab--active')
        const edge = await glassPaint(tab, '::after')
        await tab.focus()
        const focus = await glassPaint(tab)
        expect.soft(edge.borderWidth).toBe('1px')
        expect.soft(focus.outlineWidth).toBe('2px')
        expect.soft(-parseFloat(focus.outlineOffset) - parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(parseFloat(edge.borderWidth))
        expect.soft((await glassPaint(tab, '::after')).border).toBe(edge.border)
        await tab.blur()
      }
    })

    test(`glass ${mode} shows selected page cues across pagination designs`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: mode })
      await page.goto('/#components?variant=glass')
      await applyTheme(page, mode, 'glass')
      for (const media of glassMedia) {
        await page.emulateMedia(media)
        await waitForThemePaint(page)
        const highlight = media.forcedColors === 'active' ? await systemHighlight(page) : undefined
        for (const design of ['', '-outline', '-push', '-unelevated']) {
          const selected = page.locator(`[data-test="qds-pagination${design}"] [aria-current="page"]`)
          const label = `${design || 'default'} (${media.contrast}/${media.forcedColors})`
          const text = selected.locator('.q-btn__content')
          expect.soft((await glassPaint(text)).textContrast, `${label} selected label`).toBeGreaterThanOrEqual(4.5)
          await expect.soft(selected, label).toHaveCSS('font-weight', '600')
          const rest = await glassPaint(selected)
          if (design === '-outline') expect.soft(rest.borderWidth, `${label} outline`).toBe('1px')
          else expect.soft(rest.fillContrast, `${label} selected fill`).toBeGreaterThan(1)
          if (highlight && design === '-outline') {
            await expect.soft(selected, label).toHaveCSS('border-top-color', highlight.fill)
            await expect.soft(text, label).toHaveCSS('color', highlight.fill)
          } else if (highlight) {
            await expect.soft(selected, label).toHaveCSS('background-color', highlight.fill)
            await expect.soft(text, label).toHaveCSS('color', highlight.label)
          }
          if (media.contrast === 'more' || highlight) {
            const paint = await glassPaint(selected)
            expect.soft(paint.borderWidth, `${label} boundary width`).toBe('1px')
            expect.soft(paint.edgeContrast, `${label} boundary contrast`).toBeGreaterThanOrEqual(3)
          }
          await selected.focus()
          const paint = await glassPaint(selected)
          expect.soft(paint.outlineStyle, `${label} focus style`).toBe('solid')
          expect.soft(parseFloat(paint.outlineOffset) < 0 ? paint.outlineOnFill : paint.outlineOnSurface, `${label} focus`).toBeGreaterThanOrEqual(3)
          await selected.blur()
        }
      }
    })

    test(`glass ${mode} restores bordered picker edges in contrast modes`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: mode })
      await page.goto('/#catalog?variant=glass')
      await applyTheme(page, mode, 'glass')
      const color = page.locator('[data-test="qds-catalog-color-tune"]')
      await color.evaluate(el => el.classList.add('q-color-picker--bordered'))
      for (const media of glassMedia.slice(1)) {
        await page.emulateMedia(media)
        await waitForThemePaint(page)
        const controls = page.locator('[data-test="qds-catalog-date"], [data-test="qds-catalog-time"], .q-color-picker--bordered, .q-color-picker__tune-tab input')
        expect(await controls.count()).toBeGreaterThan(3)
        for (const control of await controls.all()) {
          const label = `${await control.getAttribute('class')} (${media.contrast}/${media.forcedColors})`
          const paint = await glassPaint(control)
          expect.soft(paint.borderStyle, label).toBe('solid')
          expect.soft(paint.borderWidth, label).toBe('1px')
          expect.soft(paint.edgeContrast, label).toBeGreaterThanOrEqual(3)
        }
      }
    })

    test(`glass ${mode} shows keyboard focus on selected and unselected QSelect options`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: mode })
      await page.goto('/#components?variant=glass')
      await applyTheme(page, mode, 'glass')
      const select = page.locator('[data-test="qds-control-select-multiple"]').getByRole('combobox')
      for (const media of [
        { contrast: 'no-preference', forcedColors: 'none' },
        { contrast: 'more', forcedColors: 'none' },
        { contrast: 'no-preference', forcedColors: 'active' },
      ] as const) {
        await page.emulateMedia(media)
        await select.press('ArrowDown')
        const list = page.getByRole('listbox')
        await expect(list).toBeVisible()
        const combobox = page.getByRole('combobox').filter({ visible: true }).and(page.locator('[aria-expanded="true"]'))
        for (const [key, selected] of [['Home', true], ['End', false]] as const) {
          await combobox.press(key)
          const option = list.locator('.q-manual-focusable--focused')
          await expect(option).toHaveAttribute('aria-selected', String(selected))
          await expect(combobox).toHaveAttribute('aria-activedescendant', (await option.getAttribute('id'))!)
          await expect(combobox).toBeFocused()
          await waitForThemePaint(page)
          const paint = await glassPaint(option)
          expect.soft(paint.outlineWidth).toBe('2px')
          expect.soft(paint.outlineOnFill, `${media.forcedColors}/${media.contrast}, selected=${selected}`).toBeGreaterThanOrEqual(3)
          await expect(list.locator('[role="option"]:not(.q-manual-focusable--focused)').first()).toHaveCSS('outline-width', '0px')
        }
        await combobox.press('Escape')
        await expect(list).toBeHidden()
      }
    })
  }

  for (const [delivery, entry] of [['default', '/conformance.html'], ['layered', '/conformance-layered.html']]) {
    for (const scheme of ['light', 'dark', 'local dark'] as const) {
      test(`glass ${scheme} selection indicators cover every role in ${delivery} CSS`, async ({ page }) => {
        const mode = scheme === 'dark' ? 'dark' : 'light'
        await page.emulateMedia({ colorScheme: mode })
        await page.goto(`${entry}?glass-selection`)
        await applyTheme(page, mode, 'glass')
        await page.locator('[data-selection-matrix]').evaluate((el: HTMLElement, localDark) => {
          el.classList.toggle('q-card--dark', localDark)
          el.style.background = localDark ? 'var(--qds-bg-card)' : 'var(--qds-surface-2)'
        }, scheme === 'local dark')
        for (const media of glassMedia) {
          await page.emulateMedia(media)
          await waitForThemePaint(page)
          const sliderFills = new Set<string>()
          const rangeFills = new Set<string>()
          const switchFills = new Set<string>()
          const mixedSwitchFills = new Set<string>()
          const checkboxFills = new Set<string>()
          const radioFills = new Set<string>()
          for (const role of ['primary', 'secondary', 'accent', 'positive', 'negative', 'warning', 'info']) {
            const fixture = page.locator(`[data-selection-role="${role}"]`)
            for (const axis of ['h', 'v']) {
              const slider = fixture.locator(`.q-slider--${axis}`)
              const thumb = { selector: '.q-slider__thumb', within: '.q-slider', pseudo: '::before' }
              const paint = await glassPaint(slider.locator('.q-slider__selection'), undefined, thumb)
              const fills = axis === 'h' ? sliderFills : rangeFills
              fills.add(paint.fill)
              const label = `${role} ${axis === 'h' ? 'slider' : 'range'} (${media.contrast}/${media.forcedColors})`
              expect.soft(paint.fillContrast, `${label} selection/surface`).toBeGreaterThanOrEqual(3)
              expect.soft(paint.adjacentContrasts, `${label} thumb count`).toHaveLength(axis === 'h' ? 1 : 2)
              for (const contrast of paint.adjacentContrasts) expect.soft(contrast, `${label} thumb/selection`).toBeGreaterThanOrEqual(3)
              const rail = await glassPaint(slider.locator('.q-slider__inner'))
              expect.soft(rail.fillContrast, `${label} rail/surface`).toBeGreaterThanOrEqual(3)
            }
            for (const state of ['truthy', 'indet', 'falsy']) {
              const toggle = fixture.locator(`.q-toggle__inner--${state}`)
              const track = await glassPaint(toggle.locator('.q-toggle__track'), undefined, { selector: '.q-toggle__thumb', pseudo: '::after' })
              if (state === 'truthy') switchFills.add(track.fill)
              if (state === 'indet') mixedSwitchFills.add(track.fill)
              const thumb = await glassPaint(toggle.locator('.q-toggle__thumb'), '::after', { selector: '.q-icon', within: '.q-toggle__thumb', property: 'color' })
              const label = `${role} switch ${state} (${media.contrast}/${media.forcedColors})`
              expect.soft(track.fillContrast, `${label} track/surface`).toBeGreaterThanOrEqual(3)
              expect.soft(track.adjacentContrasts[0], `${label} thumb/track`).toBeGreaterThanOrEqual(3)
              expect.soft(thumb.adjacentContrasts[0], `${label} icon/thumb`).toBeGreaterThanOrEqual(3)
            }
            for (const [kind, state, mark] of [
              ['checkbox', 'truthy', '.q-checkbox__truthy'],
              ['checkbox', 'indet', '.q-checkbox__indet'],
              ['radio', 'truthy', '.q-radio__check'],
            ]) {
              const box = `.q-${kind}__bg`
              const indicator = fixture.locator(`.q-${kind}__inner--${state} ${box}`)
              const paint = await glassPaint(indicator, undefined, { selector: mark, within: box, property: kind === 'checkbox' && state === 'truthy' ? 'stroke' : 'fill' })
              if (state === 'truthy') {
                const fills = kind === 'checkbox' ? checkboxFills : radioFills
                fills.add(paint.fill)
              }
              const label = `${role} ${kind} ${state} (${media.contrast}/${media.forcedColors})`
              expect.soft(paint.fillContrast, `${label} indicator/surface`).toBeGreaterThanOrEqual(3)
              expect.soft(paint.adjacentContrasts[0], `${label} mark/indicator`).toBeGreaterThanOrEqual(3)
            }
            for (const kind of ['checkbox', 'radio']) {
              const paint = await glassPaint(fixture.locator(`.q-${kind}__inner--falsy .q-${kind}__bg`))
              const label = `${role} unchecked ${kind} (${media.contrast}/${media.forcedColors})`
              expect.soft(paint.borderStyle, label).toBe('solid')
              expect.soft(paint.edgeContrast, `${label} indicator/surface`).toBeGreaterThanOrEqual(3)
            }
            const selected = fixture.locator('.q-btn-toggle [aria-pressed="true"]')
            const segmentLabel = `${role} segment (${media.contrast}/${media.forcedColors})`
            expect.soft((await glassPaint(selected)).fillContrast, `${segmentLabel} selected fill`).toBeGreaterThan(1)
            expect.soft((await glassPaint(selected.locator('.q-btn__content'))).textContrast, segmentLabel).toBeGreaterThanOrEqual(4.5)
            await expect.soft(selected, segmentLabel).toHaveCSS('font-weight', '600')
          }
          if (media.forcedColors === 'none') {
            for (const [control, fills] of Object.entries({ sliderFills, rangeFills, switchFills, mixedSwitchFills, checkboxFills, radioFills })) {
              expect.soft(fills.size, `${control} role colours`).toBe(7)
            }
          }
          const hovered = page.locator('[data-selection-role="primary"] .q-toggle').filter({ hasText: 'Off' })
          await hovered.hover()
          await waitForThemePaint(page)
          const paint = await glassPaint(hovered.locator('.q-toggle__track'), undefined, { selector: '.q-toggle__thumb', pseudo: '::after' })
          expect.soft(paint.fillContrast, 'hovered off track/surface').toBeGreaterThanOrEqual(3)
          expect.soft(paint.adjacentContrasts[0], 'hovered off thumb/track').toBeGreaterThanOrEqual(3)
          await page.mouse.move(0, 0)
        }
      })
    }

    for (const mode of ['light', 'dark'] as const) {
      test(`glass ${mode} uses the nearest role fill for control content and focus in ${delivery} CSS`, async ({ page }) => {
        test.setTimeout(90_000)
        await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
        await page.goto(`${entry}?glass-fill`)
        await applyTheme(page, mode, 'glass')
        await expect(page.locator('[data-fill-probe]')).toHaveCount(72)
        await page.addStyleTag({ content: '[data-fill-matrix] * { transition: none !important; }' })

        for (const contrast of ['no-preference', 'more'] as const) {
          await page.emulateMedia({ contrast })
          const labels = '[data-probe-label], [data-fill-probe] :is(.q-btn__content, .q-tab__content, .q-item__label, .q-chip__content, .q-checkbox__label, .q-radio__label, .q-toggle__label, .q-field__label, .q-field__native, .q-field__marginal, .q-field__messages, .q-field__prefix, .q-field__suffix, .q-tree__node-header-content, .q-circular-progress__text, .q-editor__content a, .q-stepper__title, .q-table td, .q-uploader__title, .q-timeline__title, .q-timeline__subtitle, .q-banner a[href]):not(.disabled *, [hidden], input[tabindex="-1"], .q-field__marginal:has(.q-icon))'
          const icons = '[data-fill-probe] :is(.q-item__section--side > .q-icon, .q-chip__icon--remove, .q-tab__icon, .q-field__marginal .q-icon, .q-tree__arrow, .q-tree__icon, .q-rating__icon, .q-knob):not(.disabled *)'
          const controls = '[data-fill-probe] :is(.q-btn, .q-tab, .q-item, .q-chip, .q-chip__icon--remove, .q-checkbox, .q-radio, .q-toggle, .q-field, [data-probe-label][tabindex], a[data-probe-label], .q-tree__node-header, .q-knob, .q-rating__icon-container, :is(.q-card, .q-markup-table)[tabindex="0"], .q-banner a[href]):not(.disabled, :disabled)'
          const links = await glassPaints(page.locator('[data-fill-probe] a[data-probe-label]'))
          const placeholders = await glassPaints(page.locator('[data-fill-probe] input[data-probe="error field"][placeholder]'), '::placeholder')
          const text = [...await glassPaints(page.locator(labels)), ...placeholders]
          const symbols = await glassPaints(page.locator(icons))
          const marks = await glassPaints(page.locator('[data-fill-probe] .q-tab--active .q-tab__content:has(> .q-tab__icon):not(:has(> .q-tab__label))'), '::after')
          const focus = await glassPaints(page.locator(controls), undefined, undefined, true)
          expect(marks).toHaveLength(16)
          await expect(page.locator('[data-fill-probe] :is(.q-card, .q-markup-table)[tabindex="0"]')).toHaveCount(16)
          const failures = <T extends typeof text[number]>(paints: T[], fails: (paint: T) => boolean) => [...new Map(paints.filter(fails).map(paint => [`${paint.probe?.split('/')[0]} ${paint.part} ${paint.fill} ${paint.outline}`, paint])).values()]
          expect.soft(failures(text, paint => paint.textContrast < 4.5), `${contrast} text`).toEqual([])
          expect(placeholders).toHaveLength(48)
          expect(links).toHaveLength(48)
          expect.soft(failures(links, paint => paint.decorationContrast < 3), `${contrast} underline`).toEqual([])
          expect.soft(failures(symbols, paint => paint.textContrast < 3), `${contrast} icons`).toEqual([])
          expect.soft(failures(marks, paint => paint.markWidth !== '2px' || paint.markContrast < 3), `${contrast} selected marks`).toEqual([])
          const rails = await glassPaints(page.locator('[data-fill-probe] .q-tree__node--selected'), '::after')
          expect(rails).toHaveLength(8)
          expect.soft(failures(rails, paint => paint.fillContrast < 3), `${contrast} tree selection rail`).toEqual([])
          expect.soft(failures(focus, paint => paint.outlineStyle !== 'solid'
            || parseFloat(paint.outlineWidth) < 2
            || (parseFloat(paint.outlineOffset) < 0 ? paint.outlineOnFill : paint.outlineOnSurface) < 3), `${contrast} focus`).toEqual([])
          expect.soft(failures(focus, paint => Object.values(paint.fieldText).some(value => value < 4.5)), `${contrast} focused field text`).toEqual([])
          const toggles = page.locator('[data-fill-probe] [data-probe="toggle false"]')
          const offThumbs = await glassPaints(toggles.locator('.q-toggle__track'), undefined, { selector: '.q-toggle__thumb', pseudo: '::after' })
          expect(offThumbs).toHaveLength(48)
          expect.soft(failures(offThumbs, paint => paint.adjacentContrasts[0] < 3), `${contrast} off switch thumb`).toEqual([])
          if (contrast === 'more') {
            const rowEdges = await glassPaints(page.locator('[data-fill-probe] :is(.q-tab, .q-item)'), '::after')
            const nativeEdges = await glassPaints(page.locator('[data-probe="link"], [data-probe="native tabindex"]'))
            expect.soft(failures(nativeEdges, paint => paint.outlineStyle !== 'solid' || paint.outlineOnFill < 3), 'native action edges').toEqual([])
            expect.soft(failures(rowEdges, paint => paint.borderWidth !== '1px' || paint.edgeContrast < 3), 'row and tab edges').toEqual([])
          }
        }
      })

      test(`glass ${mode} restores keyboard action edges on BottomSheet in ${delivery} CSS`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: mode, contrast: 'more', reducedMotion: 'reduce' })
        await page.goto(entry)
        await applyTheme(page, mode, 'glass')
        for (const kind of ['Grid', 'List']) {
          await page.getByRole('button', { name: `${kind} sheet` }).click()
          const sheet = page.locator(`.q-bottom-sheet--${kind.toLowerCase()}`)
          const actions = sheet.locator('.q-bottom-sheet__item')
          await expect(actions).toHaveCount(2)
          await expect(sheet).toBeVisible()
          const edges = await glassPaints(actions, '::after')
          expect.soft(edges.filter(paint => paint.borderWidth !== '1px' || paint.edgeContrast < 3)).toEqual([])
          await page.keyboard.press('Tab')
          const focus = await glassPaints(actions, undefined, undefined, true)
          expect.soft(focus.filter(paint => paint.outlineStyle !== 'solid' || paint.outlineOnFill < 3)).toEqual([])
          await page.keyboard.press('Escape')
          await expect(sheet).toBeHidden()
        }
      })

      test(`glass ${mode} selected destinations and their perimeters stay legible in ${delivery} CSS`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: mode })
        await page.goto(entry)
        await applyTheme(page, mode, 'glass')
        await page.locator('[data-conformance]').evaluate(el => {
          const card = el.querySelector('[data-scheme="light"]')!
          const tabs = card.querySelector('[data-native="tabs"]')!.outerHTML
          const list = card.querySelector('[data-native="list"]')!.outerHTML
          const segments = el.querySelector('[data-native="segments"]')!.outerHTML.replace('data-native="segments"', 'data-bar-segments')
          const bar = (classes: string, content: string) => `<div class="${classes}" style="position:relative;z-index:0">${content}</div>`
          const drawer = (classes: string, content: string) => bar(`q-drawer ${classes}`, bar('q-drawer__content', content))
          const cases = {
            horizontal: tabs,
            vertical: tabs.replace('q-tabs--horizontal', 'q-tabs--vertical'),
            header: bar('q-header', tabs),
            footer: bar('q-footer', tabs),
            capsule: bar('q-header', bar('q-toolbar qds-glass-bar', tabs + segments)),
            tintedCapsule: bar('q-header', bar('q-toolbar qds-glass-bar bg-warning', tabs + segments)),
            colored: bar('q-header bg-warning', bar('q-toolbar', tabs + segments)),
            bar: bar('q-bar bg-primary', tabs),
            darkBar: bar('q-bar q-bar--dark', tabs),
            drawer: drawer('q-drawer--bordered', list + tabs),
            overlay: drawer('q-drawer--on-top', list),
            mini: drawer('q-drawer--mini', tabs.replace('q-tabs--horizontal', 'q-tabs--vertical') + list),
            darkDrawer: drawer('q-drawer--dark', list),
            list,
            menu: bar('q-menu', list),
          }
          for (const [name, html] of Object.entries(cases)) {
            el.insertAdjacentHTML('beforeend', `<section data-glass-destination="${name}">${html}</section>`)
            const section = el.lastElementChild!
            section.querySelector('.q-tab--active')?.classList.add('text-warning')
            if (name === 'mini') {
              section.querySelector('.q-tab--active .q-tab__content')!.innerHTML = '<i class="q-tab__icon">●</i>'
              const item = section.querySelector('.q-item--active')!
              item.innerHTML = '<div class="q-item__section q-item__section--side q-item__section--avatar"><i class="q-icon">●</i></div>'
            }
          }
        })
        const areas = page.locator('[data-glass-destination]')
        await expect(areas).toHaveCount(15)
        for (const media of glassMedia) {
          await page.emulateMedia(media)
          await waitForThemePaint(page)
          const highlight = media.forcedColors === 'active' ? await systemHighlight(page) : undefined
          for (const area of await areas.all()) {
            const name = await area.getAttribute('data-glass-destination')
            const label = `${name} (${media.contrast}/${media.forcedColors})`
            const active = area.locator('.q-tab--active, .q-item--active')
            expect.soft(await active.count(), label).toBeGreaterThan(0)
            for (const item of await active.all()) {
              const text = item.locator('.q-tab__content, .q-item__section--main .q-item__label:first-child, .q-item__section--avatar > .q-icon').first()
              expect.soft((await glassPaint(text)).textContrast, `${label} selected label`).toBeGreaterThanOrEqual(4.5)
              expect.soft((await glassPaint(item)).fillContrast, `${label} selected fill`).toBeGreaterThan(1)
              if (highlight) {
                await expect.soft(item, label).toHaveCSS('background-color', highlight.fill)
                await expect.soft(text, label).toHaveCSS('color', highlight.label)
              }
              const type = await item.evaluate(el => el.classList.contains('q-tab') ? 'tab' : 'item')
              if (name === 'mini') {
                const mark = await glassPaint(type === 'tab' ? text : item, type === 'tab' ? '::after' : '::before')
                expect.soft(mark.markWidth, `${label} ${type} mark`).toBe('2px')
                expect.soft(mark.markContrast, `${label} ${type} mark contrast`).toBeGreaterThanOrEqual(3)
              } else {
                const weighted = type === 'tab' ? item.locator('.q-tab__label') : item
                await expect.soft(weighted, `${label} selection weight`).toHaveCSS('font-weight', '600')
              }
              await item.evaluate(el => (el as HTMLElement).tabIndex = 0)
              await item.focus()
              const focus = await glassPaint(item)
              expect.soft(focus.outlineStyle, `${label} focus style`).toBe('solid')
              expect.soft(focus.outlineWidth, `${label} focus width`).toBe('2px')
              expect.soft(focus.outlineOnFill, `${label} focus`).toBeGreaterThanOrEqual(3)
              await item.blur()
            }
            for (const segment of await area.locator('[data-bar-segments] [aria-pressed="true"]').all()) {
              expect.soft((await glassPaint(segment)).fillContrast, `${label} segment fill`).toBeGreaterThan(1)
              expect.soft((await glassPaint(segment.locator('.q-btn__content'))).textContrast, `${label} segment text`).toBeGreaterThanOrEqual(4.5)
              await expect.soft(segment, label).toHaveCSS('font-weight', '600')
            }
            if (media.contrast === 'more' || highlight) {
              for (const track of await area.locator('.q-drawer__content, .q-tabs--horizontal, .q-bar, [data-bar-segments]').all()) {
                const paint = await glassPaint(track)
                expect.soft(paint.outlineStyle, `${label} perimeter style`).toBe('solid')
                expect.soft(paint.outlineOnFill, `${label} inset perimeter`).toBeGreaterThanOrEqual(3)
              }
              for (const list of await area.locator('.q-list--bordered').all()) {
                const paint = await glassPaint(list)
                expect.soft(paint.borderWidth, `${label} list perimeter width`).toBe('1px')
                expect.soft(paint.edgeContrast, `${label} list edge`).toBeGreaterThanOrEqual(3)
              }
            }
          }
        }
      })

      test(`glass ${mode} selected-row text has painted contrast in ${delivery} CSS`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: mode })
        await page.goto(entry)
        await applyTheme(page, mode, 'glass')
        await page.locator('[data-conformance]').evaluate((el, mode) => {
          const rowClass = mode === 'dark' ? 'q-item q-item--dark' : 'q-item'
          for (const [kind, attributes] of [
            ['active', `class="${rowClass} q-item--active"`],
            ['option', `class="${rowClass}" role="option" aria-selected="true"`],
          ]) {
            el.insertAdjacentHTML('beforeend', [0, 1, 2].map(surface => `
              <div style="background-color: var(--qds-surface-${surface})">
                <div ${attributes} data-selected-row="${kind}-${surface}">
                  <div class="q-item__section q-item__section--main">
                    <div class="q-item__label q-item__label--overline">Workspace</div>
                    <div class="q-item__label">Selected workspace</div>
                    <div class="q-item__label q-item__label--caption">Recently updated</div>
                  </div>
                  <div class="q-item__section q-item__section--side">Active</div>
                </div>
              </div>`).join(''))
          }
        }, mode)
        const parts = ['.q-item__label--caption', '.q-item__label--overline', '.q-item__section--side']
        const rows = page.locator('[data-selected-row]')
        await expect(rows).toHaveCount(6)
        for (const forcedColors of ['none', 'active'] as const) {
          await page.emulateMedia({ forcedColors })
          await waitForThemePaint(page)
          const highlight = forcedColors === 'active' ? await systemHighlight(page) : undefined
          for (const row of await rows.all()) {
            const state = await row.getAttribute('data-selected-row')
            if (highlight) await expect(row).toHaveCSS('background-color', highlight.fill)
            for (const part of parts) {
              const descendant = row.locator(part)
              expect.soft((await glassPaint(descendant)).textContrast, `${state} ${part} (${forcedColors})`).toBeGreaterThanOrEqual(4.5)
              if (highlight) await expect.soft(descendant).toHaveCSS('color', highlight.label)
            }
          }
        }
      })

      test(`glass ${mode} keeps bar focus, group edges, caption and chip cues in ${delivery} CSS`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: mode })
        await page.goto(entry)
        await applyTheme(page, mode, 'glass')
        await page.locator('[data-conformance]').evaluate((el, mode) => {
          const dark = mode === 'dark' ? ' q-item--dark' : ''
          el.insertAdjacentHTML('beforeend', `
            <div class="q-header"><div class="q-toolbar row no-wrap items-center">
              <button class="q-btn q-btn-item q-btn--flat q-btn--rectangle" data-bar-item>Back</button>
              <div class="q-btn-group row no-wrap inline" data-bar-item><button class="q-btn q-btn-item q-btn--flat">A</button></div>
            </div></div>
            <div class="q-toolbar qds-glass-bar row wrap" data-focus-bar></div>
            ${[0, 1, 2].map(surface => `
              <div style="background-color: var(--qds-surface-${surface})">
                <div class="q-expansion-item q-item-type q-expansion-item--expanded q-expansion-item--standard"><div class="q-expansion-item__container">
                  <div class="q-item q-item-type row no-wrap q-item--clickable q-hoverable${dark}">
                    <div class="q-item__section column q-item__section--main"><div class="q-item__label">Details</div><div class="q-item__label q-item__label--caption" data-expanded-caption>Three items</div></div>
                  </div>
                </div></div>
                <div class="q-chip row inline no-wrap items-center q-chip--clickable cursor-pointer bg-primary" tabindex="0" data-tinted-chip><div class="q-chip__content row no-wrap items-center">Filter</div></div>
                <div class="q-chip row inline no-wrap items-center bg-positive" data-tinted-chip><div class="q-chip__content row no-wrap items-center">Done</div><i class="q-icon q-chip__icon q-chip__icon--remove" role="button" tabindex="0">×</i></div>
              </div>`).join('')}`)
          const buttons = [...el.querySelectorAll('[data-native="roles"] [data-role]')]
          const hosts = [
            ['header', 'q-header', 'q-toolbar'],
            ['footer', 'q-footer', 'q-toolbar'],
            ['colored', 'q-header bg-accent', 'q-toolbar'],
            ['bar', 'q-bar q-bar--dark', ''],
          ]
          for (const [name, parent, child] of hosts) {
            el.insertAdjacentHTML('beforeend', `<section class="${parent}" style="position:relative;z-index:0">${child ? `<div class="${child}"></div>` : ''}</section>`)
            const section = el.lastElementChild!
            const host = section.firstElementChild ?? section
            host.setAttribute('data-focus-bar', name)
            host.append(...buttons.map(button => button.cloneNode(true)))
          }
          const capsule = el.querySelector('[data-focus-bar=""]')!
          capsule.setAttribute('data-focus-bar', 'capsule')
          capsule.append(...buttons)
        }, mode)

        const barButtons = page.locator('[data-focus-bar] .q-btn')
        await expect(barButtons).toHaveCount(35)
        const groups = page.locator('[data-native="group"], [data-native="split"], [data-native="segments"]')
        await expect(groups).toHaveCount(3)
        for (const media of glassMedia) {
          await page.emulateMedia(media)
          await waitForThemePaint(page)
          for (const button of await barButtons.all()) {
            await button.focus()
            await expect(button).toBeFocused()
            const paint = await glassPaint(button)
            const label = await button.evaluate(el => `${el.closest<HTMLElement>('[data-focus-bar]')!.dataset.focusBar} ${(el as HTMLElement).dataset.role}`) + ` (${media.contrast}/${media.forcedColors})`
            expect.soft(paint.outlineStyle, `${label} focus style`).toBe('solid')
            expect.soft(paint.outlineWidth, `${label} focus width`).toBe('2px')
            expect.soft(paint.outlineOffset, `${label} focus offset`).toBe('-3px')
            expect.soft(paint.outlineOnFill, `${label} focus/fill`).toBeGreaterThanOrEqual(3)
          }
          for (const group of await groups.all()) {
            const label = `${await group.getAttribute('data-native')} (${media.contrast}/${media.forcedColors})`
            const paint = await glassPaint(group)
            if (media.contrast === 'more' || media.forcedColors === 'active') {
              expect.soft(paint.outlineStyle, `${label} perimeter style`).toBe('solid')
              expect.soft(paint.outlineWidth, `${label} perimeter width`).toBe('1px')
              expect.soft(paint.outlineContrast, `${label} perimeter contrast`).toBeGreaterThanOrEqual(3)
            } else {
              expect.soft(paint.outlineStyle, `${label} rest perimeter`).toBe('none')
            }
          }
        }
        await page.emulateMedia({ contrast: 'no-preference', forcedColors: 'none' })
        for (const caption of await page.locator('[data-expanded-caption]').all()) {
          expect.soft((await glassPaint(caption)).textContrast, 'expanded header caption').toBeGreaterThanOrEqual(4.5)
        }

        await page.emulateMedia({ contrast: 'more' })
        await waitForThemePaint(page)
        for (const chip of await page.locator('[data-tinted-chip]').all()) {
          expect.soft((await glassPaint(chip)).edgeContrast, `${await chip.textContent()} chip edge`).toBeGreaterThanOrEqual(3)
        }

        await page.emulateMedia({ contrast: 'no-preference', forcedColors: 'active' })
        await waitForThemePaint(page)
        const buttonText = await page.evaluate(() => {
          const sample = document.createElement('span')
          sample.style.cssText = 'forced-color-adjust: none; color: ButtonText'
          document.body.append(sample)
          const color = getComputedStyle(sample).color
          sample.remove()
          return color
        })
        for (const item of await page.locator('[data-bar-item]').all()) {
          await expect.soft(item).toHaveCSS('border-top-width', '1px')
          await expect.soft(item).toHaveCSS('border-top-style', 'solid')
          await expect.soft(item).toHaveCSS('border-top-color', buttonText)
        }
      })
    }
  }

  for (const mode of ['light', 'dark'] as const) {
    test(`glass ${mode} marks selected tabs and segments with system highlight under forced colors`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: mode })
      await page.goto('/#components?variant=glass')
      await applyTheme(page, mode, 'glass')
      const tab = '[data-test="qds-tabs-horizontal"] .q-tab--active'
      const segment = '[data-test="qds-toggle-color"] > .q-btn[aria-pressed="true"]'
      const idleSegment = '[data-test="qds-toggle-color"] > .q-btn[aria-pressed="false"]:not(.disabled)'
      const accent = await resolvedColor(page, '--_qds-glass-selection-label')
      for (const selector of [tab, segment]) {
        expect.soft(await computed(page, selector, 'color')).toBe(accent)
        expect.soft(await computed(page, selector, 'box-shadow')).not.toContain('inset')
      }
      expect.soft(await computed(page, segment, 'font-weight')).toBe('600')
      expect.soft(await computed(page, idleSegment, 'font-weight')).toBe('500')
      expect.soft(await computed(page, `${tab} .q-tab__label`, 'font-weight')).toBe('600')
      await page.locator(`${segment} .q-btn__content`).evaluate(el => {
        el.insertAdjacentHTML('afterbegin', '<i class="q-icon">●</i>')
      })
      await expect(page.locator(`${segment} .q-btn__content > .block`)).toBeVisible()
      expect.soft(await computed(page, `${segment} .q-btn__content`, 'content', '::after')).toBe('none')
      for (const selector of [segment, idleSegment]) {
        await page.locator(`${selector} .q-btn__content`).first().evaluate(el => {
          const icon = document.createElement('i')
          icon.className = 'q-icon'
          icon.textContent = '●'
          el.replaceChildren(icon)
        })
      }
      for (const media of glassMedia) {
        await page.emulateMedia(media)
        await waitForThemePaint(page)
        expect.soft(await computed(page, `${idleSegment} .q-btn__content`, 'content', '::after')).toBe('none')
        const mark = await glassPaint(page.locator(`${segment} .q-btn__content`), '::after')
        expect.soft(mark.markWidth).toBe('2px')
        expect.soft(mark.markContrast, `icon-only selection (${media.contrast}/${media.forcedColors})`).toBeGreaterThanOrEqual(3)
        const active = page.locator(segment)
        await active.focus()
        const focus = await glassPaint(active)
        expect.soft(focus.outlineStyle).toBe('solid')
        expect.soft(focus.outlineWidth).toBe('2px')
        if (media.forcedColors === 'active') expect.soft(focus.outlineOffset).toBe('-3px')
        const contrast = media.forcedColors === 'active' ? focus.outlineOnFill : focus.outlineOnSurface
        expect.soft(contrast, 'icon-only selection focus').toBeGreaterThanOrEqual(3)
        await active.blur()
      }

      const highlight = await systemHighlight(page)
      for (const selector of [tab, segment]) {
        await expect.soft(page.locator(selector)).toHaveCSS('background-color', highlight.fill)
        await expect.soft(page.locator(selector)).toHaveCSS('color', highlight.label)
      }
    })
  }

  // Both of these were silently dead once; this is their regression gate.
  test('glass switch keeps its capsule geometry and an on-state fill', async ({ page }) => {
    await page.goto('/#catalog?variant=glass')
    await applyTheme(page, 'light', 'glass')

    expect.soft(await customProperty(page, '--qds-toggle-track-width'), 'the capsule survives the generic size ramp').toBe('3.9375rem')
    const toggle = page.locator('[data-test="qds-catalog-toggle"]')
    await expect(toggle).toBeVisible()
    const track = toggle.locator('.q-toggle__track')
    const inner = toggle.locator('.q-toggle__inner')
    const startedOn = await inner.evaluate((el) => el.classList.contains('q-toggle__inner--truthy'))
    const before = await track.evaluate((el) => getComputedStyle(el).backgroundColor)
    await inner.click()
    await expect(inner).toHaveClass(startedOn ? /q-toggle__inner--falsy/ : /q-toggle__inner--truthy/)
    const after = await track.evaluate((el) => getComputedStyle(el).backgroundColor)
    const [on, off] = startedOn ? [before, after] : [after, before]
    expect.soft(on, 'the on track carries the role colour, not the off fill').not.toBe(off)
    expect.soft(on, 'the on track resolves to glass primary').toBe('rgb(8, 96, 204)')
  })
})

function systemHighlight(page: Page) {
  return page.evaluate(() => {
    const sample = document.createElement('span')
    sample.style.cssText = 'forced-color-adjust: none; background-color: Highlight; color: HighlightText'
    document.body.append(sample)
    const style = getComputedStyle(sample)
    const pair = { fill: style.backgroundColor, label: style.color }
    sample.remove()
    return pair
  })
}

async function expectMaterialText(page: Page, selector: string) {
  await waitForThemePaint(page)
  const labels = await page.locator(selector).evaluateAll(elements => elements.flatMap(element => {
    const range = document.createRange()
    range.selectNodeContents(element)
    const { left, top, right, bottom } = range.getBoundingClientRect()
    const rect = element.getBoundingClientRect()
    const x = Math.ceil(Math.max(0, left, rect.left))
    const y = Math.ceil(Math.max(0, top, rect.top))
    const width = Math.floor(Math.min(innerWidth, right, rect.right)) - x
    const height = Math.floor(Math.min(innerHeight, bottom, rect.bottom)) - y
    if (width < 1 || height < 1) return []
    let opacity = 1
    for (let parent: Element | null = element; parent; parent = parent.parentElement) opacity *= Number(getComputedStyle(parent).opacity)
    return [{ x, y, width, height, name: element.textContent?.trim(), color: getComputedStyle(element).color, opacity }]
  }))
  expect(labels.length).toBeGreaterThan(0)
  const hidden = await page.addStyleTag({ content: `${selector} { visibility: hidden !important; }` })
  const screenshot = await page.screenshot({ animations: 'disabled', scale: 'css' })
  await hidden.evaluate(element => element.remove())

  const results = await page.evaluate(async ({ labels, png }) => {
    const response = await fetch(`data:image/png;base64,${png}`)
    const image = await createImageBitmap(await response.blob())
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const context = canvas.getContext('2d', { willReadFrequently: true })!
    context.drawImage(image, 0, 0)
    const foreground = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
    const linear = (channel: number) => (channel /= 255) <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    const luminance = (r: number, g: number, b: number) => linear(r) * 0.2126 + linear(g) * 0.7152 + linear(b) * 0.0722
    return labels.map(({ x, y, width, height, name, color, opacity }) => {
      foreground.clearRect(0, 0, 1, 1)
      foreground.fillStyle = color
      foreground.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = foreground.getImageData(0, 0, 1, 1).data
      const alpha = opacity * a / 255
      const pixels = context.getImageData(x, y, width, height).data
      let minimum = Infinity
      for (let i = 0; i < pixels.length; i += 4) {
        const [br, bg, bb] = [pixels[i], pixels[i + 1], pixels[i + 2]]
        const back = luminance(br, bg, bb)
        const ink = luminance(r * alpha + br * (1 - alpha), g * alpha + bg * (1 - alpha), b * alpha + bb * (1 - alpha))
        minimum = Math.min(minimum, (Math.max(ink, back) + 0.05) / (Math.min(ink, back) + 0.05))
      }
      return { name, minimum }
    })
  }, { labels, png: screenshot.toString('base64') })
  await test.info().attach(`painted contrast: ${selector}`, { body: JSON.stringify(results), contentType: 'application/json' })
  for (const { name, minimum } of results) expect.soft(minimum, name).toBeGreaterThanOrEqual(4.5)
}

const glassMedia = [
  { contrast: 'no-preference', forcedColors: 'none' },
  { contrast: 'more', forcedColors: 'none' },
  { contrast: 'no-preference', forcedColors: 'active' },
] as const

type GlassAdjacentPaint = {
  selector: string
  within?: string
  pseudo?: string
  property?: 'color' | 'fill' | 'stroke'
}

async function glassPaint(locator: Locator, pseudo?: string, adjacent?: GlassAdjacentPaint) {
  await locator.waitFor({ state: 'attached' })
  const [paint] = await glassPaints(locator, pseudo, adjacent)
  return paint
}

function glassPaints(locator: Locator, pseudo?: string, adjacent?: GlassAdjacentPaint, focused = false) {
  return locator.evaluateAll(async (elements, { pseudo, adjacent, focused }) => {
    const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
    function measure(el: Element) {
      context.globalAlpha = 1
      context.fillStyle = 'Canvas'
      context.fillRect(0, 0, 1, 1)
      const paint = (color: string, opacity = 1) => {
        context.fillStyle = 'transparent'
        context.fillStyle = color
        context.globalAlpha = opacity
        context.fillRect(0, 0, 1, 1)
        const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data).map(value => {
          const channel = value / 255
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      const ancestors: Element[] = []
      for (let parent = el.parentElement; parent; parent = parent.parentElement) ancestors.unshift(parent)
      let surface = 0
      for (const ancestor of ancestors) surface = paint(getComputedStyle(ancestor).backgroundColor)
      const style = getComputedStyle(el, pseudo)
      if (pseudo) paint(getComputedStyle(el).backgroundColor)
      const fill = paint(style.backgroundColor)
      const fillPixel = context.getImageData(0, 0, 1, 1)
      const edge = paint(style.borderTopColor)
      context.putImageData(fillPixel, 0, 0)
      const outline = paint(style.outlineColor)
      context.putImageData(fillPixel, 0, 0)
      const marker = paint(style.borderBlockEndColor)
      context.putImageData(fillPixel, 0, 0)
      const decorationContrast = ratio(paint(style.textDecorationColor), fill)
      const neighbors = adjacent
        ? (adjacent.within ? el.closest(adjacent.within) : el.parentElement)?.querySelectorAll(adjacent.selector)
        : []
      const adjacentContrasts = Array.from(neighbors ?? [], neighbor => {
        context.putImageData(fillPixel, 0, 0)
        const neighborStyle = getComputedStyle(neighbor, adjacent?.pseudo)
        return ratio(paint(neighborStyle[adjacent?.property ?? 'backgroundColor']), fill)
      })
      const fieldText: Record<string, number> = {}
      for (const [part, selector] of [['placeholder', 'input[placeholder]'], ['prefix', '.q-field__prefix'], ['suffix', '.q-field__suffix'], ['label', '.q-field__label']]) {
        const node = el.querySelector(selector)
        if (node) {
          context.putImageData(fillPixel, 0, 0)
          const text = getComputedStyle(node, part === 'placeholder' ? '::placeholder' : null)
          fieldText[part] = ratio(paint(text.color, Number(text.opacity)), fill)
        }
      }
      context.putImageData(fillPixel, 0, 0)
      return {
        probe: el.closest('[data-fill-probe]')?.getAttribute('data-fill-probe'),
        part: `${el.closest('[data-probe]')?.getAttribute('data-probe') ?? el.closest('.q-field')?.querySelector('[data-probe]')?.getAttribute('data-probe') ?? el.closest('[data-probe-group]')?.getAttribute('data-probe-group') ?? ''} ${el.getAttribute('class')}`,
        fill: style.backgroundColor,
        shadow: style.boxShadow,
        border: style.borderTopColor,
        borderWidth: style.borderTopWidth,
        borderStyle: style.borderTopStyle,
        outline: style.outlineColor,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
        edgeContrast: ratio(edge, fill),
        fillContrast: ratio(fill, surface),
        adjacentContrasts,
        filter: style.backdropFilter,
        markWidth: style.display === 'none' || style.content === 'none' ? '0px' : style.borderBlockEndWidth,
        markContrast: ratio(marker, fill),
        decorationContrast,
        outlineOnFill: ratio(outline, fill),
        outlineOnSurface: ratio(outline, surface),
        outlineContrast: Math.min(ratio(outline, fill), ratio(outline, surface)),
        textContrast: ratio(paint(style.color, Number(style.opacity)), fill),
        fieldText,
      }
    }
    const results: ReturnType<typeof measure>[] = []
    for (const el of elements) {
      let painted = el
      if (focused) {
        const target = el.matches('.q-field') ? el.querySelector<HTMLElement>('input:not([tabindex="-1"]), [tabindex="0"]') : el as HTMLElement
        target?.focus({ preventScroll: true })
        await Promise.resolve()
        painted = el.querySelector(':scope > :is(.q-checkbox__inner, .q-radio__inner, .q-toggle__inner), .q-field__control') ?? el
      }
      results.push(measure(painted))
      if (focused) (document.activeElement as HTMLElement | null)?.blur()
    }
    return results
  }, { pseudo, adjacent, focused })
}
