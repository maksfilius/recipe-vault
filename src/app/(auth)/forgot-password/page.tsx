import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ForgotPasswordForm from "@/src/components/auth/ForgotPasswordForm";
import { env } from "@/src/lib/env";
import { getServerUser } from "@/src/lib/supabase-server";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: "Forgot Password",
};

export default async function ForgotPasswordPage() {
  const user = await getServerUser();

  if (user) {
    redirect("/dashboard");
  }

  return <ForgotPasswordForm />;
}
