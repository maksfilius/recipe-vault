import type { Metadata } from "next";

import ResetPasswordForm from "@/src/components/auth/ResetPasswordForm";
import { env } from "@/src/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
