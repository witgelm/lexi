# Запуск Lexi в Telegram (GitHub Pages)

Пошагово: от локального репозитория до работающего Mini App в боте.

## 1. Залить код на GitHub

Создай пустой репозиторий на GitHub (без README/gitignore), затем локально:

```bash
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

## 2. Включить GitHub Pages через Actions

1. В репозитории: **Settings → Pages**.
2. **Build and deployment → Source** → выбери **GitHub Actions**.
3. Готово: воркфлоу `.github/workflows/deploy.yml` соберёт проект и опубликует его.
   Каждый `git push` в `main` = авто-деплой.

Проверь вкладку **Actions** — после успешного прогона сайт будет по адресу:

```
https://<USERNAME>.github.io/<REPO>/
```

Открой этот URL в обычном браузере — приложение должно загрузиться
(в браузере данные хранятся в localStorage; CloudStorage включается только в Telegram).

## 3. Создать бота и привязать Mini App (@BotFather)

1. **@BotFather** → `/newbot` → имя и `@username_bot`. Сохрани токен.
2. `/newapp` → выбери бота → short name, описание, иконка (640×360) →
   в поле **Web App URL** вставь `https://<USERNAME>.github.io/<REPO>/`.
3. Дополнительно: **Bot Settings → Menu Button → Configure Menu Button** → тот же URL.

Прямая ссылка на приложение: `t.me/<username_bot>/<app_short_name>`.

## 4. Проверка вживую

1. Открой бота в Telegram → кнопка меню (или прямая ссылка) → запустится Lexi.
2. Тест-сценарий сохранения:
   - создай колоду → добавь 5 слов → пройди сессию;
   - полностью закрой приложение и открой снова — прогресс должен сохраниться (CloudStorage).

## Обновление приложения

Просто пуш в `main`:

```bash
git add -A && git commit -m "..." && git push
```

Actions пересоберёт и выкатит новую версию. Telegram может кэшировать —
если не видно изменений, закрой и переоткрой Mini App.

## Частые проблемы

- **Белый экран / ассеты не грузятся** — обычно из-за путей. Здесь используется
  `base: './'` в `vite.config.ts`, поэтому работает на любом субпути Pages. Не меняй на абсолютный путь.
- **CloudStorage не сохраняет** — проверяешь в браузере, а не в Telegram. CloudStorage
  доступен только в реальном клиенте Telegram по HTTPS.
- **Actions падает на `npm ci`** — убедись, что `package-lock.json` закоммичен (он есть в репозитории).
