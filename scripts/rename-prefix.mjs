#!/usr/bin/env node
// Applies scripts/rename-map.json (qds -> ods).
// Usage: rename-prefix.mjs [--check] | --dir <path> [--check]
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, renameSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const MAP = JSON.parse(readFileSync(new URL('rename-map.json', import.meta.url), 'utf8'))
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const RULES = MAP.rules.map((rule) => ({
  kind: rule.kind,
  regex: new RegExp(rule.find ? escape(rule.find) : rule.pattern, 'g'),
  replace: rule.replace,
}))
const TOKEN = /(?<![A-Za-z0-9_-])qds-[A-Za-z0-9_-]*/g

export function renameText(text, { keep, stats } = {}) {
  const masked = []
  let out = keep ? text.replace(TOKEN, (t) => (keep(t) ? `\0${masked.push(t) - 1}\0` : t)) : text
  for (const rule of RULES) {
    out = out.replace(rule.regex, (match, ...args) => {
      if (stats) {
        const offset = args.at(-2)
        const source = args.at(-1)
        const tail = source.slice(offset + match.length).match(/^[A-Za-z0-9_-]*/)[0]
        const entry = (stats[rule.kind] ??= { occurrences: 0, identifiers: new Set() })
        entry.occurrences++
        entry.identifiers.add(match + tail)
      }
      return rule.replace
    })
  }
  return masked.length ? out.replace(/\0(\d+)\0/g, (_, i) => masked[i]) : out
}

const globToRegex = (glob) => new RegExp(`^${glob.split('**/').map((part) => part.split('**').map((p) => p.split('*').map(escape).join('[^/]*')).join('.*')).join('(?:.*/)?')}$`)
const KEEP_FILES = MAP.keep.files.map(globToRegex)
const kept = (file) => KEEP_FILES.some((re) => re.test(file))
const isText = (buf) => !buf.subarray(0, 8000).includes(0)

export function deriveKeep(files) {
  const keep = new Set(MAP.keep.tokens)
  const add = (value) => { if (/^qds-[A-Za-z0-9_-]+$/.test(value)) keep.add(value) }
  for (const { file, text } of files) {
    if (text === null) continue
    for (const [, value] of text.matchAll(/(?<!:)data-test="(qds-[^"]*)"/g)) add(value.split('${')[0])
    for (const [, expr] of text.matchAll(/:data-test="([^"]*)"/g)) {
      for (const [, value] of expr.matchAll(/[`'](qds-[^`'$]*)/g)) add(value)
    }
  }
  for (const { file } of files) {
    if (file.includes('__screens__/')) {
      for (const [name] of path.basename(file).matchAll(/qds-[a-z0-9-]+/g)) {
        add(name.replace(/-(?:light|dark)(?:-.*)?$/, '').replace(/-(?:desktop|mobile).*$/, ''))
      }
    }
  }
  return keep
}

export function publicNames(files) {
  const names = new Set()
  for (const { file, text } of files) {
    if (text === null || !/^packages\/[^/]+\/(src|dist)\//.test(file)) continue
    for (const [name] of text.matchAll(/(?<![A-Za-z0-9_-])[qo]ds-[A-Za-z0-9_-]*/g)) names.add(`q${name.slice(1)}`)
  }
  return names
}

export function listFiles(dir, useGit) {
  if (useGit) return execFileSync('git', ['ls-files', '-z'], { cwd: dir, encoding: 'utf8' }).split('\0').filter(Boolean)
  const walk = (rel) => readdirSync(path.join(dir, rel)).flatMap((name) => {
    const child = path.join(rel, name)
    return statSync(path.join(dir, child)).isDirectory() ? walk(child) : [child]
  })
  return walk('')
}

export function buildKeep(dir, all) {
  const tokens = deriveKeep(all)
  const distCss = path.join(dir, 'packages/quasar/dist/css')
  const builtCss = existsSync(distCss) ? listFiles(distCss, false).map((file) => ({ file: `packages/quasar/dist/css/${file}`, text: readFileSync(path.join(distCss, file), 'utf8') })) : []
  const pub = publicNames([...all, ...builtCss])
  const conflicts = [...tokens].filter((k) => pub.has(k))
  if (conflicts.length) throw new Error(`kept test hooks collide with public names: ${conflicts.join(', ')}`)
  const prefixes = [...tokens].filter((k) => k.endsWith('-'))
  return { tokens, pub, keep: (t) => tokens.has(t) || (!pub.has(t) && prefixes.some((p) => t.startsWith(p))) }
}


function run({ dir, useGit, check }) {
  const all = listFiles(dir, useGit).map((file) => {
    const buf = readFileSync(path.join(dir, file))
    return { file, buf, text: isText(buf) ? buf.toString('utf8') : null }
  })
  const { tokens, keep } = useGit ? buildKeep(dir, all) : { tokens: new Set() }
  const stats = {}
  const leftovers = []
  const moves = []
  for (const { file, text } of all) {
    if (kept(file)) continue
    const base = path.basename(file)
    const renamedBase = renameText(base, { keep })
    if (renamedBase !== base) moves.push([file, path.join(path.dirname(file), renamedBase)])
    if (text === null) continue
    const next = renameText(text, { keep, stats })
    if (next === text) continue
    if (check) {
      text.split('\n').forEach((line, i) => { if (renameText(line, { keep }) !== line) leftovers.push(`${file}:${i + 1}: ${line.trim().slice(0, 160)}`) })
    } else writeFileSync(path.join(dir, file), next)
  }
  if (check) {
    for (const [from, to] of moves) leftovers.push(`${from}: path would become ${to}`)
    if (leftovers.length) { console.error(leftovers.join('\n')); process.exitCode = 1 }
    console.log(`${leftovers.length} occurrence(s) left outside the kept files and tokens (${tokens.size} kept tokens)`)
    return
  }
  for (const [from, to] of moves) {
    if (useGit) execFileSync('git', ['mv', from, to], { cwd: dir })
    else renameSync(path.join(dir, from), path.join(dir, to))
  }
  const summary = Object.fromEntries(Object.entries(stats).map(([kind, s]) => [kind, { occurrences: s.occurrences, identifiers: s.identifiers.size }]))
  console.log(JSON.stringify({ keptTokens: tokens.size, movedFiles: moves.length, kinds: summary }, null, 2))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const dirIndex = args.indexOf('--dir')
  run({ dir: dirIndex >= 0 ? path.resolve(args[dirIndex + 1]) : ROOT, useGit: dirIndex < 0, check: args.includes('--check') })
}
