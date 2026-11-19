#!/usr/bin/env node
// Byte-compares a 0.x dist/css tree, renamed through rename-map.json, with the current build.
// Usage: check-rename-parity.mjs <baseline-css-dir> [current-css-dir]
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { listFiles, renameText } from './rename-prefix.mjs'

const [baselineArg, currentArg] = process.argv.slice(2)
if (!baselineArg) throw new Error('usage: check-rename-parity.mjs <baseline-css-dir> [current-css-dir]')
const baseline = path.resolve(baselineArg)
const current = path.resolve(currentArg ?? fileURLToPath(new URL('../packages/quasar/dist/css', import.meta.url)))
const before = listFiles(baseline, false).sort()
const after = listFiles(current, false).sort()
const failures = []
let identical = 0
for (const file of new Set([...before, ...after])) {
  if (!before.includes(file) || !after.includes(file)) { failures.push(`${file}: only in ${before.includes(file) ? 'baseline' : 'current'}`); continue }
  const expected = renameText(readFileSync(path.join(baseline, file), 'utf8'))
  const actual = readFileSync(path.join(current, file), 'utf8')
  if (expected === actual) { identical++; continue }
  let i = 0
  while (expected[i] === actual[i]) i++
  failures.push(`${file}: differs at byte ${i}: expected ${JSON.stringify(expected.slice(i, i + 60))}, got ${JSON.stringify(actual.slice(i, i + 60))}`)
}
console.log(`${identical}/${new Set([...before, ...after]).size} files byte-identical after the rename map`)
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1 }
