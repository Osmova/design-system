import { expect, test } from '@playwright/test'
import { computed, waitForThemePaint } from './helpers'

test('Osmova fields use one border for rest, focus and validation', async ({ page }) => {
  await page.goto('/#forms?variant=default&mode=light')
  await expect(page.locator('body')).toHaveAttribute('data-qds-variant', 'default')
  const control = (state: string) => `[data-test="qds-forms-state-${state}"] .q-field__control`
  const rest = control('rest')
  expect(await computed(page, rest, 'border-radius')).toBe('8px')
  expect(await computed(page, rest, 'height')).toBe('56px')
  expect(await computed(page, rest, 'border-color', '::before')).toBe('rgb(232, 232, 236)')

  for (const [state, color] of [
    ['rest', 'rgb(0, 100, 255)'],
    ['positive', 'rgb(1, 121, 83)'],
    ['warning', 'rgb(124, 97, 27)'],
    ['error', 'rgb(180, 29, 62)'],
  ]) {
    const field = control(state)
    await page.locator(`${field} input`).focus()
    await waitForThemePaint(page)
    expect(await computed(page, field, 'border-color', '::before')).toBe(color)
    expect(await computed(page, field, 'border-width', '::before')).toBe('2px')
    expect(await computed(page, field, 'display', '::after')).toBe('none')
    expect(await computed(page, field, 'box-shadow')).toContain('0px 0px 0px 4px')
  }
})

test('Osmova segments and filter chips share the pill selection treatment', async ({ page }) => {
  await page.goto('/#components?variant=default&mode=light')
  const group = '[data-test="qds-toggle-color"]'
  expect(await computed(page, `${group} [aria-pressed="false"]`, 'background-color')).toBe('rgba(0, 0, 0, 0)')
  expect(await computed(page, `${group} [aria-pressed="false"]`, 'border-color')).toBe('rgb(209, 213, 219)')
  expect(await computed(page, `${group} [aria-pressed="true"]`, 'background-color')).toBe('rgb(31, 41, 55)')
  expect(await computed(page, `${group} [aria-pressed="true"]`, 'color')).toBe('rgb(255, 255, 255)')

  await page.goto('/#forms?variant=default&mode=light')
  const chips = '[data-test="qds-forms-pills"] .q-chip'
  const home = page.locator('[data-test="qds-forms-pills"]').getByRole('button', { name: 'Home', exact: true })
  await home.click()
  await expect(home).toHaveAttribute('aria-pressed', 'true')
  await waitForThemePaint(page)
  expect(await computed(page, `${chips}[aria-pressed="true"]`, 'background-color')).toBe('rgb(31, 41, 55)')
  expect(await computed(page, `${chips}[aria-pressed="true"]`, 'color')).toBe('rgb(255, 255, 255)')
})
