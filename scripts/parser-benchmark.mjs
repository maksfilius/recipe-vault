#!/usr/bin/env node

// Run: node --experimental-strip-types scripts/parser-benchmark.mjs
// Optional: --limit 5 for a smoke check. A full run writes docs/research/parser-baseline.md.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { buildImportedRecipe, decodeRecipeHtml } from '../src/lib/recipe-import-parser.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sites = JSON.parse(await readFile(path.join(root, 'scripts/parser-benchmark-sites.json'), 'utf8'));
const limitArg = process.argv.indexOf('--limit');
const limit = limitArg < 0 ? sites.length : Number(process.argv[limitArg + 1]);
if (!Number.isInteger(limit) || limit < 1 || limit > sites.length) {
  throw new Error(`--limit must be an integer from 1 to ${sites.length}`);
}

const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 12_000;
const CONCURRENCY = 5;
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (compatible; KeepAndCookBot/1.0; +https://keepandcook.com)',
  accept: 'text/html,application/xhtml+xml',
  'accept-language': 'en,de,ru;q=0.8,*;q=0.5',
};

function domainOf(value) {
  return new URL(value).hostname.replace(/^www\./, '').toLowerCase();
}

class BenchmarkError extends Error {
  constructor(reason, message) {
    super(message);
    this.reason = reason;
  }
}

async function fetchHtml(initialUrl, domain) {
  let current = new URL(initialUrl);
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    if (current.protocol !== 'https:' || domainOf(current.href) !== domain) {
      throw new BenchmarkError('redirect_or_url', `Redirected outside ${domain} or HTTPS`);
    }
    let response;
    try {
      response = await fetch(current, {
        headers: HEADERS,
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      const reason = error?.name === 'TimeoutError' ? 'timeout' : 'network_error';
      throw new BenchmarkError(reason, String(error?.message ?? error));
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location || redirect === 5) throw new BenchmarkError('redirect_or_url', `HTTP ${response.status}`);
      current = new URL(location, current);
      continue;
    }
    if (response.status === 403 || response.status === 429) {
      await response.body?.cancel();
      throw new BenchmarkError('access_blocked', `HTTP ${response.status}`);
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new BenchmarkError('http_error', `HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!/html|xml/i.test(contentType)) {
      await response.body?.cancel();
      throw new BenchmarkError('non_html', contentType || 'No content type');
    }
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > MAX_BYTES) {
      await response.body?.cancel();
      throw new BenchmarkError('too_large', `${declared} bytes declared`);
    }
    const chunks = [];
    let length = 0;
    const reader = response.body?.getReader();
    if (!reader) throw new BenchmarkError('network_error', 'Empty response body');
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_BYTES) throw new BenchmarkError('too_large', `Over ${MAX_BYTES} bytes`);
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const html = decodeRecipeHtml(bytes, contentType);
    if (/cf-mitigated/i.test(response.headers.get('cf-mitigated') ?? '') ||
        /<title>\s*(just a moment|attention required|access denied)/i.test(html) ||
        /captcha|verify you are human/i.test(html.slice(0, 8000))) {
      throw new BenchmarkError('access_blocked', 'HTML challenge / CAPTCHA');
    }
    return { html, url: current.href };
  }
  throw new BenchmarkError('redirect_or_url', 'Too many redirects');
}

function findRecipeLink(html, baseUrl, domain) {
  const $ = cheerio.load(html);
  const candidates = new Map();
  $('a[href]').each((_, element) => {
    const anchor = $(element);
    let url;
    try { url = new URL(anchor.attr('href'), baseUrl); } catch { return; }
    if (url.protocol !== 'https:' || domainOf(url.href) !== domain) return;
    const pathname = url.pathname.toLowerCase();
    if (/\.(?:jpg|png|webp|pdf|xml|json|jpg)$/i.test(pathname)) return;
    if (/(?:\/category\/|\/tag\/|\/author\/|\/about|\/contact|\/privacy|\/search|\/shop|\/newsletter|\/login)/.test(pathname)) return;
    const segments = pathname.split('/').filter(Boolean);
    const slug = segments.at(-1) ?? '';
    if (slug.length < 9 || segments.length < 1) return;
    const label = anchor.text().replace(/\s+/g, ' ').trim().toLowerCase();
    let score = 0;
    if (/\/recipes?\//.test(pathname)) score += 6;
    if (/recipe|dinner|breakfast|dessert|cookies|chicken|pasta|soup|cake|salad|bread/.test(slug)) score += 3;
    if (/recipe|dinner|breakfast|dessert|cookies|chicken|pasta|soup|cake|salad|bread/.test(label)) score += 2;
    if (anchor.closest('article').length) score += 2;
    if (anchor.find('img').length) score += 1;
    if (slug.length >= 20) score += 1;
    if (score < 3) return;
    url.hash = '';
    url.search = '';
    const previous = candidates.get(url.href) ?? -1;
    candidates.set(url.href, Math.max(previous, score));
  });
  return [...candidates].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

async function inspect(site) {
  const baseUrl = `https://www.${site.domain}/`;
  const result = {
    name: site.name, domain: site.domain, source: site.source,
    url: site.recipeUrl ?? null, selectedBy: site.recipeUrl ? 'pinned' : 'homepage',
    success: false, ingredients: false, steps: false, image: false, time: false, servings: false,
    reason: null, detail: '', recipeMarkup: false,
  };
  try {
    if (!result.url) {
      let homepage;
      try { homepage = await fetchHtml(baseUrl, site.domain); }
      catch (error) {
        result.reason = error.reason ?? 'unexpected_error';
        result.detail = `Homepage: ${error.message}`;
        return result;
      }
      result.url = findRecipeLink(homepage.html, homepage.url, site.domain);
      if (!result.url) {
        result.reason = 'candidate_not_found';
        result.detail = 'No probable recipe link on homepage';
        return result;
      }
    }
    const page = await fetchHtml(result.url, site.domain);
    result.url = page.url;
    result.recipeMarkup = /(?:"|&quot;)@type(?:"|&quot;)\s*:\s*(?:"|&quot;)Recipe(?:"|&quot;)|itemtype=["'][^"']*schema\.org\/Recipe/i.test(page.html);
    const recipe = buildImportedRecipe(page.html, page.url);
    result.ingredients = Boolean(recipe?.ingredients?.length);
    result.steps = Boolean(recipe?.steps?.length);
    result.image = Boolean(recipe?.imageUrl);
    result.time = Boolean(recipe?.totalTime);
    result.servings = Boolean(recipe?.servings);
    result.success = result.ingredients && result.steps;
    if (!recipe) result.reason = result.recipeMarkup ? 'parser_no_result' : 'no_recipe_markup';
    else if (!result.success) result.reason = result.ingredients ? 'missing_steps' : 'missing_ingredients';
    result.detail = recipe ? `Title: ${recipe.title}` : 'Parser returned null';
  } catch (error) {
    result.reason = error.reason ?? 'unexpected_error';
    result.detail = String(error?.message ?? error).slice(0, 180);
  }
  return result;
}

const selected = sites.slice(0, limit);
const results = new Array(selected.length);
let cursor = 0;
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, async () => {
  while (cursor < selected.length) {
    const index = cursor++;
    results[index] = await inspect(selected[index]);
    console.log(`${index + 1}/${selected.length} ${results[index].domain}: ${results[index].success ? 'complete' : results[index].reason}`);
  }
}));

const successCount = results.filter((r) => r.success).length;
const reachedCount = results.filter((r) => r.detail.startsWith('Title:') || r.detail === 'Parser returned null').length;
const fieldCounts = Object.fromEntries(['ingredients', 'steps', 'image', 'time', 'servings'].map((field) => [field, results.filter((r) => r[field]).length]));
const reasonCounts = Object.entries(results.reduce((counts, r) => {
  if (r.reason) counts[r.reason] = (counts[r.reason] ?? 0) + 1;
  return counts;
}, {})).sort((a, b) => b[1] - a[1]);
const labels = {
  access_blocked: 'Доступ: антибот/403/429', network_error: 'Доступ: сеть/DNS/TLS', timeout: 'Доступ: тайм-аут',
  http_error: 'Доступ: HTTP-ошибка', redirect_or_url: 'Доступ: редирект/URL', non_html: 'Доступ: не HTML', too_large: 'Доступ: страница >3 МБ',
  candidate_not_found: 'Выбор страницы: нет ссылки на рецепт', no_recipe_markup: 'Разметка: нет Recipe schema и результата',
  parser_no_result: 'Парсер: есть Recipe schema, результат пуст', missing_steps: 'Неполный результат: нет шагов',
  missing_ingredients: 'Неполный результат: нет ингредиентов', unexpected_error: 'Прочая ошибка',
};
const yes = (value) => value ? '✓' : '—';
const safe = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const date = new Date().toISOString();
const lines = [
  `# A-05 — проверка парсера на ${sites.length} сайтах`,
  '',
  `Запуск: ${date}. Прогнано ${results.length} из ${sites.length} сайтов. Полный результат (ингредиенты **и** шаги): **${successCount}/${results.length} = ${(successCount / results.length * 100).toFixed(1)}%**. Страница рецепта получена и передана в \`buildImportedRecipe\`: **${reachedCount}/${results.length}**.`,
  '',
  `Метод: исходные 5 публичных лидеров американской категории [Similarweb](https://www.similarweb.com/top-websites/united-states/food-and-drink/cooking-and-recipes/) плюс 45 уникальных сайтов из [Detailed.com Top 50 Food Blogs](https://detailed.com/food-blogs/); остальные сайты добавлены для проверки регрессий. Исходная выборка **не** является строгим топ-50 по трафику США: полный список Similarweb публично недоступен, а блоговый рейтинг — другая методика. Для каждого сайта в манифесте закреплён один URL отдельного рецепта (${results.filter((r) => r.selectedBy === 'pinned').length}/${results.length} на этом запуске). Если URL не закреплён, скрипт ищет вероятную ссылку на главной; такой автовыбор требует ручной сверки.`,
  '',
  'Скрипт: `node --experimental-strip-types scripts/parser-benchmark.mjs`. Список: `scripts/parser-benchmark-sites.json`. Ограничение HTML 3 МБ, тайм-аут 12 с на запрос, максимум 5 редиректов в пределах того же HTTPS-домена, user-agent как у текущего API. Изображения не скачиваются; поле `image` означает только извлечённый URL. Запуск из другой сети или позже может дать другой результат из-за защиты сайтов и изменений страниц.',
  '',
  `Покрытие полей на всей выборке из ${results.length}: ингредиенты ${fieldCounts.ingredients}, шаги ${fieldCounts.steps}, URL фото ${fieldCounts.image}, время ${fieldCounts.time}, порции ${fieldCounts.servings}. Среди ${reachedCount} страниц, переданных парсеру, полный результат ${reachedCount ? (successCount / reachedCount * 100).toFixed(1) : '—'}%; этот показатель зависит от доступности и состава выбранных страниц.`,
  '',
  '## Причины неполного результата по типу исправления',
  '',
  '| Тип / причина | Сайтов | Следующее действие |',
  '|---|---:|---|',
  ...reasonCounts.map(([reason, count]) => {
    const action = reason.startsWith('access_') || ['network_error','timeout','http_error','redirect_or_url','non_html','too_large'].includes(reason)
      ? 'Проверить доступность и честно показывать ошибку; не обходить защиту сайтов.'
      : reason === 'candidate_not_found'
        ? 'Закрепить реальный URL рецепта в манифесте и перезапустить.'
        : reason === 'no_recipe_markup'
          ? 'Проверить, что URL ведёт на рецепт; затем добавить допустимый HTML fallback.'
          : 'Сохранить HTML-образец и завести точечный тест для W-03.';
    return `| ${labels[reason] ?? reason} | ${count} | ${action} |`;
  }),
  '',
  '## Результаты по сайтам',
  '',
  '| Сайт / проверенный URL | Итог | Ингредиенты | Шаги | Фото | Время | Порции | Причина / примечание |',
  '|---|---|:---:|:---:|:---:|:---:|:---:|---|',
  ...results.map((r) => {
    const link = `[${safe(r.name)}](${r.url ?? `https://www.${r.domain}/`})`;
    return `| ${link} | ${r.success ? 'успех' : 'нет'} | ${yes(r.ingredients)} | ${yes(r.steps)} | ${yes(r.image)} | ${yes(r.time)} | ${yes(r.servings)} | ${safe(r.reason ? `${r.reason}: ${r.detail}` : r.detail)} |`;
  }),
  '',
  '## Интерпретация для W-03',
  '',
  '- Это сетевой end-to-end baseline **доступа и парсинга**, а не изолированная точность алгоритма. Антибот-блокировку нельзя считать дефектом `buildImportedRecipe`; отдельно приведено число страниц, реально переданных парсеру.',
  '- `Успех` здесь означает наличие обоих обязательных блоков, но не проверенную корректность каждого количества/шага. Перед W-03 вручную сверить хотя бы успешные и неполные строки на сохранённых HTML-образцах при разрешённом доступе.',
  '- Для улучшения в W-03 сначала закрепить URL у строк `candidate_not_found`, затем разбирать `parser_no_result` и `missing_*`; сетевые блокировки требуют пользовательского fallback, а не обхода защиты.',
  '',
];
const output = lines.join('\n');
if (limit === sites.length) {
  await writeFile(path.join(root, 'docs/research/parser-baseline.md'), output);
  console.log('Wrote docs/research/parser-baseline.md');
} else {
  console.log(`Smoke run only; report not written. ${successCount}/${results.length} complete.`);
}
