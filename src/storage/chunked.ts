import { cloud } from './cloudStorage'

/**
 * Stores an array of items across multiple CloudStorage keys so that no
 * single value exceeds the 4096-byte limit. Items are packed greedily.
 *
 * Layout for a collection named `ns` (keys use only [A-Za-z0-9_-] per
 * Telegram CloudStorage rules — no colons):
 *   `${ns}_i`      → { chunks: number }        (index: how many chunk keys exist)
 *   `${ns}_c0..cN` → JSON array of items
 */
const MAX_BYTES = 3800 // headroom under 4096 for JSON overhead

function byteLen(s: string): number {
  return new Blob([s]).size
}

export async function loadCollection<T>(ns: string): Promise<T[]> {
  const { chunks } = await cloud.getJSON<{ chunks: number }>(`${ns}_i`, { chunks: 0 })
  const out: T[] = []
  for (let i = 0; i < chunks; i++) {
    const part = await cloud.getJSON<T[]>(`${ns}_c${i}`, [])
    out.push(...part)
  }
  return out
}

export async function saveCollection<T>(ns: string, items: T[]): Promise<void> {
  // Greedily pack items into chunks under MAX_BYTES.
  const chunks: T[][] = []
  let cur: T[] = []
  for (const item of items) {
    const tentative = JSON.stringify([...cur, item])
    if (byteLen(tentative) > MAX_BYTES && cur.length > 0) {
      chunks.push(cur)
      cur = [item]
    } else {
      cur.push(item)
    }
  }
  if (cur.length > 0) chunks.push(cur)

  const prev = await cloud.getJSON<{ chunks: number }>(`${ns}_i`, { chunks: 0 })

  for (let i = 0; i < chunks.length; i++) {
    await cloud.setJSON(`${ns}_c${i}`, chunks[i])
  }
  // Remove stale chunk keys if the collection shrank.
  for (let i = chunks.length; i < prev.chunks; i++) {
    await cloud.remove(`${ns}_c${i}`)
  }
  await cloud.setJSON(`${ns}_i`, { chunks: chunks.length })
}
