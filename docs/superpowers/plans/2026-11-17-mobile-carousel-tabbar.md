# Мобильная нижняя панель и карусель — план

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** На телефоне (< 640 px) библиотека — горизонтальная карусель с видимыми соседями и привязкой «как в iOS», навигация — нижняя панель с иконками.

**Architecture:** Нативный CSS scroll-snap; чистые функции расчёта центральной карточки и «выделения» соседей в `src/lib/carousel.ts`; компонент `RecipeCarousel` применяет их в `requestAnimationFrame`. `BottomTabBar` живёт в `AppShell`; поиск открывается существующей панелью поиска `TopBar` через событие окна.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, lucide-react; тесты `node --test` (`tests/*.test.mts`).

**Spec:** `docs/superpowers/specs/2026-11-17-mobile-carousel-tabbar-design.md`

## Global Constraints

- Только ширина < 640 px (`sm` в Tailwind); на `sm` и шире разметка как сейчас.
- Без новых зависимостей.
- Вибрация: `navigator.vibrate(8)` только если функция есть; при `prefers-reduced-motion` без масштабирования.
- Существующие события: `keep-and-cook:add-recipe` (добавить); новое — `keep-and-cook:open-search`.
- Безопасные зоны: `env(safe-area-inset-bottom)` у панели, контент не уходит под неё.

## Review Focus

- Один рецепт в библиотеке: карусель без соседей, счётчик «1 / 1», карточка по центру.
- Смена поискового запроса при прокрученной карусели: позиция сбрасывается на первую карточку, счётчик не показывает индекс за пределами списка.
- Открытый рецепт (`RecipeDetails`) и редактор на телефоне не перекрыты нижней панелью (нижний отступ `main`).
- Экран настроек: вкладка Settings активна, Recipes — нет.
- Клавиатура: ←/→ на карусели листают по одной карточке.

---

### Task 1: Расчёт карусели

**Files:**
- Create: `src/lib/carousel.ts`
- Test: `tests/carousel.test.mts`

**Interfaces:**
- Produces: `getCenteredIndex(scrollLeft: number, step: number, count: number): number` — индекс ближайшей к центру карточки, где `step` = ширина карточки + gap; результат в `[0, count-1]`, `0` при `count <= 0` или `step <= 0`.
- Produces: `getSlideEmphasis(distance: number): { scale: number; opacity: number }` — `distance` в карточках от центра (может быть дробным, знак не важен): `0 → {1, 1}`, `≥1 → {0.92, 0.55}`, линейно между.

- [ ] **Step 1: Тесты**
  - `getCenteredIndex(0, 300, 5) === 0`; `(449, 300, 5) === 1`; `(451, 300, 5) === 2`; `(10_000, 300, 5) === 4`; `(-50, 300, 5) === 0`; `(100, 300, 0) === 0`; `(100, 0, 5) === 0`.
  - `getSlideEmphasis(0)` → `{scale: 1, opacity: 1}`; `(-1)` и `(3)` → `{0.92, 0.55}`; `(0.5)` → `{0.96, 0.775}` (с точностью 1e-9).
- [ ] **Step 2:** `npm run test:unit` — падает (модуля нет).
- [ ] **Step 3:** Реализовать обе функции.
- [ ] **Step 4:** `npm run test:unit` — проходит.
- [ ] **Step 5:** Commit.

### Task 2: Карусель рецептов на телефоне

**Files:**
- Create: `src/components/dashboard/recipe/RecipeCarousel.tsx`
- Modify: `src/components/dashboard/DashboardClient.tsx` (ветка со списком рецептов)

**Interfaces:**
- Consumes: Task 1.
- Produces: `RecipeCarousel({ recipes, resetKey, onOpen }: { recipes: Recipe[]; resetKey: string; onOpen: (recipe: Recipe) => void })`.

- [ ] **Step 1:** Разметка: `<section aria-roledescription="carousel" aria-label="Recipes">` со списком `overflow-x-auto snap-x snap-mandatory`, скрытым скроллбаром, `scroll-padding` так, чтобы карточка ~82% ширины стояла по центру, а края соседей были видны; каждый слайд `snap-center` с `RecipeCard`; под списком счётчик `{index + 1} / {recipes.length}` (`aria-live="polite"`).
- [ ] **Step 2:** Поведение: на `scroll` в `requestAnimationFrame` — `getCenteredIndex`, стиль соседей через `getSlideEmphasis` (не при `prefers-reduced-motion`); при смене индекса `navigator.vibrate?.(8)`. Тап по нецентральной карточке — `scrollTo` к ней вместо открытия; по центральной — `onOpen`. ←/→ на списке — к соседней карточке. При смене `resetKey` — `scrollTo({left: 0})`.
- [ ] **Step 3:** В `DashboardClient`: на телефоне (`sm:hidden`) вместо сетки рецептов — `RecipeCarousel` с `resetKey={searchTerm}`; сетка получает `hidden sm:grid`. Пустая библиотека, загрузка, ошибка и «ничего не найдено» остаются в общей сетке для всех ширин. `onOpen` выполняет то же, что сейчас клик по карточке (аналитика + `setSelectedRecipe`).
- [ ] **Step 4:** `npm run test` и `npm run build` — проходят.
- [ ] **Step 5:** Commit.

### Task 3: Нижняя панель и мобильная шапка

**Files:**
- Create: `src/components/dashboard/BottomTabBar.tsx`
- Modify: `src/components/dashboard/AppShell.tsx`, `src/components/dashboard/TopBar.tsx`

**Interfaces:**
- Produces: событие окна `keep-and-cook:open-search`; `TopBar` открывает свою панель поиска по нему.

- [ ] **Step 1:** `BottomTabBar` (`sm:hidden`, фиксирована внизу, `pb-[env(safe-area-inset-bottom)]`): Recipes (`/dashboard`, иконка `BookOpen`), Search (`Search`; на `/dashboard` шлёт `keep-and-cook:open-search`, иначе `router.push("/dashboard")` и затем событие), Add (центральная круглая акцентная `Plus`; на `/dashboard` — `keep-and-cook:add-recipe`, иначе `router.push("/dashboard?add=select")`), Settings (`/dashboard/settings`, `Settings`). Активная — по `pathname`, `aria-current="page"`. Минимальная зона нажатия 44 px.
- [ ] **Step 2:** `TopBar`: на < 640 px показывать только логотип; кнопки поиска, «+» и меню аккаунта — `hidden sm:inline-flex`/`sm:block`. Слушать `keep-and-cook:open-search` → `setSearchOpen(true)`; панель поиска на телефоне закрывается по Escape и после Enter, как сейчас.
- [ ] **Step 3:** `AppShell`: добавить `BottomTabBar`; нижний отступ `main` на телефоне = высота панели + safe area (`pb-[calc(80px+env(safe-area-inset-bottom))] sm:pb-[calc(16px+env(safe-area-inset-bottom))]`).
- [ ] **Step 4:** `npm run test` и `npm run build`; в браузере на 390×844: панель видна, Search открывает поле и фильтрует карусель, Add открывает диалог, Settings открывает настройки с активной вкладкой, рецепт и редактор не перекрыты.
- [ ] **Step 5:** Обновить `docs/specs/web.md` (раздел «Шапка» и «Mobile / PWA»: ссылка на дизайн 17.11) и commit.
