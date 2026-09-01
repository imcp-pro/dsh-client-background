# @imcp-pro/dsh-client-background

Replaces the dsh Web client base background with a randomly switching public
[Unsplash](https://unsplash.com) image, revealed through translucent base
surfaces. A standalone, installable dsh **bundle** for `dsh --profile web`.

## What it does

- Paints a public image on `<body>` (`cover`, centered, fixed).
- Overrides the two base-background theme tokens
  (`--dsw-alias-bg-base`, `--dsw-specific-sidebar-fill`) to translucent values so
  the image shows through the conversation, details, and sidebar surfaces.
- Preloads every image up front so rotations hit the browser cache instead of
  flashing the base color.
- Rotates to a random image every 20 seconds.

The image list, interval, and surface opacity are fixed constants (client halves
receive no `cordis.yml` config), and the plugin owns no Cordis service — it only
uses browser globals, so it works against any published dsh version.

## Install

```sh
# from this repo's directory:
dsh plugin --profile web add .

# or from a published npm package:
dsh plugin --profile web add @imcp-pro/dsh-client-background

# or straight from a git repo:
dsh plugin --profile web add github:imcp-pro/dsh-client-background
```

Then restart `dsh web`; the background appears and persists across restarts.

## Develop

```sh
npm install
npm run build   # esbuild bundles + tsc declarations → lib/
npm test        # vitest (jsdom)
```

## Publish

```sh
npm publish    # prepack runs the build
```

The package ships `lib/` and `cordis.patch.yml` (the bundle patch layer that
inserts the `dsh.client` row). It declares both `dsh.bundle.patch` (so
`dsh plugin add` registers the layer) and `dsh.client` (so the client-modules
host serves the browser half).

## Notes

- **No `cordis.yml` config** — tunables are constants; see `src/client/index.ts`.
- **Instant swap, not crossfade** — preloading removes the loading flash, but the
  image still changes in one step.
- **`background-attachment: fixed` is ignored on iOS Safari** — the image scrolls
  with the page there.
