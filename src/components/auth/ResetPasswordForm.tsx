"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import { getImportAuthDestination } from "@/src/lib/auth-destination";
import { supabase } from "@/src/lib/supabase-client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const destination = getImportAuthDestination(useSearchParams().get("next"));
  const authQuery = destination === "/dashboard" ? "" : `?next=${encodeURIComponent(destination)}`;
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const passwordError = useMemo(() => repeatPassword && password !== repeatPassword ? "Passwords do not match." : "", [password, repeatPassword]);

  useEffect(() => {
    let active = true;
    let recoveryEventSeen = false;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && !recoveryEventSeen) setIsRecoveryReady(Boolean(session?.access_token));
    }).catch(() => {
      if (active && !recoveryEventSeen) setIsRecoveryReady(false);
    }).finally(() => {
      if (active) setIsCheckingRecovery(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        recoveryEventSeen = true;
        setIsRecoveryReady(true);
        setIsCheckingRecovery(false);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordError) { setErrorMessage(passwordError); return; }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setErrorMessage(getFriendlyAuthErrorMessage(error.message)); return; }
      await supabase.auth.signOut({ scope: "local" });
      router.replace(`/login?reset=success${authQuery ? `&${authQuery.slice(1)}` : ""}`);
    } catch {
      setErrorMessage("Could not update your password. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h1 className="text-3xl font-semibold leading-tight">Choose a new password</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Use at least 8 characters and keep this password private.</p>
      {isCheckingRecovery ? (
        <p className="mt-7 text-sm text-muted-foreground" role="status">Checking your reset link…</p>
      ) : !isRecoveryReady ? (
        <div className="mt-7 space-y-5">
          <p className="rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-6" role="alert">This reset link is missing or expired. Request a new link to continue.</p>
          <Button asChild className="w-full"><Link href={`/forgot-password${authQuery}`}>Request new reset link</Link></Button>
        </div>
      ) : (
        <>
          {errorMessage ? <p className="mt-5 rounded-xl border border-destructive px-4 py-3 text-sm text-destructive" role="alert">{errorMessage}</p> : null}
          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2"><span className="block text-sm font-semibold">New password</span><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
            <label className="block space-y-2"><span className="block text-sm font-semibold">Repeat password</span><Input type="password" value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} autoComplete="new-password" minLength={8} required /></label>
            {passwordError ? <p className="text-sm text-destructive" role="status">{passwordError}</p> : null}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Updating…" : "Update password"}</Button>
          </form>
        </>
      )}
      <p className="mt-7 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        <Link href={`/login${authQuery}`} className="font-semibold text-primary underline-offset-4 hover:underline">Back to sign in</Link>
      </p>
    </section>
  );
}
