// Computed-paint proof for the Zen pilot: real Quasar controls, the real
// compiled QDS bundle, and measured contrast. Nothing here is judged by eye and
// nothing here claims anything about physical e-paper hardware.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { compile } from 'sass'
import { contrast, mix } from './shadcn-fixtures.mjs'

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
const barRoles = [...roles, 'dark']
const barCompositions = ['header-transparent-toolbar', 'footer-transparent-toolbar', 'header-direct', 'header-toolbar', 'header-colored-toolbar', 'footer-direct', 'footer-toolbar', 'footer-colored-toolbar', 'footer-colored-tabs', 'toolbar', 'compact-bar', 'vertical-bar']
const designs = ['standard', 'flat', 'outline', 'unelevated', 'push']
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
const paintContrast = (value, backdrop) => {
  const ink = rgb(value)
  return contrast(mix(ink, backdrop, ink[3]), backdrop)
}

async function mount(browser, bodyClass) {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, reducedMotion: 'reduce' })
  await page.setContent(`<style>${assets.quasarCss}</style><style>${assets.qds}</style><style>${fixture}</style>`
    + `<body class="${bodyClass}"><div id="app"></div></body>`)
  await page.addScriptTag({ content: assets.vue })
  await page.addScriptTag({ content: assets.quasar })
  await page.evaluate(({ roles, barRoles, barCompositions, barActions, designs }) => {
    const { createApp, h, reactive, nextTick } = Vue
    const { QBtn, QBtnGroup, QBtnToggle, QInput, QTabs, QTab, QRouteTab, QToolbar, QMenu, QList, QItem, QItemSection, QSeparator, QToggle, QCheckbox, QRadio, QSlider, QRange, QPagination, QBar, QCard, QChip, QSelect, QExpansionItem, QTree, QRating, QDate, QTime, QColor, QStepper, QStep, QSplitter, QEditor, QUploader, QTable } = Quasar
    const state = reactive({ value: 'Zen', tab: 'a', menu: false, error: false })
    const svg = 'M0 0h24v24H0z'
    const tabs = (props, icons = false) => h(QTabs, { ...props, modelValue: state.tab, 'onUpdate:modelValue': (v) => { state.tab = v } },
      () => ['a', 'b', 'c'].map((name) => h(QTab, { name, label: icons ? undefined : `Tab ${name}`, icon: icons ? svg : undefined, 'aria-label': icons ? `Tab ${name}` : undefined, disable: name === 'c' })))
    const destinations = (id, iconOnly = false) => h(QList, { bordered: true, id }, () =>
      [true, false].map((active) => h(QItem, { active: active && !['list', 'drawer-list', 'mini-child'].includes(id), clickable: true,
        'aria-selected': id === 'list' ? String(active) : undefined,
        'aria-current': ['drawer-list', 'mini-child'].includes(id) && active ? 'page' : undefined,
        'data-current': String(active) }, () =>
        h(QItemSection, { avatar: iconOnly }, () => iconOnly
          ? h(Quasar.QIcon, { name: svg, 'aria-label': 'Destination' })
          : 'Destination'))))
    const chromeCases = barRoles.flatMap((role) => barCompositions.map((composition) => {
      const id = `${composition}-${role}`
      const tabsOwnFill = composition === 'footer-colored-tabs'
      const tray = tabs({ id: `tabs-${id}`, vertical: composition === 'vertical-bar',
        class: tabsOwnFill ? `bg-${role}` : undefined }, true)
      const button = h(QBtn, { id: `action-${id}`, label: 'Action', color: 'secondary' })
      const title = h(Quasar.QToolbarTitle, {}, () => 'Bar title')
      const fill = { id, class: `bg-${role}` }
      const neutralToolbar = (transparent = false) => h(QToolbar, {
        id: `nested-${id}`, class: transparent ? 'bg-transparent' : undefined,
      }, () => [title, button, tray])
      const coloredToolbar = () => h(QToolbar, fill, () => [title, button, tray])
      const shell = (kind, children, paint = fill) => h(kind, { ...paint, class: [`q-${kind}`, paint.class] }, children)
      switch (composition) {
        case 'header-direct': return shell('header', [title, button, tray])
        case 'header-transparent-toolbar': return shell('header', [neutralToolbar(true)])
        case 'header-toolbar': return shell('header', [neutralToolbar()])
        case 'header-colored-toolbar': return shell('header', [coloredToolbar()], {})
        case 'footer-direct': return shell('footer', [title, button, tray])
        case 'footer-transparent-toolbar': return shell('footer', [neutralToolbar(true)])
        case 'footer-toolbar': return shell('footer', [neutralToolbar()])
        case 'footer-colored-toolbar': return shell('footer', [coloredToolbar()], {})
        case 'footer-colored-tabs': return shell('footer', [tray], {})
        case 'toolbar': return coloredToolbar()
        case 'compact-bar':
        case 'vertical-bar': return h(QBar, fill, () => [title, button, tray])
      }
    }))
    const contractTabs = (vertical, route, fill) => h(QTabs, {
      vertical, class: fill, modelValue: 'current', 'onUpdate:modelValue': () => {},
      activeColor: 'accent', indicatorColor: 'secondary',
    }, () => ['current', 'next'].map((name) => h(route ? QRouteTab : QTab, {
      name, href: route ? `/${name}` : undefined, exact: route, label: name, icon: svg,
      'data-audit': `${route ? 'route' : 'tab'}-${vertical ? 'vertical' : 'horizontal'}-${name}`,
    })))
    const roleControls = (role, container) => {
      const controls = [
        ...designs.flatMap((design) => [undefined, role].map((color) => h(QBtn, {
          color, [design]: design !== 'standard', label: design, icon: svg,
          'data-audit': `button-${design}-${color ?? 'neutral'}`,
        }))),
        h(QBtn, { color: 'accent', class: 'qds-tonal', label: 'Tonal', 'data-audit': 'tonal-button' }),
        ...[true, false].flatMap((active) => [
          ...[false, true].map((filled) => h(QItem, {
            active, clickable: true, activeClass: 'text-accent', class: filled ? `bg-${role}` : undefined,
            'data-audit': `item-${filled ? 'filled' : 'neutral'}-${active}`,
          }, () => [
            h(QItemSection, { side: true }, () => h(Quasar.QIcon, { name: svg })),
            h(QItemSection, {}, () => ['Item', h(Quasar.QItemLabel, { caption: true }, () => 'Caption')]),
          ])),
          ...['neutral', 'outline', 'tonal', 'solid'].map((design) => h(QChip, {
            color: design === 'neutral' || design === 'outline' ? undefined : role,
            textColor: design === 'outline' ? 'accent' : undefined, outline: design === 'outline',
            class: design === 'solid' ? 'qds-solid' : undefined, selected: active,
            clickable: true, removable: true, icon: svg, label: 'Chip',
            'data-audit': `chip-${design}-${active}`,
          })),
          ...[QToggle, QCheckbox, QRadio].map((component) => h(component, {
            color: role, modelValue: active, val: true, keepColor: true, label: component.name,
            'data-audit': `${component.name}-${active}`,
          })),
        ]),
        ...[false, true].map(filled => h(QBtnToggle, {
          class: filled ? `bg-${role}` : undefined, color: 'accent', toggleColor: role, modelValue: 'on',
          options: ['on', 'off'].map((value) => ({ value, icon: svg, attrs: { 'aria-label': value, 'data-audit': `segment-${filled ? 'filled' : 'neutral'}-${value}` } })),
        })),
        ...designs.map((design) => h(QPagination, {
          'data-family': `pagination-${design}`, modelValue: 2, max: 3, color: role,
          activeColor: 'accent', activeDesign: design === 'standard' ? '' : design,
        })),
        ...['standard', 'outlined', 'filled', 'standout', 'borderless', 'ghost', 'readonly-borderless', 'error', 'standout-role'].map((design) =>
          h(QInput, {
            modelValue: 'Value', label: 'Input', prefix: 'Prefix', suffix: 'Suffix', hint: 'Hint',
            outlined: design === 'outlined' || design === 'error', error: design === 'error', errorMessage: 'Error',
            clearable: true, class: design === 'ghost' ? 'qds-field--ghost' : undefined,
            filled: design === 'filled', borderless: design === 'borderless' || design === 'readonly-borderless',
            readonly: design === 'readonly-borderless', standout: design === 'standout-role' ? `bg-${role} text-accent` : design === 'standout',
            'data-audit': `field-${design}`,
          })),
        h('div', { class: 'qds-field-group' }, [
          h(QInput, { modelValue: 'Value', label: 'Joined', borderless: true, 'data-audit': 'field-joined' }),
          h(QSelect, { options: ['Unit'], modelValue: 'Unit', outlined: true, 'data-audit': 'field-joined-select' }),
        ]),
        h(QInput, { type: 'textarea', modelValue: 'Text', outlined: true, 'data-audit': 'field-textarea' }),
        h(QSelect, { options: ['Value'], modelValue: 'Value', borderless: true, 'data-audit': 'field-select' }),
      ]
      const props = { 'data-audit-surface': `${container}-${role}`, class: `bg-${role}` }
      const trays = [false, true].flatMap((vertical) => [false, true].map((route) => contractTabs(vertical, route)))
      if (container === 'track') return h('div', { 'data-audit-surface': `track-${role}` },
        [false, true].flatMap((vertical) => [false, true].map((route) => contractTabs(vertical, route, props.class))))
      if (container === 'toolbar') return h(QToolbar, props, () => h('div', controls.concat(trays)))
      if (container === 'bar') return h(QBar, { ...props, style: 'height:auto' }, () => h('div', controls.concat(trays)))
      return h('section', { ...props, class: [props.class, container === 'panel' ? undefined : `q-${container}`] }, controls.concat(trays))
    }
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
      ...roles.map((color) => h('div', { style: 'display:flex;gap:10px;align-items:center' }, [
        h(QCheckbox, { id: `checked-${color}`, color, modelValue: true }),
        h(QCheckbox, { id: `mixed-${color}`, color, modelValue: null }),
        h(QCheckbox, { id: `unchecked-${color}`, color, keepColor: true, modelValue: false }),
        h(QCheckbox, { id: `custom-check-${color}`, color, checkedIcon: svg, modelValue: true }),
        h(QCheckbox, { id: `custom-check-mixed-${color}`, color, indeterminateIcon: 'M0 10h24v4H0z', modelValue: null }),
        h(QCheckbox, { id: `custom-check-off-${color}`, color, keepColor: true, uncheckedIcon: svg, modelValue: false }),
        h(QRadio, { id: `radio-${color}`, color, modelValue: true, val: true }),
        h(QRadio, { id: `radio-off-${color}`, color, keepColor: true, modelValue: false, val: true }),
        h(QRadio, { id: `custom-radio-${color}`, color, checkedIcon: svg, modelValue: true, val: true }),
        h(QRadio, { id: `custom-radio-off-${color}`, color, keepColor: true, uncheckedIcon: svg, modelValue: false, val: true }),
        h(QToggle, { id: `switch-icon-${color}`, color, iconColor: color, icon: svg, modelValue: true }),
        h(QToggle, { id: `switch-off-${color}`, color, keepColor: true, icon: svg, modelValue: false }),
        h(QToggle, { id: `switch-mixed-${color}`, color, keepColor: true, icon: svg, modelValue: null }),
        h(QSlider, { id: `slider-${color}`, color, modelValue: 40 }),
        h(QRange, { id: `range-${color}`, color, modelValue: { min: 25, max: 75 } }),
      ])),
      tabs({ id: 'accent-tabs', class: 'bg-accent text-white' }),
      h('div', { id: 'accent-wrapper', class: 'bg-accent' }, [tabs({ id: 'wrapped-tabs' })]),
      ...roles.map((role, index) => h(QToolbar, { id: `bar-${role}`, class: `bg-${role}` }, () => [
        h(QBtn, { id: `bar-fill-${role}`, color: barActions[index], label: 'Action' }),
        h('div', {}, [tabs({ id: `bar-tabs-${role}` })]),
        h(QBtnGroup, { id: `bar-group-${role}`, flat: true }, () => h(QBtn, { label: 'Group', flat: true })),
      ])),
      h(QBtnToggle, { id: 'icon-segments', modelValue: 'a', dense: true, options: [
        { icon: 'M0 0h24v24H0z', value: 'a', attrs: { 'aria-label': 'Square' } },
        { icon: 'M12 0l12 24H0z', value: 'b', attrs: { 'aria-label': 'Triangle' } },
      ] }),
      ...['flat', 'outline'].map((style) => h(QBtnGroup, { id: `group-${style}`, [style]: true },
        () => ['Previous', 'Next'].map((label) => h(QBtn, { label, [style]: true })))),
      h('header', { id: 'neutral-header', class: 'q-header' }, [
        h(QToolbar, { id: 'neutral-header-toolbar' }, () => [h(Quasar.QToolbarTitle, {}, () => 'Toolbar'), tabs({ id: 'header-tabs' }, true)]),
      ]),
      h('header', { id: 'neutral-direct-header', class: 'q-header' }, [tabs({ id: 'header-direct-tabs' }, true)]),
      h('footer', { id: 'neutral-footer', class: 'q-footer' }, [tabs({ id: 'footer-tabs' }, true)]),
      h('footer', { id: 'neutral-footer-toolbar', class: 'q-footer' }, [
        h(QToolbar, { id: 'neutral-footer-toolbar-inner' }, () => [tabs({ id: 'footer-nested-tabs' }, true)]),
      ]),
      h(QToolbar, { id: 'neutral-toolbar' }, () => [tabs({ id: 'toolbar-tabs' }, true)]),
      h(QBar, { id: 'neutral-bar' }, () => [tabs({ id: 'bar-tabs' }, true)]),
      h(QBar, { id: 'native-dark-bar', dark: true }, () => [tabs({ id: 'native-dark-tabs' }, true)]),
      h('header', { id: 'outer-mixed-header', class: 'q-header bg-accent' }, [
        h(QToolbar, { id: 'inner-mixed-toolbar', class: 'bg-dark' }, () => [tabs({ id: 'mixed-tabs' }, true)]),
        h(QBar, { id: 'inner-neutral-bar' }, () => [tabs({ id: 'neutral-reset-tabs' }, true)]),
      ]),
      ...chromeCases,
      h(QToolbar, { id: 'transparent-toolbar', class: 'bg-transparent' }, () => [
        h(Quasar.QToolbarTitle, {}, () => 'Transparent toolbar'), tabs({ id: 'transparent-toolbar-tabs' }, true),
      ]),
      h('header', { id: 'transparent-header', class: 'q-header bg-transparent' }, [
        h(QToolbar, { id: 'transparent-header-toolbar', class: 'bg-transparent' }, () => tabs({ id: 'transparent-header-tabs' }, true)),
      ]),
      h(QBar, { id: 'transparent-dark-bar', dark: true, class: 'bg-transparent' }, () => tabs({ id: 'transparent-dark-bar-tabs' }, true)),
      ...barRoles.flatMap((role) => ['panel', 'toolbar', 'header', 'footer', 'bar', 'track'].map((container) => roleControls(role, container))),
      destinations('list'),
      h('aside', { id: 'drawer', class: 'q-drawer q-drawer--bordered q-drawer--left' }, [destinations('drawer-list')]),
      h('aside', { id: 'mini-drawer', class: 'q-drawer q-drawer--mini q-drawer--bordered q-drawer--left' }, [
        destinations('mini-list', true),
        h(QExpansionItem, { id: 'mini-parent', icon: svg }, () => destinations('mini-child', true)),
      ]),
      h(QTree, { id: 'tree', nodes: [{ label: 'Current', id: 'now' }, { label: 'Other', id: 'other' }], nodeKey: 'id', selected: 'now', 'onUpdate:selected': () => {} }),
      ...designs.map((design) => h(QPagination, { id: `pagination-${design}`, modelValue: 2, max: 3, activeDesign: design === 'standard' ? '' : design, activeColor: 'accent' })),
      h(QPagination, { id: 'pagination-input', modelValue: 2, max: 3, input: true }),
      h(QBtn, { id: 'outline-button', label: 'Outline', outline: true }),
      h(QBtn, { id: 'flat-button', label: 'Flat', flat: true }),
      h(QBtn, { id: 'tonal-button', label: 'Tonal', class: 'qds-tonal', color: 'accent' }),
      h(QBtnGroup, { id: 'standard-group' }, () => h(QBtn, { label: 'Standard' })),
      h(QBtnGroup, { id: 'push-group', push: true }, () => h(QBtn, { label: 'Push', push: true })),
      h(QBtnGroup, { id: 'unelevated-group', unelevated: true }, () => h(QBtn, { label: 'Unelevated', unelevated: true })),
      h(QChip, { id: 'chip', clickable: true, label: 'Chip' }),
      h(QChip, { id: 'outline-chip', outline: true, clickable: true, label: 'Outline' }),
      h(QChip, { id: 'solid-chip', class: 'qds-solid', color: 'accent', clickable: true, label: 'Solid' }),
      h('div', { id: 'field-group', class: 'qds-field-group' }, [
        h(QInput, { modelValue: 'Joined', label: 'Input', outlined: true }),
        h(QSelect, { modelValue: 'Joined', options: ['Joined'], outlined: true }),
        h(QBtn, { label: 'Go' }),
      ]),
      ...['filled', 'standout', 'borderless', 'readonly'].map((design) =>
        h('div', { 'data-edge-field': design }, [h(QInput, { modelValue: 'Value', [design]: true })])),
      h('div', { 'data-edge-field': 'textarea' }, [h(QInput, { type: 'textarea', modelValue: 'Note', outlined: true })]),
      h('div', { class: 'qds-option-group--card' }, h(QRadio, { id: 'option-card', class: 'qds-active', modelValue: true, val: true })),
      h(QCard, { id: 'card', bordered: true }, () => 'Card'),
      ...[
        ['date', QDate, { modelValue: '2026/11/24' }], ['time', QTime, { modelValue: '12:00' }],
        ['color-picker', QColor, { modelValue: '#e2907f' }], ['editor', QEditor, { modelValue: 'Text' }],
        ['splitter', QSplitter, { modelValue: 50 }], ['uploader', QUploader, {}],
        ['stepper', QStepper, { modelValue: 'step' }], ['table', QTable, { rows: [], columns: [] }],
      ].map(([id, component, props]) => h('div', { id: `frame-${id}` }, [h(component, props,
        id === 'stepper' ? () => h(QStep, { name: 'step', title: 'Step' }) : undefined)])),
      ...roles.flatMap((color) => [
        h(QRating, { id: `rating-${color}`, colorSelected: color, modelValue: 2, max: 3, icon: svg }),
        h(QBtnToggle, { id: `segment-${color}`, modelValue: 'a', toggleColor: color, dense: true, options: [
          { icon: svg, value: 'a', attrs: { 'aria-label': 'Square' } },
          { icon: 'M12 0l12 24H0z', value: 'b', attrs: { 'aria-label': 'Triangle' } },
        ] }),
      ]),
      h('div', { id: 'glass', class: 'qds-glass' }, 'Solid Zen surface'),
    ] })
    app.use(Quasar)
    app.mount('#app')
    window.zen = { state, async set(values) { Object.assign(state, values); await nextTick() }, dispose() { app.unmount() } }
  }, { roles, barRoles, barCompositions, designs, barActions: roles.map((_, index) => actionRole(index)) })
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
  samples.menuMark = await read(page, '.q-menu .q-item--active', ['content', 'display', 'width', 'background-color'], '::before')
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

async function verifyIconSegments(page, scheme, group = '#icon-segments') {
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
    record(scheme, `icon selection mark against ${selector}`, paintContrast(
      mark['border-bottom-color'], opaque(background, selector),
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
    const active = `${tabs} .q-tab--active`
    const activeMark = await read(page, `${active} .q-tab__indicator`, ['background-color'])
    record(scheme, `${tabs} active underline`, contrast(opaque(activeMark['background-color'], tabs), fill), 3)
    await page.locator(active).focus()
    const focus = await read(page, active, ['outline-width', 'outline-style', 'outline-color'])
    assert.ok(parseFloat(focus['outline-width']) >= 1 && focus['outline-style'] === 'solid', `${scheme} ${tabs} focus ring`)
    record(scheme, `${tabs} focus ring`, paintContrast(focus['outline-color'], fill), 3)
    const disabled = await read(page, `${tabs} .q-tab.disabled`, ['opacity'])
    assert.ok(Number(disabled.opacity) < 1, `${scheme} ${tabs} disabled tab stays muted`)
  }
}

async function surface(page, selector) {
  const layers = await page.locator(selector).evaluate((element) => {
    const layers = []
    for (let node = element; node; node = node.parentElement) layers.unshift(getComputedStyle(node).backgroundColor)
    return layers
  })
  return layers.map(rgb).reduce((behind, face) => mix(face, behind, face[3]), [255, 255, 255]).slice(0, 3)
}

async function verifyRoleSelection(page, scheme, forced) {
  const canvas = await surface(page, 'body')
  for (const role of roles) {
    await verifyIconSegments(page, scheme, `#segment-${role}`)
    const rating = `#rating-${role}`
    const currentRating = `${rating} [aria-checked="true"] .q-rating__icon`
    const idleRating = `${rating} .q-rating__icon:not(.q-rating__icon--active)`
    for (const selector of [currentRating, idleRating]) {
      const icon = await read(page, selector, ['color', 'opacity'])
      assert.equal(icon.opacity, '1')
      record(scheme, `${selector} icon`, paintContrast(icon.color, canvas), 3)
    }
    const ratingMark = await read(page, currentRating, ['content', 'border-bottom-color', 'border-bottom-width'], '::after')
    assert.equal(ratingMark.content, '""')
    assert.ok(parseFloat(ratingMark['border-bottom-width']) >= 2)
    record(scheme, `${role} rating mark`, paintContrast(ratingMark['border-bottom-color'], canvas), 3)
    assert.equal((await read(page, idleRating, ['content'], '::after')).content, 'none')
    const roleFill = await surface(page, `#fill-${role}`)
    for (const [id, part, glyph, ink] of [
      ['checked', '.q-checkbox__bg', '.q-checkbox__truthy', 'stroke'],
      ['mixed', '.q-checkbox__bg', '.q-checkbox__indet', 'fill'],
    ]) {
      const selector = `#${id}-${role} ${part}`
      const fill = await surface(page, selector)
      if (!forced) assert.deepEqual(fill, roleFill, `${scheme} ${id} ${role} uses the role fill`)
      const mark = await read(page, `${selector} ${glyph}`, [ink, 'opacity'])
      assert.equal(mark.opacity, '1')
      record(scheme, `${id} ${role} face`, contrast(fill, canvas), 3)
      record(scheme, `${id} ${role} glyph`, paintContrast(mark[ink], fill), 3)
    }
    const well = `#radio-${role} .q-radio__bg`
    const dot = await read(page, `${well} .q-radio__check`, ['fill', 'transform'])
    assert.doesNotMatch(dot.transform, /^matrix\(0,/)
    const radioFill = await surface(page, well)
    if (!forced) assert.deepEqual(rgb(dot.fill).slice(0, 3), roleFill, `${scheme} radio ${role} uses the role fill`)
    record(scheme, `${role} radio dot`, paintContrast(dot.fill, radioFill), 3)
    record(scheme, `${role} radio ring`, paintContrast((await read(page, well, ['border-top-color']))['border-top-color'], radioFill), 3)

    for (const id of ['custom-check', 'custom-check-mixed', 'custom-check-off', 'custom-radio', 'custom-radio-off']) {
      const selector = `#${id}-${role} .q-icon svg`
      const { fill } = await read(page, selector, ['fill'])
      record(scheme, `${id} ${role} SVG`, paintContrast(fill, await surface(page, selector)), 3)
    }
    for (const [id, part] of [['unchecked', '.q-checkbox__bg'], ['radio-off', '.q-radio__bg'], ['switch-off', '.q-toggle__track'], ['switch-mixed', '.q-toggle__track']]) {
      const selector = `#${id}-${role} ${part}`
      record(scheme, `${id} ${role} perimeter`, paintContrast((await read(page, selector, ['border-top-color']))['border-top-color'], canvas), 3)
    }
    for (const [id, pseudo, edge, style] of [
      ['switch-icon', '::before', 'border-inline-start', 'solid'],
      ['switch-off', '::after', 'border-top', 'solid'],
      ['switch-mixed', '::after', 'border-top', 'dashed'],
    ]) {
      const selector = `#${id}-${role}`
      const track = `${selector} .q-toggle__track`
      const thumb = await read(page, `${selector} .q-toggle__thumb`, ['background-color', 'border-top-color'], '::after')
      const icon = await read(page, `${selector} .q-toggle__thumb .q-icon`, ['color', 'opacity'])
      const glyph = await read(page, track, ['content', `${edge}-style`, `${edge}-color`], pseudo)
      const fill = await surface(page, track)
      assert.equal(glyph.content, '""')
      assert.equal(glyph[`${edge}-style`], style)
      assert.equal(icon.opacity, '1')
      if (id === 'switch-icon' && !forced) assert.deepEqual(fill, roleFill)
      record(scheme, `${id} ${role} track mark`, paintContrast(glyph[`${edge}-color`], fill), 3)
      record(scheme, `${id} ${role} thumb icon`, paintContrast(icon.color, opaque(thumb['background-color'], selector)), 3)
      const thumbBoundary = Math.max(paintContrast(thumb['background-color'], fill), paintContrast(thumb['border-top-color'], fill))
      record(scheme, `${id} ${role} thumb vs track`, thumbBoundary, 3)
    }

    for (const [id, thumbs] of [['slider', 1], ['range', 2]]) {
      const selector = `#${id}-${role}`
      const unfilled = await surface(page, `${selector} .q-slider__inner`)
      const filled = await surface(page, `${selector} .q-slider__selection`)
      if (!forced) assert.deepEqual(filled, roleFill)
      record(scheme, `${id} ${role} fill vs well`, contrast(filled, unfilled), 3)
      const track = await read(page, `${selector} .q-slider__inner`, ['border-top-color'])
      record(scheme, `${id} ${role} well edge`, paintContrast(track['border-top-color'], canvas), 3)
      assert.equal(await page.locator(`${selector} .q-slider__thumb`).count(), thumbs)
      for (let index = 0; index < thumbs; index++) {
        const thumb = await read(page, `${selector} .q-slider__thumb:nth-child(${index + 1} of .q-slider__thumb)`, PAINT)
        record(scheme, `${id} ${role} thumb ${index + 1} vs well`, paintContrast(thumb['border-top-color'], unfilled), 3)
        record(scheme, `${id} ${role} thumb ${index + 1} vs fill`, Math.max(
          paintContrast(thumb['background-color'], filled), paintContrast(thumb['border-top-color'], filled),
        ), 3)
      }
    }
  }
}

async function verifyChrome(page, scheme, forced, edges = false, reducedTransparency = false) {
  for (const [id, tray, filled] of [
    ...barRoles.flatMap((role) => barCompositions.map((composition) => {
      const id = `${composition}-${role}`
      return [composition === 'footer-colored-tabs' ? `tabs-${id}` : id, `tabs-${id}`, true]
    })),
    ['neutral-header', 'header-tabs'], ['neutral-direct-header', 'header-direct-tabs'], ['neutral-footer', 'footer-tabs'],
    ['neutral-footer-toolbar', 'footer-nested-tabs'], ['neutral-toolbar', 'toolbar-tabs'],
    ['neutral-bar', 'bar-tabs'], ['native-dark-bar', 'native-dark-tabs', true],
    ['inner-mixed-toolbar', 'mixed-tabs', true], ['inner-neutral-bar', 'neutral-reset-tabs'],
  ]) {
    const container = `#${id}`
    const tabs = `#${tray}`
    const chrome = await read(page, container, ['color', 'background-color', 'backdrop-filter', 'background-image'])
    assert.equal(chrome['backdrop-filter'], 'none', `${scheme} ${container}`)
    assert.equal(chrome['background-image'], 'none', `${scheme} ${container}`)
    if (id === 'neutral-footer' && !reducedTransparency) assert.equal(rgb(chrome['background-color'])[3], 0)
    else opaque(chrome['background-color'], `${scheme} ${container}`)
    const trayPaint = await read(page, tabs, ['background-color', 'backdrop-filter'])
    assert.equal(trayPaint['backdrop-filter'], 'none')
    if (filled && id !== tray) assert.equal(rgb(trayPaint['background-color'])[3], 0)
    if (edges) {
      const edge = await read(page, tabs, ['border-top-color', 'border-top-width', 'border-top-style'])
      assert.ok(parseFloat(edge['border-top-width']) >= 1 && edge['border-top-style'] === 'solid')
      record(scheme, `${tabs} tray edge`, paintContrast(
        edge['border-top-color'], await surface(page, filled ? container : tabs),
      ), 3)
    }
    const active = `${tabs} [aria-selected="true"]`
    for (const selector of [active, `${tabs} [aria-selected="false"]:not(.disabled)`]) {
      const icon = `${selector} .q-icon svg`
      assert.equal(await page.locator(icon).count(), 1)
      const { fill } = await read(page, icon, ['fill'])
      record(scheme, `${selector} icon`, paintContrast(fill, await surface(page, selector)), 3)
    }
    const title = await page.locator(`${container} .q-toolbar__title`).count()
    if (title) {
      const selector = `${container} .q-toolbar__title`
      record(scheme, `${container} title`, paintContrast((await read(page, selector, ['color'])).color, await surface(page, selector)), 4.5)
    }
    const action = `#action-${id}`
    if (await page.locator(action).count()) {
      record(scheme, `${container} filled action`, paintContrast((await read(page, action, ['color'])).color, await surface(page, action)), 4.5)
    }
    const indicator = await read(page, `${active} .q-tab__indicator`, ['display', 'width', 'height', 'opacity', 'background-color'])
    if (id === 'neutral-footer' && !forced) {
      assert.equal(indicator.display, 'none')
      record(scheme, 'neutral footer selected pebble', contrast(await surface(page, active), await surface(page, tabs)), 3)
      await page.locator(active).focus()
      const focus = await read(page, active, ['outline-color', 'outline-width', 'outline-style', 'outline-offset'])
      assert.ok(parseFloat(focus['outline-width']) >= 1 && focus['outline-style'] === 'solid' && parseFloat(focus['outline-offset']) < 0)
      record(scheme, 'neutral footer selected pebble focus', paintContrast(focus['outline-color'], await surface(page, active)), 3)
    } else {
      assert.notEqual(indicator.display, 'none', `${scheme} ${id} selection mark`)
      assert.equal(indicator.opacity, '1')
      assert.ok(parseFloat(indicator.width) > 0 && parseFloat(indicator.height) >= 2)
      record(scheme, `${container} tab underline`, paintContrast(indicator['background-color'], await surface(page, active)), 3)
    }
  }
}

async function verifyDestinations(page, scheme, forced) {
  for (const [selector, pseudo, container] of [
    ['#list [data-current="true"]', '::before', '#list'],
    ['#drawer-list [data-current="true"]', '::before', '#drawer-list'],
    ['#mini-list [data-current="true"]', '::before', '#mini-list'],
    ['#mini-parent > .q-expansion-item__container > .q-item', '::before', '#mini-drawer'],
    ['#tree .q-tree__node--selected', '::after', '#tree'],
  ]) {
    const mark = await read(page, selector, ['content', 'width', 'height', 'display', 'background-color'], pseudo)
    assert.equal(mark.content, '""')
    assert.notEqual(mark.display, 'none', `${scheme} ${selector} mark`)
    assert.ok(parseFloat(mark.width) >= 2 && parseFloat(mark.height) > 0)
    for (const background of [selector, container]) {
      record(scheme, `${selector} current mark vs ${background}`, paintContrast(mark['background-color'], await surface(page, background)), 3)
    }
  }
  for (const design of designs) {
    const container = `#pagination-${design}`
    const selector = `${container} [aria-current="page"]`
    const face = await surface(page, selector)
    const text = await read(page, selector, ['color'])
    record(scheme, `${design} current page text`, paintContrast(text.color, face), 4.5)
    if (forced || ['flat', 'outline'].includes(design)) {
      const mark = await read(page, selector, ['content', 'border-bottom-color', 'border-bottom-width', 'border-bottom-style'], '::after')
      assert.equal(mark.content, '""')
      assert.equal(mark['border-bottom-style'], 'solid')
      assert.ok(parseFloat(mark['border-bottom-width']) >= 2)
      record(scheme, `${design} current page mark`, paintContrast(mark['border-bottom-color'], face), 3)
    } else {
      record(scheme, `${design} current page face`, contrast(face, await surface(page, container)), 3)
    }
  }
}

async function verifyRoleControls(page, scheme, edges = false) {
  await page.keyboard.press('Tab')
  const observations = await page.evaluate(async ({ edges }) => {
    const layers = (node) => {
      const paints = []
      for (; node; node = node.parentElement) paints.unshift(getComputedStyle(node).backgroundColor)
      return paints
    }
    const enabled = (node) => !node.matches('.disabled, [disabled], [aria-disabled="true"]')
    const entries = []
    for (const container of document.querySelectorAll('[data-audit-surface]')) {
      const prefix = container.dataset.auditSurface
      for (const fixture of container.querySelectorAll('[data-audit], .q-pagination .q-btn')) {
        const node = fixture.dataset.audit?.startsWith('field-') ? fixture.closest('.q-field') : fixture
        if (!enabled(node)) continue
        const family = node.closest('[data-family]')?.dataset.family
        const name = `${prefix}/${fixture.dataset.audit ?? family + '/' + node.textContent.trim()}`
        const field = node.matches('.q-field')
        const target = field ? node.querySelector('input, textarea, .q-select__focus-target') : node
        const anchor = field ? node.querySelector('.q-field__control') : node
        const parts = field
          ? node.querySelectorAll('.q-field__native, .q-field__label, .q-field__append .q-icon, .q-field__prefix, .q-field__suffix, .q-field__messages > div')
          : [node.querySelector('.q-checkbox__label, .q-radio__label, .q-toggle__label') ?? node,
            ...node.querySelectorAll('.q-item__label--caption, svg, .q-chip__icon--remove')].filter((part) => !part.closest('.q-checkbox__bg, .q-radio__bg'))
        const focusTarget = node.querySelector('.q-checkbox__inner, .q-radio__inner, .q-toggle__inner') ?? anchor
        const add = (label, paint, backdrop, minimum, present = true, opacity = 1) => entries.push({ name: `${name} ${label}`, paint, backdrop, minimum, present, opacity })
        const inspect = (state) => {
          for (const part of parts) {
            const computed = getComputedStyle(part)
            const icon = part instanceof SVGElement || part.classList.contains('q-icon')
            let opacity = 1
            let hidden = false
            for (let el = part; el && el !== node.parentElement; el = el.parentElement) {
              const style = getComputedStyle(el)
              opacity *= Number(style.opacity)
              hidden ||= style.display === 'none' || style.visibility === 'hidden'
            }
            if (!hidden) add(`${state} ${part.className.baseVal ?? part.className} ink`, part instanceof SVGElement ? computed.fill : computed.color,
              layers(part), icon ? 3 : 4.5, true, opacity)
          }
          const mark = node.querySelector('.q-tab__indicator')
          if (mark && node.getAttribute('aria-selected') === 'true') {
            const paint = getComputedStyle(mark)
            add('selection underline', paint.backgroundColor, layers(node), 3, paint.display !== 'none' && Number(paint.opacity) === 1)
          }
          if (node.matches('.q-item--active')) {
            const rail = getComputedStyle(node, '::before')
            add('current item rail', rail.backgroundColor, layers(node), 3, rail.content === '""' && parseFloat(rail.width) >= 2)
          }
          if (node.matches('.q-btn[aria-current="page"]:is(.q-btn--flat, .q-btn--outline), .q-btn-toggle .q-btn[aria-pressed="true"]')) {
            const dash = getComputedStyle(node, '::after')
            add('selected action dash', dash.borderBottomColor, layers(node), 3, dash.content === '""' && parseFloat(dash.borderBottomWidth) >= 2)
          }
        }
        target.blur()
        if (field) await new Promise(resolve => setTimeout(resolve, 0))
        inspect('unfocused')
        target.focus({ preventScroll: true })
        if (field) await Vue.nextTick()
        inspect('focused')
        const focus = getComputedStyle(focusTarget)
        add('keyboard focus', focus.outlineColor, layers(parseFloat(focus.outlineOffset) < 0 ? focusTarget : focusTarget.parentElement), 3,
          target.matches(':focus-visible') && parseFloat(focus.outlineWidth) >= 1 && focus.outlineStyle === 'solid')
        const action = node.querySelector('.q-chip__icon--remove, .q-field__focusable-action[tabindex]')
        if (action) {
          action.focus({ preventScroll: true })
          const paint = getComputedStyle(action)
          add('secondary action keyboard focus', paint.outlineColor, layers(action), 3,
            action.matches(':focus-visible') && parseFloat(paint.outlineWidth) >= 1 && paint.outlineStyle === 'solid')
          action.blur()
        }
        target.blur()
        if (edges && node.matches('.q-tab')) {
          const paint = getComputedStyle(node)
          add('increased contrast tab edge', paint.outlineColor, layers(node), 3,
            parseFloat(paint.outlineWidth) >= 1 && paint.outlineStyle === 'solid')
        } else if (edges) {
          const mark = node.querySelector('.q-checkbox__bg, .q-radio__bg, .q-toggle__track') ?? anchor
          const paint = getComputedStyle(mark)
          const side = node.matches('.q-field--borderless') && !node.matches('.qds-field--ghost') ? 'bottom' : 'top'
          const face = node.matches('.q-btn-toggle .q-btn[aria-pressed="true"]') ? mark : mark.parentElement
          add('increased contrast boundary', paint.getPropertyValue(`border-${side}-color`), layers(face), 3,
            parseFloat(paint.getPropertyValue(`border-${side}-width`)) >= 1)
        }
      }
    }
    return entries
  }, { edges })
  assert.ok(observations.length > 5000, 'the role surface matrix rendered')
  const failures = []
  for (const { name, paint, backdrop, minimum, present, opacity } of observations) {
    const surface = backdrop.map(rgb).reduce((behind, face) => mix(face, behind, face[3]), [255, 255, 255])
    const ink = rgb(paint)
    const ratio = contrast(mix(ink, surface, ink[3] * opacity), surface)
    if (!present || ratio < minimum) failures.push({ name, present, paint, surface, ratio, minimum })
    else record(scheme, name, ratio, minimum)
  }
  if (failures.length) {
    const unique = new Map(failures.map((failure) => [failure.name.replace(/^[^/]+\//, ''), failure]))
    for (const failure of unique.values()) console.error(JSON.stringify(failure))
  }
  assert.equal(failures.length, 0, `${scheme}: all role surface observations must meet their contrast and visibility thresholds`)
  console.log(`${scheme}: ${observations.length} role-surface observations passed`)
}

async function verifyControlPerimeters(page, scheme) {
  for (const [selector, edge, behind] of [
    ...['outline-button', 'flat-button', 'tonal-button', 'standard-group', 'push-group', 'unelevated-group',
      'segments', 'chip', 'outline-chip', 'solid-chip', 'option-card', 'card', 'glass',
    ].map((id) => [`#${id}`]),
    ...roles.flatMap((role) => [
      [`#fill-${role}`], [`#bar-group-${role}`, undefined, `#bar-${role}`],
    ]),
    ...['date', 'time', 'color-picker', 'editor', 'splitter', 'uploader', 'stepper', 'table'].map((name) =>
      [`#frame-${name} > .q-${name === 'table' ? 'table__container' : name}`]),
    ...designs.map((design) => [`#pagination-${design} [aria-current="page"]`]),
    ['#pagination-flat .q-btn[aria-label="1"]'],
    ['#pagination-input .q-field__control'],
    ...['filled', 'standout', 'readonly', 'borderless'].map((design) =>
      [`[data-edge-field="${design}"] .q-field__control`, design === 'borderless' ? 'bottom' : undefined]),
    ['[data-edge-field="textarea"] .q-field__control'],
    ['#field-group .q-field:first-child .q-field__control', 'left'],
    ['#field-group .q-field:nth-child(2) .q-field__control', 'top'],
    ['#field-group .q-btn', 'right'],
    ['#list [data-current="true"]', undefined, '#list'],
    ['#list [data-current="false"]', undefined, '#list'],
    ['#drawer', 'right'],
    ['#mini-drawer', 'right'],
    ['#neutral-header', 'bottom'],
    ['#neutral-footer-toolbar', 'top'],
    ['#footer-tabs'],
    ['#header-toolbar-accent', 'bottom', '#header-toolbar-accent'],
    ['#footer-toolbar-warning', 'top', '#footer-toolbar-warning'],
    ['#tabs-footer-colored-tabs-info', undefined, '#tabs-footer-colored-tabs-info'],
    ['#tabs-header-direct-dark', undefined, '#header-direct-dark'],
    ['#action-toolbar-accent', undefined, '#toolbar-accent'],
  ]) {
    for (const side of edge ? [edge] : ['top', 'right', 'bottom', 'left']) {
      const prefix = `border-${side}`
      const paint = await read(page, selector, [`${prefix}-width`, `${prefix}-style`, `${prefix}-color`])
      const name = `${selector} ${side} perimeter`
      assert.ok(paint && parseFloat(paint[`${prefix}-width`]) >= 1 && paint[`${prefix}-style`] !== 'none', `${scheme} ${name}`)
      record(scheme, name, paintContrast(paint[`${prefix}-color`], await surface(page, behind ?? 'body')), 3)
    }
  }
}

async function verifyKeyboardParts(page, scheme) {
  await page.keyboard.press('Tab')
  for (const selector of ['#frame-date .q-date__header-link[tabindex="0"]', '#frame-time [role="spinbutton"][tabindex="0"]',
    '#frame-color-picker [role="slider"][tabindex="0"]', '#frame-editor [contenteditable="true"]',
    '#tree [role="treeitem"][tabindex="0"]', '#rating-primary [role="radio"][tabindex="0"]']) {
    const target = page.locator(selector).first()
    const state = () => target.evaluate((el) => {
      const paint = getComputedStyle(el)
      return { width: paint.outlineWidth, style: paint.outlineStyle, ink: paint.outlineColor, focused: el.matches(':focus-visible') }
    })
    await target.blur()
    const behind = await surface(page, selector)
    const edge = await state()
    assert.ok(parseFloat(edge.width) >= 1 && edge.style === 'solid', `${scheme} ${selector} control boundary`)
    record(scheme, `${selector} control boundary`, paintContrast(edge.ink, behind), 3)
    await target.focus()
    const focus = await state()
    assert.ok(focus.focused && parseFloat(focus.width) >= 1 && focus.style === 'solid', `${scheme} ${selector} keyboard focus`)
    record(scheme, `${selector} keyboard focus`, paintContrast(focus.ink, await surface(page, selector)), 3)
    await target.blur()
  }
}

function verifyMenuMark(paint, scheme) {
  assert.equal(paint.menuMark.content, '""')
  assert.notEqual(paint.menuMark.display, 'none')
  assert.ok(parseFloat(paint.menuMark.width) >= 2)
  for (const part of ['menuItem', 'menu']) {
    record(scheme, `current menu mark vs ${part}`, paintContrast(
      paint.menuMark['background-color'], opaque(paint[part]['background-color'], part),
    ), 3)
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
      await verifyRoleControls(page, scheme)
      await verifyBarTabs(page, scheme)
      await verifyRoleSelection(page, scheme, false)
      await verifyChrome(page, scheme, false)
      await verifyDestinations(page, scheme, false)
      await verifyGroupPerimeters(page, scheme, false)

      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })
      assert.ok(await page.evaluate(() => matchMedia('(prefers-reduced-transparency: reduce)').matches))
      for (const selector of ['#glass', '#button', '.q-field__control', '#tabs', '#icon-segments']) {
        const material = await read(page, selector, ['background-color', 'backdrop-filter'])
        opaque(material['background-color'], `${scheme} reduced transparency ${selector}`)
        assert.equal(material['backdrop-filter'], 'none')
      }
      await verifyChrome(page, `${scheme} reduced transparency`, false, false, true)
      for (const id of ['transparent-toolbar', 'transparent-header', 'transparent-header-toolbar', 'transparent-dark-bar',
        ...barRoles.flatMap((role) => [`nested-header-transparent-toolbar-${role}`, `nested-footer-transparent-toolbar-${role}`])]) {
        const selector = `#${id}`
        opaque((await read(page, selector, ['background-color']))['background-color'], `${scheme} ${selector}`)
        record(scheme, `${selector} reduced-transparency text`, paintContrast((await read(page, selector, ['color'])).color, await surface(page, selector)), 4.5)
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
        record(scheme, label, paintContrast(sample.color, fill), 4.5)
      }

      // Every role fill, in every interactive state the profile can reach, is
      // measured against the on-fill text actually painted on it. Pressed is
      // held with a real pointer because Chromium cannot be asked for :active.
      for (const [role, selector, filledRole] of roles.flatMap((role, index) => [
        [role, `#fill-${role}`], [`${actionRole(index)} button in ${role} bar`, `#bar-fill-${role}`, actionRole(index)],
      ])) {
        const rest = await read(page, selector, PAINT)
        record(scheme, `${role} fill rest`, paintContrast(rest.color, opaque(rest['background-color'], `${scheme} ${role} rest`)), 4.5)
        if (filledRole) {
          const normal = await read(page, `#fill-${filledRole}`, ['color', 'background-color'])
          assert.deepEqual(rgb(rest.color), rgb(normal.color), `${scheme} ${role} keeps its on-fill foreground`)
          assert.deepEqual(rgb(rest['background-color']), rgb(normal['background-color']), `${scheme} ${role} keeps its own fill`)
        } else {
          record(scheme, `${role} fill vs page`, contrast(opaque(rest['background-color'], `${scheme} ${role}`), opaque(paint.page['background-color'], `${scheme} page`)), 3)
        }

        await page.hover(selector)
        const hover = await read(page, selector, PAINT)
        record(scheme, `${role} fill hover`, paintContrast(hover.color, opaque(hover['background-color'], `${scheme} ${role} hover`)), 4.5)

        const box = await page.locator(selector).boundingBox()
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        const pressed = await read(page, selector, PAINT)
        await page.mouse.up()
        assert.notEqual(pressed['background-color'], rest['background-color'], `${scheme} ${role} must repaint when pressed`)
        record(scheme, `${role} fill pressed`, paintContrast(pressed.color, opaque(pressed['background-color'], `${scheme} ${role} pressed`)), 4.5)
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

      record(scheme, 'selected menu item', paintContrast(paint.menuItem.color, opaque(paint.menuItem['background-color'], `${scheme} selected item`)), 4.5)
      verifyMenuMark(paint, scheme)

      // Disabled text is exempt from WCAG 1.4.3, so it is measured and reported
      // at the 3:1 non-text floor rather than silently skipped.
      record(scheme, 'disabled button label', paintContrast(paint.disabled.color, opaque(paint.page['background-color'], `${scheme} disabled`)), 3)

      const boundaries = [
        ['button', 'page'], ['field', 'page'], ['tabsTrack', 'page'], ['menu', 'page'], ['menuItem', 'menu'],
      ]
      for (const [part, behind] of boundaries) {
        const ratio = paintContrast(paint[part]['border-top-color'], opaque(paint[behind]['background-color'], scheme))
        assert.ok(ratio < 3, `${scheme} ${part} rest edge should be soft, got ${ratio.toFixed(3)}:1`)
      }
      for (const media of [{ contrast: 'more' }, { contrast: 'no-preference', forcedColors: 'active' }]) {
        await page.emulateMedia({ colorScheme: scheme, ...media })
        await verifyGroupPerimeters(page, `${scheme} ${media.forcedColors ?? media.contrast}`, true)
        await verifyIconSegments(page, `${scheme} ${media.forcedColors ?? media.contrast}`)
        const medium = `${scheme} ${media.forcedColors ?? media.contrast}`
        await verifyControlPerimeters(page, medium)
        if (media.contrast === 'more') {
          await verifyRoleControls(page, medium, true)
          await verifyKeyboardParts(page, medium)
        }
        await verifyRoleSelection(page, medium, media.forcedColors === 'active')
        await verifyChrome(page, medium, media.forcedColors === 'active', true)
        await verifyDestinations(page, medium, media.forcedColors === 'active')
        const enhanced = await observe(page)
        verifyMenuMark(enhanced, medium)
        for (const [part, behind] of boundaries) {
          assert.ok(parseFloat(enhanced[part]['border-top-width']) >= 1, `${scheme} ${part} needs a boundary`)
          const ratio = paintContrast(enhanced[part]['border-top-color'], opaque(enhanced[behind]['background-color'], scheme))
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
        record(scheme, label, paintContrast(sample['border-top-color'], opaque(behind['background-color'], `${scheme} ${label}`)), 3)
      }

      // State indicators that are not text clear the 3:1 non-text minimum on what they sit on.
      record(scheme, 'switch on track vs page', contrast(opaque(paint.toggleOn['background-color'], `${scheme} switch on`), opaque(paint.page['background-color'], `${scheme} page`)), 3)
      record(scheme, 'switch on glyph', paintContrast(paint.glyphOn, opaque(paint.toggleOn['background-color'], `${scheme} switch on`)), 3)
      record(scheme, 'switch off glyph', paintContrast(paint.glyphOff, opaque(paint.toggleOff['background-color'], `${scheme} switch off`)), 3)
      record(scheme, 'checkbox checked vs page', contrast(opaque(paint.checkOn['background-color'], `${scheme} checked`), opaque(paint.page['background-color'], `${scheme} page`)), 3)
      record(scheme, 'slider value bubble', paintContrast(paint.bubbleText.color, opaque(paint.bubble['background-color'], `${scheme} bubble`)), 4.5)
      record(scheme, 'active tab underline', paintContrast(paint.indicator['background-color'], opaque(paint.tabActive['background-color'], `${scheme} selected tab`)), 3)

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
      record(scheme, 'field focus ring', paintContrast(focused['outline-color'], opaque(paint.field['background-color'], `${scheme} focus`)), 3)

      // Error state never falls back to Quasar's native #c10015.
      await page.evaluate(() => window.zen.set({ error: true }))
      const error = await read(page, '.q-field--error .q-field__control', ['border-top-color'])
      assert.notDeepEqual(rgb(error['border-top-color']).slice(0, 3), [193, 0, 21], `${scheme} field error must not use the native #c10015`)
      record(scheme, 'field error boundary', paintContrast(error['border-top-color'], opaque(paint.field['background-color'], `${scheme} error`)), 3)
    } finally { await page.close() }
  }

  // Reading presentation: decorative depth and motion gone, boundaries intact.
  for (const [scheme, bodyClass] of [['light', 'qds-ui qds-variant-zen qds-reading'], ['dark', 'qds-ui qds-variant-zen qds-theme-dark qds-reading']]) {
    const page = await mount(browser, bodyClass)
    try {
      const paint = await observe(page)
      await verifyIconSegments(page, `reading ${scheme}`)
      await verifyRoleSwitches(page, `reading ${scheme}`)
      await verifyRoleSelection(page, `reading ${scheme}`, false)
      await verifyChrome(page, `reading ${scheme}`, false)
      await verifyDestinations(page, `reading ${scheme}`, false)
      verifyMenuMark(paint, `reading ${scheme}`)
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
