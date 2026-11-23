// Fills a LOCAL Supabase (npx supabase start) with the demo cookbook used for store and landing
// screenshots. Refuses any non-local URL so it can never touch production.
//   KC_SUPABASE_URL=http://127.0.0.1:54321 KC_SERVICE_ROLE_KEY=<local service_role key> node scripts/store/seed-demo-library.mjs
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { DEMO_EMAIL, DEMO_PASSWORD, demoRecipes } from "./demo-recipes.mjs";

const base = (process.env.KC_SUPABASE_URL || "http://127.0.0.1:54321").replace(/\/$/, "");
const key = process.env.KC_SERVICE_ROLE_KEY;
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base)) throw new Error(`Refusing non-local Supabase URL: ${base}`);
if (!key) throw new Error("Set KC_SERVICE_ROLE_KEY to the local service_role key (npx supabase status).");
const headers = { apikey: key, authorization: `Bearer ${key}` };

async function call(path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...init.headers } });
  const text = await response.text();
  if (!response.ok) throw new Error(`${init.method || "GET"} ${path}: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const { users } = await call("/auth/v1/admin/users?per_page=1000");
let user = users.find((entry) => entry.email === DEMO_EMAIL);
user ??= await call("/auth/v1/admin/users", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { username: "Sam" } }),
});
await call(`/rest/v1/recipes?user_id=eq.${user.id}`, { method: "DELETE" });

// Oldest first, so the library (newest first) opens with the roast chicken.
const now = Date.now();
for (const [index, recipe] of [...demoRecipes].reverse().entries()) {
  const bytes = await readFile(new URL(`./photos/${recipe.photo}.webp`, import.meta.url));
  const name = `${user.id}/${createHash("sha256").update(bytes).digest("hex")}.webp`;
  await call(`/storage/v1/object/recipe-images/${name}`, { method: "POST", headers: { "content-type": "image/webp", "x-upsert": "true" }, body: bytes });
  await call("/rest/v1/recipes", {
    method: "POST", headers: { "content-type": "application/json", prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: user.id, title: recipe.title, description: recipe.description,
      ingredients: recipe.ingredients, steps: recipe.steps, tags: [],
      source_url: recipe.sourceUrl ?? null, total_time: recipe.totalTime, servings: recipe.servings,
      image_url: `${base}/storage/v1/object/public/recipe-images/${name}`,
      created_at: new Date(now - (demoRecipes.length - index) * 86400000).toISOString(),
    }),
  });
}
console.log(`Seeded ${demoRecipes.length} recipes for ${DEMO_EMAIL}`);
