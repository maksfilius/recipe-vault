import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import recipe | Keep & Cook",
  robots: { index: false, follow: false },
};

export default function ExtensionImportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
