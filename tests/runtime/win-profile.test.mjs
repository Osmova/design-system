import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import Color from 'colorjs.io'
import { chromium, mount, settle, paint, roles } from './fluent-native-fixture.mjs'

const ratio = (a, b) => new Color(a).contrast(new Color(b), 'WCAG21')

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
