import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import AuthForm from '../../../components/AuthForm'
import { env } from "@/src/lib/env";
import { getServerUser } from "@/src/lib/supabase-server";
import { getImportAuthDestination } from "@/src/lib/auth-destination";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: "Sign In",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getServerUser();

  if (user) {
    redirect(getImportAuthDestination((await searchParams).next));
  }

  return <Suspense fallback={null}><AuthForm type="login" /></Suspense>
}
