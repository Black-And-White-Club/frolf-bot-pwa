/* Minimal Playwright types shim to avoid typecheck errors when Playwright is not installed in dev environments */
declare module '@playwright/test' {
  export const test: any
  export const expect: any
  export const devices: any
  export function defineConfig(v: any): any
}

export {}
