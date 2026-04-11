"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { getFriendlyAuthErrorMessage } from "@/src/lib/auth-errors";
import { isAccountDeletionEnabled } from "@/src/lib/env";
import { supabase } from "@/src/lib/supabase-client";

type Notice = {
  type: "success" | "error";
  message: string;
};

export default function Settings() {
  const router = useRouter();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [profileName, setProfileName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSigningOutOthers, setIsSigningOutOthers] = useState(false);
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

      const metadata = user.user_metadata as
        | { username?: string; full_name?: string }
        | undefined;

      setProfileName(metadata?.username ?? metadata?.full_name ?? "");
      setEmail(user.email ?? "");
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

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingProfile(true);
    setNotice(null);

    const nextName = profileName.trim();

    const { error } = await supabase.auth.updateUser({
      data: {
        username: nextName,
        full_name: nextName,
      },
    });

    if (error) {
      setNotice({ type: "error", message: getFriendlyAuthErrorMessage(error.message) });
      setIsSavingProfile(false);
      return;
    }

    router.refresh();
    setNotice({ type: "success", message: "Profile updated." });
    setIsSavingProfile(false);
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

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your profile, change your password, and manage active sessions.
        </p>
      </div>

      <form
        onSubmit={handleProfileSubmit}
        className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-5"
      >
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This name is shown in the dashboard header.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Display name / username</span>
          <Input
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            autoComplete="nickname"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Email</span>
          <Input value={email} readOnly disabled />
        </label>

        <Button type="submit" disabled={isSavingProfile}>
          {isSavingProfile ? "Saving..." : "Save profile"}
        </Button>
      </form>

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

        <Button
          type="button"
          variant="ghost"
          onClick={handleSignOutOtherSessions}
          disabled={isSigningOutOthers}
        >
          {isSigningOutOthers ? "Signing out..." : "Sign out other sessions"}
        </Button>
      </div>

      <form
        onSubmit={handleDeleteAccount}
        className="space-y-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-5"
      >
        <div>
          <h2 className="text-lg font-semibold text-foreground">Delete account</h2>
          <p className="mt-1 text-sm text-red-100/80">
            This permanently deletes your account and all saved recipes.
          </p>
        </div>

        {isAccountDeletionEnabled() ? (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Type DELETE to confirm</span>
              <Input
                value={deleteConfirmation}
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <Button
              type="submit"
              variant="ghost"
              className="border-red-400/50 text-red-100 hover:bg-red-500/20"
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? "Deleting..." : "Delete account"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-red-100/80">
            Set `SUPABASE_SERVICE_ROLE_KEY` on the server to enable secure account deletion before launch.
          </p>
        )}
      </form>
    </section>
  );
}
