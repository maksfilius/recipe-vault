"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import { getAnalyticsConsent, setAnalyticsConsent, trackAnalytics } from "@/src/lib/analytics";
import { clearOfflineRecipeData } from "@/src/lib/offline-recipes";
import { buildRecipeExport } from "@/src/lib/recipe-export";
import { mapRowToCollection, mapRowToRecipe, type CollectionRow, type RecipeRow } from "@/src/lib/recipes";
import type { RecipeCollection } from "@/src/types/recipe";
import { supabase } from "@/src/lib/supabase-client";
import { readThemePreference, saveThemePreference, type ThemePreference } from "@/src/lib/theme-preference";

type Notice = {
  type: "success" | "error";
  message: string;
};

type SettingsClientProps = {
  accountDeletionEnabled: boolean;
  supportEmail: string | null;
};

const themeChoices: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function subscribeTheme(onChange: () => void) {
  window.addEventListener("theme-change", onChange);
  return () => window.removeEventListener("theme-change", onChange);
}

export default function SettingsClient({ accountDeletionEnabled, supportEmail }: SettingsClientProps) {
  const router = useRouter();
  const theme = useSyncExternalStore(subscribeTheme, readThemePreference, () => "dark");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [analyticsConsent, setConsentState] = useState<boolean | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSigningOutOthers, setIsSigningOutOthers] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);
      setIsBootstrapping(false);
    };

    void bootstrap();
  }, [router]);

  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => { setConsentState(getAnalyticsConsent()); }, []);

  const handleExport = async () => {
    if (!userId) return;
    setIsExporting(true);
    setNotice(null);
    try {
      const collections: RecipeCollection[] = [];
      const recipes: RecipeRow[] = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
          .from("collections")
          .select("id, user_id, name, position, created_at")
          .eq("user_id", userId)
          .order("position", { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const page = (data ?? []) as CollectionRow[];
        collections.push(...page.map(mapRowToCollection));
        if (page.length < pageSize) break;
      }
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase
          .from("recipes")
          .select("*, recipe_collections(collection:collections(id,user_id,name,position,created_at))")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + pageSize - 1);
        if (error) throw error;
        const page = (data ?? []) as RecipeRow[];
        recipes.push(...page);
        if (page.length < pageSize) break;
      }
      const payload = buildRecipeExport(recipes.map((row) => mapRowToRecipe(row)), collections, new Date().toISOString());
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `keep-and-cook-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(anchor);
      anchor.click();
      trackAnalytics("recipe_exported", { format: "json" });
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice({ type: "success", message: "Recipe export downloaded." });
    } catch {
      setNotice({ type: "error", message: "Could not export your recipes. Try again." });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (newPassword.length < 8) {
      setNotice({ type: "error", message: "Password must be at least 8 characters." });
      return;
    }

    if (newPassword !== repeatPassword) {
      setNotice({ type: "error", message: "Passwords do not match." });
      return;
    }

    setIsSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setNotice({ type: "error", message: getFriendlyAuthErrorMessage(error.message) });
      setIsSavingPassword(false);
      return;
    }

    setNewPassword("");
    setRepeatPassword("");
    setNotice({ type: "success", message: "Password updated." });
    setIsSavingPassword(false);
  };

  const handleSignOutOtherSessions = async () => {
    setIsSigningOutOthers(true);
    setNotice(null);

    const { error } = await supabase.auth.signOut({ scope: "others" });

    if (error) {
      setNotice({ type: "error", message: getFriendlyAuthErrorMessage(error.message) });
      setIsSigningOutOthers(false);
      return;
    }

    setNotice({ type: "success", message: "Signed out from other sessions." });
    setIsSigningOutOthers(false);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);

    if (!open && !isDeletingAccount) {
      setDeleteConfirmation("");
    }
  };

  const handleDeleteAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (deleteConfirmation.trim() !== "DELETE") {
      setNotice({ type: "error", message: 'Type "DELETE" to confirm account deletion.' });
      return;
    }

    setIsDeletingAccount(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setNotice({ type: "error", message: "Session expired. Sign in again and retry." });
      setIsDeletingAccount(false);
      return;
    }

    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setNotice({
        type: "error",
        message: body?.error ?? "Failed to delete account.",
      });
      setIsDeletingAccount(false);
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    await clearOfflineRecipeData();
    router.replace("/");
  };

  if (isBootstrapping) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-border/60 bg-card/50 px-5 py-6 text-sm text-muted-foreground">
          Loading settings...
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-foreground">Settings</h1>
        <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground no-underline hover:bg-muted">
          <ArrowLeft className="size-4" aria-hidden="true" />Back to recipes
        </Link>
      </div>
      {notice ? (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
            notice.type === "error"
              ? "border-red-400/60 bg-red-500/20 text-red-100"
              : "border-emerald-400/60 bg-emerald-500/20 text-emerald-100",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          {notice.message}
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Export your recipes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download your recipes, collections, and tags as JSON.
          </p>
        </div>
        <Button type="button" onClick={() => void handleExport()} disabled={isExporting}>
          {isExporting ? "Preparing export..." : "Download JSON"}
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Theme</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose how Keep &amp; Cook looks on this device.</p>
        </div>
        <div role="group" aria-label="Theme preference" className="flex flex-wrap gap-2">
          {themeChoices.map(({ value, label }) => (
            <Button key={value} type="button" variant={theme === value ? "primary" : "ghost"} aria-pressed={theme === value} onClick={() => saveThemePreference(value)}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/50 p-5">
        <h2 className="text-lg font-semibold text-foreground">Product analytics</h2>
        <p className="text-sm text-muted-foreground">Optional usage events help us improve Keep &amp; Cook. We do not send recipe content or email. <Link href="/privacy" className="underline">Privacy details</Link></p>
        <div role="group" aria-label="Product analytics preference" className="flex flex-wrap gap-2">
          <Button type="button" variant={analyticsConsent === true ? "primary" : "ghost"} aria-pressed={analyticsConsent === true} onClick={() => { setAnalyticsConsent(true); setConsentState(true); }}>Allow analytics</Button>
          <Button type="button" variant={analyticsConsent === false ? "primary" : "ghost"} aria-pressed={analyticsConsent === false} onClick={() => { setAnalyticsConsent(false); setConsentState(false); }}>Decline</Button>
        </div>
      </div>

      <form
        onSubmit={handlePasswordSubmit}
        className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-5"
      >
        <div>
          <h2 className="text-lg font-semibold text-foreground">Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use at least 8 characters for your new password.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">New password</span>
          <Input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Repeat password</span>
          <Input
            type="password"
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <Button type="submit" disabled={isSavingPassword}>
          {isSavingPassword ? "Updating..." : "Update password"}
        </Button>
      </form>

      <div className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sessions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Revoke refresh tokens for your other devices without signing out here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSignOutOtherSessions}
            disabled={isSigningOutOthers}
          >
            {isSigningOutOthers ? "Signing out..." : "Sign out other sessions"}
          </Button>
        </div>
      </div>

      {accountDeletionEnabled ? (
        <div className="space-y-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Delete account</h2>
            <p className="mt-1 text-sm text-red-100/80">
              This permanently deletes your account and all saved recipes.
            </p>
          </div>

          <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="border-red-400/50 text-red-100 hover:bg-red-500/20"
                disabled={isDeletingAccount}
              >
                <Trash2 aria-hidden="true" />
                Delete account
              </Button>
            </DialogTrigger>
            <DialogContent className="border-red-400/35 bg-card sm:max-w-md">
              <form onSubmit={handleDeleteAccount} className="space-y-5">
                <DialogHeader>
                  <div className="mb-1 flex size-11 items-center justify-center rounded-full border border-red-400/40 bg-red-500/15 text-red-200">
                    <AlertTriangle className="size-5" aria-hidden="true" />
                  </div>
                  <DialogTitle>Delete account?</DialogTitle>
                  <DialogDescription className="leading-6">
                    This action is permanent. Your account and all saved recipes will be deleted and cannot be restored.
                  </DialogDescription>
                </DialogHeader>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Type DELETE to confirm</span>
                  <Input
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isDeletingAccount}
                  />
                </label>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost" disabled={isDeletingAccount}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    variant="ghost"
                    className="border-red-400/50 text-red-100 hover:bg-red-500/20"
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? "Deleting..." : "Delete permanently"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/50 p-5">
        <h2 className="text-lg font-semibold text-foreground">Help and legal</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <Link href="/privacy" className="text-foreground underline underline-offset-4">Privacy</Link>
          <Link href="/terms" className="text-foreground underline underline-offset-4">Terms</Link>
          <a href={supportEmail ? `mailto:${supportEmail}` : "https://github.com/maksfilius/recipe-vault/issues/new"} className="text-foreground underline underline-offset-4">Support</a>
        </div>
      </div>
    </section>
  );
}
