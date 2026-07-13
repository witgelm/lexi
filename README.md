# Lexi — Telegram Mini App для изучения слов

**Lexi** (от греч. λέξις — «слово»). Изучение слов по принципу Anki: карточки + интервальные повторения (**FSRS**).
100% клиентское приложение — прогресс хранится в **Telegram CloudStorage** и
синхронизируется между устройствами через ваш Telegram-аккаунт. Своего бэкенда нет.

## Стек

- **React 18 + TypeScript + Vite**
- **@telegram-apps/telegram-ui** + `telegram-web-app.js` — нативный UI, тема, haptics
- **ts-fsrs** — планировщик повторений
- **zustand** — состояние
- Хранилище: Telegram CloudStorage (в браузере — фолбэк на localStorage)

## Структура

```
src/
  domain/       типы (Deck, Word, Review) и парсер импорта
  storage/      обёртка CloudStorage + чанкинг (лимит 4096 байт/ключ) + репозитории
  srs/          обёртка ts-fsrs (srs.ts) и построение очереди на сегодня (queue.ts)
  store/        zustand-стор
  telegram/     инициализация WebApp, haptics, тема
  screens/      экраны: список колод, колода, добавление слов, сессия изучения
```

## Запуск (dev)

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`. В обычном браузере приложение работает на
localStorage-фолбэке — удобно для разработки UI.

### Проверка внутри Telegram

Telegram Mini App требует **HTTPS**. Для локальной разработки поднимите туннель:

```bash
cloudflared tunnel --url http://localhost:5173
# или: ngrok http 5173
```

1. Создайте бота у **@BotFather** → `/newbot`.
2. `/newapp` (или Bot Settings → Menu Button → Web App URL) → вставьте HTTPS-URL туннеля.
3. Откройте бота в Telegram, нажмите Menu Button — приложение запустится с CloudStorage.

## Сборка и деплой

```bash
npm run build      # → dist/
```

`dist/` — статика. Разместите на любом HTTPS-хостинге (Cloudflare Pages, Vercel,
Netlify, GitHub Pages) и укажите итоговый URL в @BotFather.

## Как пользоваться

1. Создайте колоду (название + языковая пара, любая).
2. «Добавить слова» → вставьте список, по одной карточке на строку:
   ```
   apple — яблоко
   run — бежать — I run every morning
   Katze; кошка
   ```
   Разделитель: тире, точка с запятой, таб или ` = `. Третье поле — пример.
3. «Учить» → показать ответ → оценка **Again / Hard / Good / Easy**.
   FSRS сам назначит дату следующего показа.

## Что дальше (не входит в v1)

- Push-напоминания «пора повторять» (нужен мини serverless-cron + Bot API).
- Готовые колоды (топ-1000 слов), озвучка (TTS), картинки.
- Экран статистики: streak, точность, календарь активности.
- Автоперевод/примеры через LLM.
```
