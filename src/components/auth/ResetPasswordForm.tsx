"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import { supabase } from "@/src/lib/supabase-client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const passwordError = useMemo(() => {
    if (!repeatPassword) return "";
    return password === repeatPassword ? "" : "Passwords do not match.";
  }, [password, repeatPassword]);

  useEffect(() => {
    let isMounted = true;

    const syncRecoveryState = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      const isRecoverySession =
        window.location.hash.includes("type=recovery") || Boolean(session?.access_token);

      setIsRecoveryReady(isRecoverySession);
    };

    void syncRecoveryState();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setIsRecoveryReady(true);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordError) {
      setNotice({ type: "error", message: passwordError });
      return;
    }

    setIsLoading(true);
    setNotice(null);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setNotice({ type: "error", message: getFriendlyAuthErrorMessage(error.message) });
      setIsLoading(false);
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    router.replace("/login?reset=success");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111827] px-4">
      <div className="w-full max-w-md rounded-lg bg-[#1F2937] p-8 shadow-xl">
        <h1 className="mb-3 text-center text-3xl font-bold text-foreground">Choose a new password</h1>
        <p className="mb-6 text-center text-sm text-foreground/75">
          Use a strong password you haven&apos;t used before.
        </p>

        {!isRecoveryReady ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              This reset link is missing or expired. Request a new password reset email to continue.
            </div>
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request new reset link</Link>
            </Button>
          </div>
        ) : (
          <>
            {notice ? (
              <div
                className={[
                  "mb-4 rounded-lg border px-4 py-3 text-sm",
                  notice.type === "error"
                    ? "border-red-400/40 bg-red-500/10 text-red-100"
                    : "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
                ].join(" ")}
              >
                {notice.message}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">New password</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-foreground">Repeat password</span>
                <Input
                  type="password"
                  value={repeatPassword}
                  onChange={(event) => setRepeatPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>

              {passwordError ? <p className="text-sm text-red-200">{passwordError}</p> : null}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-5 text-center text-sm text-foreground/75">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
