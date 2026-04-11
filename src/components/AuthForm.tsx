"use client"

import { zodResolver } from "@hookform/resolvers/zod";
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

export default function AuthForm({type}: AuthFormProps) {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
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
          setNotice({
            type: "success",
            message: "Account created. Check your email to confirm your address before signing in.",
          });
          form.reset({
            email: registerValues.email,
            password: "",
            username: registerValues.username,
            repeatPassword: "",
          });
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
    <div className="min-h-screen bg-[#111827] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 bg-[#1F2937] rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
          {formTitles[type]}
        </h2>
        {searchParams.get("reset") === "success" && type === "login" ? (
          <div className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            Password updated. Sign in with your new password.
          </div>
        ) : null}
        {notice ? (
          <div
            className={[
              "mb-4 rounded-lg border px-4 py-3 text-sm",
              notice.type === "error"
                ? "border-red-400/40 bg-red-500/10 text-red-100"
                : "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
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
    </div>
    </div>
  )
}
