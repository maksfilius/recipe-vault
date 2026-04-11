import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AuthForm from '../../../components/AuthForm'
import { env } from "@/src/lib/env";
import { getServerUser } from "@/src/lib/supabase-server";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: "Create Account",
};

export default async function RegisterPage() {
  const user = await getServerUser();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthForm type="register" />
}
