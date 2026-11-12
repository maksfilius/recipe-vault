# D-12 — боковая панель расширения

Панель использует палитру `extension/tokens.css`, локальный Fraunces для заголовка, карточку рецепта и отдельные экраны для загрузки и ошибок. В шапке остаётся только бренд; «Read this page» появляется при отсутствии рецепта или ошибке. Действия карточки: Start cooking, Save и небольшая ссылка Download .txt внизу. Ингредиенты и шаги остаются рядом с исходной страницей.

## Состояния

| Состояние A-03 | Preview | Скриншот |
|---|---|---|
| Загрузка страницы | `loading` | [loading](screenshots/kc-d12-loading.png) |
| Загрузка серверного парсера | `parser` | [parser](screenshots/kc-d12-parser.png) |
| Рецепт найден | `found` | [found](screenshots/kc-d12-found.png), [dark](screenshots/kc-d12-found-dark.png) |
| Нет рецепта | `no-recipe` | [no-recipe](screenshots/kc-d12-no-recipe.png) |
| Ошибка доступа | `access-error` | [access-error](screenshots/kc-d12-access-error.png) |
| Ошибка извлечения | `extraction-error` | [extraction-error](screenshots/kc-d12-extraction-error.png) |
| Не вошёл | `signed-out` | [signed-out](screenshots/kc-d12-signed-out.png) |
| Вошёл | `signed-in` | [signed-in](screenshots/kc-d12-signed-in.png) |
| Уже в библиотеке | `already-saved` | [already-saved](screenshots/kc-d12-already-saved.png) |
| Сохранение завершено | `saved` | [saved](screenshots/kc-d12-saved.png) |

После открытия вкладки сайта панель показывает «Review in the opened tab» и не утверждает, что рецепт сохранён. Подтверждённые статусы signed-out, signed-in, already-saved и saved пока доступны **только в локальном preview**: сайт ещё не отправляет результат передачи в панель. Это интеграция E-02, с проверкой origin и ID передачи по A-03. Preview не притворяется ответом сайта в рабочем расширении.

Ссылка Add manually ведёт через `/login?next=…`, поэтому и вошедший, и новый пользователь попадают сразу в ручную форму после авторизации.

## Локальная проверка

1. В корне проекта запустить `python3 -m http.server 8765 --bind 127.0.0.1`.
2. Открыть `http://127.0.0.1:8765/extension/sidepanel.html?preview=found`. Заменить `found` на имя из таблицы; `&theme=dark` включает тёмную тему. Preview работает только на `localhost` / `127.0.0.1`.
3. Для рабочих сценариев загрузить папку `extension/` в `chrome://extensions` через **Load unpacked** и открыть панель на странице рецепта.
4. Для снимков в точных 390×844 запустить headless Chrome с локальным DevTools на порту 9228 и затем `node scripts/capture-extension-panel.mjs`. Скрипт проверяет отсутствие горизонтальной прокрутки для каждого состояния.

На 390×844 проверены все состояния; карточка дополнительно снята в обеих темах. Реальные ограничения `activeTab`, чтение сайтов и получение результата Save требуют ручной проверки установленного расширения после E-02. Снимки получены в локальном preview, поэтому они подтверждают разметку и стили, а не сетевую интеграцию.
