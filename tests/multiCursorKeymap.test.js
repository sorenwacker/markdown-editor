import { describe, it, expect, afterEach } from 'vitest'
import { multiCursorKeymap } from '../src/index.js'
import { mount } from './helpers.js'

let cleanup = () => {}
afterEach(() => cleanup())

function run(doc, anchor, key) {
  const m = mount({ doc })
  cleanup = m.cleanup
  m.editor.view.dispatch({ selection: { anchor } })
  const handled = multiCursorKeymap.find(b => b.key === key).run(m.editor.view)
  return { handled, heads: m.editor.view.state.selection.ranges.map(r => r.head) }
}

describe('multi-cursor bindings', () => {
  it('adds a cursor on the line above at the same column', () => {
    expect(run('abcd\nefgh', 7, 'Alt-ArrowUp')).toEqual({ handled: true, heads: [2, 7] })
  })

  it('adds a cursor on the line below, clamped to its length', () => {
    expect(run('abcdef\nxy', 5, 'Alt-ArrowDown')).toEqual({ handled: true, heads: [5, 9] })
  })

  it('does nothing on the first line when adding above', () => {
    expect(run('abc\ndef', 1, 'Alt-ArrowUp')).toEqual({ handled: false, heads: [1] })
  })
})
