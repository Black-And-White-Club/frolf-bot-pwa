# Testing & Coverage (local dev)

This project has two Vitest projects configured:

- `client` — UI/component tests (jsdom environment)
- `server` — store/utility tests (node environment)

Run client tests:

```bash
# run client tests (jsdom)
bunx vitest --project client --run --reporter verbose
```

Run server tests:

```bash
bunx vitest --project server --run --reporter verbose
# or via bun script
bun run test:unit -- --run
```

Run all tests and generate coverage:

```bash
bunx vitest --run --coverage
# or via bun script
bun run coverage
```

View the HTML coverage report:

```bash
# macOS
open coverage/index.html
# linux
xdg-open coverage/index.html
```

Tips

- The `vitest-setup-client.ts` file registers DOM polyfills and auto-cleanup for component tests.
- If you want to exclude large auto-generated folders from coverage (paraglide runtime, routes), we already exclude them via vitest config so coverage reflects app code more realistically.
- To enforce coverage thresholds in CI, add a small step to run `bun run coverage` and fail if total coverage is below targets.
