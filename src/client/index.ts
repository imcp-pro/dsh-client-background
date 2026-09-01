/**
 * Background plugin, browser half: replaces the application base background
 * with a randomly switching public image.
 *
 * The app's base surfaces (conversation, details, sidebar) are opaque and sit
 * above `<body>`, so a body-level image stays invisible until those surfaces
 * turn translucent. The plugin injects one owned stylesheet that both
 * (1) redefines the two base-background theme tokens to translucent values and
 * (2) paints the image on `<body>` through a CSS variable it updates on each
 * rotation.
 *
 * It overrides the tokens with plain CSS rather than the theme service, so it
 * owns no service dependency and works against any published dsh version: the
 * token names and the `body[data-ds-dark-theme]` dark-mode selector are stable
 * theme facts (`!important` keeps the override above the base palette sheets).
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'

/** Package id, stamped onto the owned style tag. Keep in sync with package.json. */
const PLUGIN_ID = '@imcp-pro/dsh-client-background'

/** Body CSS variable carrying the active image URL, updated in place on rotation. */
const BACKGROUND_VARIABLE = '--dsh-bg-image'

/** Public, keyless Unsplash CDN images cycled at random. */
const DEFAULT_IMAGES: readonly string[] = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80&auto=format&fit=crop',
]

/** Rotation interval in milliseconds. */
const ROTATION_INTERVAL_MS = 20_000

/** How opaque the base surfaces stay; 1 hides the image, 0 shows it fully. */
const SURFACE_OPACITY = 0.55

/** No Cordis services are required — the plugin only uses browser globals. */
export const inject: string[] = []

/** The owned stylesheet: translucent base tokens plus the body image rule. */
function backgroundCss(): string {
  const alpha = SURFACE_OPACITY
  return [
    // Light palette (the base tokens live on :root).
    ':root {',
    `  --dsw-alias-bg-base: rgba(255, 255, 255, ${alpha}) !important;`,
    `  --dsw-specific-sidebar-fill: rgba(249, 250, 251, ${alpha}) !important;`,
    '}',
    // Dark palette (the theme presenter toggles body[data-ds-dark-theme]).
    'body[data-ds-dark-theme] {',
    `  --dsw-alias-bg-base: rgba(21, 21, 23, ${alpha}) !important;`,
    `  --dsw-specific-sidebar-fill: rgba(27, 27, 28, ${alpha}) !important;`,
    '}',
    'body {',
    `  background-image: var(${BACKGROUND_VARIABLE}, none);`,
    '  background-size: cover;',
    '  background-position: center;',
    '  background-repeat: no-repeat;',
    '  background-attachment: fixed;',
    '}',
  ].join('\n')
}

/** Preload one image into the browser cache without inserting it into the document. */
function preload(url: string): void {
  const image = new Image()
  const release = (): void => {
    image.onload = null
    image.onerror = null
  }
  image.onload = release
  image.onerror = release
  image.src = url
}

/** Pick the next image index, avoiding the current one whenever more than one exists. */
function nextIndex(count: number, current: number): number {
  if (count <= 1) return 0
  let index = Math.floor(Math.random() * count)
  while (index === current) index = Math.floor(Math.random() * count)
  return index
}

/**
 * Client plugin body: inject the stylesheet, preload every image, then rotate
 * on an interval — each side effect owned by this fiber so stop/unload removes it.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  // Non-browser runs (node e2e booting the client tree) have no document.
  if (typeof document === 'undefined') return

  // Preload the whole list once so rotations never wait on the network.
  for (const url of DEFAULT_IMAGES) preload(url)

  // One package-owned stylesheet carrying the token overrides and body rule.
  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = PLUGIN_ID
    tag.dataset.pluginCss = `${PLUGIN_ID}/background`
    tag.textContent = backgroundCss()
    document.head.appendChild(tag)
    return () => {
      tag.remove()
      document.body.style.removeProperty(BACKGROUND_VARIABLE)
    }
  }, 'ui-background: stylesheet')

  // Rotate the active image without ever picking the same one twice in a row.
  let currentIndex = -1
  const rotate = (): void => {
    currentIndex = nextIndex(DEFAULT_IMAGES.length, currentIndex)
    document.body.style.setProperty(BACKGROUND_VARIABLE, `url("${DEFAULT_IMAGES[currentIndex]}")`)
  }
  rotate()
  ctx.effect(() => {
    const timer = globalThis.setInterval(rotate, ROTATION_INTERVAL_MS)
    return () => { globalThis.clearInterval(timer) }
  }, 'ui-background: rotation timer')
}
