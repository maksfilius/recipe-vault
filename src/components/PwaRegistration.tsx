"use client";

import { useEffect } from "react";

import { clearOfflineRecipeData } from "@/src/lib/offline-recipes";
import { supabase } from "@/src/lib/supabase-client";

export default function PwaRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") void clearOfflineRecipeData();
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
