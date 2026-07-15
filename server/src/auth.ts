/**
 * Validates Telegram Mini App `initData` per the official algorithm:
 *   secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
 *   hash       = HMAC_SHA256(key=secret_key, msg=data_check_string)
 * where data_check_string is every field except `hash`, formatted `k=v`,
 * sorted alphabetically, joined by "\n". Uses the Workers Web Crypto API.
 */

export interface TelegramUser {
  telegramId: string
  username: string | null
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Returns the verified user, or null if the signature is invalid/missing. */
export async function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 24 * 60 * 60,
): Promise<TelegramUser | null> {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null
  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n')

  const secretKey = await hmacSha256(new TextEncoder().encode('WebAppData'), botToken)
  const signature = await hmacSha256(new Uint8Array(secretKey), dataCheckString)
  if (toHex(signature) !== hash) return null

  // Reject stale initData to limit replay.
  const authDate = Number(params.get('auth_date'))
  if (authDate && Date.now() / 1000 - authDate > maxAgeSeconds) return null

  const userRaw = params.get('user')
  if (!userRaw) return null
  try {
    const user = JSON.parse(userRaw) as { id: number; username?: string }
    return { telegramId: String(user.id), username: user.username ?? null }
  } catch {
    return null
  }
}
