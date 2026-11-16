"use client";

import { minimizeAnalyticsCapture, sanitizeAnalyticsEvent, type WebAnalyticsEvent } from "./analytics-events";

const CONSENT_KEY = "keep-and-cook-analytics-consent-v1";
const PENDING_SIGNUP_KEY = "keep-and-cook-analytics-pending-signup-v1";
const PROJECT_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const enabled = process.env.NODE_ENV === "production" && Boolean(PROJECT_KEY);
type PostHog = typeof import("posthog-js")["default"];
let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
let identifiedUserId: string | null = null;

export function getAnalyticsConsent(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "yes" ? true : value === "no" ? false : null;
  } catch { return null; }
}

export function setAnalyticsConsent(consent: boolean): void {
  try { window.localStorage.setItem(CONSENT_KEY, consent ? "yes" : "no"); } catch { return; }
  if (consent) void getClient();
  else {
    client?.reset();
    client?.opt_out_capturing();
    client = null;
    identifiedUserId = null;
    try { window.localStorage.removeItem(PENDING_SIGNUP_KEY); } catch { /* Optional metric. */ }
  }
  window.dispatchEvent(new Event("keep-and-cook:analytics-consent"));
}

async function getClient(): Promise<PostHog | null> {
  if (!enabled || getAnalyticsConsent() !== true) return null;
  if (client) return client;
  if (loading) return loading;
  loading = import("posthog-js").then(({ default: posthog }) => {
    if (getAnalyticsConsent() !== true) return null;
    posthog.init(PROJECT_KEY!, {
      api_host: "https://eu.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_external_dependency_loading: true,
      disable_surveys: true,
      advanced_disable_flags: true,
      capture_heatmaps: false,
      capture_performance: false,
      opt_out_capturing_by_default: true,
      persistence: "localStorage",
      person_profiles: "identified_only",
      before_send: (capture) => getAnalyticsConsent() === true
        ? minimizeAnalyticsCapture(capture, PROJECT_KEY!, identifiedUserId !== null) : null,
    });
    posthog.opt_in_capturing({ captureEventName: false });
    client = posthog;
    return posthog;
  }).catch(() => null).finally(() => { loading = null; });
  return loading;
}

export function trackAnalytics(event: WebAnalyticsEvent, properties: Record<string, unknown> = {}): void {
  const safe = sanitizeAnalyticsEvent(event, properties);
  if (!safe || getAnalyticsConsent() !== true) return;
  void getClient().then((posthog) => {
    if (posthog && getAnalyticsConsent() === true) posthog.capture(event, safe);
  });
}

export async function identifyAnalytics(userId: string): Promise<void> {
  if (!/^[a-f0-9-]{36}$/i.test(userId)) return;
  const posthog = await getClient();
  if (posthog && getAnalyticsConsent() === true) {
    posthog.identify(userId);
    identifiedUserId = userId;
  }
}

export function resetAnalyticsIdentity(): void { client?.reset(); identifiedUserId = null; }

type SignupEntryPoint = "landing" | "extension" | "share";

export function rememberPendingSignup(userId: string, entryPoint: SignupEntryPoint): void {
  if (getAnalyticsConsent() !== true) return;
  try { window.localStorage.setItem(PENDING_SIGNUP_KEY, `${userId}:${entryPoint}`); } catch { /* Optional metric. */ }
}

export function consumePendingSignup(userId: string): SignupEntryPoint | null {
  try {
    const stored = window.localStorage.getItem(PENDING_SIGNUP_KEY);
    const entryPoint = stored?.startsWith(`${userId}:`) ? stored.slice(userId.length + 1) : null;
    if (entryPoint !== "landing" && entryPoint !== "extension" && entryPoint !== "share") return null;
    window.localStorage.removeItem(PENDING_SIGNUP_KEY);
    return entryPoint;
  } catch { return null; }
}

export function analyticsIsConfigured(): boolean { return enabled; }
