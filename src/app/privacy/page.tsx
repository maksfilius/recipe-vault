import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Keep & Cook.",
};

const updatedAt = "April 21, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
            Legal
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {updatedAt}</p>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            This Privacy Policy explains what information Keep &amp; Cook collects, how we use it,
            and what choices you have when using the service.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Information We Collect</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>We collect information you provide directly, including:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Account details such as email address and display name or username.</li>
              <li>Content you save in the app, including recipes, notes, links, and favorites.</li>
              <li>Messages or requests you send if you contact us for support.</li>
            </ul>
            <p>We also collect limited technical data needed to run and secure the service, such as session data, IP address, browser information, and basic server logs.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">How We Use Information</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>To create and manage your account.</li>
            <li>To store, display, edit, and delete your saved recipes.</li>
            <li>To authenticate users and keep accounts secure.</li>
            <li>To respond to support requests and service issues.</li>
            <li>To maintain, improve, and protect the service.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">How Information Is Shared</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>We do not sell your personal information.</p>
            <p>
              We may share information with service providers that help operate Keep &amp; Cook,
              such as hosting, authentication, and database infrastructure providers.
            </p>
            <p>
              We may also disclose information if required by law or if reasonably necessary to
              protect the rights, safety, and security of users or the service.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Data Retention</h2>
          <p className="text-muted-foreground">
            We keep account and recipe data for as long as your account remains active, and for a
            limited period afterward when reasonably necessary for security, legal compliance,
            dispute resolution, or backup and recovery purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Choices</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>You can update your profile information from the account settings page.</p>
            <p>
              You can request deletion of your account from the settings page. When your account
              is deleted, your saved recipes and account information are removed from the active
              service, subject to limited retention described above.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Security</h2>
          <p className="text-muted-foreground">
            We use reasonable technical and organizational measures to protect personal
            information, but no method of transmission or storage is completely secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">International Users</h2>
          <p className="text-muted-foreground">
            If you use Keep &amp; Cook from outside the country where the service is operated, your
            information may be processed in other countries where our service providers operate.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Children&apos;s Privacy</h2>
          <p className="text-muted-foreground">
            Keep &amp; Cook is not intended for children under 13, and we do not knowingly collect
            personal information from children under 13.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Changes To This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. If we make material changes, we
            will update the date at the top of this page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            For privacy questions, contact the operator of Keep &amp; Cook through the support
            channel or contact address you provide for the service before launch.
          </p>
        </section>

        <p className="border-t border-border/60 pt-6 text-sm text-muted-foreground">
          See also the{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
