# markdown-editor

A framework-independent markdown editor built on CodeMirror 6. It holds the editor configuration and markdown editing commands shared by graph-core and markdown-viewer, so both applications use one implementation. Applications add their own behavior (for example graph-core's `@person` mentions) through extensions; they do not copy or redefine the package's functions.

## Installation

The package is installed as a git dependency pinned to a release tag:

```bash
npm install github:sorenwacker/markdown-editor#v1.0.0
```

It is published as ES modules. Applications with a bundler (graph-core uses Vite) import it directly; markdown-viewer bundles it with esbuild.

CodeMirror packages are regular dependencies bounded below their next major version (`>=6.x,<7`).

## API

### `createMarkdownEditor(options)`

Creates an editor inside a DOM element and returns a handle.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `parent` | `HTMLElement` | required | Element the editor is mounted in. |
| `doc` | `string` | `''` | Initial text. |
| `onChange` | `(text: string) => void` | none | Called after every change made in the editor (typing, paste, undo, commands). Not called for `setValue`. |
| `extensions` | `Extension[]` | `[]` | Additional CodeMirror extensions, applied after the defaults. |
| `dark` | `boolean` | `false` | Marks the theme as dark, so CodeMirror's built-in panels (find/replace) use dark styling. |

The returned handle:

| Member | Description |
|--------|-------------|
| `view` | The underlying `EditorView`, for application-specific extensions. |
| `getValue()` | Returns the current text. |
| `setValue(text)` | Replaces the text with `text` as the smallest differing span (see `minimalReplacement`), so the caret keeps its position unless the change touched it. Does not call `onChange`, and does not add an undo step that mixes with the user's own edits. |
| `getSelection()` | Returns `{ text, from, to }` for the main selection. |
| `replaceSelection(text)` | Replaces the main selection with `text`. |
| `setDark(dark)` | Switches the dark flag at runtime, for applications with a dark mode toggle. |
| `focus()` | Focuses the editor. |
| `destroy()` | Removes the editor from the DOM and releases its listeners. |

### Default configuration

`createMarkdownEditor` enables: line numbers, active line highlight, selection drawing, matching-selection highlight, undo history, markdown language support, line wrapping, multiple selections, and the keymaps below.

| Key | Action |
|-----|--------|
| `Enter` | `insertNewlineTightList` in lists and blockquotes, otherwise a plain newline |
| `Tab` / `Shift+Tab` | Indent / dedent |
| `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z` | Undo / redo |
| `Cmd/Ctrl+F` | Find and replace panel |
| `Cmd+Alt+Up/Down` (macOS), `Alt+Up/Down` (other) | Add a cursor on the line above / below |

### Theming

The editor's colors are CSS custom properties with fallbacks, so each application maps them to its own palette and dark mode:

| Property | Used for |
|----------|----------|
| `--md-editor-bg` | Editor background |
| `--md-editor-fg` | Text |
| `--md-editor-gutter-bg`, `--md-editor-gutter-fg` | Line number gutter |
| `--md-editor-active-line` | Active line and active gutter line |
| `--md-editor-caret` | Caret |
| `--md-editor-selection` | Selection background |
| `--md-editor-selection-match` | Other occurrences of the selected text |
| `--md-editor-search-match` | Search matches |
| `--md-editor-search-match-selected` | The search match the cursor is on |
| `--md-editor-panel-bg`, `--md-editor-panel-fg` | Find and replace panel |
| `--md-editor-border` | Panel edge, inputs, and buttons |

Every highlight is a translucent background over the editor background, so the text keeps its own color and stays readable. `--md-editor-active-line` must be translucent too: the active line is painted over the selection layer, so an opaque color there hides the selection on the line being edited. CodeMirror's own defaults are opaque and were unreadable on a dark background, so the theme covers all of them rather than only the selection.

### `insertNewlineTightList(view)`

CodeMirror command. Continues a markdown list or blockquote on Enter without inserting a blank line between items, including in a list that already contains one. Enter on an empty item ends the list. Returns `false` outside list and blockquote context so the next binding handles the key.

### `minimalReplacement(current, next)`

Returns the smallest single change `{ from, to, insert }` that turns `current` into `next`, or `null` when they are equal. Applying incoming text as this change instead of a whole-document replacement lets CodeMirror map the selection through it.

### `multiCursorKeymap`

The key bindings for adding cursors above and below, exported for applications that build their own keymap.

## Consumers

- **graph-core:** `NotesEditor.vue` is a Vue wrapper around `createMarkdownEditor`. It adds `@person` mentions through `extensions` and maps `modelValue` to `setValue` / `onChange`.
- **markdown-viewer:** edit mode (see its `docs/editing.md`).

## Development

```bash
npm run hooks   # once per clone: installs the pre-commit lint hook
npm test        # vitest with jsdom
npm run lint
```

The package has no `prepare` script on purpose: npm runs `prepare` when installing a git dependency, which would install this package's development tools in every consumer.

CI runs lint and tests on pull requests and tags, and installs the packed package into an empty project with a fresh dependency resolution to check that it imports.

Releases are tag-driven: pushing a `vX.Y.Z` tag is the release that consumers pin to.
