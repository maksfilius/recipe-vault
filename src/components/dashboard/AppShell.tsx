"use client";

import { type ReactNode } from "react";
import { useRouter } from "next/navigation";

import TopBar from "./TopBar";
import BottomTabBar from "./BottomTabBar";
import { supabase } from "@/src/lib/supabase-client";
import { clearOfflineRecipeData } from "@/src/lib/offline-recipes";

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Failed to sign out", error);
      return;
    }
    await clearOfflineRecipeData();
    router.replace("/login");
  };

  return (
    <div className="flex h-[100dvh] min-w-0 flex-col overflow-hidden bg-background text-foreground">
      <TopBar onSignOut={handleSignOut} />
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4 pt-4 sm:px-6 sm:pb-[calc(16px+env(safe-area-inset-bottom))] sm:pt-6 lg:px-10">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
