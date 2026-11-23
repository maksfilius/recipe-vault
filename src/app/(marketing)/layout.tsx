import type { ReactNode } from "react";

import Footer from "@/src/components/landing/Footer";
import Header from "@/src/components/landing/Header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen scroll-smooth bg-background">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
