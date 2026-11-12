# A-06 — план продуктовой аналитики

Статус: спецификация для W-08 и G-09, 10.11.2026. Цель — измерять путь от первого рецепта до повторного приготовления в вебе и расширении, не передавая содержимое личной библиотеки аналитическому провайдеру.

## Инструмент и границы

**Выбор: PostHog Cloud EU (Frankfurt), один production-проект.** У PostHog есть единые события, воронки и идентификация между вебом и расширением; [первые 1 млн аналитических событий в месяц бесплатны](https://posthog.com/pricing), [EU Cloud размещён во Франкфурте](https://posthog.com/docs/privacy). Установить лимит затрат 0 до отдельного решения владельца; после бесплатного порога события могут отбрасываться. Записи сессий, autocapture, heatmaps, error tracking и feature flags не включать. Для dev/staging использовать отдельный локальный лог или отдельный проект при доступности — не смешивать с production.

**Альтернатива:** [Plausible](https://plausible.io/docs/subscription-plans) хорошо подходит для посещаемости сайта без cookies, но нужные здесь воронки, custom properties и API относятся к Business, а для событий расширения и связи с вебом понадобился бы собственный слой. Выбрать его, если после юридической оценки PostHog даже с явным согласием окажется неприемлемым.

Это продуктовый план, не юридическое заключение. До включения трекинга проверить текст privacy policy, договор обработки данных, срок хранения и требования к согласию в фактических странах запуска. Консервативное правило реализации: **до согласия не отправлять аналитические события** ни в вебе, ни в расширении. Отказ не мешает готовить или сохранять; согласие можно изменить в Settings. Если позже будет выбран cookieless режим, заменить правило только после юридической проверки. [PostHog позволяет отключать сбор по умолчанию](https://posthog.com/docs/privacy).

## Контракт события

- Имена — `snake_case`; события фиксируют **завершённое действие**, а не клик по кнопке. `recipe_saved` только после подтверждённой записи сервером. Точные точки отправки и idempotency ключи задать в W-08.
- Общие свойства: `surface: web|extension|pwa`, `entry_point: landing|dashboard|share|extension`, `app_version`, `extension_version` (если есть), `is_authenticated`, `consent_version`. Версия без URL и query string. Не слать эти свойства, когда значение неизвестно; не подставлять выдуманные значения.
- Идентификатор вошедшего пользователя — внутренний случайный UUID Supabase Auth, **не email**. До входа — случайный anonymous ID в пределах одного first-party контекста после согласия; связать веб и расширение только после явного входа/сохранения. `identify` после входа, `reset` при выходе. Не использовать адрес страницы рецепта как идентификатор.
- Для ошибок `reason` — только закрытый enum (`network`, `blocked`, `unsupported_page`, `no_recipe`, `missing_ingredients`, `missing_steps`, `invalid_url`, `rate_limited`, `handoff_expired`, `server_error`, `unknown`). Свободный текст ошибки не передавать.
- Отправка best-effort; ошибка аналитики никогда не блокирует пользовательское действие. Не дублировать событие при повторной отрисовке React, retry сети и смене вкладки.

## Таксономия

| Событие | Когда отправлять | Дополнительные свойства |
|---|---|---|
| `landing_viewed` | Первый показ лендинга в сессии | `referrer_category: direct|search|social|other|unknown` |
| `url_import_started` | Пользователь подтвердил URL | `source_kind: website|youtube|other_video` |
| `import_preview_shown` | Получен пригодный черновик | `source_kind`, `has_ingredients`, `has_steps`, `has_image` |
| `import_failed` | Импорт завершился ошибкой | `source: url|extension|video`, `reason` |
| `signup_started` | Отправлена форма регистрации | `entry_point` |
| `signup_completed` | Аккаунт подтверждён, пользователь вошёл | `entry_point` |
| `login_completed` | Успешный вход | `entry_point` |
| `recipe_saved` | Сервер подтвердил новую запись | `source: manual|url|extension|video`, `is_first_recipe` |
| `recipe_updated` | Сервер подтвердил правку | `source` исходного рецепта, если известно |
| `recipe_opened` | Пользователь открыл сохранённую карточку | `entry_point: dashboard|search|after_save|other` |
| `cook_mode_started` | Вид приготовления реально открыт | `surface: web|extension|pwa`, `recipe_origin: saved|preview` |
| `cook_mode_completed` | Пользователь нажал Finish | `surface`, `recipe_origin`, `step_count_bucket: 1-3|4-7|8+` |
| `recipe_exported` | Начат `.txt`, JSON либо системный Print | `format: txt|json|print` |
| `extension_installed` | `runtime.onInstalled` с reason `install` | `extension_version` |
| `extension_panel_opened` | Панель впервые открыта для вкладки | `is_supported_tab` |
| `extension_recipe_found` | Панель показала карточку | `has_ingredients`, `has_steps`, `has_image` |
| `extension_recipe_not_found` | Оба способа извлечения завершились без рецепта | `reason: unsupported_page|no_recipe|blocked|unknown` |
| `extension_save_started` | Пользователь открыл веб-передачу черновика | `is_authenticated` если известно |
| `extension_handoff_completed` | Веб принял черновик и открыл editor | `was_authenticated` |
| `extension_handoff_failed` | Черновик не принят | `reason: handoff_expired|invalid_url|server_error|unknown` |

Для будущего X-01 добавить `video_import_started`, `video_import_preview_shown`, `video_import_failed` с `platform: youtube|tiktok|instagram`, `input_kind: description|creator_link|user_text` и без текста видео. `recipe_saved {source: video}` уже предусмотрен.

## Воронки и определения

| Воронка | Шаги | Окно и знаменатель |
|---|---|---|
| Первый рецепт с лендинга | `landing_viewed` → `url_import_started` → `import_preview_shown` → `signup_completed` → `recipe_saved {is_first_recipe:true}` | 7 дней от первого шага; отдельный разрез по посетителям, давшим согласие |
| Расширение | `extension_installed` → `extension_panel_opened` → `extension_recipe_found` → `extension_save_started` → `extension_handoff_completed` → `recipe_saved {source:extension}` | 14 дней; до входа идентичность между поверхностями не гарантирована, поэтому install→save показывать как приблизительную метрику; точную считать от handoff после входа |
| Активация | `signup_completed` → первый `recipe_saved` → `cook_mode_started` | 14 дней; сегменты по источнику первого рецепта |
| Повторное использование | первый `recipe_saved` → `recipe_opened` / `cook_mode_started` в другой день | D7/D30 когорты только среди давших согласие |
| Качество импорта | `url_import_started` → `import_preview_shown` или `import_failed` | Одна попытка; разрез по `reason`, `source_kind`, версии приложения; считать долю только для наблюдаемых попыток |

Нельзя интерпретировать эти воронки как абсолютные показатели всех пользователей: отказ от аналитики, блокировщики и переходы между поверхностями смещают выборку. Для общего числа подтверждённых сохранений использовать агрегированный серверный счётчик без личного контента.

## Дашборды G-09

1. **Acquisition:** просмотры лендинга, начало импорта, установка/открытие панели, signup и конверсия первого рецепта по `entry_point`.
2. **Activation:** первый Save за 7/14 дней, время от регистрации до Save, доля начавших готовить, источники `manual|url|extension|video`.
3. **Import health:** попытки, полные/частичные preview, ошибки по `reason`, версии и поверхности; отдельно доля блокировок сайтов из A-05.
4. **Retention:** D7/D30 повторное открытие/готовка по когортам первого Save, число пользователей с повторным `cook_mode_started`.
5. **Extension handoff:** переходы панель→editor→Save, `handoff_expired`, вход при передаче, ограничение межконтекстного связывания.
6. **Consent/coverage:** доля согласившихся по поверхности и дата изменения правила — без попытки оценить личность отказавшихся.

## Приватность и реализация

- Никогда не отправлять название, ингредиенты, шаги, заметки, email, имя, домен/полный URL стороннего рецепта, токены, Supabase session, поисковые запросы, коллекции и теги. URL страницы веба передавать только как разрешённый route name без параметров; отключить автоматические pageview и capture событий, которые могут включать URL, DOM и формы.
- Для расширения собрать совместимый с MV3 локально упакованный SDK или посылать строго заданные события на собственный endpoint; никакого удалённого исполняемого кода. Проверить CSP и `host_permissions` на конкретном build.
- Событие `extension_installed` возможно только при согласии; если пользователь даст согласие позже, не отправлять задним числом фиктивную дату установки. Для оценки установок также использовать агрегат Chrome Web Store.
- Удаление аккаунта должно удалять/обезличивать связанную аналитику согласно политике хранения; до реализации проверить возможности PostHog EU и описать процесс в privacy policy.

## Открытые вопросы реализации

- Текст и версия согласия, а также юридически допустимый вариант без cookies для США/ЕС.
- Нужен ли proxy для extension ingestion и как связать consent веба с расширением без передачи auth токена.
- Срок хранения событий и процедура удаления в PostHog Cloud EU.
