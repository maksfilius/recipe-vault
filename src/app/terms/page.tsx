import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Keep & Cook.",
};

const updatedAt = "April 21, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
            Legal
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {updatedAt}</p>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            These Terms of Service govern your use of Keep &amp; Cook. By using the service, you
            agree to these terms.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Use of the Service</h2>
          <p className="text-muted-foreground">
            You may use Keep &amp; Cook only in compliance with applicable law and these terms. You
            are responsible for maintaining the confidentiality of your account credentials.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Content</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              You retain ownership of the recipes, notes, links, and other content you submit to
              Keep &amp; Cook.
            </p>
            <p>
              You give us a limited license to host, store, process, and display that content only
              as needed to operate and improve the service for you.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Acceptable Use</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>Do not misuse the service, interfere with it, or attempt unauthorized access.</li>
            <li>Do not upload content you do not have the right to use or share.</li>
            <li>Do not use the service to violate applicable law.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Availability and Changes</h2>
          <p className="text-muted-foreground">
            We may modify, suspend, or discontinue all or part of Keep &amp; Cook at any time. We may
            also update these terms from time to time by posting a revised version on this page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Termination</h2>
          <p className="text-muted-foreground">
            You may stop using the service at any time. We may suspend or terminate access if you
            violate these terms or if continued access creates legal, security, or operational
            risk.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Disclaimers</h2>
          <p className="text-muted-foreground">
            Keep &amp; Cook is provided on an &quot;as is&quot; and &quot;as available&quot; basis,
            without warranties of any kind to the extent permitted by law. We do not guarantee
            uninterrupted availability, error-free operation, or the accuracy of user-submitted
            content.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by law, Keep &amp; Cook and its operator will not be
            liable for indirect, incidental, special, consequential, exemplary, or punitive
            damages, or for loss of data, profits, goodwill, or business interruption arising from
            your use of the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            Questions about these terms should be sent through the support channel or contact
            address you provide for the service before launch.
          </p>
        </section>

        <p className="border-t border-border/60 pt-6 text-sm text-muted-foreground">
          See also the{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
