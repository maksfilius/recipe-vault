import { createClient } from "@supabase/supabase-js";

import {
  browserUserStorage,
  cookieSessionStorage,
  SUPABASE_AUTH_STORAGE_KEY,
} from "@/src/lib/auth";
import { env } from "@/src/lib/env";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    storage: cookieSessionStorage,
    userStorage: browserUserStorage,
  },
});
