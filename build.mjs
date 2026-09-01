// Builds the three publish artifacts:
//   lib/index.js   — node half (ESM), the Loader imports it via package "main"
//   lib/client.js  — browser half, wrapped in the client module-loader factory
// Run `npm run build` (which also emits lib/types via tsc).

import { build } from 'esbuild'

// TODO: keep in sync with "name" in package.json.
const ID = '@imcp-pro/dsh-client-background'

const shared = {
  bundle: true,
  sourcemap: true,
  target: 'es2024',
  logLevel: 'info',
}

await build({
  ...shared,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  format: 'esm',
  platform: 'node',
})

// The browser half runs inside the shell's frozen module table. The
// `window.__ModuleLoader__.load({ id, factory })` handoff is the exact format
// the dsh client-modules host serves and the shell kernel consumes. This
// package has no runtime cross-package value imports (only `import type`,
// erased), so the factory is self-contained.
await build({
  ...shared,
  entryPoints: ['src/client/index.ts'],
  outfile: 'lib/client.js',
  format: 'cjs',
  platform: 'browser',
  banner: {
    js: [
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
      'var module = { exports: {} }; var exports = module.exports;',
    ].join('\n'),
  },
  footer: { js: 'return module.exports; } });' },
})
