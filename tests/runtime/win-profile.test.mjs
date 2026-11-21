import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import Color from 'colorjs.io'
import { compile } from 'sass'
import { chromium, mount, settle, paint, roles } from './fluent-native-fixture.mjs'

const ratio = (a, b) => new Color(a).contrast(new Color(b), 'WCAG21')
const edgeRatio = (edge, background) => {
  const color = new Color(edge).to('srgb')
  const surface = new Color(background).to('srgb')
  return ratio(new Color('srgb', color.coords.map((v, i) => v * color.alpha + surface.coords[i] * (1 - color.alpha))), surface)
}

test('Win native filled states and accessible edges work in default and layered delivery', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const layered of [false, true]) {
      const css = readFileSync(new URL(`../../dist/css/${layered ? 'layered/' : ''}index.css`, import.meta.url), 'utf8')
      for (const mode of ['light', 'dark']) {
        const page = await mount(browser, css, { layered, mode })
        try {
          for (const role of roles) {
            const button = page.locator(`#${role}`)
            await page.mouse.move(0, 0); await settle(page)
            const rest = await paint(page, `#${role}`)
            await button.hover(); await settle(page)
            const hover = await paint(page, `#${role}`)
            await page.mouse.down(); await settle(page)
            const pressed = await paint(page, `#${role}`)
            assert.equal(pressed.active, true)
            assert.equal(await button.evaluate(el => getComputedStyle(el).borderBottomColor), await button.evaluate(el => {
              const probe = document.createElement('span')
              probe.style.color = 'var(--qds-control-stroke-default)'
              el.append(probe)
              const color = getComputedStyle(probe).color
              probe.remove()
              return color
            }))
            await page.mouse.up(); await page.mouse.move(0, 0)
            await button.focus(); await page.keyboard.down('Space'); await settle(page)
            const keyboard = await paint(page, `#${role}`)
            await page.keyboard.up('Space')
            for (const state of [rest, hover, pressed, keyboard]) assert.ok(state.ratio >= 4.5, `${layered}/${mode}/${role}: ${JSON.stringify(state)}`)
            assert.equal(keyboard.background, pressed.background)
          }
          for (const media of [{ contrast: 'more' }, { contrast: 'no-preference', forcedColors: 'active' }]) {
            await page.emulateMedia(media)
            await settle(page)
            const edges = await page.evaluate(() => {
              const root = document.querySelector('#app')
              const tokens = ['control-stroke-default', 'control-stroke-top', 'control-stroke-bottom', 'card-stroke', 'material-stroke']
              const resolve = name => {
                const probe = document.createElement('span')
                const property = name.startsWith('surface-') ? 'backgroundColor' : 'color'
                probe.style[property] = `var(--qds-${name})`
                root.append(probe)
                const color = getComputedStyle(probe)[property]
                probe.remove()
                return color
              }
              return {
                surfaces: ['surface-0', 'surface-1', 'surface-2', 'surface-3'].map(resolve),
                tokens: tokens.map(resolve),
                buttons: [...document.querySelectorAll('.roles .q-btn')].map(el => getComputedStyle(el).borderTopColor),
                field: getComputedStyle(document.querySelector('.field .q-field__control'), '::before').borderTopColor,
              }
            })
            for (const edge of [...edges.tokens, ...edges.buttons, edges.field]) {
              for (const surface of edges.surfaces) assert.ok(ratio(edge, surface) >= 3, `${layered}/${mode}/${JSON.stringify(media)}: ${edge} / ${surface}`)
            }
          }
        } finally { await page.close() }
      }
    }
  } finally { await browser.close() }
})

async function colorToken(page, selector, token) {
  return page.locator(selector).evaluate((el, token) => {
    const probe = document.createElement('span')
    const property = token.includes('surface-') ? 'backgroundColor' : 'color'
    if (property === 'color') probe.style.forcedColorAdjust = 'none'
    probe.style[property] = `var(${token})`
    el.append(probe)
    const color = getComputedStyle(probe)[property]
    probe.remove()
    return color
  }, token)
}


test('Win neutral, tonal, flat and outline actions keep pointer/keyboard held paint in sync', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const layered of [false, true]) for (const mode of ['light', 'dark']) {
      const css = readFileSync(new URL(`../../dist/css/${layered ? 'layered/' : ''}index.css`, import.meta.url), 'utf8')
      const page = await mount(browser, css, { layered, mode })
      try {
        await page.evaluate(roles => {
          const root = document.createElement('div')
          root.className = 'group'
          document.querySelector('#app').prepend(root)
          const { h, createApp } = Vue
          const { QBtn } = Quasar
          createApp({ render: () => [
            ...roles.map(role => h(QBtn, { id: `tonal-${role}`, color: role, label: role, class: 'qds-tonal' })),
            h(QBtn, { id: 'outline', outline: true, label: 'Outline' }),
            h(QBtn, { id: 'flat', flat: true, label: 'Flat' }),
          ] }).use(Quasar).mount(root)
        }, roles)
        for (const selector of ['#next', '#outline', '#flat', ...roles.map(role => `#tonal-${role}`)]) {
          const button = page.locator(selector)
          const styles = () => button.evaluate(el => {
            const s = getComputedStyle(el)
            return { color: s.color, background: s.backgroundColor, image: s.backgroundImage, border: s.borderBottomColor }
          })
          await button.hover(); await page.mouse.down(); await settle(page)
          const pointer = await styles()
          await page.mouse.up(); await page.mouse.move(0, 0)
          await button.focus(); await page.keyboard.down('Space'); await settle(page)
          const keyboard = await styles()
          const held = await paint(page, selector)
          await page.keyboard.up('Space')
          assert.deepEqual(keyboard, pointer, `${layered}/${mode}/${selector} held paint`)
          assert.ok(held.ratio >= 4.5, `${selector} held text`)
        }
      } finally { await page.close() }
    }
  } finally { await browser.close() }
})

test('Win field shapes preserve native readonly/disabled semantics and restore ghost/borderless edges', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const layered of [false, true]) for (const mode of ['light', 'dark']) {
      const css = readFileSync(new URL(`../../dist/css/${layered ? 'layered/' : ''}index.css`, import.meta.url), 'utf8')
      const page = await mount(browser, css, { layered, mode })
      try {
        await page.evaluate(() => {
          const { h, createApp } = Vue
          const root = document.createElement('div')
          document.body.prepend(root)
          createApp({ render: () => ['outlined', 'filled', 'standout', 'borderless', 'ghost', 'readonly', 'disabled'].map(name => h(Quasar.QInput, {
            class: `field-${name} ${name === 'ghost' ? 'qds-field--ghost' : ''}`, modelValue: 'Value', label: name,
            outlined: name === 'outlined' || name === 'readonly' || name === 'disabled', filled: name === 'filled', standout: name === 'standout', borderless: name === 'borderless', readonly: name === 'readonly', disable: name === 'disabled',
          })) }).use(Quasar).mount(root)
        })
        assert.equal(await page.locator('.field-readonly input').getAttribute('readonly'), '')
        assert.equal(await page.locator('.field-disabled input').isDisabled(), true)
        for (const media of [{ contrast: 'more' }, { contrast: 'no-preference', forcedColors: 'active' }]) {
          await page.emulateMedia(media); await settle(page)
          for (const name of ['outlined', 'filled', 'standout', 'borderless', 'ghost', 'readonly', 'disabled']) {
            const edge = await page.locator(`.field-${name} .q-field__control`).evaluate(el => {
              const s = getComputedStyle(el, '::before')
              return { color: s.borderTopColor, width: s.borderTopWidth, style: s.borderTopStyle, content: s.content }
            })
            assert.equal(edge.width, '1px', name)
            assert.notEqual(edge.content, 'none', name)
            assert.equal(edge.style, name === 'readonly' ? 'dashed' : 'solid', name)
            for (const surface of ['--qds-surface-0', '--qds-surface-1', '--qds-surface-2', '--qds-surface-3']) {
              const bg = await colorToken(page, ` .field-${name}`, surface)
              assert.ok(edgeRatio(edge.color, bg) >= 3, `${layered}/${mode}/${JSON.stringify(media)}/${name}/${surface}: ${edge.color}`)
            }
          }
        }
      } finally { await page.close() }
    }
  } finally { await browser.close() }
})

async function nativeNavigation(page) {
  await page.evaluate(() => {
    const { h, createApp, reactive } = Vue
    const { QItem, QItemSection, QTabs, QTab, QCard, QTable, QExpansionItem } = Quasar
    const state = reactive({ tab: 'a', current: 'home', selected: [], indicatorColor: undefined })
    const root = document.createElement('div')
    root.id = 'navigation'
    document.body.prepend(root)
    const app = createApp({ render: () => [
      h('nav', {}, [
        ...['home', 'other'].map(name => h(QItem, { id: `nav-${name}`, clickable: true, active: state.current === name, onClick: () => { state.current = name } }, () => h(QItemSection, () => name))),
        h(QItem, { id: 'nav-disabled', clickable: true, disable: true }, () => 'Disabled'),
        h(QExpansionItem, { id: 'nav-parent', label: 'Parent' }, () => h(QItem, { active: true, clickable: true }, () => 'Nested current')),
      ]),
      h(QTabs, { id: 'nav-tabs', indicatorColor: state.indicatorColor, modelValue: state.tab, 'onUpdate:modelValue': v => { state.tab = v } }, () => [
        h(QTab, { id: 'tab-a', name: 'a', label: 'Overview' }),
        h(QTab, { id: 'tab-disabled', name: 'disabled', label: 'Disabled', disable: true }),
        h(QTab, { id: 'tab-b', name: 'b', label: 'Details' }),
      ]),
      h(QCard, { id: 'nav-card', tabindex: 0 }, () => ['Interactive card', h(QCard, { id: 'nested-card' }, () => 'Nested well')]),
      h('div', { id: 'hook-card', class: 'qds-card', tabindex: 0 }, 'Card hook'),
      h('div', { id: 'hook-tile', class: 'qds-tile', tabindex: 0 }, 'Tile hook'),
      h(QTable, { id: 'nav-table', rowKey: 'id', rows: [{ id: 1, label: 'First' }, { id: 2, label: 'Second' }], columns: [{ name: 'label', label: 'Label', field: 'label', sortable: true }], selection: 'multiple', selected: state.selected, 'onUpdate:selected': v => { state.selected = v }, pagination: { rowsPerPage: 0 } }),
    ] })
    app.use(Quasar).mount(root)
    window.navigationFixture = { state, dispose: () => app.unmount() }
  })
  await settle(page)
}

test('Win native navigation keeps keyboard/current/RTL cues and card hierarchy in both deliveries', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const layered of [false, true]) for (const mode of ['light', 'dark']) {
      const css = readFileSync(new URL(`../../dist/css/${layered ? 'layered/' : ''}index.css`, import.meta.url), 'utf8')
      const page = await mount(browser, css, { layered, mode })
      try {
        await page.emulateMedia({ colorScheme: mode })
        await nativeNavigation(page)
        await page.keyboard.press('Tab')
        for (const selector of ['#nav-home', '#tab-a', '#nav-card', '#hook-card', '#hook-tile']) {
          await page.locator(selector).focus(); await settle(page)
          const ring = await page.locator(selector).evaluate(el => ({ visible: el.matches(':focus-visible'), width: getComputedStyle(el).outlineWidth, style: getComputedStyle(el).outlineStyle, color: getComputedStyle(el).outlineColor }))
          assert.ok(ring.visible, selector)
          assert.equal(ring.width, '2px', `${selector} focus width`)
          assert.equal(ring.style, 'solid', `${selector} focus style`)
          assert.equal(ring.color, await colorToken(page, selector, '--_qds-win-focus-outer'))
          const p = await paint(page, selector)
          assert.ok(edgeRatio(ring.color, new Color('srgb', p.fill)) >= 3, `${selector} focus contrast`)
          assert.ok(p.ratio >= 4.5, `${selector} text contrast`)
        }
        await page.locator('#nav-other').focus(); await page.keyboard.press('Enter')
        assert.equal(await page.locator('#nav-other').evaluate(el => el.classList.contains('q-item--active')), true)
        await page.locator('#tab-a').focus(); await page.keyboard.press('ArrowRight')
        assert.equal(await page.locator('#tab-b').evaluate(el => el === document.activeElement), true, 'disabled tab is skipped')
        await page.keyboard.press('Enter'); await settle(page)
        assert.equal(await page.locator('#tab-b').getAttribute('aria-selected'), 'true')
        await page.locator('#nav-table tbody .q-checkbox').first().click()
        assert.equal(await page.locator('#nav-table tbody tr.selected').count(), 1)
        assert.equal(await page.evaluate(() => navigationFixture.state.selected[0].id), 1)
        assert.equal(await page.locator('#nested-card').evaluate(el => getComputedStyle(el).borderTopWidth), '0px')
        assert.equal(await page.locator('#nav-card').evaluate(el => getComputedStyle(el).borderTopWidth), '1px')
        for (const direction of ['ltr', 'rtl']) {
          await page.evaluate(direction => {
            document.documentElement.dir = direction; document.body.dir = direction
            document.documentElement.style.direction = direction; document.body.style.direction = direction
          }, direction)
          const rail = await page.locator('#nav-other').evaluate(el => {
            const s = getComputedStyle(el, '::before')
            return { width: s.width, height: s.height, left: s.left, right: s.right }
          })
          assert.equal(rail.width, '3px'); assert.equal(rail.height, '16px')
          assert.equal(direction === 'rtl' ? rail.right : rail.left, '0px')
        }
        for (const media of [{ contrast: 'more' }, { contrast: 'no-preference', forcedColors: 'active' }]) {
          await page.emulateMedia(media); await settle(page)
          const indicator = await page.locator('#tab-b .q-tab__indicator').evaluate(el => getComputedStyle(el).backgroundColor)
          const p = await paint(page, '#tab-b')
          assert.ok(edgeRatio(indicator, new Color('srgb', p.fill)) >= 3, `${mode}/${JSON.stringify(media)} selected tab ${indicator}`)
          const card = await page.locator('#nav-card').evaluate(el => ({ border: getComputedStyle(el).borderTopColor, width: getComputedStyle(el).borderTopWidth, bg: getComputedStyle(el).backgroundColor }))
          assert.equal(card.width, '1px'); assert.ok(edgeRatio(card.border, new Color('srgb', (await paint(page, '#nav-card')).fill)) >= 3)
          if (media.forcedColors === 'active') {
            await page.evaluate(() => { navigationFixture.state.indicatorColor = 'primary' }); await settle(page)
            const border = await page.locator('#tab-b .q-tab__indicator').evaluate(el => ({ color: getComputedStyle(el).borderTopColor, width: getComputedStyle(el).borderTopWidth }))
            assert.equal(border.width, '1px')
            assert.equal(border.color, await colorToken(page, '#tab-b', '--qds-stroke-focus'))
            assert.ok(edgeRatio(border.color, new Color('srgb', (await paint(page, '#tab-b')).fill)) >= 3)
          }
        }
      } finally { await page.close() }
    }
  } finally { await browser.close() }
})

async function nativeOverlays(page) {
  await page.evaluate(() => {
    const { h, createApp, reactive } = Vue
    const { QBtn, QMenu, QList, QItem, QItemSection, QTree, QStepper, QStep, Dialog, Notify, BottomSheet, Loading } = Quasar
    const root = document.createElement('div')
    root.id = 'overlays'
    document.body.prepend(root)
    const state = reactive({ menu: false, step: 1, selected: 'a' })
    const app = createApp({ render: () => [
      h(QBtn, { id: 'menu-open', label: 'Menu', onClick: () => { state.menu = true } }, () => h(QMenu, { modelValue: state.menu, 'onUpdate:modelValue': v => { state.menu = v } }, () => h(QList, () => [h(QItem, { id: 'menu-command', clickable: true }, () => h(QItemSection, () => 'Command'))]))),
      h(QBtn, { id: 'dialog-open', label: 'Dialog', onClick: () => Dialog.create({ title: 'Native dialog', message: 'Content', cancel: true }) }),
      h(QBtn, { id: 'sheet-open', label: 'Sheet', onClick: () => BottomSheet.create({ message: 'Native sheet', actions: [{ label: 'Command', id: 'command' }] }) }),
      h(QTree, { id: 'rich-tree', nodeKey: 'id', nodes: [{ id: 'a', label: 'Tree', children: [{ id: 'b', label: 'Child' }] }], selected: state.selected, 'onUpdate:selected': v => { state.selected = v } }),
      h(QStepper, { id: 'rich-stepper', modelValue: state.step, 'onUpdate:modelValue': v => { state.step = v }, headerNav: true }, () => [h(QStep, { name: 1, title: 'First' }, () => 'Content'), h(QStep, { name: 2, title: 'Second' }, () => 'More')]),
    ] })
    app.use(Quasar, { plugins: { Dialog, Notify, BottomSheet, Loading } }).mount(root)
    window.overlayFixture = {
      notify: () => Notify.create({ message: 'Native notice', timeout: 0 }),
      loading: () => Loading.show({ message: 'Native loading' }),
      stop: () => Loading.hide(),
      dispose: () => app.unmount(),
    }
  })
  await settle(page)
}

test('Win native portals, rich selection and plugin lifecycles retain contrast and keyboard dismissal', async () => {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const layered of [false, true]) for (const mode of ['light', 'dark']) {
      const css = readFileSync(new URL(`../../dist/css/${layered ? 'layered/' : ''}index.css`, import.meta.url), 'utf8')
      const page = await mount(browser, css, { layered, mode })
      try {
        await page.emulateMedia({ colorScheme: mode })
        await nativeOverlays(page)
        await page.locator('#menu-open').focus(); await page.keyboard.press('Enter')
        await page.locator('.q-menu #menu-command').waitFor()
        assert.equal(await page.locator('.q-menu').evaluate(el => !document.querySelector('#overlays').contains(el)), true, 'actual portal')
        await page.locator('#menu-command').focus(); await settle(page)
        assert.equal(await page.locator('#menu-command').evaluate(el => getComputedStyle(el).outlineWidth), '2px')
        assert.ok((await paint(page, '#menu-command')).ratio >= 4.5)
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })
        await settle(page)
        const opaque = await page.locator('.q-menu').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, filter: getComputedStyle(el).backdropFilter }))
        assert.equal(opaque.filter, 'none')
        assert.equal(new Color(opaque.background).alpha, 1)
        await cdp.send('Emulation.setEmulatedMedia', { features: [] })
        await cdp.detach()
        await page.keyboard.press('Escape'); await page.locator('.q-menu').waitFor({ state: 'detached' })
        assert.equal(await page.locator('#menu-open').evaluate(el => el === document.activeElement), true)
        for (const media of [{ contrast: 'more' }, { contrast: 'no-preference', forcedColors: 'active' }]) {
          await page.emulateMedia(media)
          await page.locator('#dialog-open').click(); await page.locator('.q-dialog-plugin').waitFor(); await settle(page)
          const dialog = await page.locator('.q-dialog-plugin').evaluate(el => {
            const s = getComputedStyle(el)
            return { edge: s.borderTopColor, width: s.borderTopWidth, filter: s.backdropFilter }
          })
          assert.equal(dialog.width, '1px'); assert.equal(dialog.filter, 'none')
          for (const token of ['--qds-surface-0', '--qds-surface-1', '--qds-surface-2', '--qds-surface-3']) {
            assert.ok(edgeRatio(dialog.edge, await colorToken(page, '.q-dialog-plugin', token)) >= 3, `${mode}/${JSON.stringify(media)} dialog edge ${dialog.edge}`)
          }
          await page.keyboard.press('Escape'); await page.locator('.q-dialog').waitFor({ state: 'detached' })
          const selector = '#rich-tree .q-tree__node--selected'
          const rail = await page.locator(selector).evaluate(el => getComputedStyle(el, '::after').backgroundColor)
          const p = await paint(page, selector)
          assert.ok(edgeRatio(rail, new Color('srgb', p.fill)) >= 3, `${mode}/${JSON.stringify(media)} tree rail ${rail}`)
        }
        await page.emulateMedia({ contrast: 'no-preference', forcedColors: 'none', reducedMotion: 'reduce' })
        await page.locator('#sheet-open').focus(); await page.keyboard.press('Enter')
        await page.locator('.q-bottom-sheet').waitFor()
        await page.keyboard.press('Escape'); await page.locator('.q-dialog').waitFor({ state: 'detached' })
        await page.evaluate(() => { window.dismissNotice = overlayFixture.notify() })
        await page.locator('.q-notification').waitFor(); await settle(page)
        assert.ok((await paint(page, '.q-notification')).ratio >= 4.5)
        await page.evaluate(() => window.dismissNotice()); await page.locator('.q-notification').waitFor({ state: 'detached' })
        await page.evaluate(() => overlayFixture.loading()); await page.locator('.q-loading').waitFor()
        await page.evaluate(() => overlayFixture.stop()); await page.locator('.q-loading').waitFor({ state: 'detached' })
        await page.locator('#rich-stepper .q-stepper__tab').last().focus(); await page.keyboard.press('Enter')
        await settle(page)
        assert.equal(await page.locator('#rich-stepper .q-stepper__tab').last().evaluate(el => el.classList.contains('q-stepper__tab--active')), true)
        await page.evaluate(() => overlayFixture.dispose())
        assert.equal(await page.locator('.q-menu, .q-dialog, .q-notification, .q-loading').count(), 0)
      } finally { await page.close() }
    }
  } finally { await browser.close() }
})

test('Win optional native windows restore their edge in both extension deliveries', async () => {
  const nativeRoot = new URL('../../node_modules/@quasar/quasar-ui-qwindow/dist/', import.meta.url)
  const nativeScript = readFileSync(new URL('index.umd.js', nativeRoot), 'utf8')
  const nativeCss = readFileSync(new URL('index.min.css', nativeRoot), 'utf8')
  const browser = await chromium.launch({ headless: true })
  try {
    for (const layered of [false, true]) {
      const extension = compile(new URL(`../../src/css/extensions/qwindow${layered ? '.layered' : ''}.scss`, import.meta.url).pathname, { style: 'compressed', silenceDeprecations: ['if-function'] }).css
      const css = readFileSync(new URL(`../../dist/css/${layered ? 'layered/' : ''}index.css`, import.meta.url), 'utf8')
      for (const mode of ['light', 'dark']) {
        const page = await mount(browser, css, { layered, mode })
        try {
          await page.emulateMedia({ colorScheme: mode })
          await page.addStyleTag({ content: (layered ? `@layer quasar{${nativeCss}}` : nativeCss) + extension })
          await page.addScriptTag({ content: nativeScript })
          await page.evaluate(() => {
            const { createApp, h } = Vue
            const root = document.createElement('div')
            document.body.prepend(root)
            createApp({ render: () => h(QWindow.QWindow, { modelValue: true, embedded: true, noResize: true, title: 'Native window', class: 'qds-window qds-window--embedded', titlebarClass: 'qds-window__titlebar' }, () => h('div', { class: 'qds-window__body' }, 'Content')) }).use(Quasar).mount(root)
          })
          await page.locator('.qds-window').waitFor()
          for (const media of [{ contrast: 'more' }, { contrast: 'no-preference', forcedColors: 'active' }]) {
            await page.emulateMedia(media); await settle(page)
            for (const active of [false, true]) {
              await page.locator('.qds-window').evaluate((el, active) => el.classList.toggle('qds-window--active', active), active)
              const edge = await page.locator('.qds-window').evaluate(el => ({ color: getComputedStyle(el).borderTopColor, width: getComputedStyle(el).borderTopWidth }))
              assert.equal(edge.width, '1px')
              for (const token of ['--qds-surface-0', '--qds-surface-1', '--qds-surface-2', '--qds-surface-3']) assert.ok(edgeRatio(edge.color, await colorToken(page, '.qds-window', token)) >= 3, `${layered}/${mode}/${active} window edge ${edge.color}`)
            }
          }
        } finally { await page.close() }
      }
    }
  } finally { await browser.close() }
})
