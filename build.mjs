// Builds the three publish artifacts:
//   lib/index.js   — node half (ESM), the Loader imports it via package "main"
//   lib/client.js  — browser half, wrapped in the client module-loader factory
// Run `npm run build` (which also emits lib/types via tsc).

import { build } from 'esbuild'
import { execSync } from 'node:child_process'

// TODO: keep in sync with "name" in package.json.
const ID = '@imcp-pro/dsh-client-background'

// The client bundle runs inside the shell's frozen module table; these baseline
// modules are seeded by the dsh shell, so they must stay external (resolved by
// the factory's `require`) rather than being inlined. Keep in sync with the
// shell's PLATFORM_MODULES.
const CLIENT_EXTERNALS = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
]

/** The commit this build is from: local git, else the git-dep commit npm exposes. */
function resolveCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  } catch {
    // `prepare` runs in a codeload tarball with no `.git`; npm exposes the
    // resolved commit for git dependencies through this variable.
    return process.env.npm_package_gitHead ?? ''
  }
}

const buildCommit = resolveCommit()

const shared = {
  bundle: true,
  sourcemap: true,
  target: 'es2024',
  logLevel: 'info',
}

// Node half: schemastery is a runtime dependency of the host, so it stays an
// import resolved from the profile's node_modules; everything else inlines.
await build({
  ...shared,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  format: 'esm',
  platform: 'node',
  external: ['@deepseek-ai/schemastery', '@deepseek-ai/cordis'],
})

// Browser half: baseline modules stay external; the rest is inlined (or is a
// type-only import, erased). `__BUILD_COMMIT__` is stamped for the update check.
await build({
  ...shared,
  entryPoints: ['src/client/index.ts'],
  outfile: 'lib/client.js',
  format: 'cjs',
  platform: 'browser',
  external: CLIENT_EXTERNALS,
  define: { __BUILD_COMMIT__: JSON.stringify(buildCommit) },
  banner: {
    js: [
      `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
      'var module = { exports: {} }; var exports = module.exports;',
    ].join('\n'),
  },
  footer: { js: 'return module.exports; } });' },
})
