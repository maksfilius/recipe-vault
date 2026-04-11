const requiredClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

function getRequiredEnvValue(name: keyof typeof requiredClientEnv) {
  const value = requiredClientEnv[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  supabaseUrl: getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://recipevault.app",
  productName: "RecipeVault",
  productDescription:
    "RecipeVault keeps your recipes searchable, organized, and ready while you cook.",
};

export function isAccountDeletionEnabled() {
  return Boolean(env.supabaseServiceRoleKey);
}
