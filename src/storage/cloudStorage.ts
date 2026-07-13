/**
 * Thin async wrapper over Telegram WebApp CloudStorage.
 *
 * Limits to respect (Telegram Bot API):
 *  - up to 1024 keys per user
 *  - key: 1..128 chars, [A-Za-z0-9_-]
 *  - value: up to 4096 bytes
 *
 * Because a single value is capped at 4096 bytes, large collections
 * (cards, reviews) are chunked by the repositories on top of this.
 *
 * Falls back to localStorage when running outside Telegram (browser dev),
 * so the app is testable without the Telegram client.
 */

type WebAppCloudStorage = {
  getItem(key: string, cb: (err: string | null, value: string | null) => void): void
  setItem(key: string, value: string, cb?: (err: string | null, ok: boolean) => void): void
  removeItem(key: string, cb?: (err: string | null, ok: boolean) => void): void
  getKeys(cb: (err: string | null, keys: string[]) => void): void
}

function getTgCloud(): WebAppCloudStorage | null {
  const tg = (window as unknown as { Telegram?: { WebApp?: { CloudStorage?: WebAppCloudStorage } } })
    .Telegram?.WebApp
  return tg?.CloudStorage ?? null
}

const LS_PREFIX = 'volta:'

export const cloud = {
  async get(key: string): Promise<string | null> {
    const c = getTgCloud()
    if (!c) return localStorage.getItem(LS_PREFIX + key)
    return new Promise((resolve, reject) => {
      c.getItem(key, (err, value) => (err ? reject(new Error(err)) : resolve(value)))
    })
  },

  async set(key: string, value: string): Promise<void> {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(key)) {
      throw new Error(`Invalid CloudStorage key "${key}" (only A-Za-z0-9_- allowed, max 128)`)
    }
    if (new Blob([value]).size > 4096) {
      throw new Error(`CloudStorage value for "${key}" exceeds 4096 bytes`)
    }
    const c = getTgCloud()
    if (!c) {
      localStorage.setItem(LS_PREFIX + key, value)
      return
    }
    return new Promise((resolve, reject) => {
      c.setItem(key, value, (err) => (err ? reject(new Error(err)) : resolve()))
    })
  },

  async remove(key: string): Promise<void> {
    const c = getTgCloud()
    if (!c) {
      localStorage.removeItem(LS_PREFIX + key)
      return
    }
    return new Promise((resolve, reject) => {
      c.removeItem(key, (err) => (err ? reject(new Error(err)) : resolve()))
    })
  },

  async keys(): Promise<string[]> {
    const c = getTgCloud()
    if (!c) {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith(LS_PREFIX))
        .map((k) => k.slice(LS_PREFIX.length))
    }
    return new Promise((resolve, reject) => {
      c.getKeys((err, keys) => (err ? reject(new Error(err)) : resolve(keys)))
    })
  },

  async getJSON<T>(key: string, fallback: T): Promise<T> {
    const raw = await this.get(key)
    if (raw == null) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  },

  async setJSON(key: string, value: unknown): Promise<void> {
    await this.set(key, JSON.stringify(value))
  },
}
