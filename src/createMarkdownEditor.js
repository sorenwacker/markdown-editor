/**
 * Mounts a CodeMirror markdown editor with the shared default configuration.
 * @module createMarkdownEditor
 */

import { Annotation, Compartment, EditorState, Prec, Transaction } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { insertNewlineTightList, minimalReplacement, multiCursorKeymap } from './markdownEditing.js'

// Marks transactions made by setValue so the change listener can tell them
// apart from edits made in the editor.
const externalValue = Annotation.define()

// Colors come from CSS custom properties so each application maps them to its
// own palette; the fallbacks are the colors graph-core used before extraction.
const theme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--md-editor-bg, transparent)',
    color: 'var(--md-editor-fg, inherit)',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit',
  },
  '.cm-content': {
    padding: '8px',
    caretColor: 'var(--md-editor-caret, #3b82f6)',
  },
  '.cm-line': {
    padding: '0 4px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--md-editor-selection, rgba(59, 130, 246, 0.3)) !important',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--md-editor-caret, #3b82f6)',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--md-editor-gutter-bg, transparent)',
    color: 'var(--md-editor-gutter-fg, #888)',
    border: 'none',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'var(--md-editor-active-line, rgba(127, 127, 127, 0.1))',
  },
})

/**
 * Creates a markdown editor inside `parent`.
 *
 * @param {object} options - Editor options
 * @param {HTMLElement} options.parent - Element the editor is mounted in
 * @param {string} [options.doc=''] - Initial text
 * @param {(text: string) => void} [options.onChange] - Called after every
 *   change made in the editor; not called for setValue
 * @param {import('@codemirror/state').Extension[]} [options.extensions=[]] -
 *   Additional extensions, applied after the defaults
 * @param {boolean} [options.dark=false] - Whether the theme is dark
 * @returns {object} Editor handle (see docs/index.md)
 */
export function createMarkdownEditor({ parent, doc = '', onChange, extensions = [], dark = false }) {
  const darkMode = new Compartment()

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        highlightSelectionMatches(),
        history(),
        markdown(),
        // markdown() already binds Enter and Backspace at Prec.high; only Enter
        // is overridden here, to keep lists tight.
        Prec.highest(keymap.of([{ key: 'Enter', run: insertNewlineTightList }])),
        keymap.of([...multiCursorKeymap, indentWithTab, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        theme,
        darkMode.of(EditorView.darkTheme.of(dark)),
        EditorView.lineWrapping,
        EditorState.allowMultipleSelections.of(true),
        EditorView.updateListener.of(update => {
          if (!onChange || !update.docChanged) return
          if (update.transactions.some(tr => tr.annotation(externalValue))) return
          onChange(update.state.doc.toString())
        }),
        ...extensions,
      ],
    }),
  })

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue(text) {
      const change = minimalReplacement(view.state.doc.toString(), text ?? '')
      if (!change) return
      view.dispatch({
        changes: change,
        annotations: [externalValue.of(true), Transaction.addToHistory.of(false)],
      })
    },
    getSelection() {
      const { from, to } = view.state.selection.main
      return { text: view.state.sliceDoc(from, to), from, to }
    },
    replaceSelection(text) {
      const { from, to } = view.state.selection.main
      view.dispatch({ changes: { from, to, insert: text }, userEvent: 'input' })
    },
    setDark(value) {
      view.dispatch({ effects: darkMode.reconfigure(EditorView.darkTheme.of(!!value)) })
    },
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  }
}
