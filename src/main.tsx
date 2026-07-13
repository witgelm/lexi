import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRoot } from '@telegram-apps/telegram-ui'
import '@telegram-apps/telegram-ui/dist/styles.css'
import { initTelegram, colorScheme } from '@/telegram/init'
import { App } from '@/App'
import './index.css'

initTelegram()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot appearance={colorScheme()}>
      <App />
    </AppRoot>
  </StrictMode>,
)
