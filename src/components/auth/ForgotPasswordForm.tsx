"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { getAuthRedirectUrl } from "@/src/lib/auth";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import { supabase } from "@/src/lib/supabase-client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setNotice(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getAuthRedirectUrl("/reset-password"),
    });

    if (error) {
      setNotice({ type: "error", message: getFriendlyAuthErrorMessage(error.message) });
      setIsLoading(false);
      return;
    }

    setNotice({
      type: "success",
      message: "Check your email for the password reset link.",
    });
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111827] px-4">
      <div className="w-full max-w-md rounded-lg bg-[#1F2937] p-8 shadow-xl">
        <h1 className="mb-3 text-center text-3xl font-bold text-foreground">Reset your password</h1>
        <p className="mb-6 text-center text-sm text-foreground/75">
          Enter the email you use for Keep &amp; Cook and we&apos;ll send a reset link.
        </p>

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
      </div>
    </div>
  );
}
