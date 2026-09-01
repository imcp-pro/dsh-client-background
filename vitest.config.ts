import { defineConfig } from 'vitest/config'

// Self-contained so the scaffold's tests never inherit a parent workspace's
// vitest config. Each spec sets its own environment via the per-file
// `@vitest-environment` pragma.
export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
  },
})
