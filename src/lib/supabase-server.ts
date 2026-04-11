import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import { SUPABASE_AUTH_STORAGE_KEY } from "@/src/lib/auth";
import { env } from "@/src/lib/env";

type StoredServerSession = {
  access_token?: string;
};

export function createServerSupabaseClient() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createServiceRoleSupabaseClient() {
  if (!env.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation.");
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function getServerUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SUPABASE_AUTH_STORAGE_KEY)?.value;

  if (!sessionCookie) {
    return null;
  }

  let parsed: StoredServerSession | null = null;

  try {
    parsed = JSON.parse(decodeURIComponent(sessionCookie)) as StoredServerSession;
  } catch {
    parsed = null;
  }

  const accessToken = parsed?.access_token;

  if (!accessToken) {
    return null;
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}
