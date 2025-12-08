"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import {useState} from "react";
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
}

export default function AuthForm({type}: AuthFormProps) {
  const [isLoading, setLoading] = useState<boolean>(false);

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

      if (type === "register") {
        const registerValues = values as RegisterValues;

        const { data, error } = await supabase.auth.signUp({
          email: registerValues.email,
          password: registerValues.password,
          options: {
            data: {
              username: registerValues.username,
            },
          },
        });

        if (error) {
          form.setError("email", { message: error.message });
          return;
        }

        // TODO: Redirect
      } else {
        const loginValues = values as LoginValues;

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginValues.email,
          password: loginValues.password,
        });

        if (error) {
          form.setError("password", { message: error.message });
          return;
        }
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
                      <Input placeholder="Name" {...field} />
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
                    <Input type="email" placeholder="Email" {...field} />
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
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            { type == "register" && (
              <FormField
                control={form.control}
                name="repeatPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repeat Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Repeat Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) }
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Loading..." : "Submit"}
            </Button>
          </form>
      </Form>
    </div>
    </div>
  )
}
