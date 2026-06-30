"use client";

import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/src/lib/env";

export const supabase = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
  cookieOptions: {
    name: "recipe-vault-auth",
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
});
