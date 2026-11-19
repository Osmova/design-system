import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))

test('generated Sass token maps match tokens/**/*.tokens.json', () => {
  const run = spawnSync(process.execPath, ['scripts/build-tokens.mjs', '--check'], { cwd: root, encoding: 'utf8' })
  assert.equal(run.status, 0, run.stderr)
})
