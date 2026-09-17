// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Every dependency is bounded below its next major version, so a future major
 * release cannot break a fresh install while the lockfile keeps tests green.
 * Accepted forms: a caret range on a major >= 1 (`^6.7.1`) or an explicit
 * upper bound (`>=6.7 <7`).
 */
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

function isBounded(range) {
  if (/^\^[1-9]\d*\./.test(range)) return true
  return /<\s*\d/.test(range)
}

describe('dependency ranges', () => {
  for (const field of ['dependencies', 'devDependencies']) {
    for (const [name, range] of Object.entries(pkg[field] || {})) {
      it(`${name} (${field}) is bounded below its next major`, () => {
        expect(isBounded(range)).toBe(true)
      })
    }
  }
})
