This project includes a helper wrapper `.eslintrc.complex.cjs` that converts a legacy `.eslintrc.complex.json` into a flat-config-friendly shape for ad-hoc complexity scans.

Recommended local setup to run the complexity scan successfully:

1. Install (dev) dependencies used by the complexity config if you don't already have them:

   npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-sonarjs

   or with bun:

   bun add -d eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-sonarjs

2. If you run ESLint with the parserOptions.project setting, make sure test files are included by using the provided `tsconfig.eslint.json`.
   It's already present in the repo root and will be preferred by the wrapper when available.

3. Run the fast scan (TS/JS only, ignoring generated paraglide files):

   bunx eslint -c .eslintrc.complex.cjs "src/**/\*.{ts,js}" --ignore-pattern "src/lib/paraglide/**" -f json -o eslint-report.json || true

4. Extract complexity results with jq:

   jq -r '.[] | .messages[]? | select(.ruleId=="complexity" or .ruleId=="sonarjs/cognitive-complexity" or .ruleId=="max-statements") | "\(.ruleId)\t\(.message)\tfile:\(.filePath)\tline:\(.line // \"-\")"' eslint-report.json

If you want, I can run the lint + report here — say "run it here" and I'll execute the same commands and return a ranked list.
