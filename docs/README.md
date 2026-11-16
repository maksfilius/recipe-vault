# Keep & Cook: документация проекта

Состояние на 2026-11-16. Веб-версия с PWA работает на `https://keepandcook.com`. Chrome-расширение (v0.2.0) готово к упаковке, но ещё не опубликовано. Статус задач — в [tasks.md](tasks.md#статус-на-16112026).

| Документ | Что внутри |
|---|---|
| [product-vision.md](product-vision.md) | Концепт продукта, точки входа, аудитория, этапы, гипотезы монетизации, метрики |
| [architecture.md](architecture.md) | Как устроен код сейчас: веб, БД, импорт, PWA, расширение; известный техдолг |
| [design-direction.md](design-direction.md) | Утверждённая палитра, типографика, состояния и правила миграции UI (D-01) |
| [design-components.md](design-components.md) | Снимки базовых компонентов в обеих темах и на телефоне (D-02) |
| [design-shell.md](design-shell.md) | Навигация и снимки оболочки на десктопе и телефоне (D-04) |
| [design-library.md](design-library.md) | Минимальная сетка, поиск и пустая библиотека (M-01—M-06) |
| [design-recipe-details.md](design-recipe-details.md) | Карточка рецепта, источник и состояния неполного рецепта (D-06) |
| [design-recipe-editor.md](design-recipe-editor.md) | Добавление вручную, импорт ссылки и черновика расширения (D-07) |
| [design-auth.md](design-auth.md) | Четыре auth-экрана и возврат по `next` после регистрации или сброса пароля (D-08) |
| [design-landing.md](design-landing.md) | Лендинг, URL-превью, расширение, мобильные метрики и снимки (D-09) |
| [design-cook-mode.md](design-cook-mode.md) | Шаги, ингредиенты, таймеры, wake lock и браузерная проверка cook mode (D-10) |
| [design-extension-panel.md](design-extension-panel.md) | Все состояния боковой панели расширения и локальные снимки (D-12) |
| [design-extension-reader.md](design-extension-reader.md) | Cook mode расширения, таймеры и проверка трёх размеров (D-13) |
| [w01-verification.md](w01-verification.md) | Ручная проверка рефакторинга библиотеки и найденный конфликт локальных миграций |
| [m01-m03-verification.md](m01-m03-verification.md) | Минимальная шапка и библиотека: снимки, размеры сетки, проверка меню и перенаправления |
| [m04-verification.md](m04-verification.md) | Минимальный экран рецепта: три варианта на телефоне и десктопе, проверка меню действий |
| [m05-verification.md](m05-verification.md) | Редактор из трёх полей: снимки, импортные черновики и сохранение скрытых данных |
| [roadmap.md](roadmap.md) | Этапы, их порядок и критерии выхода |
| [tasks.md](tasks.md) | Задачи для агентов: ID, зависимости, критерии готовности |
| [adr/001-extension-save.md](adr/001-extension-save.md) | E-02: расширение сохраняет через вкладку сайта, без токенов в расширении |
| [research/competitors.md](research/competitors.md) | A-01: сравнение конкурентов, отзывы и возможности для Keep & Cook |
| [research/audience.md](research/audience.md) | A-02: сегменты, JTBD и рекомендация по стартовому рынку |
| [specs/extension.md](specs/extension.md) | A-03: утверждённый целевой опыт Chrome-расширения v1.0 |
| [specs/web.md](specs/web.md) | A-04: утверждённый целевой опыт веба и PWA v1.0 |
| [research/parser-baseline.md](research/parser-baseline.md) | A-05: результаты бенчмарка парсера на 50 сайтах и причины провалов |
| [research/parser-w03-recheck.md](research/parser-w03-recheck.md) | W-03: повторный прогон и блокировка сайтов, из-за которой общий порог 80% пока не достигнут |
| [specs/analytics-events.md](specs/analytics-events.md) | A-06: события, воронки, дашборды и требования к приватности |
| [research/social-import.md](research/social-import.md) | A-07: источники данных для видео/соцсетей, выборка 10 видео, риски и стоимость |
| [pwa-v1.md](pwa-v1.md) | Офлайн-режим PWA v1 и правила таймеров (без изменений) |
| `../extension/README.md` | Установка прототипа расширения и ручные проверки |
| `../PRODUCT.md` | A-08: карточка продукта для дизайн-скилла `impeccable` |

## Правила для агентов

1. Берите одну задачу из `tasks.md`. Перед стартом проверьте, что все задачи из поля «Зависит от» закрыты.
2. Аналитические задачи (`A-*`, `G-01`) пишут markdown в `docs/research/` или `docs/specs/` и не меняют продуктовый код. Исключение A-05: воспроизводимый скрипт бенчмарка в `scripts/` и список тестовых URL.
3. Код: одна задача — одна ветка — один PR. Перед PR запустите `npm run test` (lint, typecheck и unit-тесты), а для UI-изменений ещё `npm run build`.
4. Схема БД меняется только новой миграцией в `supabase/migrations/`. Существующие миграции не редактировать: прод уже на них.
5. Прод живой. Не меняйте поведение существующих потоков (ручное добавление, импорт по ссылке, офлайн-снимок), если задача прямо этого не требует.
6. Расширение проверяется через `chrome://extensions`: Load unpacked → `extension/`.
7. Если задача упирается в продуктовое решение, которого нет в спецификации, не угадывайте. Запишите вопрос в раздел «Открытые вопросы» своего результата.
