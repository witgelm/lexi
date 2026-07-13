/**
 * Initializes the Telegram Mini App runtime.
 *
 * We use the classic `window.Telegram.WebApp` object (loaded via the script in
 * index.html) for lifecycle + CloudStorage, which is the most stable surface.
 * `ready()` tells Telegram the app has rendered; `expand()` uses full height.
 */
type WebApp = {
  ready: () => void
  expand: () => void
  colorScheme?: 'light' | 'dark'
  showAlert?: (message: string, cb?: () => void) => void
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
}

export function colorScheme(): 'light' | 'dark' {
  return getWebApp()?.colorScheme ?? 'light'
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
