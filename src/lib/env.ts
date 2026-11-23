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
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL?.trim() || null,
  resendTestToEmail: process.env.RESEND_TEST_TO_EMAIL?.trim() || null,
  resendTestToken: process.env.RESEND_TEST_TOKEN?.trim() || null,
  siteUrl: getSiteUrl(),
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null,
  // Chrome Web Store listing; until it is set the landing button stays disabled and the library hides the link.
  chromeExtensionUrl: process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL?.trim() || null,
  // "true" once the Google provider is set up in Supabase (docs/google-sign-in.md); hides the button until then.
  googleAuthEnabled: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true",
  productName: "Keep & Cook",
  productDescription:
    "Save recipes from any website, cook step by step without the clutter, and keep them in a free personal cookbook.",
};

export function isAccountDeletionEnabled() {
  return Boolean(env.supabaseServiceRoleKey?.trim());
}
