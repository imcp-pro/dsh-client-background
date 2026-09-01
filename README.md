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
- Rotates to a random image on a configurable interval.

The visual effect uses only browser globals (`document`, `Image`, `setInterval`);
its configuration is a settings namespace the Web client edits from its Plugins
panel.

## Requirements

- A dsh Web profile (`dsh --profile web`, a.k.a. `dsh web`) with the `web-app`
  bundle.
- The target dsh version must expose the base theme tokens
  `--dsw-alias-bg-base` / `--dsw-specific-sidebar-fill`, toggle the
  `body[data-ds-dark-theme]` dark-mode attribute, and serve the Plugins
  settings panel (stable facts in current releases).

## Install

### From this repo (git)

```sh
dsh plugin --profile web add github:imcp-pro/dsh-client-background
```

The plugin's `prepare` script builds `lib/` at install time (it is not committed),
and pnpm ≥ 10 blocks a git dependency's build scripts until you allowlist them.
The first run can therefore fail with `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`.
That is expected — fix it in one step:

1. The error prints the exact allowlist key under **"For example"**. Copy that
   `@imcp-pro/dsh-client-background@https://codeload.github.com/…/tar.gz/<commit>`
   line.
2. Paste it under `allowBuilds` in the web profile's `pnpm-workspace.yaml`
   (`~/.dsh/profiles/web/pnpm-workspace.yaml`), then re-run the command.

```yaml
# ~/.dsh/profiles/web/pnpm-workspace.yaml
allowBuilds:
  "@imcp-pro/dsh-client-background@https://codeload.github.com/imcp-pro/dsh-client-background/tar.gz/<commit>": true
```

Two things that trip people up:

- The key is **commit-bound** — `<commit>` changes with every new commit, so
  always copy the key from the current error; never reuse an old one.
- The key uses the **codeload tarball** form
  (`https://codeload.github.com/…/tar.gz/<commit>`), not `git+https://` or
  `git+ssh://`. Copy it verbatim.

### From an agent (dsh / Claude Code / OpenCode)

Paste this prompt into your agent; it installs the plugin and resolves the
allowlist step for you:

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

## Configure

Open **Settings → Plugins → Plugin configuration** and expand the **Background**
card:

| Field | Default | Meaning |
| --- | --- | --- |
| Enable background | on | runtime off switch; the plugin stays installed |
| Rotation interval (seconds) | 20 | how often the image auto-switches |
| Check for updates | off | periodically poll GitHub for a newer commit |
| Check interval (seconds) | 21600 | time between two update checks |

When a newer commit is found, the card shows the update command to run (then
restart). Edits stage locally and apply on **Save**; **Discard** drops them.

## Develop

```sh
npm install
npm run build   # esbuild bundles + tsc declarations → lib/
npm test        # vitest (jsdom)
```

`tsconfig.json` maps the `@deepseek-ai/dsh-*` type imports to a sibling
deepseek-harness source checkout (its `lib/types`), because the published dsh
packages currently predate the source API the plugin targets. Point the `paths`
entries at your own checkout before building.

## Publish

```sh
npm publish    # `prepare` runs the build; ships lib/ + cordis.patch.yml
```

The package ships `lib/` and `cordis.patch.yml` (the bundle patch layer that
inserts the `dsh.client` row). It declares `dsh.bundle.patch` (so
`dsh plugin add` registers the layer), `dsh.client` (so the client-modules host
serves the browser half), and a `client-background` settings namespace the Host
half registers.

## Notes

- **Instant swap, not crossfade** — preloading removes the loading flash, but the
  image still changes in one step.
- **`background-attachment: fixed` is ignored on iOS Safari** — the image scrolls
  with the page there.
- **The update check is client-side** — the browser polls the GitHub default
  branch and compares its commit with the one stamped into the bundle at build
  time, so it never mutates a running install.
