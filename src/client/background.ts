/**
 * Background effect, browser half: owns the stylesheet that paints a rotating
 * public image on `<body>` and the rotation timer. Pure DOM logic driven by
 * the resolved settings — {@link mountBackground} returns a disposer so the
 * settings-driven fiber can re-mount it whenever `enabled` or the interval
 * changes.
 *
 * @module @imcp-pro/dsh-client-background/client/background
 */
import { PLUGIN_ID } from '../config.ts'

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
  'https://images.unsplash.com/photo-1439246854758-f686a415d9da?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1440773310993-8660d1577dcd?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1446834898093-264bbb1bdcc9?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445308124430-8357b98a6f71?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441961497852-89a16db29005?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1442095962062-cc576a28f7ef?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1421990535576-b336c6b1c8a1?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1442943861491-36a87a01e726?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1430132594682-16e1185b17c5?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1439853849133-aaf5b7b5f55b?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1440942574812-185bf7cf6c49?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1438185074000-4b84f7ffc075?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1448713551278-27e64beaa3fd?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1438129501245-af64ca2b270a?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1419293667059-7f9357d09013?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451272994275-50b182fb2c70?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1452480306336-ffdc85b78768?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1433763484842-f9bca4a5b93f?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1429552016556-fd6f7d9743e1?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1428394527478-f01c05887d1f?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1450655816589-5eea781dae8a?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1446840908685-30f3a9e727f9?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451395599223-6349b929a180?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1431683535750-2b9b2371efb7?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1433030384060-b53fe066a835?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1424136164161-9c851c61012f?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445367986565-c73f84588095?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1447655513720-7da85ed1fa57?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1466943746581-80a02881f4c8?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451959082120-81e1dbec1d7a?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476041026529-411f6ae1de3e?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470771602397-a17d07357acc?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470836047270-6c7c229fd74b?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1422452098470-722310d3ad74?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1429152937938-07b5f2828cdd?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1435566029824-9ff1216c5b11?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1423209086112-cf2c8acd502f?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1440500122534-703c6966f83d?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1418874525809-bec95b9c4500?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1440130266107-787dd24d69d7?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1433492753406-04e6d7ed995c?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1436772275169-d8467f9d5aa5?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1449027627419-e46b1154169d?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451102070012-5ec12448f8c6?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1426270238320-f944ef4ddb3f?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1433155327100-12aac6a14ff1?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1464823265838-c29e2a106ef6?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1431223430019-7c33d109bf40?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1447829171547-a5807f9e26d5?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1435002864064-ad5b71978e79?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1449617540102-accfca509ef6?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1430936084646-158d26ba98ff?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1422728221357-57980993ea99?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1424386883927-2078a32e5cfd?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1435685813800-51ba4ceb9c4a?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1426760253677-88a3f201f5fe?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1435568009252-48c5abc5dcae?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1442071771157-ead3c45f708f?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1434600171728-fd0c9ba2efe9?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1440605271345-b97ed0ef877f?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1444857697744-4691e1a0500e?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1421885661290-1b5a570626e9?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1435782944608-71c88cf57a17?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1429808016056-f8a16278ebff?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1447955552776-56465b845d20?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1422837284172-a925ac273aa9?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445217320842-2edce6f9acd0?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1431793918933-1cb10f3ef908?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1438803235109-d737bc3129ec?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1432105214010-ae5e45b2cebb?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1417915134192-0194508577ac?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1446080501695-8e929f879f2b?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1446711994820-33c11e0a8bfc?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1450262109774-e464a9b783d8?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1446569405618-5a61f12ee143?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1445346366695-5bf62de05412?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1468898203265-d5b5601865c7?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1467318442930-9c0122002f65?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1451906148688-836c3e59d35c?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494756159834-6fdaee7a9b7e?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505159042738-73dbae90178f?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502943693086-33b5b1cfdf2f?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1496068485394-64235b139f6d?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1495927007324-53cb9cee3f15?w=1920&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507527982907-723733713d42?w=1920&q=80&auto=format&fit=crop',
]

/** How opaque the base surfaces stay; 1 hides the image, 0 shows it fully. */
const LIGHT_SURFACE_OPACITY = 0.55

/** Dark surfaces stay slightly more see-through so the photo reads as a moody backdrop. */
const DARK_SURFACE_OPACITY = 0.55

/** Slight photo darkening in light mode so bright photos read as a calm pastel backdrop. */
const LIGHT_SCRIM_ALPHA = 0.15

/** The owned stylesheet: translucent base tokens plus the body image rule. */
function backgroundCss(): string {
  const lightAlpha = LIGHT_SURFACE_OPACITY
  const darkAlpha = DARK_SURFACE_OPACITY
  return [
    // Light palette (declared on body so it beats the app's own `body`
    // token declarations; a :root override would only be inherited).
    'body {',
    `  --dsw-alias-bg-base: rgba(255, 255, 255, ${lightAlpha}) !important;`,
    `  --dsw-specific-sidebar-fill: rgba(249, 250, 251, ${lightAlpha}) !important;`,
    '}',
    // Dark palette (the theme presenter toggles body[data-ds-dark-theme]).
    'body[data-ds-dark-theme] {',
    `  --dsw-alias-bg-base: rgba(21, 21, 23, ${darkAlpha}) !important;`,
    `  --dsw-specific-sidebar-fill: rgba(27, 27, 28, ${darkAlpha}) !important;`,
    '}',
    'body {',
    `  background-image: var(${BACKGROUND_VARIABLE}, none);`,
    '  background-size: cover;',
    '  background-position: center;',
    '  background-repeat: no-repeat;',
    '  background-attachment: fixed;',
    '}',
    // Light-mode scrim: a slight darkening over the photo, behind every
    // surface, so bright photos calm down under the white veil.
    'body::before {',
    "  content: '';",
    '  position: fixed;',
    '  inset: 0;',
    '  z-index: -1;',
    '  pointer-events: none;',
    `  background: rgba(0, 0, 0, ${LIGHT_SCRIM_ALPHA});`,
    '}',
    'body[data-ds-dark-theme]::before { display: none; }',
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
 * Mount the background: inject the owned stylesheet, preload every image, then
 * rotate on the given interval. Non-browser runs (node e2e booting the client
 * tree) have no document and are a no-op.
 * @param intervalSeconds - seconds between swaps.
 * @returns the disposer removing every effect.
 */
export function mountBackground(intervalSeconds: number): () => void {
  if (typeof document === 'undefined') return () => {}

  const tag = document.createElement('style')
  tag.dataset.plugin = PLUGIN_ID
  tag.dataset.pluginCss = `${PLUGIN_ID}/background`
  tag.textContent = backgroundCss()
  document.head.appendChild(tag)

  for (const url of DEFAULT_IMAGES) preload(url)

  let currentIndex = -1
  const rotate = (): void => {
    currentIndex = nextIndex(DEFAULT_IMAGES.length, currentIndex)
    document.body.style.setProperty(BACKGROUND_VARIABLE, `url("${DEFAULT_IMAGES[currentIndex]}")`)
  }
  rotate()
  const timer = globalThis.setInterval(rotate, intervalSeconds * 1000)

  return () => {
    globalThis.clearInterval(timer)
    tag.remove()
    document.body.style.removeProperty(BACKGROUND_VARIABLE)
  }
}
