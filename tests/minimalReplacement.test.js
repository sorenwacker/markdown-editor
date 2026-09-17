import { describe, it, expect } from 'vitest'
import { minimalReplacement } from '../src/index.js'

describe('the smallest change between two texts', () => {
  it('is nothing when they are equal', () => {
    expect(minimalReplacement('same', 'same')).toBeNull()
  })

  it('covers only an inserted span', () => {
    expect(minimalReplacement('ac', 'abc')).toEqual({ from: 1, to: 1, insert: 'b' })
  })

  it('covers only a removed span', () => {
    expect(minimalReplacement('abc', 'ac')).toEqual({ from: 1, to: 2, insert: '' })
  })

  it('covers only a replaced span', () => {
    expect(minimalReplacement('a-one-z', 'a-two-z')).toEqual({ from: 2, to: 5, insert: 'two' })
  })

  it('reproduces the target text when applied', () => {
    const pairs = [
      ['', 'hello'],
      ['hello', ''],
      ['line one\nline two', 'line one\nline 2\nline three'],
      ['aaa', 'aa'],
    ]
    for (const [current, next] of pairs) {
      const c = minimalReplacement(current, next)
      expect(current.slice(0, c.from) + c.insert + current.slice(c.to)).toBe(next)
    }
  })
})
