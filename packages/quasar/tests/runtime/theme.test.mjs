import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
  createDesignSystemController, configureDesignSystem, DEFAULT_DESIGN_SYSTEM_OPTIONS,
  DESIGN_SYSTEM_VARIANTS, SHADCN_ACCENT_COLORS, SHADCN_BASE_COLORS, isShadcnBaseColor, isBuiltInDesignSystemVariantName,
  INK_COLORS, isInkColor,
} from '@osmova/ds-quasar'
import { createDesignSystemController as runtimeExport } from '@osmova/ds-quasar/runtime'
import { SHADCN_BASE_COLORS as themesExport, INK_COLORS as inkThemesExport } from '@osmova/ds-quasar/themes'

const storageKey = DEFAULT_DESIGN_SYSTEM_OPTIONS.storageKey
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
afterEach(() => {
  for (const [name, descriptor] of [['window', originalWindow], ['document', originalDocument]]) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else delete globalThis[name]
  }
})

function target() {
  const classes = new Set(['author-class'])
  return {
    dataset: { author: 'retained' }, classes,
    classList: {
      toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name) },
      remove(...names) { names.forEach((name) => classes.delete(name)) },
    },
  }
}

function browser(stored, prefersDark = false, legacyListener = false) {
  const body = target()
  const storage = new Map(stored === undefined ? [] : [[storageKey, typeof stored === 'string' ? stored : JSON.stringify(stored)]])
  const listeners = new Set()
  const media = { matches: prefersDark }
  const add = (_event, callback) => listeners.add(callback)
  const remove = (_event, callback) => listeners.delete(callback)
  if (legacyListener) {
    media.addListener = (callback) => add('change', callback)
    media.removeListener = (callback) => remove('change', callback)
  } else {
    media.addEventListener = add
    media.removeEventListener = remove
  }
  globalThis.document = { body }
  globalThis.window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    matchMedia: () => media,
  }
  return {
    body, storage, listeners,
    change(matches) { media.matches = matches; listeners.forEach((callback) => callback({ matches })) },
  }
}

test('compiled package entrypoints expose every canonical variant and five exact base colors', () => {
  assert.equal(runtimeExport, createDesignSystemController)
  assert.equal(themesExport, SHADCN_BASE_COLORS)
  assert.deepEqual(SHADCN_BASE_COLORS.map(({ name }) => name), ['neutral', 'gray', 'zinc', 'stone', 'slate'])
  assert.deepEqual(Object.keys(DESIGN_SYSTEM_VARIANTS), ['win', 'ink', 'one', 'term', 'shadcn', 'zen', 'default', 'glass'])
  assert.equal(DESIGN_SYSTEM_VARIANTS.shadcn.cssClass, 'ods-variant-shadcn')
  assert.equal(isBuiltInDesignSystemVariantName('shadcn'), true)
  assert.equal(DESIGN_SYSTEM_VARIANTS.zen.cssClass, 'ods-variant-zen')
  assert.equal(isBuiltInDesignSystemVariantName('zen'), true)
  assert.equal(DESIGN_SYSTEM_VARIANTS.glass.cssClass, 'ods-variant-glass')
  assert.equal(isBuiltInDesignSystemVariantName('glass'), true)
  assert.equal(DESIGN_SYSTEM_VARIANTS.default.cssClass, 'ods-variant-default')
  assert.equal(isBuiltInDesignSystemVariantName('default'), true)
  assert.equal(DEFAULT_DESIGN_SYSTEM_OPTIONS.variant, 'win')
  assert.equal(DEFAULT_DESIGN_SYSTEM_OPTIONS.mode, 'system')
  for (const bad of [undefined, null, '', 'Gray', 'gray ', '__proto__', 'toString', {}, ['slate'], 1]) {
    assert.equal(isShadcnBaseColor(bad), false)
  }
})

test('mandatory SSR: target:null + persist:true initializes, switches and destroys without any DOM', () => {
  delete globalThis.window
  delete globalThis.document
  const controller = createDesignSystemController({ target: null, persist: true, variant: 'shadcn', shadcnBaseColor: 'stone' })
  controller.initialize()
  controller.initialize()
  assert.equal(controller.state.initialized, true)
  assert.equal(controller.resolvedMode.value, 'light')
  assert.equal(controller.shadcnBaseColor.value, 'stone')
  for (const { name } of SHADCN_BASE_COLORS) assert.equal(controller.setShadcnBaseColor(name), name)
  controller.setDark()
  assert.equal(controller.isDark.value, true)
  controller.setVariant('win')
  assert.equal(controller.shadcnBaseColor.value, 'slate')
  controller.destroy()
  controller.destroy()
  assert.equal(controller.state.initialized, false)
  controller.initialize()
  assert.equal(controller.variant.value, 'win')
  assert.equal(controller.shadcnBaseColor.value, 'slate')
  controller.destroy()
})

test('explicit target:null does not fall back to body when document exists', () => {
  const env = browser()
  const controller = createDesignSystemController({ target: null, persist: true, variant: 'shadcn' })
  controller.initialize()
  controller.setShadcnBaseColor('zinc')
  controller.destroy()
  assert.deepEqual(env.body.dataset, { author: 'retained' })
  assert.deepEqual([...env.body.classes], ['author-class'])
})

test('all palettes switch on the same custom target and persist with mode and variant', () => {
  const env = browser()
  const subtree = target()
  const darkCalls = []
  const controller = createDesignSystemController({ target: subtree, variant: 'shadcn', mode: 'light', rootClass: 'extra-scope' }, { dark: { set: (value) => darkCalls.push(value) } })
  controller.initialize()
  for (const { name } of SHADCN_BASE_COLORS) {
    controller.setShadcnBaseColor(name)
    assert.equal(subtree.dataset.odsShadcnBaseColor, name)
    assert.equal(subtree.dataset.odsVariant, 'shadcn')
    assert.equal(subtree.dataset.odsMode, 'light')
    assert.deepEqual(JSON.parse(env.storage.get(storageKey)), { mode: 'light', variant: 'shadcn', shadcnBaseColor: name, shadcnAccent: 'none', inkColor: 'charcoal' })
  }
  controller.setDark()
  assert.equal(subtree.dataset.odsResolved, 'dark')
  assert.equal(darkCalls.at(-1), true)
  controller.setVariant('one')
  assert.equal(subtree.dataset.odsShadcnBaseColor, undefined)
  assert.equal(controller.shadcnBaseColor.value, 'slate')
  controller.setVariant('shadcn')
  assert.equal(subtree.dataset.odsShadcnBaseColor, 'slate')
  assert.equal(subtree.classes.has('ods-variant-one'), false)
  assert.equal(subtree.classes.has('ods-variant-shadcn'), true)
  assert.deepEqual(env.body.dataset, { author: 'retained' })
  controller.destroy()
  assert.deepEqual(subtree.dataset, { author: 'retained' })
  assert.deepEqual([...subtree.classes], ['author-class'])
  assert.equal(env.listeners.size, 0)
})

test('shadcn accent applies only on shadcn, persists, and falls back to none', () => {
  const env = browser()
  const subtree = target()
  const controller = createDesignSystemController({ target: subtree, variant: 'shadcn', mode: 'light', shadcnAccent: 'blue' })
  controller.initialize()
  assert.equal(subtree.dataset.odsShadcnAccent, 'blue')
  assert.equal(controller.setShadcnAccent('blue'), 'blue')
  assert.equal(JSON.parse(env.storage.get(storageKey)).shadcnAccent, 'blue')
  controller.setVariant('win')
  assert.equal(subtree.dataset.odsShadcnAccent, undefined)
  assert.equal(controller.shadcnAccent.value, 'blue')
  controller.setVariant('shadcn')
  assert.equal(subtree.dataset.odsShadcnAccent, 'blue')
  assert.equal(controller.setShadcnAccent('purple'), 'none')
  assert.equal(subtree.dataset.odsShadcnAccent, undefined)
  assert.ok(SHADCN_ACCENT_COLORS.some((accent) => accent.name === 'blue'))
  controller.destroy()
  assert.deepEqual(subtree.dataset, { author: 'retained' })
})

test('ink colours: exports, attribute only on ink (legacy feather too), persistence, cleanup', () => {
  assert.equal(inkThemesExport, INK_COLORS)
  assert.deepEqual(INK_COLORS.map(({ name, label }) => [name, label]), [['charcoal', 'Charcoal'], ['black', 'Black'], ['navy', 'Navy']])
  assert.equal(DEFAULT_DESIGN_SYSTEM_OPTIONS.inkColor, 'charcoal')
  for (const bad of [undefined, null, '', 'Navy', 'navy ', '__proto__', 'toString', {}, ['black'], 1]) {
    assert.equal(isInkColor(bad), false)
  }
  const env = browser()
  const subtree = target()
  const controller = createDesignSystemController({ target: subtree, variant: 'ink', mode: 'light' })
  controller.initialize()
  assert.equal(controller.inkColor.value, 'charcoal')
  assert.equal(subtree.dataset.odsInk, 'charcoal')
  for (const { name } of INK_COLORS) {
    assert.equal(controller.setInkColor(name), name)
    assert.equal(subtree.dataset.odsInk, name)
    assert.equal(controller.state.inkColor, name)
    assert.deepEqual(JSON.parse(env.storage.get(storageKey)), { mode: 'light', variant: 'ink', shadcnBaseColor: 'neutral', shadcnAccent: 'none', inkColor: name })
  }
  controller.setVariant('shadcn')
  assert.equal(subtree.dataset.odsInk, undefined)
  assert.equal(subtree.dataset.odsShadcnBaseColor, 'neutral')
  assert.equal(controller.inkColor.value, 'navy')
  controller.setInkColor('black')
  assert.equal(subtree.dataset.odsInk, undefined)
  assert.equal(controller.setVariant('feather'), 'ink')
  assert.equal(subtree.dataset.odsInk, 'black')
  assert.equal(subtree.dataset.odsShadcnBaseColor, undefined)
  controller.destroy()
  assert.deepEqual(subtree.dataset, { author: 'retained' })
  assert.deepEqual(env.body.dataset, { author: 'retained' })

  browser()
  const legacy = createDesignSystemController({ persist: false, variant: 'feather', inkColor: 'navy' })
  legacy.initialize()
  assert.equal(document.body.dataset.odsInk, 'navy')
  legacy.destroy()
  assert.equal(document.body.dataset.odsInk, undefined)
})

test('stored ink colour wins; absent old field preserves configured colour; invalid values normalise Charcoal', () => {
  for (const [stored, config, expected] of [
    [{ mode: 'dark', variant: 'ink', inkColor: 'black' }, 'charcoal', 'black'],
    [{ mode: 'dark', variant: 'ink', shadcnBaseColor: 'slate' }, 'navy', 'navy'],
    [{ mode: 'light', variant: 'term' }, undefined, 'charcoal'],
    [{ inkColor: null }, 'black', 'charcoal'],
    [{ inkColor: 'unknown' }, 'black', 'charcoal'],
  ]) {
    const env = browser(stored)
    const controller = createDesignSystemController({ mode: 'light', variant: 'ink', inkColor: config })
    controller.initialize()
    assert.equal(controller.inkColor.value, expected)
    assert.equal(env.body.dataset.odsInk, controller.variant.value === 'ink' ? expected : undefined)
    controller.destroy()
  }
  browser()
  for (const bad of [null, 'Black', 'bad', '', '__proto__', 'toString', {}, ['black'], 42, false]) {
    const controller = createDesignSystemController({ inkColor: bad, persist: false, variant: 'ink' })
    controller.initialize()
    assert.equal(controller.inkColor.value, 'charcoal')
    controller.setInkColor('black')
    assert.equal(controller.setInkColor(bad), 'charcoal')
    assert.equal(document.body.dataset.odsInk, 'charcoal')
    controller.destroy()
  }
})

test('mandatory SSR: ink colour switches and persists state without any DOM', () => {
  delete globalThis.window
  delete globalThis.document
  const controller = createDesignSystemController({ target: null, persist: true, variant: 'ink', inkColor: 'black' })
  controller.initialize()
  assert.equal(controller.inkColor.value, 'black')
  for (const { name } of INK_COLORS) assert.equal(controller.setInkColor(name), name)
  controller.setVariant('win')
  controller.destroy()
  controller.initialize()
  assert.equal(controller.inkColor.value, 'navy')
  controller.destroy()
})

test('stored palette wins; absent old field preserves configured palette or defaults Neutral', () => {
  for (const [stored, config, expected] of [
    [{ mode: 'dark', variant: 'shadcn', shadcnBaseColor: 'gray' }, 'stone', 'gray'],
    [{ mode: 'dark', variant: 'ink' }, 'slate', 'slate'],
    [{ mode: 'light', variant: 'term' }, undefined, 'neutral'],
    [{ shadcnBaseColor: null }, 'slate', 'neutral'],
    [{ shadcnBaseColor: 'unknown' }, 'stone', 'neutral'],
  ]) {
    browser(stored)
    const controller = createDesignSystemController({ mode: 'light', variant: 'shadcn', shadcnBaseColor: config })
    controller.initialize()
    assert.equal(controller.shadcnBaseColor.value, expected)
    assert.equal(controller.mode.value, stored.mode ?? 'light')
    assert.equal(controller.variant.value, stored.variant ?? 'shadcn')
    controller.destroy()
  }
})

test('invalid JavaScript palette values normalize Neutral in configuration and setter', () => {
  browser()
  for (const bad of [null, 'Slate', 'bad', '', '__proto__', 'toString', {}, ['gray'], 42, false]) {
    const controller = createDesignSystemController({ shadcnBaseColor: bad, persist: false })
    controller.initialize()
    assert.equal(controller.shadcnBaseColor.value, 'neutral')
    controller.setShadcnBaseColor('gray')
    assert.equal(controller.setShadcnBaseColor(bad), 'neutral')
    controller.destroy()
  }
})

test('system lifecycle is idempotent, responds to media changes and detaches both listener APIs', () => {
  for (const legacy of [false, true]) {
    const env = browser(undefined, true, legacy)
    const controller = createDesignSystemController({ persist: false, variant: 'shadcn', shadcnBaseColor: 'gray' })
    controller.initialize()
    controller.initialize()
    assert.equal(env.listeners.size, 1)
    assert.equal(controller.resolvedMode.value, 'dark')
    env.change(false)
    assert.equal(controller.resolvedMode.value, 'light')
    controller.setDark()
    env.change(false)
    assert.equal(controller.resolvedMode.value, 'dark')
    controller.setSystem()
    assert.equal(controller.resolvedMode.value, 'light')
    controller.destroy()
    assert.equal(env.listeners.size, 0)
    env.change(true)
    assert.equal(env.body.dataset.odsResolved, undefined)
    controller.initialize()
    assert.equal(env.listeners.size, 1)
    assert.equal(controller.resolvedMode.value, 'dark')
    controller.destroy()
  }
})

test('disabled persistence, malformed storage and blocked storage do not break switching', () => {
  const env = browser({ shadcnBaseColor: 'gray', variant: 'shadcn' })
  const previous = env.storage.get(storageKey)
  const controller = createDesignSystemController({ persist: false, syncWithSystem: false, shadcnBaseColor: 'stone' })
  controller.initialize()
  controller.setShadcnBaseColor('slate')
  assert.equal(env.listeners.size, 0)
  assert.equal(env.storage.get(storageKey), previous)
  controller.destroy()
  for (const value of ['{broken', 'null']) {
    const broken = browser(value)
    const c = createDesignSystemController({ shadcnBaseColor: 'zinc' })
    c.initialize()
    assert.equal(c.shadcnBaseColor.value, 'zinc')
    assert.equal(broken.storage.has(storageKey), false)
    c.destroy()
  }
  browser()
  Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked') } })
  const blocked = createDesignSystemController({ variant: 'shadcn' })
  blocked.initialize()
  assert.equal(blocked.setShadcnBaseColor('slate'), 'slate')
  assert.equal(blocked.setDark(), 'dark')
  blocked.destroy()
})

test('existing aliases and externally registered variants remain unchanged', () => {
  const env = browser()
  const variants = { custom: { name: 'custom', label: 'Custom', cssClass: 'custom-theme' } }
  const themes = { extra: { name: 'extra', label: 'Extra', variants: { alternate: { name: 'alternate', label: 'Alternate', cssClass: 'alternate-theme' } } } }
  const c = createDesignSystemController({ variants, themes, persist: false, variant: 'custom', shadcnBaseColor: 'gray' })
  c.initialize()
  assert.equal(env.body.classes.has('custom-theme'), true)
  c.setVariant('alternate')
  assert.equal(env.body.classes.has('custom-theme'), false)
  assert.equal(env.body.classes.has('alternate-theme'), true)
  for (const [alias, canonical] of Object.entries({ fluent: 'win', air: 'win', studio: 'win', feather: 'ink', mobile: 'one', terminal: 'term' })) {
    assert.equal(c.setVariant(alias), canonical)
    assert.equal(env.body.classes.has(`ods-variant-${canonical}`), true)
    assert.equal(Object.keys(DESIGN_SYSTEM_VARIANTS).includes(alias), false)
  }
  assert.equal(c.shadcnBaseColor.value, 'gray')
  c.destroy()
  assert.deepEqual([...env.body.classes], ['author-class'])
})

test('glass is its own variant, no longer a win alias, while fluent, air and studio still are', () => {
  const configured = browser()
  const c = createDesignSystemController({ persist: false, variant: 'glass' })
  c.initialize()
  assert.equal(c.variant.value, 'glass')
  assert.equal(configured.body.classes.has('ods-variant-glass'), true)
  assert.equal(configured.body.classes.has('ods-variant-win'), false)
  assert.equal(configured.body.dataset.odsVariant, 'glass')
  assert.equal(c.setVariant('glass'), 'glass')
  for (const alias of ['fluent', 'air', 'studio']) {
    assert.equal(c.setVariant(alias), 'win')
    assert.equal(configured.body.classes.has('ods-variant-win'), true)
    assert.equal(configured.body.classes.has('ods-variant-glass'), false)
  }
  c.destroy()

  for (const [stored, expected] of [['glass', 'glass'], ['fluent', 'win'], ['air', 'win'], ['studio', 'win']]) {
    const env = browser({ mode: 'light', variant: stored })
    const restored = createDesignSystemController()
    restored.initialize()
    assert.equal(restored.variant.value, expected, `stored ${stored} resolves to ${expected}`)
    assert.equal(env.body.classes.has(`ods-variant-${expected}`), true)
    restored.destroy()
  }
})

test('configureDesignSystem initializes and provides the complete compiled public controller', () => {
  const env = browser()
  const provided = []
  const app = { config: { globalProperties: {} }, provide: (...args) => provided.push(args) }
  const c = configureDesignSystem(app, { variant: 'shadcn', shadcnBaseColor: 'slate' })
  assert.equal(app.config.globalProperties.$designSystem, c)
  assert.equal(provided[0][1], c)
  assert.equal(c.state.initialized, true)
  assert.equal(env.body.dataset.odsShadcnBaseColor, 'slate')
  c.destroy()
})

test('stale ods-variant-fluent is removed and a missing variant stylesheet warns once in development only', (t) => {
  const env = browser()
  env.body.classes.add('ods-variant-fluent')
  const loaded = new Set(['win'])
  globalThis.getComputedStyle = (element) => ({
    getPropertyValue: (name) => {
      const variant = [...element.classes].find((c) => c.startsWith('ods-variant-'))?.slice(12)
      return name === '--_ods-variant' && loaded.has(variant) ? ` ${variant}` : ''
    },
  })
  t.after(() => { delete globalThis.getComputedStyle })
  const warn = t.mock.method(console, 'warn', () => {})
  const c = createDesignSystemController({ persist: false, variant: 'win' })
  c.initialize()
  assert.equal(env.body.classes.has('ods-variant-fluent'), false)
  assert.equal(warn.mock.callCount(), 0)
  c.setVariant('zen')
  c.setDark()
  c.setVariant('zen')
  assert.equal(warn.mock.callCount(), 1)
  assert.match(warn.mock.calls[0].arguments[0], /"zen".*css\/variants\/zen/)
  loaded.add('glass')
  c.setVariant('glass')
  c.setVariant('custom-unknown')
  assert.equal(warn.mock.callCount(), 1)
  c.destroy()

  globalThis.getComputedStyle = () => { throw new Error('boom') }
  assert.doesNotThrow(() => { const d = createDesignSystemController({ persist: false, variant: 'ink' }); d.initialize(); d.destroy() })

  const nodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  t.after(() => { if (nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = nodeEnv })
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' })
  const p = createDesignSystemController({ persist: false, variant: 'ink' })
  p.initialize()
  p.destroy()
  assert.equal(warn.mock.callCount(), 1)
})
