/**
 * Editor commands for markdown text.
 * @module markdownEditing
 */

import { EditorSelection } from '@codemirror/state'
import { insertNewlineContinueMarkupCommand } from '@codemirror/lang-markdown'

// `nonTightLists: false` makes Enter on an empty list item end the list. The
// default instead moves the item down a line, which is how a list acquires the
// blank line that then repeats on every following Enter.
const continueMarkup = insertNewlineContinueMarkupCommand({ nonTightLists: false })

/**
 * Continues a markdown list or blockquote on Enter without inserting a blank
 * line between items.
 *
 * CodeMirror's markup-continuing Enter preserves a loose list: when the list
 * already has a blank line between two items it inserts another blank line
 * ahead of each new marker. That makes the looseness self-perpetuating, so one
 * stray blank line turns every later Enter into two. lang-markdown's
 * `nonTightLists` option ends the list on an empty item, which stops a list
 * acquiring that first blank line, but it does not cover an already-loose list.
 * For that the transaction is captured and its leading blank line dropped
 * before it is applied. Non-list context is left to the next binding.
 *
 * @param {import('@codemirror/view').EditorView} view - The editor view receiving the keypress
 * @returns {boolean} True if the command handled the keypress
 */
export function insertNewlineTightList(view) {
  let captured = null
  const handled = continueMarkup({
    state: view.state,
    dispatch: tr => {
      captured = tr
    },
  })
  if (!handled || !captured) return false

  const doubled = view.state.lineBreak + view.state.lineBreak
  const changes = []
  let trimmed = 0
  captured.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    const text = inserted.toString()
    if (text.startsWith(doubled)) {
      changes.push({ from: fromA, to: toA, insert: text.slice(view.state.lineBreak.length) })
      trimmed += view.state.lineBreak.length
    } else {
      changes.push({ from: fromA, to: toA, insert: text })
    }
  })

  if (trimmed === 0) {
    view.dispatch(captured)
    return true
  }

  view.dispatch(
    view.state.update({
      changes,
      selection: { anchor: captured.selection.main.head - trimmed },
      scrollIntoView: true,
      userEvent: 'input',
    })
  )
  return true
}

/**
 * Smallest single replacement that turns `current` into `next`.
 *
 * Applying incoming text as a whole-document replacement drops the caret:
 * CodeMirror cannot map a selection through a change that covers the text the
 * selection sits in, so the cursor lands at the end of the new document. A
 * change limited to the span that actually differs leaves every position
 * outside it mappable, so the caret stays where the user put it.
 *
 * @param {string} current - Text currently in the document
 * @param {string} next - Text the document should hold
 * @returns {{from: number, to: number, insert: string}|null} The change, or
 *   null when the texts are already equal
 */
export function minimalReplacement(current, next) {
  if (current === next) return null

  let start = 0
  const shortest = Math.min(current.length, next.length)
  while (start < shortest && current[start] === next[start]) start++

  let endCurrent = current.length
  let endNext = next.length
  while (endCurrent > start && endNext > start && current[endCurrent - 1] === next[endNext - 1]) {
    endCurrent--
    endNext--
  }

  return { from: start, to: endCurrent, insert: next.slice(start, endNext) }
}

/**
 * Adds a cursor on the adjacent line for every selection range, keeping the
 * column where the line is long enough.
 *
 * @param {number} direction - -1 for the line above, 1 for the line below
 * @returns {(view: import('@codemirror/view').EditorView) => boolean} Command
 */
function addCursorVertically(direction) {
  return view => {
    const { state } = view
    const ranges = [...state.selection.ranges]
    for (const range of state.selection.ranges) {
      const line = state.doc.lineAt(range.head)
      const target = line.number + direction
      if (target < 1 || target > state.doc.lines) continue
      const adjacent = state.doc.line(target)
      const column = Math.min(range.head - line.from, adjacent.length)
      ranges.push(EditorSelection.cursor(adjacent.from + column))
    }
    if (ranges.length === state.selection.ranges.length) return false
    view.dispatch({ selection: EditorSelection.create(ranges.sort((a, b) => a.from - b.from)) })
    return true
  }
}

/** Key bindings that add a cursor on the line above or below. */
export const multiCursorKeymap = [
  { key: 'Alt-ArrowUp', mac: 'Cmd-Alt-ArrowUp', run: addCursorVertically(-1) },
  { key: 'Alt-ArrowDown', mac: 'Cmd-Alt-ArrowDown', run: addCursorVertically(1) },
]
