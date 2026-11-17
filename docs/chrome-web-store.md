# Chrome Web Store — листинг (E-11)

Копируется в Developer Dashboard как есть. Тексты на английском (v1 только EN).

## Сборка

1. `git tag extension-v0.2.0 && npm run pack:extension` (на коммите в main, `extension/` без изменений).
2. Load unpacked `dist/extension/` → ручная проверка из `extension/README.md`.
3. Загрузить `dist/keep-and-cook-extension-0.2.0.zip`.

## Store listing

**Name** (из manifest): Keep & Cook — Recipe Companion

**Summary** (из manifest, ≤132): Read, cook, download, and keep recipes from the page you are visiting.

**Category:** Lifestyle → Household (если появится Food & Drink — она).

**Language:** English.

**Description:**

```
Recipe pages are long. Keep & Cook shows just the recipe, right beside the page.

Click the Keep & Cook icon on any recipe site and a side panel opens with the ingredients and steps — no life story, no pop-ups, no ads in the way.

• Read: ingredients and steps in a clean side panel, next to the original page.
• Check off: tick ingredients as you gather them.
• Cook: a full-window cooking view with large text, one step at a time, step timers, and the screen kept on.
• Download: save the recipe as a plain text file. No account needed.
• Keep: send the recipe to your free Keep & Cook library (keepandcook.com) to review, edit and save. Your library works on your phone as an app, even offline.

Privacy first
The extension reads a page only when you click its icon on that page. It has no access to the sites you browse otherwise. No analytics, no tracking, no ads. Reading, cooking and downloading work without an account.

Works on most recipe sites that publish structured recipe data, which is the large majority. If a page has none, the extension asks Keep & Cook to read that public page for you.
```

**Graphics:** `docs/store/`
- Screenshots 1280×800: `1-panel.jpg`, `2-cook-mode.jpg`, `3-dark.jpg`
- Small promo tile 440×280: `promo-tile-440x280.jpg`
- Icon 128×128: `extension/icons/icon-128.png`

**Official URL / Homepage:** https://keepandcook.com
**Support URL:** https://keepandcook.com/privacy (раздел Contact) или support-адрес

## Privacy practices

**Single purpose:**

```
Show the recipe from the web page the user is viewing in a clean side panel, so they can read it, cook from it step by step, download it, or save it to their Keep & Cook library.
```

**Permission justifications:**

| Permission | Justification |
|---|---|
| activeTab | Reads the recipe from the current tab only after the user clicks the extension icon on that page. |
| scripting | Runs the recipe reader in the tab the user clicked, and opens the full-window cooking view over that page. |
| sidePanel | Shows the extracted recipe in Chrome's side panel next to the page. |
| storage | Keeps the recipe the user is cooking in session storage, so the cooking view can reopen in a new tab when a site blocks overlays. Cleared when the browser closes. |
| Host permission `https://keepandcook.com/*` | Hands the recipe to the Keep & Cook website when the user chooses Save, and calls the Keep & Cook import service for pages without structured recipe data. No other sites. |

**Remote code:** No, I am not using remote code. (Все скрипты в пакете, CSP `script-src 'self'`.)

**Data usage — что отметить:**
- **Website content** — да: текст рецепта со страницы, на которой пользователь нажал иконку (в т.ч. адрес страницы, если структурных данных нет и рецепт читает сервер).
- Остальное (personally identifiable info, health, financial, authentication, personal communications, location, web history, user activity) — нет. Адрес отправляется только для одной страницы по клику пользователя, историю расширение не собирает.

Три подтверждения (не продаём данные третьим лицам; не используем не по назначению; не для кредитоспособности) — отметить все.

**Privacy policy URL:** https://keepandcook.com/privacy (раздел «Chrome Extension» уже описывает расширение).

## Distribution

Сначала **Unlisted**: установить по ссылке, проверить установку из стора, первое открытие `/extension/welcome`, сохранение в библиотеку. Потом переключить на **Public**.

## После одобрения

1. Vercel → Production env: `NEXT_PUBLIC_CHROME_EXTENSION_URL=https://chromewebstore.google.com/detail/<id>` → **Redeploy** (переменная встраивается при сборке).
2. Кнопка «Add to Chrome» на лендинге и ссылка в пустой библиотеке включатся сами.
3. В `extension/README.md` убрать «not published to the Chrome Web Store»; E-11 в `docs/tasks.md` → готово.
