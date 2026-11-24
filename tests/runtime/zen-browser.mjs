// Computed-paint proof for the Zen pilot: real Quasar controls, the real
// compiled QDS bundle, and measured contrast. Nothing here is judged by eye and
// nothing here claims anything about physical e-paper hardware.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { compile } from 'sass'
import { contrast } from './shadcn-fixtures.mjs'

const root = new URL('../../', import.meta.url)
const require = createRequire(import.meta.url)
const galleryRequire = createRequire(new URL('examples/gallery/package.json', root))
let chromium
try { ({ chromium } = galleryRequire('@playwright/test')) }
catch (cause) {
  throw new Error('The Zen browser proof requires the full pnpm workspace install (including examples/gallery). Run pnpm install --frozen-lockfile, then pnpm -C examples/gallery exec playwright install chromium.', { cause })
}

const assets = {
  vue: readFileSync(require.resolve('vue/dist/vue.global.prod.js'), 'utf8'),
  quasar: readFileSync(require.resolve('quasar/dist/quasar.umd.prod.js'), 'utf8'),
  quasarCss: readFileSync(require.resolve('quasar/dist/quasar.prod.css'), 'utf8'),
  // Sass emits a BOM and @charset, which are valid in a served stylesheet but
  // invalidate the first at-rule when the same bytes are injected into <style>;
  // without stripping them the whole :root token block is silently dropped.
  qds: compile(new URL('src/css/index.scss', root).pathname, {
    style: 'compressed', loadPaths: [new URL('node_modules/', root).pathname], silenceDeprecations: ['if-function'],
  }).css.replace(/^\uFEFF/, '').replace(/^@charset "[^"]*";/, ''),
}

const fixture = `body { margin: 24px; } #app { width: 560px; display: grid; gap: 24px; }
  *, *::before, *::after { transition: none !important; animation: none !important; }`
const roles = ['primary', 'secondary', 'accent', 'positive', 'negative', 'warning', 'info']
const actionRole = (index) => roles[(index + 1) % roles.length]

// Chrome serializes a resolved color-mix() as `color(srgb r g b / a)` with 0..1
// components, and everything else as rgb()/rgba() bytes. Both must land on the
// same 0..255 scale before any contrast number means anything.
const rgb = (value) => {
  const numbers = value.match(/[\d.]+/g)?.map(Number)
  assert.ok(numbers && numbers.length >= 3, `expected a resolved paint, got ${value}`)
  const scale = value.startsWith('color(') ? 255 : 1
  return [numbers[0] * scale, numbers[1] * scale, numbers[2] * scale, numbers[3] ?? 1]
}
const opaque = (value, context) => {
  const paint = rgb(value)
  assert.equal(paint[3], 1, `${context} must paint an opaque fill, got ${value}`)
  return paint
}

async function mount(browser, bodyClass) {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, reducedMotion: 'reduce' })
  await page.setContent(`<style>${assets.quasarCss}</style><style>${assets.qds}</style><style>${fixture}</style>`
    + `<body class="${bodyClass}"><div id="app"></div></body>`)
  await page.addScriptTag({ content: assets.vue })
  await page.addScriptTag({ content: assets.quasar })
  await page.evaluate(({ roles, barActions }) => {
    const { createApp, h, reactive, nextTick } = Vue
    const { QBtn, QBtnGroup, QBtnToggle, QInput, QTabs, QTab, QToolbar, QMenu, QList, QItem, QItemSection, QSeparator, QToggle, QCheckbox, QSlider } = Quasar
    const state = reactive({ value: 'Zen', tab: 'a', menu: false, error: false })
    const tabs = (props) => h(QTabs, { ...props, modelValue: state.tab, 'onUpdate:modelValue': (v) => { state.tab = v } },
      () => ['a', 'b', 'c'].map((name) => h(QTab, { name, label: `Tab ${name}`, disable: name === 'c' })))
    const app = createApp({ setup: () => () => [
      h('div', { style: 'display:flex;gap:16px;flex-wrap:wrap' }, [
        h(QBtn, { id: 'button', label: 'Action' }),
        h(QBtn, { id: 'disabled', label: 'Disabled', disable: true }),
        ...roles.map((role) => h(QBtn, { id: `fill-${role}`, class: 'role-fill', label: role, color: role })),
      ]),
      h(QInput, { id: 'field', modelValue: state.value, 'onUpdate:modelValue': (v) => { state.value = v },
        label: 'Reading label', outlined: true, hint: 'Zen help', error: state.error, errorMessage: 'Zen error' }),
      tabs({ id: 'tabs' }),
      h(QBtnToggle, { id: 'segments', modelValue: 'a', options: [
        { label: 'Segment A', value: 'a' }, { label: 'Segment B', value: 'b' },
      ] }),
      h(QBtn, { id: 'anchor', label: 'Menu', onClick: () => { state.menu = true } }, () => h(QMenu, {
        id: 'menu', noParentEvent: true, modelValue: state.menu, 'onUpdate:modelValue': (v) => { state.menu = v }, transitionDuration: 0,
      }, () => h(QList, {}, () => [
        h(QItem, { id: 'item', clickable: true, active: true }, () => h(QItemSection, {}, () => 'Zen item')),
        h(QSeparator, { id: 'separator' }),
      ]))),
      h('div', { style: 'display:flex;gap:16px;align-items:center;padding-top:32px' }, [
        h(QToggle, { id: 'toggle-on', modelValue: true, label: 'On' }),
        h(QToggle, { id: 'toggle-off', modelValue: false, label: 'Off' }),
        h(QCheckbox, { id: 'check-off', modelValue: false, label: 'Unchecked' }),
        h(QCheckbox, { id: 'check-on', modelValue: true, label: 'Checked' }),
        h(QSlider, { id: 'slider', modelValue: 40, labelAlways: true, style: 'width:160px' }),
      ]),
      h('div', { style: 'display:flex;flex-wrap:wrap' }, roles.map((role) =>
        h(QToggle, { id: `toggle-${role}`, modelValue: true, color: role, label: role }))),
      tabs({ id: 'accent-tabs', class: 'bg-accent text-white' }),
      h('div', { id: 'accent-wrapper', class: 'bg-accent' }, [tabs({ id: 'wrapped-tabs' })]),
      ...roles.map((role, index) => h(QToolbar, { id: `bar-${role}`, class: `bg-${role}` }, () => [
        h(QBtn, { id: `bar-fill-${role}`, color: barActions[index], label: 'Action' }),
        h('div', {}, [tabs({ id: `bar-tabs-${role}` })]),
      ])),
      h(QBtnToggle, { id: 'icon-segments', modelValue: 'a', dense: true, options: [
        { icon: 'M0 0h24v24H0z', value: 'a', attrs: { 'aria-label': 'Square' } },
        { icon: 'M12 0l12 24H0z', value: 'b', attrs: { 'aria-label': 'Triangle' } },
      ] }),
      ...['flat', 'outline'].map((style) => h(QBtnGroup, { id: `group-${style}`, [style]: true },
        () => ['Previous', 'Next'].map((label) => h(QBtn, { label, [style]: true })))),
      h('div', { id: 'glass', class: 'qds-glass' }, 'Solid Zen surface'),
    ] })
    app.use(Quasar)
    app.mount('#app')
    window.zen = { state, async set(values) { Object.assign(state, values); await nextTick() }, dispose() { app.unmount() } }
  }, { roles, barActions: roles.map((_, index) => actionRole(index)) })
  return page
}

const read = (page, selector, properties, pseudo) => page.evaluate(([target, names, pseudo]) => {
  const element = document.querySelector(target)
  if (!element) return null
  const computed = getComputedStyle(element, pseudo)
  return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name)]))
}, [selector, properties, pseudo])

const PAINT = ['color', 'background-color', 'border-top-width', 'border-top-color', 'border-top-style', 'box-shadow', 'outline-width', 'outline-color', 'font-weight']

async function observe(page) {
  await page.evaluate(() => window.zen.set({ menu: true }))
  await page.waitForSelector('.q-menu', { state: 'visible' })
  const samples = {}
  for (const [name, selector] of [
    ['button', '#button'], ['filled', '#fill-primary'], ['disabled', '#disabled'],
    ['field', '.q-field__control'], ['tabsTrack', '.q-tabs'],
    ['tabActive', '.q-tab--active'], ['tabIdle', '.q-tab:not(.q-tab--active)'],
    ['segmentActive', '#segments [aria-pressed="true"]'], ['segmentIdle', '#segments [aria-pressed="false"]'],
    ['menu', '.q-menu'], ['menuItem', '.q-menu .q-item--active'],
  ]) samples[name] = await read(page, selector, PAINT)
  samples.activeLabel = await read(page, '.q-tab--active .q-tab__label', ['font-weight'])
  samples.idleLabel = await read(page, '.q-tab:not(.q-tab--active) .q-tab__label', ['font-weight'])
  samples.indicator = await read(page, '.q-tab--active .q-tab__indicator', ['display', 'height', 'width', 'background-color', 'opacity'])
  samples.activeTabWidth = await page.evaluate(() => document.querySelector('.q-tab--active').getBoundingClientRect().width)
  for (const [name, selector] of [['toggleOn', '#toggle-on .q-toggle__track'], ['toggleOff', '#toggle-off .q-toggle__track'],
    ['checkOff', '#check-off .q-checkbox__bg'], ['checkOn', '#check-on .q-checkbox__bg'], ['bubble', '.q-slider__text-container'], ['bubbleText', '.q-slider__text']]) {
    samples[name] = await read(page, selector, PAINT)
  }
  samples.glyphOn = await page.evaluate(() => getComputedStyle(document.querySelector('#toggle-on .q-toggle__track'), '::before').borderInlineStartColor)
  samples.glyphOff = await page.evaluate(() => getComputedStyle(document.querySelector('#toggle-off .q-toggle__track'), '::after').borderTopColor)
  samples.fieldAfter = await page.evaluate(() => getComputedStyle(document.querySelector('.q-field__control'), '::after').content)
  samples.page = await read(page, 'body', ['background-color', 'color'])
  await page.evaluate(() => window.zen.set({ menu: false }))
  return samples
}

const results = []
const record = (scheme, label, ratio, minimum) => {
  results.push({ scheme, label, contrast: Number(ratio.toFixed(3)), minimum })
  assert.ok(ratio >= minimum, `${scheme} ${label}: computed contrast ${ratio.toFixed(3)} < ${minimum}`)
}

async function verifyIconSegments(page, scheme) {
  const group = '#icon-segments'
  const selected = `${group} [aria-pressed="true"]`
  const idle = `${group} [aria-pressed="false"]`
  const properties = ['content', 'width', 'border-bottom-width', 'border-bottom-style', 'border-bottom-color']
  assert.equal(await page.locator(`${selected} .q-icon svg`).count(), 1)
  assert.equal(await page.locator(`${idle} .q-icon svg`).count(), 1)
  const mark = await read(page, selected, properties, '::after')
  assert.equal(mark.content, '""', `${scheme} selected icon needs a persistent mark`)
  assert.equal(mark['border-bottom-style'], 'solid')
  assert.ok(parseFloat(mark.width) > 0 && parseFloat(mark['border-bottom-width']) >= 2)
  assert.equal((await read(page, idle, ['content'], '::after')).content, 'none')
  for (const selector of [selected, group]) {
    const { 'background-color': background } = await read(page, selector, ['background-color'])
    record(scheme, `icon selection mark against ${selector}`, contrast(
      opaque(mark['border-bottom-color'], `${scheme} icon selection`), opaque(background, selector),
    ), 3)
  }
}

async function verifyRoleSwitches(page, scheme) {
  const canvas = opaque((await read(page, 'body', ['background-color']))['background-color'], scheme)
  for (const role of roles) {
    const selector = `#toggle-${role}[aria-checked="true"] .q-toggle__track`
    const track = await read(page, selector, ['background-color', 'opacity'])
    assert.equal(track.opacity, '1')
    const fill = opaque(track['background-color'], `${scheme} ${role} switch`)
    const roleFace = await read(page, `#fill-${role}`, ['background-color'])
    assert.deepEqual(fill, opaque(roleFace['background-color'], role))
    const glyph = await read(page, selector, ['border-inline-start-color', 'border-inline-start-width', 'border-inline-start-style'], '::before')
    assert.ok(parseFloat(glyph['border-inline-start-width']) >= 2)
    assert.equal(glyph['border-inline-start-style'], 'solid')
    record(scheme, `${role} switch track vs page`, contrast(fill, canvas), 3)
    record(scheme, `${role} switch on glyph`, contrast(opaque(glyph['border-inline-start-color'], role), fill), 3)
  }
}

async function verifyBarTabs(page, scheme) {
  for (const [tabs, bar] of [
    ['#accent-tabs', '#accent-tabs'], ['#wrapped-tabs', '#accent-wrapper'],
    ...roles.map((role) => [`#bar-tabs-${role}`, `#bar-${role}`]),
  ]) {
    const fill = opaque((await read(page, bar, ['background-color']))['background-color'], bar)
    if (tabs !== bar) assert.equal(rgb((await read(page, tabs, ['background-color']))['background-color'])[3], 0)
    for (const selected of [true, false]) {
      const selector = `${tabs} [aria-selected="${selected}"]:not(.disabled)`
      const tab = await read(page, selector, ['color', 'opacity', 'background-color'])
      assert.equal(tab.opacity, '1', `${scheme} ${tabs} enabled tab opacity`)
      assert.equal(rgb(tab['background-color'])[3], 0)
      record(scheme, `${tabs} ${selected ? 'active' : 'inactive'} label`, contrast(opaque(tab.color, selector), fill), 4.5)
    }
    const activeMark = await read(page, `${tabs} .q-tab--active .q-tab__indicator`, ['background-color'])
    record(scheme, `${tabs} active underline`, contrast(opaque(activeMark['background-color'], tabs), fill), 3)
    const disabled = await read(page, `${tabs} .q-tab.disabled`, ['opacity'])
    assert.ok(Number(disabled.opacity) < 1, `${scheme} ${tabs} disabled tab stays muted`)
  }
}

async function verifyGroupPerimeters(page, scheme, enhanced) {
  const canvas = opaque((await read(page, 'body', ['background-color']))['background-color'], scheme)
  for (const style of ['flat', 'outline']) {
    for (const edge of ['top', 'right', 'bottom', 'left']) {
      const prefix = `border-${edge}`
      const group = await read(page, `#group-${style}`, [`${prefix}-width`, `${prefix}-style`, `${prefix}-color`])
      const label = `${style} group ${edge} perimeter`
      if (enhanced) {
        assert.ok(parseFloat(group[`${prefix}-width`]) >= 1)
        assert.equal(group[`${prefix}-style`], 'solid')
        record(scheme, label, contrast(opaque(group[`${prefix}-color`], label), canvas), 3)
      } else {
        assert.equal(rgb(group[`${prefix}-color`])[3], 0, `${scheme} ${label} stays soft`)
      }
    }
  }
}

const browser = await chromium.launch()
try {
  for (const scheme of ['light', 'dark']) {
    const bodyClass = `qds-ui qds-variant-zen qds-theme-${scheme}`
    const page = await mount(browser, bodyClass)
    try {
      const paint = await observe(page)
      await verifyIconSegments(page, scheme)
      await verifyRoleSwitches(page, scheme)
      await verifyBarTabs(page, scheme)
      await verifyGroupPerimeters(page, scheme, false)

      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })
      assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches))
      for (const selector of ['#glass', '#button', '.q-field__control', '#tabs', '#icon-segments']) {
        const material = await read(page, selector, ['background-color', 'backdrop-filter'])
        opaque(material['background-color'], `${scheme} reduced transparency ${selector}`)
        assert.equal(material['backdrop-filter'], 'none')
      }
      await verifyGroupPerimeters(page, `${scheme} reduced transparency`, false)
      await cdp.send('Emulation.setEmulatedMedia', { features: [] })
      await cdp.detach()

      // Text legibility on the real painted control fills.
      for (const [label, sample, backdrop] of [
        ['button label', paint.button, paint.button],
        ['field text', paint.field, paint.field],
        ['active tab label', paint.tabActive, paint.tabActive],
        ['idle tab label', paint.tabIdle, paint.tabsTrack],
        ['active segment label', paint.segmentActive, paint.segmentActive],
        ['menu item', paint.menuItem, paint.menuItem],
      ]) {
        const fill = opaque(backdrop['background-color'], `${scheme} ${label}`)
        record(scheme, label, contrast(rgb(sample.color), fill), 4.5)
      }

      // Every role fill, in every interactive state the profile can reach, is
      // measured against the on-fill text actually painted on it. Pressed is
      // held with a real pointer because Chromium cannot be asked for :active.
      for (const [role, selector, filledRole] of roles.flatMap((role, index) => [
        [role, `#fill-${role}`], [`${actionRole(index)} button in ${role} bar`, `#bar-fill-${role}`, actionRole(index)],
      ])) {
        const rest = await read(page, selector, PAINT)
        record(scheme, `${role} fill rest`, contrast(rgb(rest.color), opaque(rest['background-color'], `${scheme} ${role} rest`)), 4.5)
        if (filledRole) {
          const normal = await read(page, `#fill-${filledRole}`, ['color', 'background-color'])
          assert.deepEqual(rgb(rest.color), rgb(normal.color), `${scheme} ${role} keeps its on-fill foreground`)
          assert.deepEqual(rgb(rest['background-color']), rgb(normal['background-color']), `${scheme} ${role} keeps its own fill`)
        } else {
          record(scheme, `${role} fill vs page`, contrast(opaque(rest['background-color'], `${scheme} ${role}`), opaque(paint.page['background-color'], `${scheme} page`)), 3)
        }

        await page.hover(selector)
        const hover = await read(page, selector, PAINT)
        record(scheme, `${role} fill hover`, contrast(rgb(hover.color), opaque(hover['background-color'], `${scheme} ${role} hover`)), 4.5)

        const box = await page.locator(selector).boundingBox()
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        const pressed = await read(page, selector, PAINT)
        await page.mouse.up()
        assert.notEqual(pressed['background-color'], rest['background-color'], `${scheme} ${role} must repaint when pressed`)
        record(scheme, `${role} fill pressed`, contrast(rgb(pressed.color), opaque(pressed['background-color'], `${scheme} ${role} pressed`)), 4.5)
        assert.match(pressed['box-shadow'], /inset/, `${scheme} ${role} pressed recedes into an inset`)
      }
      // Pressed recedes for the neutral face too: an inset, never more lift.
      const neutral = await page.locator('#button').boundingBox()
      await page.mouse.move(neutral.x + neutral.width / 2, neutral.y + neutral.height / 2)
      await page.mouse.down()
      const neutralPressed = await read(page, '#button', ['box-shadow', 'transform'])
      await page.mouse.up()
      assert.match(neutralPressed['box-shadow'], /inset/, `${scheme} neutral pressed recedes into an inset`)
      const lift = neutralPressed.transform === 'none' ? 0 : Number(neutralPressed.transform.match(/matrix\(([^)]+)\)/)[1].split(',')[5])
      assert.ok(lift >= 0, `${scheme} neutral pressed never lifts (translateY ${lift})`)
      await page.mouse.move(0, 0)

      // Selected states carry text contrast too, not just a tint.
      record(scheme, 'selected menu item', contrast(rgb(paint.menuItem.color), opaque(paint.menuItem['background-color'], `${scheme} selected item`)), 4.5)

      // Disabled text is exempt from WCAG 1.4.3, so it is measured and reported
      // at the 3:1 non-text floor rather than silently skipped.
      record(scheme, 'disabled button label', contrast(rgb(paint.disabled.color), opaque(paint.page['background-color'], `${scheme} disabled`)), 3)

      const boundaries = [
        ['button', 'page'], ['field', 'page'], ['tabsTrack', 'page'], ['menu', 'page'], ['menuItem', 'menu'],
      ]
      for (const [part, behind] of boundaries) {
        const ratio = contrast(rgb(paint[part]['border-top-color']), opaque(paint[behind]['background-color'], scheme))
        assert.ok(ratio < 3, `${scheme} ${part} rest edge should be soft, got ${ratio.toFixed(3)}:1`)
      }
      for (const media of [{ contrast: 'more' }, { contrast: 'no-preference', forcedColors: 'active' }]) {
        await page.emulateMedia({ colorScheme: scheme, ...media })
        await verifyGroupPerimeters(page, `${scheme} ${media.forcedColors ?? media.contrast}`, true)
        await verifyIconSegments(page, `${scheme} ${media.forcedColors ?? media.contrast}`)
        const enhanced = await observe(page)
        for (const [part, behind] of boundaries) {
          assert.ok(parseFloat(enhanced[part]['border-top-width']) >= 1, `${scheme} ${part} needs a boundary`)
          const ratio = contrast(rgb(enhanced[part]['border-top-color']), opaque(enhanced[behind]['background-color'], scheme))
          record(scheme, `${part} boundary in ${media.forcedColors ?? media.contrast}`, ratio, 3)
        }
      }
      await page.emulateMedia({ contrast: 'no-preference', forcedColors: 'none' })

      for (const [label, sample, behind] of [
        ['switch off track boundary', paint.toggleOff, paint.page],
        ['checkbox well boundary', paint.checkOff, paint.page],
      ]) {
        assert.ok(parseFloat(sample['border-top-width']) >= 1, `${scheme} ${label}: no boundary, width ${sample['border-top-width']}`)
        assert.notEqual(sample['border-top-style'], 'none', `${scheme} ${label} boundary style`)
        record(scheme, label, contrast(rgb(sample['border-top-color']), opaque(behind['background-color'], `${scheme} ${label}`)), 3)
      }

      // State indicators that are not text clear the 3:1 non-text minimum on what they sit on.
      record(scheme, 'switch on track vs page', contrast(opaque(paint.toggleOn['background-color'], `${scheme} switch on`), opaque(paint.page['background-color'], `${scheme} page`)), 3)
      record(scheme, 'switch on glyph', contrast(rgb(paint.glyphOn), opaque(paint.toggleOn['background-color'], `${scheme} switch on`)), 3)
      record(scheme, 'switch off glyph', contrast(rgb(paint.glyphOff), opaque(paint.toggleOff['background-color'], `${scheme} switch off`)), 3)
      record(scheme, 'checkbox checked vs page', contrast(opaque(paint.checkOn['background-color'], `${scheme} checked`), opaque(paint.page['background-color'], `${scheme} page`)), 3)
      record(scheme, 'slider value bubble', contrast(rgb(paint.bubbleText.color), opaque(paint.bubble['background-color'], `${scheme} bubble`)), 4.5)
      record(scheme, 'active tab underline', contrast(rgb(paint.indicator['background-color']), opaque(paint.tabActive['background-color'], `${scheme} selected tab`)), 3)

      // Tactile depth: raised faces lift, wells recess, and the active tab is a short drawn
      // underline plus weight, never a full-width rail.
      assert.notEqual(paint.button['box-shadow'], 'none', `${scheme} button keeps gentle raised depth`)
      assert.match(paint.field['box-shadow'], /inset/, `${scheme} field keeps a recessed well`)
      assert.match(paint.toggleOff['box-shadow'], /inset/, `${scheme} switch track is a recessed well`)
      assert.match(paint.checkOff['box-shadow'], /inset/, `${scheme} checkbox is a recessed well`)
      assert.doesNotMatch(paint.tabsTrack['box-shadow'], /^inset/, `${scheme} tabs tray is raised`)
      assert.equal(paint.indicator.opacity, '1', `${scheme} active tab shows its underline`)
      assert.ok(parseFloat(paint.indicator.height) >= 2 && parseFloat(paint.indicator.width) < paint.activeTabWidth / 2, `${scheme} underline is a short dash (${paint.indicator.width} of ${paint.activeTabWidth}px)`)
      assert.equal(paint.fieldAfter, 'none', `${scheme} Zen paints no field focus bar`)
      assert.ok(Number(paint.activeLabel['font-weight']) > Number(paint.idleLabel['font-weight']), `${scheme} active tab carries a non-colour weight cue (${paint.activeLabel['font-weight']} vs ${paint.idleLabel['font-weight']})`)
      assert.ok(Number(paint.segmentActive['font-weight']) > Number(paint.segmentIdle['font-weight']), `${scheme} active segment carries a weight cue`)

      // Focus rings the whole control instead of underlining it.
      await page.focus('.q-field input')
      const focused = await read(page, '.q-field--focused .q-field__control', ['outline-width', 'outline-color', 'border-top-color'])
      assert.ok(parseFloat(focused['outline-width']) >= 1, `${scheme} field focus ring width ${focused['outline-width']}`)
      record(scheme, 'field focus ring', contrast(rgb(focused['outline-color']), opaque(paint.field['background-color'], `${scheme} focus`)), 3)

      // Error state never falls back to Quasar's native #c10015.
      await page.evaluate(() => window.zen.set({ error: true }))
      const error = await read(page, '.q-field--error .q-field__control', ['border-top-color'])
      assert.notDeepEqual(rgb(error['border-top-color']).slice(0, 3), [193, 0, 21], `${scheme} field error must not use the native #c10015`)
      record(scheme, 'field error boundary', contrast(rgb(error['border-top-color']), opaque(paint.field['background-color'], `${scheme} error`)), 3)
    } finally { await page.close() }
  }

  // Reading presentation: decorative depth and motion gone, boundaries intact.
  for (const [scheme, bodyClass] of [['light', 'qds-ui qds-variant-zen qds-reading'], ['dark', 'qds-ui qds-variant-zen qds-theme-dark qds-reading']]) {
    const page = await mount(browser, bodyClass)
    try {
      const paint = await observe(page)
      await verifyIconSegments(page, `reading ${scheme}`)
      await verifyRoleSwitches(page, `reading ${scheme}`)
      for (const [label, sample] of [['button', paint.button], ['field', paint.field], ['tabs tray', paint.tabsTrack], ['menu', paint.menu], ['switch track', paint.toggleOff], ['checkbox well', paint.checkOff]]) {
        assert.equal(sample['box-shadow'], 'none', `reading ${scheme} ${label} must drop decorative depth`)
        assert.ok(parseFloat(sample['border-top-width']) >= 1, `reading ${scheme} ${label} must keep its boundary`)
        opaque(sample['background-color'], `reading ${scheme} ${label}`)
      }
      assert.ok(Number(paint.activeLabel['font-weight']) > Number(paint.idleLabel['font-weight']), `reading ${scheme} active tab keeps its weight cue`)
      // observe() closes the menu again, so reopen it before probing the portal.
      await page.evaluate(() => window.zen.set({ menu: true }))
      await page.waitForSelector('.q-menu', { state: 'visible' })
      const motion = await page.evaluate(() => ['#button', '.q-field__control', '.q-tab', '.q-menu'].map((selector) => {
        const computed = getComputedStyle(document.querySelector(selector))
        return `${computed.transitionProperty}/${computed.animationName}`
      }))
      for (const entry of motion) assert.equal(entry, 'none/none', `reading ${scheme} must remove motion, got ${entry}`)
    } finally { await page.close() }
  }
} finally { await browser.close() }

console.log(JSON.stringify({ observations: results.length, minimum: Math.min(...results.map((r) => r.contrast)), results }, null, 2))
console.log(`Zen browser proof PASS: ${results.length} computed contrast observations across light/dark, plus reading-mode depth, motion, boundary and opacity checks.`)
