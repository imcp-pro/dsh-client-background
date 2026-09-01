/**
 * Card controller for the `client-background` settings card: binds the settings
 * scope, stages edits, and owns the client-side update check (polls the GitHub
 * default branch and compares to the commit stamped at build time).
 *
 * @module @imcp-pro/dsh-client-background/client/card-controller
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type {
  SettingsScope,
} from '@deepseek-ai/dsh-client-ui-settings/client'
import {
  BUILD_COMMIT, DEFAULT_SETTINGS, GITHUB_REPO, type BackgroundSettings,
} from '../config.ts'

/** Update-check sub-state shown by the card. */
export interface UpdateCheckState {
  /** Whether a check is in flight. */
  checking: boolean
  /** true when the remote HEAD differs from the build commit. */
  available: boolean
  /** Remote default-branch HEAD sha, when last known. */
  latestCommit: string | undefined
  /** The commit this bundle was built from. */
  currentCommit: string | undefined
  error: string | undefined
}

/** What the card renders. */
export interface BackgroundCardState {
  status: 'loading' | 'ready' | 'unavailable'
  writable: boolean
  /** Last accepted resolved section (undefined before the first acceptance). */
  saved: BackgroundSettings | undefined
  /** Staged draft; undefined means no unsaved edits. */
  draft: BackgroundSettings | undefined
  saving: boolean
  saveError: string | undefined
  update: UpdateCheckState
}

/** The face the card's slot registration injects. */
export interface BackgroundCardFace {
  hooks: { backgroundCard: SnapshotStore<BackgroundCardState> }
  edit: (field: keyof BackgroundSettings, value: BackgroundSettings[keyof BackgroundSettings]) => void
  save: () => void
  discard: () => void
  checkNow: () => void
}

/** Fetch the GitHub default-branch HEAD commit (public repos allow CORS). */
async function fetchLatestCommit(): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=1`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
  const payload: unknown = await response.json()
  const sha = Array.isArray(payload) && payload.length > 0
    ? (payload[0] as { sha?: unknown }).sha
    : undefined
  if (typeof sha !== 'string' || sha.length === 0) throw new Error('unexpected response')
  return sha
}

/** Bridge the scope and the update check onto the card store. */
export class BackgroundCardController {
  private readonly store: SnapshotStore<BackgroundCardState>
  private readonly unsubscribe: () => void
  private draft: BackgroundSettings | undefined = undefined
  private saving = false
  private saveError: string | undefined = undefined
  private update: UpdateCheckState = {
    checking: false,
    available: false,
    latestCommit: undefined,
    currentCommit: BUILD_COMMIT,
    error: undefined,
  }
  private timer: ReturnType<typeof setInterval> | undefined = undefined
  private disposed = false

  /**
   * @param scope - the bound `client-background` settings scope.
   */
  constructor(private readonly scope: SettingsScope<BackgroundSettings>) {
    this.store = createSnapshotStore<BackgroundCardState>(this.project())
    this.unsubscribe = scope.subscribe(() => {
      this.syncTimer()
      this.publish()
    })
    this.syncTimer()
  }

  /** Resolved-or-drafted value the card edits against. */
  private current(): BackgroundSettings {
    return this.draft ?? this.scope.getSnapshot().value ?? DEFAULT_SETTINGS
  }

  private project(): BackgroundCardState {
    const snapshot = this.scope.getSnapshot()
    return {
      status: snapshot.status,
      writable: snapshot.writable,
      saved: snapshot.value,
      draft: this.draft,
      saving: this.saving,
      saveError: this.saveError,
      update: this.update,
    }
  }

  private publish(): void {
    if (!this.disposed) this.store.set(this.project())
  }

  /** Stage one field edit; nothing persists until {@link save}. */
  edit(field: keyof BackgroundSettings, value: BackgroundSettings[keyof BackgroundSettings]): void {
    this.draft = { ...this.current(), [field]: value } as BackgroundSettings
    this.publish()
  }

  /** Drop the staged edits. */
  discard(): void {
    this.draft = undefined
    this.saveError = undefined
    this.publish()
  }

  /** Persist every staged field in one atomic mutation. */
  async save(): Promise<void> {
    const draft = this.draft
    if (draft === undefined) return
    this.saving = true
    this.saveError = undefined
    this.publish()
    try {
      const ops = (Object.keys(draft) as (keyof BackgroundSettings)[]).map(field => ({
        op: 'set' as const,
        path: [field],
        value: draft[field],
      }))
      await this.scope.mutate(ops)
      this.draft = undefined
    } catch (error) {
      this.saveError = error instanceof Error ? error.message : String(error)
    } finally {
      this.saving = false
      this.publish()
    }
  }

  /** Poll GitHub once and compare the HEAD commit with the build commit. */
  async checkNow(): Promise<void> {
    if (this.update.checking) return
    this.update = { ...this.update, checking: true, error: undefined }
    this.publish()
    try {
      const latest = await fetchLatestCommit()
      this.update = {
        checking: false,
        available: BUILD_COMMIT !== undefined && latest !== BUILD_COMMIT,
        latestCommit: latest,
        currentCommit: BUILD_COMMIT,
        error: undefined,
      }
    } catch (error) {
      this.update = {
        ...this.update,
        checking: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
    this.publish()
  }

  /** Re-arm the periodic check timer from the current `autoUpdate` settings. */
  private syncTimer(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer)
      this.timer = undefined
    }
    const snapshot = this.scope.getSnapshot()
    if (snapshot.status !== 'ready' || snapshot.value?.autoUpdate !== true) return
    this.timer = setInterval(() => { void this.checkNow() }, snapshot.value.updateCheckIntervalSeconds * 1000)
    void this.checkNow()
  }

  /** The face the card's slot registration injects. */
  inject(): BackgroundCardFace {
    return {
      hooks: { backgroundCard: this.store },
      edit: (field, value) => { this.edit(field, value) },
      save: () => { void this.save() },
      discard: () => { this.discard() },
      checkNow: () => { void this.checkNow() },
    }
  }

  /** Stop observing and clear the timer. */
  dispose(): void {
    this.disposed = true
    this.unsubscribe()
    if (this.timer !== undefined) {
      clearInterval(this.timer)
      this.timer = undefined
    }
  }
}
