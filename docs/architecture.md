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
  (marketing)/page.tsx        лендинг: Hero с превью рецепта по ссылке без аккаунта, блок расширения, CTA
  (auth)/                     login, register, forgot-password, reset-password (возврат по ?next)
  dashboard/page.tsx          тонкая обёртка над components/dashboard/DashboardClient
  dashboard/settings/         тема, экспорт JSON, аналитика, выход, удаление аккаунта
  share/                      Web Share Target PWA (Android): ссылка → импорт в редактор
  extension/welcome/          страница после первой установки расширения
  api/recipes/import          POST: URL → рецепт (fetch, парсинг, картинка)
  api/recipes/images          POST: загрузка картинки рецепта
  api/account/delete          удаление аккаунта (нужен service role key)
  privacy, terms, sitemap, robots, manifest, opengraph-image
src/components/
  ui/                         button, card, chip, dialog, empty-state, form, input, label, notice-toast, skeleton
  dashboard/                  AppShell, TopBar, DashboardClient, DashboardDialogs, EmptyLibrary,
                              хуки useDashboardData / Filters / Actions / Import
  dashboard/recipe/           RecipeCard, RecipeDetails, RecipeForm (три поля), CookingMode
  landing/                    Header, Hero, Features, CTA, Footer
  AnalyticsConsent.tsx        баннер согласия на аналитику
src/lib/
  recipe-import-parser.ts     JSON-LD → microdata (+ h-recipe e-instructions) → эвристики
  recipe-import-url.ts        нормализация URL, защита от SSRF (только публичные адреса)
  recipe-import-existing.ts   «уже в библиотеке» по source_url (W-05)
  recipe-image.ts             загрузка картинки, пресеты preview/stored, запись в Storage
  rate-limit.ts               Upstash Redis, in-memory fallback без env (локально)
  analytics.ts, analytics-events.ts   PostHog EU после согласия; whitelist событий и свойств
  share-target.ts             извлечение ссылки из title/text/url
  auth-destination.ts         безопасный ?next после входа
  pending-recipe-import.ts    ключи sessionStorage для черновика (лендинг, расширение)
  recipe-export.ts            экспорт библиотеки в JSON
  offline-recipes.ts          снимок библиотеки в IndexedDB для PWA
  step-durations.ts           поиск длительностей в шагах (для таймеров)
public/sw.js                  service worker (версионированные кэши)
supabase/migrations/          полная схема БД
extension/                    Chrome-расширение MV3, plain JS без сборки
scripts/                      бенчмарки парсера и расширения, иконки, упаковка расширения
```

## Модель данных

- `recipes`: title, description, ingredients (jsonb `{id,name,amount?,unit?}[]`), steps (jsonb `{id,text}[]`), tags `text[]`, source_url (уникален в пределах пользователя), image_url (только наш Storage), total_time, servings, timestamps.
- `collections` и `recipe_collections`: связь многие-ко-многим. Новым аккаунтам коллекции не создаются (миграция `20261113`); в минимальном UI коллекции, теги и избранное скрыты, но сохраняются и попадают в экспорт.
- `favorite_recipes`: избранное (скрыто в UI).
- Функция `save_recipe` сохраняет рецепт и его коллекции атомарно.
- RLS включён на всех таблицах, каждый пользователь видит только своё. Картинки читаются публично.
- Таблиц для подписок, событий и профиля с планом пока нет.

## Импорт по ссылке

`POST /api/recipes/import` доступен анонимно (на нём работает демо на лендинге):

1. Нормализация URL и проверка, что адрес публичный.
2. Fetch: таймаут 12 с, до 5 редиректов, не больше 3 МБ HTML.
3. Парсер: Recipe JSON-LD (включая `@graph` и секции инструкций), затем microdata, затем эвристики по разметке.
4. Картинка: для анонимов — сжатый data-URL (`preview`), для вошедших — загрузка в Storage (`stored`).
5. Лимиты: аноним — 8 импортов за 10 минут по IP, пользователь — 30, картинки — 40. Счётчики общие для всех инстансов через Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).

## PWA

Офлайн работает только на чтение: снимок библиотеки хранится в IndexedDB, картинки и оболочка кэшируются service worker. Подробности в [pwa-v1.md](pwa-v1.md). На Android установленная PWA есть в меню «Поделиться» (`share_target` → `/share`).

## Расширение (v0.2.0, готово к упаковке, не опубликовано)

- MV3, разрешения: `activeTab`, `scripting`, `sidePanel`, `storage`. Host permission только на `https://keepandcook.com/*`.
- `background.js` открывает side panel по клику на иконку, вкладку сохранения и `/extension/welcome` при первой установке.
- `extract.js` выполняется на странице и достаёт Recipe JSON-LD или microdata; время и порции по правилам серверного парсера. Если не нашёл, `panel.js` вызывает публичный `/api/recipes/import` с URL страницы. Адрес сайта — одна константа `APP_ORIGIN` в `shared.js`.
- `sidepanel.html` и `panel.js`: карточка рецепта, чекбоксы ингредиентов, скачивание `.txt`, кнопки «Начать готовить» и «Сохранить».
- `reader.js` и `reader.css`: cook mode поверх всей страницы (оверлей). Если инжект не удался, открывается отдельная вкладка `cooking.html`.
- Сохранение: открывается `keepandcook.com/login#<recipe>`. Контент-скрипт `library-handoff.js` (`document_start`) валидирует рецепт и кладёт его в `sessionStorage` по ключу `keep-and-cook:pending-recipe-import` с меткой источника `extension`. Дальше пользователь входит, попадает в редактор дашборда и сам жмёт Save. Решение и альтернативы — [ADR 001](adr/001-extension-save.md).
- В расширении нет авторизации и токенов. Картинки при сохранении не передаются.
- Палитра расширения: кремовый фон, тёмно-фиолетовый текст, терракотовый акцент. Она стала основой нового дизайна, см. [design-direction.md](design-direction.md).

## Техдолг и риски

| # | Проблема | Почему важно | Задача |
|---|---|---|---|
| 1 | Нет мониторинга ошибок | Сбои на проде видны только по жалобам | W-09 |
| 2 | Нет E2E-тестов критичных потоков; локальный `supabase start` не проверен после переименования миграции `20260805` → `20260806` | Регрессии видны только на проде | W-11 |
| 3 | Два cook mode (`CookingMode.tsx` и `extension/reader.js`) | UX и таймеры нужно менять в двух местах | — |
| 4 | Расширение без сборки: правила времени и порций продублированы в `extract.js` (покрыто тестом на общей фикстуре) | Изменение правил в парсере нужно повторить в расширении | — |
| 5 | 12 сайтов из топ-50 блокируют серверный fetch | Импорт по ссылке на них не работает, в расширении — работает | W-03 |
