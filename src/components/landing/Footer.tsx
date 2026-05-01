import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-background py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="max-w-sm">
            <h3 className="mb-4 text-lg font-bold text-foreground">Keep &amp; Cook</h3>
            <p className="text-sm text-muted-foreground">
              A clean home for the recipes you actually cook.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="transition-colors hover:text-foreground">Features</a></li>
              <li><a href="#cta" className="transition-colors hover:text-foreground">Get started</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="transition-colors hover:text-foreground">Sign in</Link></li>
              <li><Link href="/register" className="transition-colors hover:text-foreground">Create account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-2 rounded-md border border-border px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Keep &amp; Cook. Built for home cooks.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
