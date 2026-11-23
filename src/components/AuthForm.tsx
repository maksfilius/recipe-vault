"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getAuthRedirectUrl } from "@/src/lib/auth";
import { identifyAnalytics, rememberPendingSignup, trackAnalytics } from "@/src/lib/analytics";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import { getImportAuthDestination } from "@/src/lib/auth-destination";
import { env } from "@/src/lib/env";
import { getOAuthErrorCode, getOAuthRedirectTo, OAUTH_ERROR_MESSAGES } from "@/src/lib/oauth";
import { HANDOFF_FAILED_MESSAGE, PENDING_RECIPE_IMPORT_STORAGE_KEY, readPendingRecipeSource, takePendingRecipeError } from "@/src/lib/pending-recipe-import";
import { supabase } from "@/src/lib/supabase-client";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

type AuthFormProps = { type: "login" | "register" };

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
const registerSchema = loginSchema.extend({
  username: z.string().min(2, "Enter at least 2 characters."),
  password: z.string().min(8, "Use at least 8 characters."),
  repeatPassword: z.string(),
}).refine((values) => values.password === values.repeatPassword, {
  message: "Passwords do not match.",
  path: ["repeatPassword"],
});
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = getImportAuthDestination(searchParams.get("next"));
  const authQuery = destination === "/dashboard" ? "" : `?next=${encodeURIComponent(destination)}`;
  const isSharedLink = new URLSearchParams(destination.split("?")[1] ?? "").has("url");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState(() => {
    const oauthError = getOAuthErrorCode(searchParams.get("auth_error"));
    return oauthError ? OAUTH_ERROR_MESSAGES[oauthError] : "";
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // extension/library-handoff.js and the landing preview stage the draft before this page hydrates.
  const [hasPendingDraft, setHasPendingDraft] = useState(false);
  const [handoffFailed, setHandoffFailed] = useState(false);
  useEffect(() => {
    try { setHasPendingDraft(Boolean(window.sessionStorage.getItem(PENDING_RECIPE_IMPORT_STORAGE_KEY))); } catch { /* No draft to mention. */ }
    if (takePendingRecipeError()) setHandoffFailed(true);
  }, []);
  const form = useForm<LoginValues | RegisterValues>({
    resolver: zodResolver(type === "login" ? loginSchema : registerSchema),
    defaultValues: { email: "", password: "", ...(type === "register" ? { username: "", repeatPassword: "" } : {}) },
  });

  // The pending recipe stays in this tab's sessionStorage while Google and Supabase redirect back to it.
  const continueWithGoogle = async () => {
    setNotice("");
    setIsGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getOAuthRedirectTo(window.location.origin, destination), skipBrowserRedirect: true },
      });
      if (error || !data.url) throw error ?? new Error("No sign-in URL");
      // Supabase answers a disabled or misconfigured provider with a JSON error instead of a redirect.
      const check = await fetch(data.url, { redirect: "manual", credentials: "omit" }).catch(() => null);
      if (!check) { setNotice(OAUTH_ERROR_MESSAGES.offline); setIsGoogleLoading(false); return; }
      if (check.type !== "opaqueredirect") { setNotice(OAUTH_ERROR_MESSAGES.unavailable); setIsGoogleLoading(false); return; }
      window.location.assign(data.url);
    } catch {
      setNotice(OAUTH_ERROR_MESSAGES.failed);
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (values: LoginValues | RegisterValues) => {
    const entryPoint = readPendingRecipeSource() ?? (isSharedLink ? "share" : "landing");
    if (type === "register") trackAnalytics("signup_started", { entry_point: entryPoint });
    setIsLoading(true);
    setNotice("");
    try {
      if (type === "register") {
        const registration = values as RegisterValues;
        const { data, error } = await supabase.auth.signUp({
          email: registration.email,
          password: registration.password,
          options: { data: { username: registration.username }, emailRedirectTo: getAuthRedirectUrl(destination) },
        });
        if (error) {
          form.setError("email", { message: getFriendlyAuthErrorMessage(error.message) });
          return;
        }
        if (!data.session) {
          if (data.user) rememberPendingSignup(data.user.id, entryPoint);
          setRegisteredEmail(registration.email);
          form.reset();
          return;
        }
        if (data.user) {
          void identifyAnalytics(data.user.id).then(() => trackAnalytics("signup_completed", { entry_point: entryPoint }));
        }
      } else {
        const login = values as LoginValues;
        const { data, error } = await supabase.auth.signInWithPassword({ email: login.email, password: login.password });
        if (error) {
          form.setError("password", { message: getFriendlyAuthErrorMessage(error.message) });
          return;
        }
        if (data.user) void identifyAnalytics(data.user.id).then(() => trackAnalytics("login_completed", { entry_point: entryPoint }));
      }
      router.replace(destination);
    } catch {
      setNotice("Could not connect. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h1 className="text-3xl font-semibold leading-tight">
        {registeredEmail ? "Check your email" : type === "login" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {registeredEmail
          ? "Confirm your address to finish creating your account."
          : type === "login"
            ? "Sign in to open your recipe collection."
            : "Save recipes and make them easy to find again."}
      </p>
      {hasPendingDraft ? <p className="mt-4 rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-6">Your recipe draft is waiting. Sign in, then review and save it.</p> : null}
      {handoffFailed ? <p className="mt-4 rounded-xl border border-destructive bg-card px-4 py-3 text-sm leading-6 text-destructive" role="alert">{HANDOFF_FAILED_MESSAGE}</p> : null}

      {registeredEmail ? (
        <div className="mt-7" role="status" aria-live="polite">
          <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">We sent a confirmation link to <span className="break-words font-semibold text-foreground">{registeredEmail}</span>.</p>
          <Button asChild className="mt-6 w-full"><Link href={`/login${authQuery}`}>Go to sign in</Link></Button>
        </div>
      ) : (
        <>
          {searchParams.get("reset") === "success" && type === "login" ? (
            <p className="mt-5 rounded-xl border border-border bg-muted px-4 py-3 text-sm" role="status">Password updated. Sign in with your new password.</p>
          ) : null}
          {notice ? <p className="mt-5 rounded-xl border border-destructive bg-card px-4 py-3 text-sm text-destructive" role="alert">{notice}</p> : null}
          {env.googleAuthEnabled ? (
            <>
              <Button type="button" variant="ghost" className="mt-7 w-full" onClick={continueWithGoogle} disabled={isGoogleLoading || isLoading}>
                <GoogleMark />{isGoogleLoading ? "Opening Google…" : "Continue with Google"}
              </Button>
              <p className="mt-5 flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">or with email</p>
            </>
          ) : null}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={env.googleAuthEnabled ? "mt-5 space-y-5" : "mt-7 space-y-5"}>
              {type === "register" ? (
                <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem><FormLabel>Your name</FormLabel><FormControl><Input autoComplete="nickname" placeholder="How should we call you?" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              ) : null}
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" autoComplete="email" placeholder="name@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" autoComplete={type === "register" ? "new-password" : "current-password"} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              {type === "login" ? (
                <div className="text-right"><Link href={`/forgot-password${authQuery}`} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Forgot password?</Link></div>
              ) : (
                <FormField control={form.control} name="repeatPassword" render={({ field }) => (
                  <FormItem><FormLabel>Repeat password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? (type === "login" ? "Signing in…" : "Creating account…") : (type === "login" ? "Sign in" : "Create account")}
              </Button>
            </form>
          </Form>
          {type === "register" ? (
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">By creating an account, you agree to our <Link href="/terms" className="font-semibold text-primary underline-offset-2 hover:underline">Terms</Link> and <Link href="/privacy" className="font-semibold text-primary underline-offset-2 hover:underline">Privacy Policy</Link>.</p>
          ) : null}
          <p className="mt-7 border-t border-border pt-5 text-center text-sm text-muted-foreground">
            {type === "login" ? "New to Keep & Cook?" : "Already have an account?"}{" "}
            <Link href={`${type === "login" ? "/register" : "/login"}${authQuery}`} className="font-semibold text-primary underline-offset-4 hover:underline">
              {type === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </>
      )}
    </section>
  );
}

// Google's "G" in its own colours, as Google's sign-in branding guidelines require.
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
