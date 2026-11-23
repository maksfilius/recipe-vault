# Chrome Web Store — листинг (E-11)

Копируется в Developer Dashboard как есть. Тексты на английском (v1 только EN).

## Сборка

1. Версия в `extension/manifest.json`: **0.2.1** (исправления P0-1 и P1-1 из [launch-v1-release-checklist.md](launch-v1-release-checklist.md)). Тег ставится **только** на коммит, прошедший ручную проверку из раздела 5 чек-листа: `git tag extension-v0.2.1 && npm run pack:extension`.
2. Load unpacked `dist/extension/` → ручная проверка из раздела 5 чек-листа.
3. Загрузить `dist/keep-and-cook-extension-0.2.1.zip`.

## Store listing

**Позиционирование.** Расширение полезно само по себе и без аккаунта: читать рецепт без лишнего, готовить по шагам, скачать. Аккаунт нужен только чтобы сохранить рецепт в бесплатную библиотеку на keepandcook.com. В листинге только то, что работает сейчас: без коллекций, избранного, тегов (скрыты в минимальном UI), без ChatGPT, YouTube, AI и Pro.

**Name** (из manifest, ≤75): Keep & Cook — Recipe Saver & Reader

**Summary** (из manifest, ≤132; 101 символ): Read recipes without clutter, cook step by step, and save your favorites to a free personal cookbook.

**Category:** Lifestyle → Household (если появится Food & Drink — она).

**Language:** English.

**Description:**

```
Read recipes without clutter, cook step by step, and save your favorites to a free personal cookbook.

READ THE RECIPE, NOT THE CLUTTER (no account needed)
On a recipe page, click the Keep & Cook icon. A side panel opens next to the page with the photo, ingredients and steps. Tick off ingredients as you gather them, or download the recipe as a text file.

COOK STEP BY STEP (no account needed)
Click "Start cooking" and the recipe fills the window in large, readable text, one step at a time. Start a timer when a step mentions a time, open the ingredient list whenever you need it, and keep your screen on while you cook. Close cooking mode and you are back on the original page. If a site does not allow the cooking view on top of its page, it opens in a new tab instead.

SAVE RECIPES FOR LATER (free account)
Click "Save to my recipes". keepandcook.com opens in a new tab with the recipe ready to review. Sign in or create a free account, check or edit the recipe, and save it. Nothing is saved until you choose Save. If the recipe is already in your cookbook, Keep & Cook opens the saved copy instead of making a second one.

YOUR RECIPES, WHEREVER YOU COOK
Your cookbook at keepandcook.com keeps every saved recipe with its photo, ingredients, steps and a link to the original page. Search your recipes, add family recipes by hand, or paste a recipe link to import it. On your phone, add keepandcook.com to your home screen: it opens like an app, recipes you have already loaded stay readable offline, and the same cooking mode with timers is there in the kitchen. You can download all your recipes from Settings at any time.

PRIVACY
The extension reads a page only when you click its icon on that page. It looks for the recipe in the page itself; if the page has no recipe data, it sends only that page's address to the Keep & Cook import service, which reads the public page. The extension has no analytics, no ads and no access to the sites you browse otherwise. Your cookbook is private to your account.

Works on most recipe sites that publish structured recipe data. If a page has no recipe Keep & Cook can read, the panel says so, and you can add the recipe by hand on keepandcook.com.
```

Проверка утверждений (код на 23.11.2026): панель, чекбоксы, Download — `sidepanel.html`, `panel.js`; шаги, таймеры, ингредиенты, wake lock, запасная вкладка — `reader.js`, `cooking.html`; review перед Save и «уже в библиотеке» — `useDashboardImport.ts`, `useDashboardActions.ts`; поиск — `TopBar.tsx`; ручное добавление и импорт по ссылке — `RecipeForm.tsx`, `/api/recipes/import`; PWA и офлайн-чтение — `manifest.ts`, `offline-recipes.ts`, `sw.js`; экспорт — `SettingsClient.tsx`. Не упоминать: коллекции, избранное, теги, Android share target (не проверен на устройстве), синхронизацию офлайн-правок (их нет).

**Graphics:** пересобираются в Phase 3 под четыре заголовка описания (Read / Cook / Save / Wherever you cook) реальными снимками. Текущие файлы `docs/store/` (до Phase 3; размеры 1280×800 и 440×280 проверены):
1. `1-save.jpg`: сайт с рецептом и панель, акцент на «Save to my recipes».
2. `2-library.jpg`: библиотека на компьютере, «Recipe saved to your library».
3. `3-phone.jpg`: библиотека и рецепт на телефоне (PWA).
4. `4-cook-mode.jpg`: режим готовки.
- Small promo tile 440×280: `promo-tile-440x280.jpg`.
- Icon 128×128: `extension/icons/icon-128.png`.

Фото еды на скриншотах взяты с Unsplash (лицензия Unsplash, коммерческое использование без указания автора): GyV6SL_fKsI, Bs_4ce9_w0I, 7ClANzfw6iU, gWkvURhoMlA, w0JzqJZYX_E, gZ7JK_wpFrY, HsSNbTSCdSs. Сайт «The Weeknight Table» и адреса `*.example` вымышлены.

**Official URL / Homepage:** https://keepandcook.com
**Support URL:** https://keepandcook.com/privacy (раздел Contact). Блокер P0-2: на проде не задан `NEXT_PUBLIC_SUPPORT_EMAIL`, раздел Contact пока без адреса.

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
