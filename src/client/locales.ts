/** `client-background` namespace dictionaries for the plugin card. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  title: '背景',
  description: '动态背景与自动更新。',
  enabled: '启用背景',
  enabledHint: '关闭后移除背景图与切换效果，插件仍保持安装。',
  rotationInterval: '切换间隔（秒）',
  rotationIntervalHint: '背景图每隔多久自动切换一次。',
  autoUpdate: '自动检查更新',
  autoUpdateHint: '定期检查 GitHub 仓库是否有新版本。',
  updateCheckInterval: '检查间隔（秒）',
  updateCheckIntervalHint: '两次更新检查之间的间隔。',
  updateStatus: '更新状态',
  updateChecking: '检查中…',
  updateUpToDate: '已是最新版本',
  updateAvailable: '有新版本可用',
  updateUnknown: '无法判断当前版本',
  updateError: '检查失败',
  checkNow: '立即检查',
  updateCommand: '更新命令',
  updateCommandHint: '在终端运行以下命令更新插件，然后重启 dsh：',
  copy: '复制',
  save: '保存',
  discard: '放弃修改',
  unsaved: '未保存',
  unavailable: '当前无法读取设置。',
} satisfies Record<string, string>

/** The card namespace key union. */
export type BackgroundLocaleKey = keyof typeof zh

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The background plugin card's copy. */
    'client-background': BackgroundLocaleKey
  }
}

/** English dictionary, checked complete against the zh key set. */
export const en: Record<BackgroundLocaleKey, string> = {
  title: 'Background',
  description: 'Dynamic background and auto update.',
  enabled: 'Enable background',
  enabledHint: 'Turning it off removes the image and rotation; the plugin stays installed.',
  rotationInterval: 'Rotation interval (seconds)',
  rotationIntervalHint: 'How often the background image auto-switches.',
  autoUpdate: 'Check for updates',
  autoUpdateHint: 'Periodically check the GitHub repository for a new version.',
  updateCheckInterval: 'Check interval (seconds)',
  updateCheckIntervalHint: 'Time between two update checks.',
  updateStatus: 'Update status',
  updateChecking: 'Checking…',
  updateUpToDate: 'Up to date',
  updateAvailable: 'A new version is available',
  updateUnknown: 'Cannot determine the current version',
  updateError: 'Check failed',
  checkNow: 'Check now',
  updateCommand: 'Update command',
  updateCommandHint: 'Run the following command in a terminal to update, then restart dsh:',
  copy: 'Copy',
  save: 'Save',
  discard: 'Discard',
  unsaved: 'Unsaved',
  unavailable: 'Settings are unavailable right now.',
}
