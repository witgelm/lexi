/**
 * Initializes the Telegram Mini App runtime.
 *
 * We use the classic `window.Telegram.WebApp` object (loaded via the script in
 * index.html) for lifecycle + CloudStorage, which is the most stable surface.
 * `ready()` tells Telegram the app has rendered; `expand()` uses full height;
 * `requestFullscreen()` (Bot API 8.0+) goes immersive on mobile clients.
 */
type WebApp = {
  ready: () => void
  expand: () => void
  initData?: string
  colorScheme?: 'light' | 'dark'
  showAlert?: (message: string, cb?: () => void) => void
  // Fullscreen API — Bot API 8.0+, absent on older clients.
  requestFullscreen?: () => void
  exitFullscreen?: () => void
  isFullscreen?: boolean
  onEvent?: (event: string, handler: (payload?: { error?: string }) => void) => void
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
  }
}

function getWebApp(): WebApp | null {
  return (window as unknown as { Telegram?: { WebApp?: WebApp } }).Telegram?.WebApp ?? null
}

export function initTelegram(): void {
  const wa = getWebApp()
  if (!wa) return // running in a plain browser (dev)
  wa.ready()
  wa.expand()

  // Go fullscreen on supported (mobile) clients. On desktop/older clients the
  // method is missing or fires `fullscreenFailed` — we just stay expanded.
  if (typeof wa.requestFullscreen === 'function') {
    wa.onEvent?.('fullscreenFailed', () => {
      /* unsupported (e.g. desktop) — ignore, expand() already applied */
    })
    try {
      wa.requestFullscreen()
    } catch {
      /* ignore */
    }
  }
}

export function colorScheme(): 'light' | 'dark' {
  return getWebApp()?.colorScheme ?? 'light'
}

/** Raw Telegram initData string, sent to the API for auth. Empty in a browser. */
export function initData(): string {
  return getWebApp()?.initData ?? ''
}

export function haptic(kind: 'light' | 'medium' | 'heavy' = 'light'): void {
  getWebApp()?.HapticFeedback?.impactOccurred(kind)
}

export function hapticSuccess(): void {
  getWebApp()?.HapticFeedback?.notificationOccurred('success')
}

/** Native Telegram alert; falls back to window.alert in the browser. */
export function showAlert(message: string): void {
  const wa = getWebApp()
  if (wa?.showAlert) wa.showAlert(message)
  else window.alert(message)
}
