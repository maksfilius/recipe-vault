# Архитектура (текущее состояние)

## Стек

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI (dialog, label, slot), react-hook-form + zod, lucide-react, swiper
- Supabase: Auth (email и пароль), Postgres с RLS, Storage (бакет `recipe-images`)
- Resend для писем; sharp для обработки изображений; cheerio для парсинга HTML
- Прод: `https://keepandcook.com`. Сборка `npm run build` идёт через webpack.
- Тесты: `node --test` по файлам `tests/*.test.mts`, только unit. E2E-тестов нет.

## Карта кода

```
src/app/
  (marketing)/page.tsx        лендинг (Hero с демо-импортом без аккаунта, Features, CTA)
  (auth)/                     login, register, forgot-password, reset-password
  dashboard/page.tsx          библиотека: список/колода, поиск, фильтры, редактор, импорт (753 строки, монолит)
  dashboard/favorites/        избранное
  dashboard/settings/         профиль, пароль, выход из сессий, удаление аккаунта
  extension-import/           durable-handoff из расширения (не задеплоен, не обязателен)
  api/recipes/import          POST: URL → рецепт (fetch, парсинг, картинка)
  api/recipes/images          POST: загрузка картинки рецепта
  api/account/delete          удаление аккаунта (нужен service role key)
  privacy, terms, sitemap, robots, manifest, opengraph-image
src/components/
  ui/                         button, card, dialog, form, input, label, notice-toast
  dashboard/                  AppShell, SideBar, TopBar, BottomNav
  dashboard/recipe/           RecipeCard, RecipeDeck, RecipeDetails, RecipeForm, CookingMode
  landing/                    Header, Hero, Features, CTA, Footer
src/lib/
  recipe-import-parser.ts     JSON-LD → microdata → эвристики (1415 строк)
  recipe-import-url.ts        нормализация URL, защита от SSRF (только публичные адреса)
  recipe-image.ts             загрузка картинки, пресеты preview/stored, запись в Storage
  rate-limit.ts               in-memory лимиты (см. техдолг)
  recipe-validation.ts        zod-схема payload рецепта
  offline-recipes.ts          снимок библиотеки в IndexedDB для PWA
  step-durations.ts           поиск длительностей в шагах (для таймеров)
  pending-recipe-import.ts    ключ sessionStorage для передачи черновика в редактор
  recipe-import-transfer.ts   хранение черновиков из расширения (до 7 дней, localStorage)
public/sw.js                  service worker (версионированные кэши)
supabase/migrations/          полная схема БД
extension/                    Chrome-расширение MV3, plain JS без сборки
```

## Модель данных

- `recipes`: title, description, ingredients (jsonb `{id,name,amount?,unit?}[]`), steps (jsonb `{id,text}[]`), tags `text[]`, source_url (уникален в пределах пользователя), image_url (только наш Storage), total_time, servings, timestamps.
- `collections` и `recipe_collections`: связь многие-ко-многим. Дефолтные коллекции: Breakfast, Lunch, Dinner, Snacks.
- `favorite_recipes`: избранное.
- Функция `save_recipe` сохраняет рецепт и его коллекции атомарно.
- RLS включён на всех таблицах, каждый пользователь видит только своё. Картинки читаются публично.
- Таблиц для подписок, событий и профиля с планом пока нет.

## Импорт по ссылке

`POST /api/recipes/import` доступен анонимно (на нём работает демо на лендинге):

1. Нормализация URL и проверка, что адрес публичный.
2. Fetch: таймаут 12 с, до 5 редиректов, не больше 3 МБ HTML.
3. Парсер: Recipe JSON-LD (включая `@graph` и секции инструкций), затем microdata, затем эвристики по разметке.
4. Картинка: для анонимов — сжатый data-URL (`preview`), для вошедших — загрузка в Storage (`stored`).
5. Лимиты: аноним — 8 импортов за 10 минут по IP, пользователь — 30, картинки — 40.

## PWA

Офлайн работает только на чтение: снимок библиотеки хранится в IndexedDB, картинки и оболочка кэшируются service worker. Подробности в [pwa-v1.md](pwa-v1.md).

## Расширение (v0.2.0, прототип)

- MV3, разрешения: `activeTab`, `scripting`, `sidePanel`, `storage`. Host permission только на `https://keepandcook.com/*`.
- `background.js` открывает side panel по клику на иконку и открывает вкладку сохранения.
- `extract.js` выполняется на странице и достаёт Recipe JSON-LD. Если не нашёл, `panel.js` вызывает публичный `/api/recipes/import` с URL страницы.
- `sidepanel.html` и `panel.js`: карточка рецепта, чекбоксы ингредиентов, скачивание `.txt`, кнопки «Начать готовить» и «Сохранить».
- `reader.js` и `reader.css`: cook mode поверх всей страницы (оверлей). Если инжект не удался, открывается отдельная вкладка `cooking.html`.
- Сохранение: открывается `keepandcook.com/login#<recipe>`. Контент-скрипт `library-handoff.js` (`document_start`) валидирует рецепт и кладёт его в `sessionStorage` по ключу `keep-and-cook:pending-recipe-import`. Дальше пользователь входит, попадает в редактор дашборда и сам жмёт Save.
- В расширении нет авторизации и токенов. Картинки при сохранении не передаются.
- Палитра расширения: кремовый фон, тёмно-фиолетовый текст, терракотовый акцент. Она стала основой нового дизайна, см. [design-direction.md](design-direction.md).

## Техдолг и риски

| # | Проблема | Почему важно | Задача |
|---|---|---|---|
| 1 | In-memory rate limit: у каждого serverless-инстанса свой счётчик | Перед привлечением трафика публичный импорт легко абузить | W-02 |
| 2 | `dashboard/page.tsx` — монолит на 753 строки | Редизайн и новые фичи будут конфликтовать между агентами | W-01 |
| 3 | Нет продуктовой аналитики и мониторинга ошибок | Нельзя измерить воронку и поймать сбои | A-06, W-08, W-09 |
| 4 | Домен `keepandcook.com` захардкожен в расширении и в `recipe-import-transfer.ts` | Нельзя тестировать на preview или локально | W-10 |
| 5 | Незакоммиченные изменения прототипа (auth `next`, `/extension-import`, тесты) | Состояние репозитория не совпадает с продом | E-01 |
| 6 | Два cook mode (`CookingMode.tsx` и `extension/reader.js`) с разной логикой | Расходятся UX и фичи, например таймеры | D-10, E-06 |
| 7 | Расширение без сборки и без общего кода с вебом (парсер дублируется частично) | Исправления парсера приходится делать дважды | E-05 |
| 8 | Нет E2E-тестов критичных потоков | Регрессии видны только на проде | W-11 |
