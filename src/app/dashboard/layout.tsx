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

  return <AppShell>{children}</AppShell>;
}
