import { describe, it, expect } from 'vitest'
import { mount, press } from './helpers.js'

/**
 * Pressing Enter in a list must continue the list without inserting a blank
 * line. CodeMirror's insertNewlineContinueMarkup preserves a loose (non-tight)
 * list by inserting a blank line before each new marker, so once a list has one
 * blank line between items every later Enter adds another. These run through
 * createMarkdownEditor so the default key bindings are what is tested.
 */

function key(doc, keyName, { at = null } = {}) {
  const { editor, cleanup } = mount({ doc })
  editor.view.dispatch({ selection: { anchor: at === null ? doc.length : at } })
  press(editor, keyName)
  const result = { doc: editor.getValue(), cursor: editor.view.state.selection.main.head }
  cleanup()
  return result
}

const enter = (doc, opts) => key(doc, 'Enter', opts)

describe('Enter in the markdown editor', () => {
  it('continues a tight list without a blank line', () => {
    expect(enter('- Anne\n- Bravo').doc).toBe('- Anne\n- Bravo\n- ')
  })

  it('continues a list that is already loose without adding another blank line', () => {
    expect(enter('- Anne\n\n- Bravo').doc).toBe('- Anne\n\n- Bravo\n- ')
  })

  it('leaves the cursor after the new marker', () => {
    const { doc, cursor } = enter('- Anne\n\n- Bravo')
    expect(cursor).toBe(doc.length)
  })

  it('inserts a single line break in plain prose', () => {
    expect(enter('Test Person Alpha').doc).toBe('Test Person Alpha\n')
  })

  it('continues an ordered list with the next number', () => {
    expect(enter('1. Anne\n2. Bravo').doc).toBe('1. Anne\n2. Bravo\n3. ')
  })

  it('does not add a blank line to a loose ordered list', () => {
    expect(enter('1. Anne\n\n2. Bravo').doc).toBe('1. Anne\n\n2. Bravo\n3. ')
  })

  it('continues a blockquote', () => {
    expect(enter('> quoted').doc).toBe('> quoted\n> ')
  })

  it('ends the list on an empty item instead of loosening it', () => {
    const { doc, cursor } = enter('- Anne\n- ')
    expect(doc).toBe('- Anne\n')
    expect(cursor).toBe(doc.length)
  })

  it('continues a nested list at its own level', () => {
    expect(enter('- Anne\n  - Bravo').doc).toBe('- Anne\n  - Bravo\n  - ')
  })

  // Backspace markup deletion comes from the keymap markdown() registers
  // internally; the editor must not shadow it.
  it('deletes list markup on Backspace', () => {
    expect(key('- Anne\n- ', 'Backspace').doc).toBe('- Anne\n  ')
  })
})
