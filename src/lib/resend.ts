import { Resend } from "resend";

import { env } from "@/src/lib/env";

export function createResendClient() {
  if (!env.resendApiKey?.trim()) {
    throw new Error("RESEND_API_KEY is required to send email.");
  }

  return new Resend(env.resendApiKey);
}
