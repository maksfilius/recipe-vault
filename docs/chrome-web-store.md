# Chrome Web Store — листинг (E-11)

Копируется в Developer Dashboard как есть. Тексты на английском (v1 только EN).

## Сборка

1. `git tag extension-v0.2.0 && npm run pack:extension` (на коммите в main, `extension/` без изменений).
2. Load unpacked `dist/extension/` → ручная проверка из `extension/README.md`.
3. Загрузить `dist/keep-and-cook-extension-0.2.0.zip`.

## Store listing

**Позиционирование.** Расширение — вход в библиотеку Keep & Cook, а не самостоятельная «читалка». Главное обещание: «сохрани рецепт с любого сайта в свою кулинарную книгу». Чистый вид и режим готовки — то, что пользователь получает сразу, без аккаунта. В панели главная кнопка «Save to my recipes», под ней подпись «Saves to your free cookbook at keepandcook.com». Будущий Pro в листинге не обещаем: он появится внутри библиотеки, куда листинг и ведёт.

**Name** (из manifest): Keep & Cook — Recipe Saver & Cookbook

**Summary** (из manifest, ≤132): Save recipes from any website to your own cookbook. Clean recipe view and step-by-step cooking mode, free.

**Category:** Lifestyle → Household (если появится Food & Drink — она).

**Language:** English.

**Description:**

```
Save recipes from any website to your own cookbook.

Keep & Cook is two things: this Chrome extension, which works on the recipe page you are reading, and your free cookbook at keepandcook.com, where saved recipes live. Here is how they fit together.

STEP 1. Open a recipe in Chrome (extension, no account needed)
On any recipe page, click the Keep & Cook icon. A side panel opens next to the page with just the ingredients and steps: no life story, no pop-ups, no ads in the way. Tick off ingredients as you gather them, or download the recipe as a text file.

STEP 2. Save it (extension → keepandcook.com)
Click "Save to my recipes". keepandcook.com opens in a new tab with the recipe ready. Sign in or create a free account, check the recipe, edit it if you like, and save.

STEP 3. Find it in your cookbook (keepandcook.com, free account)
All your saved recipes are in one place, with photos, ingredients, steps and a link to the original. Search them and sort them into collections like Breakfast or Dinner. You can also add family recipes by hand or paste a recipe link.

STEP 4. Take it to the kitchen (keepandcook.com on your phone)
Open keepandcook.com on your phone and add it to your home screen. It works like an app, and your recipes are there even offline.

STEP 5. Cook step by step (in the extension or in your cookbook)
Cooking mode shows large text, one step at a time, with step timers, and keeps the screen on. Start it right on the recipe page from the extension, or from any recipe in your cookbook.

PRIVACY
The extension reads a page only when you click its icon on that page. It has no access to the sites you browse otherwise. No analytics, no tracking, no ads. Your cookbook is private to your account.

Works on most recipe sites that publish structured recipe data. If a page has none, Keep & Cook reads that public page for you.
```

**Graphics:** `docs/store/`, в этом порядке (совпадает с шагами описания):
1. `1-save.jpg`: сайт с рецептом и панель, акцент на «Save to my recipes».
2. `2-library.jpg`: библиотека на компьютере, «Recipe saved to your library».
3. `3-phone.jpg`: библиотека и рецепт на телефоне (PWA).
4. `4-cook-mode.jpg`: режим готовки.
- Small promo tile 440×280: `promo-tile-440x280.jpg`.
- Icon 128×128: `extension/icons/icon-128.png`.

Фото еды на скриншотах взяты с Unsplash (лицензия Unsplash, коммерческое использование без указания автора): GyV6SL_fKsI, Bs_4ce9_w0I, 7ClANzfw6iU, gWkvURhoMlA, w0JzqJZYX_E, gZ7JK_wpFrY, HsSNbTSCdSs. Сайт «The Weeknight Table» и адреса `*.example` вымышлены.

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
