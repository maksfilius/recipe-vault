"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { trackAnalytics } from "@/src/lib/analytics";
import { findSharedUrl, getSharedLinkKind } from "@/src/lib/share-target";

const platformNames = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram" } as const;

function ShareTarget() {
  const router = useRouter();
  const params = useSearchParams();
  const link = findSharedUrl({ url: params.get("url"), text: params.get("text"), title: params.get("title") });
  const kind = link ? getSharedLinkKind(link) : null;
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackAnalytics("share_target_received", { kind: kind ?? "none" });
    // The dashboard handles sign-in, duplicates and the editor, exactly like a pasted link.
    if (link && kind === "site") router.replace(`/dashboard?add=select&url=${encodeURIComponent(link)}`);
  }, [kind, link, router]);

  if (kind === "site") return <p role="status" className="mt-6">Opening your recipe…</p>;

  const manualHref = link ? `/dashboard?add=manual&url=${encodeURIComponent(link)}` : "/dashboard?add=manual";
  return (
    <section className="mt-6">
      <p role="alert">
        {kind
          ? `Importing from ${platformNames[kind]} is coming soon. Add the recipe manually for now; we keep the link to the video.`
          : "This share didn't include a link. Add the recipe manually instead."}
      </p>
      <Button asChild className="mt-6"><Link href={manualHref}>Add manually</Link></Button>
    </section>
  );
}

export default function SharePage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <Link href="/" className="text-xl font-semibold tracking-tight">Keep &amp; Cook</Link>
      <h1 className="mt-12 text-3xl font-bold tracking-tight">Save a shared recipe</h1>
      <Suspense fallback={<p role="status" className="mt-6">Reading the shared link…</p>}>
        <ShareTarget />
      </Suspense>
    </main>
  );
}
