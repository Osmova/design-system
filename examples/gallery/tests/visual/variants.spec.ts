import { expect, test, type Locator } from '@playwright/test'
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
    test(`glass drops translucency under forced colors in ${mode}`, async ({ page }) => {
      await page.goto('/#components?variant=glass')
      await applyTheme(page, mode, 'glass')
      await page.emulateMedia({ forcedColors: 'active' })

      expect.soft(await customProperty(page, '--qds-material-thin-filter'), 'the acrylic filter is dropped').toBe('none')
      expect.soft(await customProperty(page, '--qds-control-fill-default'), 'control fills become opaque').not.toContain('color-mix')
      expect.soft(await customProperty(page, '--_qds-glass-bar-line'), 'bars keep a permanent divider once glass is opaque').not.toBe('transparent')
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
          expect(Object.keys(paint.fieldText)).toEqual(['placeholder', 'prefix', 'suffix'])
          for (const [part, contrast] of Object.entries(paint.fieldText)) {
            expect.soft(contrast, `${name} ${part} over ${surface}`).toBeGreaterThanOrEqual(4.5)
          }
        }
      }

      const readonly = await glassPaint(page.locator('[data-test="qds-forms-state-readonly"] .q-field__control'))
      expect.soft(readonly.fill).toBe(await resolvedColor(page, '--qds-bg-surface-2'))
      expect.soft(readonly.borderStyle).toBe('dashed')
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
      expect.soft(await computed(page, '.gallery-header .gallery-switcher', 'backdrop-filter'), 'bar buttons float on glass').not.toBe('none')
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

  test('glass marks selected tabs and segments with system highlight under forced colors', async ({ page }) => {
    await page.goto('/#components?variant=glass')
    await applyTheme(page, 'light', 'glass')
    const tab = '[data-test="qds-tabs-horizontal"] .q-tab--active'
    const segment = '[data-test="qds-toggle-color"] > .q-btn[aria-pressed="true"]'
    const idleSegment = '[data-test="qds-toggle-color"] > .q-btn[aria-pressed="false"]:not(.disabled)'
    const accent = await resolvedColor(page, '--_qds-glass-selection-label')
    for (const selector of [tab, segment]) {
      expect.soft(await computed(page, selector, 'color')).toBe(accent)
      expect.soft(await computed(page, selector, 'font-weight')).toBe('600')
      expect.soft(await computed(page, selector, 'box-shadow')).not.toContain('inset')
    }
    expect.soft(await computed(page, idleSegment, 'font-weight')).toBe('500')
    expect.soft(await computed(page, `${tab} .q-tab__label`, 'font-weight')).toBe('600')
    for (const selector of [segment, idleSegment]) {
      await page.locator(`${selector} .q-btn__content`).first().evaluate(el => {
        const icon = document.createElement('i')
        icon.className = 'q-icon'
        icon.textContent = '●'
        el.replaceChildren(icon)
      })
    }
    expect.soft(await computed(page, `${idleSegment} .q-btn__content`, 'content', '::after')).toBe('none')
    expect.soft(await computed(page, `${segment} .q-btn__content`, 'border-block-end-width', '::after')).toBe('2px')

    await page.emulateMedia({ forcedColors: 'active' })
    await waitForThemePaint(page)
    const highlight = await page.evaluate(() => {
      const sample = document.createElement('span')
      sample.style.cssText = 'forced-color-adjust: none; background-color: Highlight; color: HighlightText'
      document.body.append(sample)
      const style = getComputedStyle(sample)
      const pair = { fill: style.backgroundColor, label: style.color }
      sample.remove()
      return pair
    })
    for (const selector of [tab, segment]) {
      await expect.soft(page.locator(selector)).toHaveCSS('background-color', highlight.fill)
      await expect.soft(page.locator(selector)).toHaveCSS('color', highlight.label)
    }
  })

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

function glassPaint(locator: Locator, pseudo?: string) {
  return locator.evaluate((el, pseudo) => {
    const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
    context.fillStyle = 'Canvas'
    context.fillRect(0, 0, 1, 1)
    const paint = (color: string, opacity = 1) => {
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
    const fill = paint(getComputedStyle(el).backgroundColor)
    const fillPixel = context.getImageData(0, 0, 1, 1)
    const edge = paint(style.borderTopColor)
    context.putImageData(fillPixel, 0, 0)
    const outline = paint(style.outlineColor)
    const fieldText: Record<string, number> = {}
    for (const [part, selector] of [['placeholder', 'input[placeholder]'], ['prefix', '.q-field__prefix'], ['suffix', '.q-field__suffix']]) {
      const node = el.querySelector(selector)
      if (node) {
        context.putImageData(fillPixel, 0, 0)
        const text = getComputedStyle(node, part === 'placeholder' ? '::placeholder' : null)
        fieldText[part] = ratio(paint(text.color, Number(text.opacity)), fill)
      }
    }
    return {
      fill: style.backgroundColor,
      shadow: style.boxShadow,
      border: style.borderTopColor,
      borderWidth: style.borderTopWidth,
      borderStyle: style.borderTopStyle,
      outline: style.outlineColor,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      edgeContrast: ratio(edge, fill),
      outlineOnFill: ratio(outline, fill),
      outlineContrast: Math.min(ratio(outline, fill), ratio(outline, surface)),
      fieldText,
    }
  }, pseudo)
}
