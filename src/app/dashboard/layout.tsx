import { ReactNode } from "react";
import { redirect } from "next/navigation";

import AppShell from "../../components/dashboard/AppShell";
import { getServerUser } from "@/src/lib/supabase-server";

import "../globals.css";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  const metadata = user.user_metadata as
    | { username?: string; full_name?: string }
    | undefined;
  const userName =
    metadata?.username?.trim() ||
    metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    null;

  return <AppShell initialUserName={userName}>{children}</AppShell>;
}
