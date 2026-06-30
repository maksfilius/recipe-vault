"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, LogIn } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  getAuthRedirectUrl,
} from "@/src/lib/auth";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {supabase} from "@/src/lib/supabase-client";

interface AuthFormProps {
  type: 'login' | 'register'
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  repeatPassword: z.string(),
}).refine((data) => data.password === data.repeatPassword, {
  message: "Passwords don't match.",
  path: ["repeatPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

const formTitles = {
  login: 'Login',
  register: 'Register'
};

const submitLabels = {
  login: "Sign in",
  register: "Create account",
};

const emailConfirmationMessage = "Check your email to confirm your address before signing in.";

export default function AuthForm({type}: AuthFormProps) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const schema = type === "login" ? loginSchema : registerSchema;

  const form = useForm<LoginValues | RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      ...(type === "register"
        ? { username: "", repeatPassword: "" }
        : {}),
    }
  });

  async function onSubmit(values: LoginValues | RegisterValues) {
    try {
      setLoading(true);
      setNotice(null);

      if (type === "register") {
        const registerValues = values as RegisterValues;

        const { data, error } = await supabase.auth.signUp({
          email: registerValues.email,
          password: registerValues.password,
          options: {
            data: {
              username: registerValues.username,
            },
            emailRedirectTo: getAuthRedirectUrl("/dashboard"),
          },
        });

        if (error) {
          form.setError("email", { message: getFriendlyAuthErrorMessage(error.message) });
          return;
        }

        if (!data.session) {
          setRegisteredEmail(registerValues.email);
          form.reset();
          return;
        }

        router.replace("/dashboard");
      } else {
        const loginValues = values as LoginValues;

        const { error } = await supabase.auth.signInWithPassword({
          email: loginValues.email,
          password: loginValues.password,
        });

        if (error) {
          form.setError("password", { message: getFriendlyAuthErrorMessage(error.message) });
          return;
        }

        router.replace("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,hsl(var(--primary)_/_0.18),transparent_32%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)_/_0.55))] px-4">
      <div className="w-full max-w-md rounded-[1.25rem] border border-border/70 bg-card/92 p-8 shadow-[0_22px_60px_hsl(var(--foreground)_/_0.12)] backdrop-blur">
        <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
          {type === "register" && registeredEmail ? "Account created" : formTitles[type]}
        </h2>
        {type === "register" && registeredEmail ? (
          <div className="text-center" role="status" aria-live="polite">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200">
              <CheckCircle2 className="size-7" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground/80">
              {emailConfirmationMessage}
            </p>
            <p className="mt-2 break-words text-sm font-semibold text-foreground">
              {registeredEmail}
            </p>
            <Button asChild className="mt-7 w-full">
              <Link href="/login">
                <LogIn aria-hidden="true" />
                Go to login
              </Link>
            </Button>
          </div>
        ) : (
          <>
        {searchParams.get("reset") === "success" && type === "login" ? (
          <div
            className="mb-4 rounded-lg border border-emerald-600/45 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-sm dark:border-emerald-400/60 dark:bg-emerald-500/20 dark:text-emerald-50"
            role="status"
            aria-live="polite"
          >
            Password updated. Sign in with your new password.
          </div>
        ) : null}
        {notice ? (
          <div
            className={[
              "mb-4 rounded-lg border px-4 py-3 text-sm",
              notice.type === "error"
                ? "border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-100"
                : "border-emerald-500/45 bg-emerald-500/15 font-medium text-emerald-900 dark:text-emerald-100",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            {notice.message}
          </div>
        ) : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            { type == "register" && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Name"
                        autoComplete="nickname"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) }
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Password"
                      autoComplete={type === "register" ? "new-password" : "current-password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type === "login" ? (
              <div className="-mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            ) : null}
            { type == "register" && (
              <FormField
                control={form.control}
                name="repeatPassword"
                render={({ field }) => (
                  <FormItem>
                  <FormLabel>Repeat Password</FormLabel>
                  <FormControl>
                      <Input
                        type="password"
                        placeholder="Repeat Password"
                        autoComplete="new-password"
                        {...field}
                      />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                )}
              />
            ) }
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Loading..." : submitLabels[type]}
            </Button>
            {type === "register" ? (
              <p className="text-center text-xs leading-5 text-foreground/70">
                By creating an account, you agree to our
                <span className="block">
                  <Link href="/terms" className="font-semibold text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-semibold text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </p>
            ) : null}
          </form>
          <p className="mt-5 text-center text-sm text-foreground/75">
            {type === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <Link
              href={type === "login" ? "/register" : "/login"}
              className="font-semibold text-primary hover:underline"
            >
              {type === "login" ? "Create one" : "Sign in"}
            </Link>
          </p>
      </Form>
          </>
        )}
    </div>
    </div>
  )
}
