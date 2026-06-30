"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { getAuthRedirectUrl } from "@/src/lib/auth";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import { supabase } from "@/src/lib/supabase-client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setNotice(null);
    const normalizedEmail = email.trim();

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: getAuthRedirectUrl("/reset-password"),
    });

    if (error) {
      setNotice({ type: "error", message: getFriendlyAuthErrorMessage(error.message) });
      setIsLoading(false);
      return;
    }

    setSentEmail(normalizedEmail);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,hsl(var(--primary)_/_0.18),transparent_32%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)_/_0.55))] px-4">
      <div className="w-full max-w-md rounded-[1.25rem] border border-border/70 bg-card/92 p-8 shadow-[0_22px_60px_hsl(var(--foreground)_/_0.12)] backdrop-blur">
        <h1 className="mb-3 text-center text-3xl font-bold text-foreground">Reset your password</h1>
        <p className="mb-6 text-center text-sm text-foreground/75">
          Enter the email you use for Keep &amp; Cook and we&apos;ll send a reset link.
        </p>

        {sentEmail ? (
          <div className="text-center" role="status" aria-live="polite">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
              <MailCheck className="size-7" aria-hidden="true" />
            </div>
            <p className="text-sm leading-6 text-foreground/80">
              Check your email for the password reset link.
            </p>
            <p className="mt-2 break-words text-sm font-semibold text-foreground">
              {sentEmail}
            </p>
            <Button asChild className="mt-7 w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            {notice ? (
              <div className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">
                {notice.message}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">Email</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                />
              </label>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-foreground/75">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
