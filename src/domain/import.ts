export interface ParsedEntry {
  front: string
  back: string
  transcription?: string
  example?: string
}

/**
 * Parses a bulk paste into card entries. One card per line.
 * Accepts common separators between front and back: em dash, hyphen, tab,
 * semicolon, or " = ". Everything after a second separator is treated as an
 * example. Blank lines are skipped.
 *
 *   apple — яблоко
 *   run - бежать - I run every morning
 *   Katze; кошка
 */
export function parseBulk(text: string): ParsedEntry[] {
  const entries: ParsedEntry[] = []
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const parts = line
      .split(/\s+[—–-]\s+|\t|\s*;\s*|\s+=\s+/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length < 2) continue
    entries.push({
      front: parts[0],
      back: parts[1],
      example: parts[2] || undefined,
    })
  }
  return entries
}
