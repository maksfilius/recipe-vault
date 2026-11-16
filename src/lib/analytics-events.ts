// Deliberately accept unknown input: no recipe text, URL, email, or free-form error
// can leave the app through the analytics client.
const allowed = {
  landing_viewed: { referrer_category: ["direct", "search", "social", "other", "unknown"] },
  url_import_started: { source_kind: ["website", "youtube", "other_video"] },
  import_preview_shown: { source_kind: ["website", "youtube", "other_video"], has_ingredients: "boolean", has_steps: "boolean", has_image: "boolean" },
  import_failed: { source: ["url", "extension", "video"], reason: ["network", "blocked", "unsupported_page", "no_recipe", "missing_ingredients", "missing_steps", "invalid_url", "rate_limited", "handoff_expired", "server_error", "unknown"] },
  signup_started: { entry_point: ["landing", "dashboard", "share", "extension"] },
  signup_completed: { entry_point: ["landing", "dashboard", "share", "extension"] },
  login_completed: { entry_point: ["landing", "dashboard", "share", "extension"] },
  recipe_saved: { source: ["manual", "url", "extension", "video"], is_first_recipe: "boolean" },
  recipe_updated: { source: ["manual", "url", "extension", "video"] },
  recipe_opened: { entry_point: ["dashboard", "search", "after_save", "other"] },
  cook_mode_started: { recipe_origin: ["saved", "preview"] },
  cook_mode_completed: { recipe_origin: ["saved", "preview"], step_count_bucket: ["1-3", "4-7", "8+"] },
  recipe_exported: { format: ["txt", "json", "print"] },
  extension_handoff_completed: { was_authenticated: "boolean" },
  share_target_received: { kind: ["site", "youtube", "tiktok", "instagram", "none"] },
  extension_handoff_failed: { reason: ["handoff_expired", "invalid_url", "server_error", "unknown"] },
} as const;

export type WebAnalyticsEvent = keyof typeof allowed;

export function sanitizeAnalyticsEvent(event: string, input: Record<string, unknown>): Record<string, string | boolean> | null {
  if (!Object.hasOwn(allowed, event)) return null;
  const rules = allowed[event as WebAnalyticsEvent] as Record<string, readonly string[] | string>;
  const output: Record<string, string | boolean> = {};
  for (const [key, rule] of Object.entries(rules)) {
    const value = input[key];
    if (rule === "boolean" && typeof value === "boolean") output[key] = value;
    else if (Array.isArray(rule) && typeof value === "string" && rule.includes(value)) output[key] = value;
  }
  return output;
}

export function getStepCountBucket(count: number): "1-3" | "4-7" | "8+" {
  return count <= 3 ? "1-3" : count <= 7 ? "4-7" : "8+";
}

export function getImportSourceKind(value: string): "website" | "youtube" | "other_video" {
  try {
    const host = new URL(value).hostname.toLowerCase();
    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "youtube";
    if (["tiktok.com", "instagram.com", "vimeo.com"].some((domain) => host === domain || host.endsWith(`.${domain}`))) return "other_video";
  } catch { /* Invalid URLs are handled by import validation. */ }
  return "website";
}

export function minimizeAnalyticsCapture(
  capture: { event: string; uuid: string; timestamp?: Date; properties: Record<string, unknown> },
  projectToken: string,
  authenticated: boolean,
) {
  const uuid = (value: unknown) => typeof value === "string" && /^[a-f0-9-]{36}$/i.test(value) ? value : undefined;
  const transport = {
    token: projectToken,
    ...(uuid(capture.properties.distinct_id) ? { distinct_id: uuid(capture.properties.distinct_id) } : {}),
  };
  if (capture.event === "$identify") {
    return { event: capture.event, uuid: capture.uuid, timestamp: capture.timestamp, properties: {
      ...transport,
      ...(uuid(capture.properties.$anon_distinct_id) ? { $anon_distinct_id: uuid(capture.properties.$anon_distinct_id) } : {}),
    } };
  }
  const safe = sanitizeAnalyticsEvent(capture.event, capture.properties);
  if (!safe) return null;
  return { event: capture.event, uuid: capture.uuid, timestamp: capture.timestamp, properties: {
    ...transport, ...safe, surface: "web", consent_version: 1, is_authenticated: authenticated,
  } };
}
