import { describe, it, expect, vi, afterEach } from 'vitest'
import { EditorView } from '@codemirror/view'
import { undo } from '@codemirror/commands'
import { mount } from './helpers.js'

let cleanups = []
function mounted(options) {
  const m = mount(options)
  cleanups.push(m.cleanup)
  return m
}
afterEach(() => {
  cleanups.forEach(c => c())
  cleanups = []
})

describe('createMarkdownEditor', () => {
  it('mounts in the parent with the initial text', () => {
    const { editor, parent } = mounted({ doc: '# Title' })
    expect(parent.querySelector('.cm-editor')).not.toBeNull()
    expect(editor.getValue()).toBe('# Title')
  })

  it('defaults to an empty document', () => {
    const { editor } = mounted()
    expect(editor.getValue()).toBe('')
  })

  it('calls onChange with the full text after an edit in the editor', () => {
    const onChange = vi.fn()
    const { editor } = mounted({ doc: 'ab', onChange })
    editor.view.dispatch({ changes: { from: 1, insert: 'X' }, userEvent: 'input.type' })
    expect(onChange).toHaveBeenCalledWith('aXb')
  })

  it('does not call onChange for setValue', () => {
    const onChange = vi.fn()
    const { editor } = mounted({ doc: 'one', onChange })
    editor.setValue('two')
    expect(editor.getValue()).toBe('two')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps the caret where it was when setValue changes text after it', () => {
    const { editor } = mounted({ doc: 'first line\nsecond line' })
    editor.view.dispatch({ selection: { anchor: 5 } })
    editor.setValue('first line\nsecond line\nthird line')
    expect(editor.view.state.selection.main.head).toBe(5)
  })

  it('keeps the caret where it was when setValue changes text before it', () => {
    const { editor } = mounted({ doc: 'alpha\nomega' })
    editor.view.dispatch({ selection: { anchor: 8 } })
    editor.setValue('ALPHA\nomega')
    expect(editor.view.state.selection.main.head).toBe(8)
  })

  it('does not undo a setValue as if it were the user\'s edit', () => {
    const { editor } = mounted({ doc: 'text' })
    editor.view.dispatch({ changes: { from: 4, insert: ' typed' }, userEvent: 'input.type' })
    editor.setValue('TEXT typed')
    undo(editor.view)
    expect(editor.getValue()).toBe('TEXT')
  })

  it('reads and replaces the main selection', () => {
    const { editor } = mounted({ doc: 'hello world' })
    editor.view.dispatch({ selection: { anchor: 6, head: 11 } })
    expect(editor.getSelection()).toEqual({ text: 'world', from: 6, to: 11 })
    editor.replaceSelection('there')
    expect(editor.getValue()).toBe('hello there')
  })

  it('applies extra extensions', () => {
    const { editor } = mounted({ extensions: [EditorView.editable.of(false)] })
    expect(editor.view.contentDOM.getAttribute('contenteditable')).toBe('false')
  })

  it('switches the dark flag at runtime', () => {
    const { editor } = mounted({ dark: false })
    expect(editor.view.state.facet(EditorView.darkTheme)).toBe(false)
    editor.setDark(true)
    expect(editor.view.state.facet(EditorView.darkTheme)).toBe(true)
  })

  it('takes its colors from the documented CSS custom properties', () => {
    mounted()
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n')
      + [...(document.adoptedStyleSheets || [])].flatMap(s => [...s.cssRules].map(r => r.cssText)).join('\n')
    for (const property of [
      '--md-editor-bg', '--md-editor-fg', '--md-editor-gutter-bg', '--md-editor-gutter-fg',
      '--md-editor-active-line', '--md-editor-caret', '--md-editor-selection',
    ]) {
      expect(css).toContain(property)
    }
  })

  it('removes itself from the parent on destroy', () => {
    const { editor, parent } = mount({ doc: 'x' })
    editor.destroy()
    expect(parent.querySelector('.cm-editor')).toBeNull()
    parent.remove()
  })
})
