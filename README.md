# @imcp-pro/dsh-client-background

English | [中文](README.zh.md)

Replaces the dsh Web client base background with a randomly switching public
[Unsplash](https://unsplash.com) image, revealed through translucent base
surfaces.

A standalone, installable dsh **bundle** for `dsh --profile web` — this repo
_is_ the plugin: no monorepo, no framework checkout.

- Repo: <https://github.com/imcp-pro/dsh-client-background>
- License: MIT

## What it does

- Paints a public image on `<body>` (`cover`, centered, fixed).
- Overrides the two base-background theme tokens
  (`--dsw-alias-bg-base`, `--dsw-specific-sidebar-fill`) to translucent values so
  the image shows through the conversation, details, and sidebar surfaces.
- Preloads every image up front so rotations hit the browser cache instead of
  flashing the base color.
- Rotates to a random image every 20 seconds.

The plugin owns no Cordis service — it injects one stylesheet and uses only
browser globals (`document`, `Image`, `setInterval`), so it works against any
published dsh version that ships the base theme tokens.

## Requirements

- A dsh Web profile (`dsh --profile web`, a.k.a. `dsh web`) with the `web-app`
  bundle.
- The target dsh version must expose the base theme tokens
  `--dsw-alias-bg-base` / `--dsw-specific-sidebar-fill` and toggle the
  `body[data-ds-dark-theme]` dark-mode attribute (stable facts in current
  releases).

## Install

```sh
# from this git repo (builds on install via the `prepare` script):
dsh plugin --profile web add github:imcp-pro/dsh-client-background

# from a published npm package (ships a prebuilt lib/):
dsh plugin --profile web add @imcp-pro/dsh-client-background

# from a local checkout (build first, then link):
npm run build
dsh plugin --profile web add .
```

Then restart `dsh web`; the background appears and persists across restarts.

## Customize

Tunables are fixed constants in [`src/client/index.ts`](src/client/index.ts) —
edit them, run `npm run build`, and reinstall:

| Constant | Default | Meaning |
| --- | --- | --- |
| `DEFAULT_IMAGES` | 15 Unsplash URLs | the rotating image list |
| `ROTATION_INTERVAL_MS` | `20_000` | milliseconds between swaps |
| `SURFACE_OPACITY` | `0.55` | surface opacity; `1` hides the image, `0` shows it fully |

## Develop

```sh
npm install
npm run build   # esbuild bundles + tsc declarations → lib/
npm test        # vitest (jsdom)
```

## Publish

```sh
npm publish    # `prepare` runs the build; ships lib/ + cordis.patch.yml
```

The package ships `lib/` and `cordis.patch.yml` (the bundle patch layer that
inserts the `dsh.client` row). It declares both `dsh.bundle.patch` (so
`dsh plugin add` registers the layer) and `dsh.client` (so the client-modules
host serves the browser half).

## Notes

- **No `cordis.yml` config** — client halves receive no config; the tunables are
  the constants above.
- **Instant swap, not crossfade** — preloading removes the loading flash, but the
  image still changes in one step.
- **`background-attachment: fixed` is ignored on iOS Safari** — the image scrolls
  with the page there.
