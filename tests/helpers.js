import { createMarkdownEditor } from '../src/index.js'

/** Mount an editor in a fresh element; returns the handle and a cleanup. */
export function mount(options = {}) {
  const parent = document.createElement('div')
  document.body.appendChild(parent)
  const editor = createMarkdownEditor({ parent, ...options })
  const cleanup = () => {
    editor.destroy()
    parent.remove()
  }
  return { editor, parent, cleanup }
}

/** Dispatch a keydown on the editor's content element. */
export function press(editor, keyName, init = {}) {
  editor.view.contentDOM.dispatchEvent(
    new window.KeyboardEvent('keydown', { key: keyName, code: keyName, bubbles: true, cancelable: true, ...init })
  )
}
