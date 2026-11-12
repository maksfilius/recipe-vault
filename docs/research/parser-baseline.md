# A-05 — baseline парсера на 50 сайтах

Запуск: 2026-11-10T11:28:12.257Z. Прогнано 50 из 50 сайтов. Полный результат (ингредиенты **и** шаги): **38/50 = 76.0%**. Страница рецепта получена и передана в `buildImportedRecipe`: **38/50**.

Метод: 5 публичных лидеров американской категории [Similarweb](https://www.similarweb.com/top-websites/united-states/food-and-drink/cooking-and-recipes/) плюс 45 уникальных сайтов из [Detailed.com Top 50 Food Blogs](https://detailed.com/food-blogs/). Это **не** строгий топ-50 по трафику США: полный список Similarweb публично недоступен, а блоговый рейтинг — другая методика. Для каждого сайта в манифесте закреплён один URL отдельного рецепта (50/50 на этом запуске). Если URL не закреплён, скрипт ищет вероятную ссылку на главной; такой автовыбор требует ручной сверки.

Скрипт: `node --experimental-strip-types scripts/parser-benchmark.mjs`. Список: `scripts/parser-benchmark-sites.json`. Ограничение HTML 3 МБ, тайм-аут 12 с на запрос, максимум 5 редиректов в пределах того же HTTPS-домена, user-agent как у текущего API. Изображения не скачиваются; поле `image` означает только извлечённый URL. Запуск из другой сети или позже может дать другой результат из-за защиты сайтов и изменений страниц.

Покрытие полей на всей выборке из 50: ингредиенты 38, шаги 38, URL фото 38, время 37, порции 38. Среди 38 страниц, переданных парсеру, полный результат 100.0%; этот показатель зависит от доступности и состава выбранных страниц.

## Причины неполного результата по типу исправления

| Тип / причина | Сайтов | Следующее действие |
|---|---:|---|
| Доступ: антибот/403/429 | 12 | Проверить доступность и честно показывать ошибку; не обходить защиту сайтов. |

## Результаты по сайтам

| Сайт / проверенный URL | Итог | Ингредиенты | Шаги | Фото | Время | Порции | Причина / примечание |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| [Allrecipes](https://www.allrecipes.com/recipe/16954/chinese-chicken-fried-rice-ii/) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [Parade](https://parade.com/recipes/slow-cooker-chicken-broccoli-pasta-recipe) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [Delish](https://www.delish.com/cooking/recipe-ideas/a46330/skillet-sicilian-chicken-recipe/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: The Original Marry Me Chicken |
| [The Pioneer Woman](https://www.thepioneerwoman.com/food-cooking/recipes/a62192271/flourless-chocolate-cake-recipe/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Flourless Chocolate Cake |
| [The Kitchn](https://www.thekitchn.com/roast-chicken-recipe-23847070) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: The Only Roast Chicken You&#8217;ll Ever Need |
| [Serious Eats](https://www.seriouseats.com/the-best-chicken-parmesan-recipe) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [Food52](https://food52.com/recipes/90774-best-utica-greens-recipe) | нет | — | — | — | — | — | access_blocked: HTTP 429 |
| [Simply Recipes](https://www.simplyrecipes.com/recipes/banana_bread/) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [Sally's Baking Addiction](https://sallysbakingaddiction.com/easy-cinnamon-rolls-from-scratch/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Easy Cinnamon Rolls (from scratch) |
| [Smitten Kitchen](https://smittenkitchen.com/2008/12/zuni-cafe-roast-chicken-bread-salad/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: zuni cafe’s roasted chicken + bread salad |
| [Minimalist Baker](https://minimalistbaker.com/lemon-herb-roasted-chicken-/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Lemon & Herb Roasted Chicken |
| [Budget Bytes](https://www.budgetbytes.com/one-pot-chicken-and-rice/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: One Pot Chicken and Rice |
| [Skinnytaste](https://www.skinnytaste.com/chicken-piccata/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Chicken Piccata Recipe |
| [Cookie and Kate](https://cookieandkate.com/chocolate-almond-cake/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Chocolate Almond Cake (Gluten-Free) |
| [Love and Lemons](https://www.loveandlemons.com/chicken-stir-fry/) | нет | — | — | — | — | — | access_blocked: HTML challenge / CAPTCHA |
| [Pinch of Yum](https://pinchofyum.com/filipino-fried-chicken) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Filipino Fried Chicken |
| [Gimme Some Oven](https://www.gimmesomeoven.com/dry-brine-turkey-recipe/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Dry Brine Turkey |
| [David Lebovitz](https://www.davidlebovitz.com/miso-walnut-chocolate-chip-cookies/) | успех | ✓ | ✓ | ✓ | — | ✓ | Title: Miso Walnut Chocolate Chip Cookies |
| [Tastes Better From Scratch](https://tastesbetterfromscratch.com/coconut-macaroons-recipe/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Easy Coconut Macaroons Recipe |
| [A Couple Cooks](https://www.acouplecooks.com/chicken-farro-recipe/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Baked Chicken & Farro (Easy Healthy Dinner Recipe!) |
| [Cooking Classy](https://www.cookingclassy.com/peruvian-chicken/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Peruvian Chicken with Green Sauce (Aji Verde) |
| [How Sweet Eats](https://www.howsweeteats.com/2022/01/weeknight-skillet-chicken/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Weeknight Skillet Chicken |
| [Two Peas & Their Pod](https://www.twopeasandtheirpod.com/no-bake-pumpkin-cheesecake-bars/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: No-Bake Pumpkin Cheesecake Bars |
| [Oh She Glows](https://ohsheglows.com/DELICIOUS-VEGAN-CHILI/) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [101 Cookbooks](https://www.101cookbooks.com/un-chicken-salad/) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [Alton Brown](https://altonbrown.com/recipes/good-eats-fudgepops/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Good Eats Fudgepops |
| [Brown Eyed Baker](https://www.browneyedbaker.com/sweet-and-sour-chicken/) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [Downshiftology](https://downshiftology.com/recipes/thanksgiving-turkey-recipe/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Easy Thanksgiving Turkey (Best No-Fail Recipe) |
| [The Recipe Critic](https://therecipecritic.com/baked-sweet-and-sour-chicken/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Baked Sweet and Sour Chicken |
| [Chef's Pencil](https://www.chefspencil.com/creamy-caramelized-onion-pasta/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Creamy Caramelized Onion Pasta |
| [My Baking Addiction](https://www.mybakingaddiction.com/cranberry-chicken/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Slow Cooker Cranberry Chicken |
| [Love & Olive Oil](https://www.loveandoliveoil.com/2026/11/glazed-apple-cider-bundt-cake.html) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Glazed Apple Cider Bundt Cake |
| [Oh My Veggies](https://ohmyveggies.com/easy-vegan-butter-chicken/) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [Spoon Fork Bacon](https://www.spoonforkbacon.com/tomato-butter-pasta-with-shrimp/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Tomato Butter Pasta (with Shrimp) |
| [Dinner Then Dessert](https://dinnerthendessert.com/smothered-chicken/) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [The Stay at Home Chef](https://thestayathomechef.com/the-best-homemade-dinner-rolls-ever/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: The Best Homemade Dinner Rolls Ever! |
| [Alexandra's Kitchen](https://alexandracooks.com/2026/11/06/simple-soft-sourdough-dinner-rolls/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Simple Soft Sourdough Dinner Rolls |
| [Slender Kitchen](https://www.slenderkitchen.com/recipe/air-fryer-spicy-chicken-sandwich) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Healthy Air Fryer Spicy Chicken Sandwich |
| [Sprinkle Bakes](https://www.sprinklebakes.com/2022/05/classic-buttermilk-waffles.html) | нет | — | — | — | — | — | access_blocked: HTTP 403 |
| [Sweet and Savory Meals](https://sweetandsavorymeals.com/millionaire-cranberry-salad/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Millionaire Cranberry Salad |
| [Seasonal Cravings](https://www.seasonalcravings.com/gluten-free-chocolate-chip-banana-bread/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Gluten Free Banana Bread |
| [Gluesticks Blog](https://gluesticksblog.com/chubby-gingerbread-man-cookies/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Chubby Gingerbread Man Cookies |
| [Homesick Texan](https://www.homesicktexan.com/dr-pepper-sheet-cake/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Dr Pepper sheet cake |
| [Sugar Free Londoner](https://sugarfreelondoner.com/almond-cream-cheese-pancakes/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Almond Cream Cheese Keto Pancakes |
| [On My Kids Plate](https://onmykidsplate.com/rotel-chicken-spaghetti/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Rotel Chicken Spaghetti |
| [Salty Side Dish](https://www.saltysidedish.com/marry-me-chicken/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Marry Me Chicken Pasta (TikTok) |
| [My Quiet Kitchen](https://myquietkitchen.com/vegan-cornbread-dressing-gluten-free-option/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Vegan Cornbread Dressing |
| [My Pure Plants](https://mypureplants.com/chickpea-korma/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Chickpea Korma (25 Mins) |
| [The Petite Cook](https://www.thepetitecook.com/italian-butter-cookies/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Italian Butter Cookies |
| [Giangi's Kitchen](https://www.giangiskitchen.com/chicken-leeks-lemon/) | успех | ✓ | ✓ | ✓ | ✓ | ✓ | Title: Chicken with Leeks Recipe |

## Интерпретация для W-03

- Это сетевой end-to-end baseline **доступа и парсинга**, а не изолированная точность алгоритма. Антибот-блокировку нельзя считать дефектом `buildImportedRecipe`; отдельно приведено число страниц, реально переданных парсеру.
- `Успех` здесь означает наличие обоих обязательных блоков, но не проверенную корректность каждого количества/шага. Перед W-03 вручную сверить хотя бы успешные и неполные строки на сохранённых HTML-образцах при разрешённом доступе.
- Для улучшения в W-03 сначала закрепить URL у строк `candidate_not_found`, затем разбирать `parser_no_result` и `missing_*`; сетевые блокировки требуют пользовательского fallback, а не обхода защиты.
