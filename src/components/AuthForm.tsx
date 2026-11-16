"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getAuthRedirectUrl } from "@/src/lib/auth";
import { identifyAnalytics, rememberPendingSignup, trackAnalytics } from "@/src/lib/analytics";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import { getImportAuthDestination } from "@/src/lib/recipe-import-transfer";
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
  const hasImportDraft = new URL(destination, "https://keepandcook.com").searchParams.has("importDraft");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const form = useForm<LoginValues | RegisterValues>({
    resolver: zodResolver(type === "login" ? loginSchema : registerSchema),
    defaultValues: { email: "", password: "", ...(type === "register" ? { username: "", repeatPassword: "" } : {}) },
  });

  const onSubmit = async (values: LoginValues | RegisterValues) => {
    const entryPoint = hasImportDraft ? "extension" : "landing";
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
      {hasImportDraft ? <p className="mt-4 rounded-xl border border-border bg-muted px-4 py-3 text-sm leading-6">Your recipe draft is waiting. Sign in, then review and save it.</p> : null}

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-7 space-y-5">
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
              <Button type="submit" className="w-full" disabled={isLoading}>
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
