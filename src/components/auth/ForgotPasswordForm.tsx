"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { MailCheck } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { getAuthRedirectUrl } from "@/src/lib/auth";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import { getImportAuthDestination } from "@/src/lib/recipe-import-transfer";
import { supabase } from "@/src/lib/supabase-client";

export default function ForgotPasswordForm() {
  const destination = getImportAuthDestination(useSearchParams().get("next"));
  const authQuery = destination === "/dashboard" ? "" : `?next=${encodeURIComponent(destination)}`;
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    const normalizedEmail = email.trim();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: getAuthRedirectUrl(`/reset-password${authQuery}`),
      });
      if (error) {
        setErrorMessage(getFriendlyAuthErrorMessage(error.message));
        return;
      }
      setSentEmail(normalizedEmail);
    } catch {
      setErrorMessage("Could not send the reset link. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h1 className="text-3xl font-semibold leading-tight">{sentEmail ? "Check your email" : "Reset your password"}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {sentEmail ? "We sent a reset link. Open it to choose a new password." : "Enter your account email and we’ll send you a reset link."}
      </p>
      {sentEmail ? (
        <div className="mt-7" role="status" aria-live="polite">
          <MailCheck className="h-8 w-8 text-primary" aria-hidden />
          <p className="mt-4 break-words text-sm font-semibold">{sentEmail}</p>
          <Button asChild className="mt-6 w-full"><Link href={`/login${authQuery}`}>Back to sign in</Link></Button>
        </div>
      ) : (
        <>
          {errorMessage ? <p className="mt-5 rounded-xl border border-destructive px-4 py-3 text-sm text-destructive" role="alert">{errorMessage}</p> : null}
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="block text-sm font-semibold">Email</span>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@example.com" required />
            </label>
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Sending…" : "Send reset link"}</Button>
          </form>
          <p className="mt-7 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            Remembered your password? <Link href={`/login${authQuery}`} className="font-semibold text-primary underline-offset-4 hover:underline">Sign in</Link>
          </p>
        </>
      )}
    </section>
  );
}
