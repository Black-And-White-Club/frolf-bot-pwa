/* Minimal Playwright types shim to avoid typecheck errors when Playwright is not installed in dev environments */
declare module '@playwright/test' {
  // Minimal placeholders so consumers (config/tests) can type-check without Playwright installed
  export const test: unknown
  export const expect: unknown
  export const devices: Record<string, unknown>

  // defineConfig typically returns the config object back; keep it generic for convenience
  export function defineConfig<T = unknown>(v: T): T

  // basic config type alias so configs can annotate themselves
  export type PlaywrightTestConfig = unknown
}

export {}
