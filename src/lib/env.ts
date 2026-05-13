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

function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
  const vercelPreview = process.env.VERCEL_URL?.replace(/\/$/, "");

  if (configured) {
    return configured;
  }

  if (vercelProduction) {
    return `https://${vercelProduction}`;
  }

  if (vercelPreview) {
    return `https://${vercelPreview}`;
  }

  return "http://localhost:3000";
}

export const env = {
  supabaseUrl: getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getRequiredEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  siteUrl: getSiteUrl(),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null,
  productName: "Keep & Cook",
  productDescription:
    "Keep & Cook keeps your recipes searchable, organized, and ready while you cook.",
};

export function isAccountDeletionEnabled() {
  return Boolean(env.supabaseServiceRoleKey?.trim());
}
