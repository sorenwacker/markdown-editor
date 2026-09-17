# markdown-editor

Framework-independent markdown editor built on CodeMirror 6, shared by [graph-core](https://github.com/sorenwacker/graph-core) and [markdown-viewer](https://github.com/sorenwacker/markdown-viewer).

```bash
npm install github:sorenwacker/markdown-editor#v1.0.0
```

```js
import { createMarkdownEditor } from 'markdown-editor'

const editor = createMarkdownEditor({ parent: element, doc: '# Title', onChange: text => save(text) })
```

API, default key bindings, and theming: [docs/index.md](docs/index.md).

## License

MIT
