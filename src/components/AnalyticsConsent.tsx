"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { analyticsIsConfigured, consumePendingSignup, getAnalyticsConsent, identifyAnalytics, resetAnalyticsIdentity, setAnalyticsConsent, trackAnalytics } from "@/src/lib/analytics";
import { supabase } from "@/src/lib/supabase-client";

function referrerCategory(): "direct" | "search" | "social" | "other" | "unknown" {
  if (!document.referrer) return "direct";
  try {
    const host = new URL(document.referrer).hostname;
    if (host === window.location.hostname) return "direct";
    if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(host)) return "search";
    if (/instagram\.|facebook\.|tiktok\.|pinterest\.|reddit\./.test(host)) return "social";
    return "other";
  } catch { return "unknown"; }
}

export default function AnalyticsConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const refresh = () => setConsent(getAnalyticsConsent());
    refresh();
    window.addEventListener("keep-and-cook:analytics-consent", refresh);
    return () => window.removeEventListener("keep-and-cook:analytics-consent", refresh);
  }, []);

  useEffect(() => {
    if (!consent) return;
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        void identifyAnalytics(data.user.id);
        const entryPoint = consumePendingSignup(data.user.id);
        if (entryPoint) trackAnalytics("signup_completed", { entry_point: entryPoint });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") resetAnalyticsIdentity();
      else if (event === "SIGNED_IN" && session?.user) {
        void identifyAnalytics(session.user.id);
        const entryPoint = consumePendingSignup(session.user.id);
        if (entryPoint) trackAnalytics("signup_completed", { entry_point: entryPoint });
      }
    });
    return () => subscription.unsubscribe();
  }, [consent]);

  useEffect(() => {
    if (pathname !== "/" || !consent) return;
    try {
      if (window.sessionStorage.getItem("keep-and-cook-landing-viewed-v1")) return;
      window.sessionStorage.setItem("keep-and-cook-landing-viewed-v1", "1");
    } catch { /* Tracking is optional when storage is unavailable. */ }
    trackAnalytics("landing_viewed", { referrer_category: referrerCategory() });
  }, [pathname, consent]);

  if (!analyticsIsConfigured() || consent !== null) return null;
  return (
    <aside className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-2xl rounded-xl border border-border bg-card p-4 text-sm text-foreground shadow-xl" aria-label="Analytics choice">
      <p>Help us improve Keep &amp; Cook with limited usage events. Recipe content and email are never sent. <Link href="/privacy" className="underline">Privacy Policy</Link></p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground" onClick={() => setAnalyticsConsent(true)}>Allow analytics</button>
        <button type="button" className="min-h-11 rounded-lg border border-border px-4 font-semibold" onClick={() => setAnalyticsConsent(false)}>Decline</button>
      </div>
    </aside>
  );
}
