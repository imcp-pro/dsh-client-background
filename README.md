# @imcp-pro/dsh-client-background

English | [中文](README.zh.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A [dsh](https://github.com/deepseek-ai/deepseek-harness) Web client bundle that replaces the base background with a randomly rotating [Unsplash](https://unsplash.com) wallpaper, revealed through translucent surfaces.

![The dsh Web client with a wallpaper background](docs/demo-1.png)

## Features

- **100 curated wallpapers** rotate on a configurable interval.
- **Runtime switch** — disable the effect without uninstalling the plugin.
- **Client-side update check** — polls GitHub for a newer commit and surfaces the exact update command.
- **No framework coupling** — the visual effect uses only browser globals (`document`, `Image`, `setInterval`).

## Requirements

- A dsh `web` profile (`dsh --profile web`, a.k.a. `dsh web`) with the `web-app` bundle.
- A dsh build that exposes the base theme tokens `--dsw-alias-bg-base` / `--dsw-specific-sidebar-fill`, toggles the `body[data-ds-dark-theme]` dark-mode attribute, and serves the Plugins settings panel.

## Installation

### From GitHub

```sh
dsh plugin --profile web add github:imcp-pro/dsh-client-background
```

The plugin's `prepare` script builds `lib/` at install time (it is not committed), and pnpm ≥ 10 blocks a git dependency's build scripts until allowlisted. The first run may therefore fail with `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` — that is expected. To resolve it:

1. Copy the exact allowlist key printed under **"For example"** in the error:
   `@imcp-pro/dsh-client-background@https://codeload.github.com/…/tar.gz/<commit>`.
2. Paste it under `allowBuilds` in the web profile's `pnpm-workspace.yaml`
   (`~/.dsh/profiles/web/pnpm-workspace.yaml`), then re-run the command.

```yaml
# ~/.dsh/profiles/web/pnpm-workspace.yaml
allowBuilds:
  "@imcp-pro/dsh-client-background@https://codeload.github.com/imcp-pro/dsh-client-background/tar.gz/<commit>": true
```

> **Note:** the key is commit-bound — every new commit changes `<commit>`, so always copy the key from the current error. Keep the codeload tarball form (`https://codeload.github.com/…/tar.gz/<commit>`) verbatim, not `git+https://` or `git+ssh://`.

### From an agent (dsh / Claude Code / OpenCode)

Paste the following prompt into your agent; it installs the plugin and resolves the allowlist step for you:

```text
Install the dsh background plugin for the web profile:

    dsh plugin --profile web add github:imcp-pro/dsh-client-background

If the command fails with `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` (or a `dsh:`
hint mentioning `allowBuilds`), copy the exact
`@imcp-pro/dsh-client-background@https://codeload.github.com/.../tar.gz/<commit>`
key printed in the error, add it under `allowBuilds` in
`~/.dsh/profiles/web/pnpm-workspace.yaml`, and re-run the same command. Then
confirm the plugin is listed under `dependencies` in
`~/.dsh/profiles/web/package.json`, report whether the install succeeded, and
remind the user to restart `dsh web` to load the plugin (do not restart it
yourself).
```

### From a local checkout

```sh
npm run build
dsh plugin --profile web add .
```

Then restart `dsh web`; the background appears and persists across restarts.

## Configuration

Open **Settings → Plugins → Plugin list**, then expand **Wallpaper background** under **Global plugins**:

| Field | Default | Description |
| --- | --- | --- |
| Enable background | on | runtime off switch; the plugin stays installed |
| Rotation interval (seconds) | 20 | how often the image auto-switches |
| Check for updates | off | periodically poll GitHub for a newer commit |
| Check interval (seconds) | 21600 | time between two update checks |

Edits stage locally and apply on **Save**; **Discard** drops them. When a newer commit is found, the entry shows the update command to run (then restart).

## Development

```sh
npm install
npm run build   # esbuild bundles + tsc declarations → lib/
npm test        # vitest (jsdom)
```

`tsconfig.json` maps the `@deepseek-ai/dsh-*` type imports to a sibling deepseek-harness source checkout (its `lib/types`), because the published dsh packages currently predate the source API this plugin targets. Point the `paths` entries at your own checkout before building.

## Publishing

```sh
npm publish    # `prepare` runs the build; ships lib/ + cordis.patch.yml
```

The package ships `lib/` and `cordis.patch.yml`. It declares `dsh.bundle.patch` (so `dsh plugin add` registers the layer), `dsh.client` (so the client-modules host serves the browser half), and a `client-background` settings namespace the Host half registers.

## Notes

- **Instant swap, not crossfade** — preloading removes the loading flash, but the image still changes in one step.
- **`background-attachment: fixed` is ignored on iOS Safari** — the image scrolls with the page there.
- **The update check is client-side** — the browser polls the GitHub default branch and compares its commit with the one stamped into the bundle at build time, so it never mutates a running install.

## License

[MIT](LICENSE)
