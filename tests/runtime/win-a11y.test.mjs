import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { test } from 'node:test'
import Color from 'colorjs.io'
import { chromium, mount, settle, paint } from './fluent-native-fixture.mjs'

const mediaCases = {
  normal: { contrast: 'no-preference', forcedColors: 'none' },
  contrast: { contrast: 'more', forcedColors: 'none' },
  forced: { contrast: 'no-preference', forcedColors: 'active' },
}
const contrast = (a, b) => new Color(a).contrast(new Color(b), 'WCAG21')
const over = (color, background) => {
  const c = new Color(color).to('srgb'), b = new Color(background).to('srgb')
  return new Color('srgb', c.coords.map((v, i) => v * c.alpha + b.coords[i] * (1 - c.alpha)))
}
const surface = async (page, selector) => new Color('srgb', (await paint(page, selector)).fill)
const style = (page, selector, properties, pseudo = null) => page.locator(selector).evaluate((el, { properties, pseudo }) => {
  const s = getComputedStyle(el, pseudo)
  return Object.fromEntries(properties.map(name => [name, s[name]]))
}, { properties, pseudo })

async function systemColor(page, color) {
  return page.evaluate(color => {
    const el = document.createElement('span')
    el.style.cssText = `color:${color};forced-color-adjust:none`
    document.body.append(el)
    const value = getComputedStyle(el).color
    el.remove()
    return value
  }, color)
}

async function fixture(browser, layered, mode, width = 1280) {
  const css = readFileSync(new URL(`../../dist/css/${layered ? 'layered/' : ''}index.css`, import.meta.url), 'utf8')
  const page = await mount(browser, css, { layered, mode })
  await page.addStyleTag({ content: 'body { margin: 0; } #busy .q-linear-progress__model::before, #busy .q-linear-progress__model::after { animation: none !important; transform: translateX(30%) scaleX(.35); }' })
  await page.setViewportSize({ width, height: 900 })
  await page.emulateMedia({ colorScheme: mode })
  await page.evaluate(() => {
    fixture.dispose()
    document.querySelector('#app').remove()
    const { createApp, h, reactive } = Vue
    const { QLinearProgress, QSelect, QInput, QCheckbox, QCard, QItem } = Quasar
    const state = reactive({ selected: null, value: 'Clear this value', checked: true, mixed: null, unchecked: false })
    const root = document.createElement('main')
    root.id = 'accessibility'
    root.style.cssText = 'display:grid;gap:24px;max-width:600px;margin:24px auto;padding:12px'
    document.body.append(root)
    createApp({ render: () => [
      h('h1', { class: 'text-h5' }, 'Win interaction states'),
      h('section', {}, [h('p', {}, 'Progress: determinate / indeterminate'), ...[false, true].map(indeterminate => h(QLinearProgress, { id: indeterminate ? 'busy' : 'progress', value: 0.55, indeterminate, size: indeterminate ? '8px' : undefined, style: 'margin-block:12px' }))]),
      h(QSelect, { for: 'options', label: 'Keyboard options', outlined: true, modelValue: state.selected, options: ['First option', 'Second option', 'Third option'], 'onUpdate:modelValue': v => { state.selected = v }, behavior: 'menu' }),
      h(QInput, { for: 'clearable', label: 'Clearable field', outlined: true, clearable: true, modelValue: state.value, 'onUpdate:modelValue': v => { state.value = v } }),
      h('section', {}, ['checked', 'mixed', 'unchecked'].map(name => h(QCheckbox, { id: name, label: name, modelValue: state[name], 'onUpdate:modelValue': v => { state[name] = v } }))),
      h(QCard, { id: 'local-dark', dark: true, style: 'padding:12px' }, () => [
        h(QItem, { id: 'dark-command', clickable: true }, () => 'Local dark command'),
        h(QCard, { id: 'nested-dark', tabindex: 0, style: 'padding:12px' }, () => 'Nested interactive card'),
      ]),
      h(QCard, { id: 'outer-card', style: 'padding:12px' }, () => [
        h(QCard, { id: 'nested-card', tabindex: 0, style: 'padding:12px' }, () => 'Nested interactive card'),
        h('div', { id: 'nested-tile', class: 'qds-tile', role: 'button', tabindex: 0, style: 'padding:12px' }, 'Nested interactive tile'),
        h(QCard, { id: 'static-card' }, () => 'Non-interactive well'),
      ]),
    ] }).use(Quasar).mount(root)
    window.a11yState = state
  })
  await settle(page)
  await page.keyboard.press('Tab')
  return page
}

async function ring(page, selector) {
  const s = await style(page, selector, ['outlineWidth', 'outlineStyle', 'outlineColor'])
  assert.equal(s.outlineWidth, '2px', `${selector}: ${JSON.stringify(s)}`)
  assert.equal(s.outlineStyle, 'solid', selector)
  if (await page.evaluate(() => matchMedia('(forced-colors: active)').matches)) assert.equal(s.outlineColor, await systemColor(page, 'Highlight'))
  const bg = await surface(page, selector)
  assert.ok(contrast(over(s.outlineColor, bg), bg) >= 3, `${selector} ring ${s.outlineColor} / ${bg}`)
}

async function options(page) {
  await page.locator('#options').focus()
  await page.keyboard.press('ArrowDown')
  await page.locator('.q-menu [role="option"]').first().waitFor()
  await page.keyboard.press('ArrowDown')
  await settle(page)
  const active = await page.locator('#options').getAttribute('aria-activedescendant')
  assert.ok(active, 'native aria-activedescendant')
  return `[id="${active}"]`
}

async function cases(check) {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const layered of [false, true]) for (const mode of ['light', 'dark']) {
      const page = await fixture(browser, layered, mode)
      try { await check(page, `${layered ? 'layered' : 'default'}/${mode}`) }
      finally { await page.close() }
    }
  } finally { await browser.close() }
}

if (process.env.QDS_WIN_CAPTURES) {
  test('capture native Win accessibility states', async () => {
    const directory = process.env.QDS_WIN_CAPTURES
    mkdirSync(directory, { recursive: true })
    const browser = await chromium.launch({ headless: true })
    const measurements = []
    try {
      for (const mode of ['light', 'dark']) for (const width of [1280, 390]) {
        const page = await fixture(browser, false, mode, width)
        try {
          for (const [media, settings] of Object.entries(mediaCases)) {
            await page.emulateMedia(settings); await settle(page)
            for (const target of ['#dark-command', '.q-field__focusable-action', 'options']) {
              const selector = target === 'options' ? await options(page) : target
              if (target !== 'options') { await page.locator(selector).focus(); await settle(page) }
              const state = target === 'options' ? 'options' : target === '#dark-command' ? 'local-dark' : 'clear-action'
              measurements.push({ mode, width, media, state, ring: await style(page, selector, ['outlineColor', 'outlineWidth', 'outlineStyle']), progress: await style(page, '#progress .q-linear-progress__track', ['backgroundColor', 'borderTopColor']) })
              await page.screenshot({ path: `${directory}/${mode}-${width}-${media}-${state}.png`, fullPage: true, animations: 'disabled' })
              if (target === 'options') { await page.keyboard.press('Escape'); await page.locator('.q-menu').waitFor({ state: 'detached' }) }
            }
          }
        } finally { await page.close() }
      }
      writeFileSync(`${directory}/computed.json`, JSON.stringify(measurements, null, 2))
    } finally { await browser.close() }
  })
} else {
  test('Win progress preserves model/track contrast with increased contrast and forced colours in both deliveries', () => cases(async page => {
    for (const settings of Object.values(mediaCases)) {
      await page.emulateMedia(settings); await settle(page)
      for (const id of ['progress', 'busy']) {
        const track = await style(page, `#${id} .q-linear-progress__track`, ['backgroundColor', 'borderTopColor', 'borderTopWidth', 'height'])
        const model = await style(page, `#${id} .q-linear-progress__model`, ['backgroundColor'], id === 'busy' ? '::before' : null)
        const bg = await surface(page, `#${id}`)
        assert.ok(contrast(over(model.backgroundColor, bg), over(track.backgroundColor, bg)) >= 3, `${id} ${JSON.stringify(settings)}: ${JSON.stringify({ track, model })}`)
        if (settings.contrast === 'more' || settings.forcedColors === 'active') {
          const frame = await style(page, `#${id}`, ['borderTopWidth', 'borderTopColor'])
          assert.equal(frame.borderTopWidth, '1px')
          assert.ok(parseFloat(track.height) >= 2, 'track retains a visible Canvas interior at the native thin size')
          if (settings.forcedColors === 'active') {
            assert.equal(frame.borderTopColor, await systemColor(page, 'CanvasText'))
            assert.equal(model.backgroundColor, await systemColor(page, 'Highlight'))
          }
          assert.ok(contrast(frame.borderTopColor, over(track.backgroundColor, bg)) >= 3)
        }
      }
    }
  }))

  test('Win native QSelect keyboard options have a qualifying manual focus ring in both deliveries', () => cases(async page => {
    for (const settings of Object.values(mediaCases)) {
      await page.emulateMedia(settings)
      const selector = await options(page)
      assert.equal(await page.locator(selector).evaluate(el => el.matches(':focus-visible')), false)
      await ring(page, selector)
      await page.keyboard.press('Enter'); await settle(page)
      assert.equal(await page.evaluate(() => a11yState.selected), 'First option')
      await page.evaluate(() => { a11yState.selected = null })
    }
  }))

  test('Win native field clear action shows keyboard focus and clears its value in both deliveries', () => cases(async page => {
    for (const settings of Object.values(mediaCases)) {
      await page.emulateMedia(settings)
      await page.locator('#clearable').focus(); await page.keyboard.press('Tab'); await settle(page)
      const action = '.q-field__focusable-action'
      assert.equal(await page.locator(action).evaluate(el => el === document.activeElement && el.matches(':focus-visible')), true)
      await ring(page, action)
      await page.keyboard.press('Enter'); await settle(page)
      assert.equal(await page.evaluate(() => a11yState.value), null)
      await page.evaluate(() => { a11yState.value = 'Clear this value' }); await settle(page)
    }
  }))

  test('Win forced-colour checked and indeterminate graphics retain paired state colours in both deliveries', () => cases(async page => {
    await page.emulateMedia(mediaCases.forced); await settle(page)
    for (const id of ['checked', 'mixed']) {
      const bg = await style(page, `#${id} .q-checkbox__bg`, ['backgroundColor', 'borderTopColor', 'forcedColorAdjust'])
      const mark = await style(page, `#${id} .q-checkbox__svg`, ['color', 'forcedColorAdjust'])
      assert.equal(bg.forcedColorAdjust, 'none')
      assert.ok(['none', 'preserve-parent-color'].includes(mark.forcedColorAdjust), JSON.stringify(mark))
      assert.equal(bg.backgroundColor, bg.borderTopColor)
      assert.equal(bg.backgroundColor, await systemColor(page, 'Highlight'))
      assert.equal(mark.color, await systemColor(page, 'HighlightText'))
      assert.ok(contrast(mark.color, bg.backgroundColor) >= 3, JSON.stringify({ bg, mark }))
      assert.notEqual(bg.backgroundColor, (await style(page, '#unchecked .q-checkbox__bg', ['backgroundColor'])).backgroundColor)
      assert.equal(await page.locator(`#${id}`).getAttribute('aria-checked'), id === 'mixed' ? 'mixed' : 'true')
    }
    assert.equal((await style(page, '#checked', ['forcedColorAdjust'])).forcedColorAdjust, 'auto')
    await page.locator('#checked').focus(); await page.keyboard.press('Space')
    assert.equal(await page.locator('#checked').getAttribute('aria-checked'), 'false')
  }))

  test('Win local-dark native descendants retain contrasting keyboard focus in both deliveries', () => cases(async page => {
    for (const settings of Object.values(mediaCases)) {
      await page.emulateMedia(settings)
      await page.locator('#dark-command').focus(); await settle(page)
      assert.equal(await page.locator('#dark-command').evaluate(el => el.matches(':focus-visible')), true)
      await ring(page, '#dark-command')
    }
  }))

  test('Win contrast modes restore nested interactive card and tile borders including local dark in both deliveries', () => cases(async page => {
    for (const settings of [mediaCases.contrast, mediaCases.forced]) {
      await page.emulateMedia(settings); await settle(page)
      for (const id of ['nested-card', 'nested-tile', 'local-dark', 'nested-dark']) {
        const s = await style(page, `#${id}`, ['borderTopWidth', 'borderTopStyle', 'borderTopColor'])
        assert.equal(s.borderTopWidth, '1px', id)
        assert.equal(s.borderTopStyle, 'solid', id)
        const bg = await surface(page, `#${id}`)
        assert.ok(contrast(over(s.borderTopColor, bg), bg) >= 3, `${id}: ${JSON.stringify(s)} / ${bg}`)
      }
      assert.equal((await style(page, '#static-card', ['borderTopWidth'])).borderTopWidth, '0px')
    }
  }))
}
