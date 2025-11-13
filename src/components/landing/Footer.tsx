const Footer = () => {
  return (
    <footer className="bg-muted py-12">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 justify-items-center">
          <div className="max-w-xs text-center">
            <h3 className="font-bold text-lg mb-4 text-foreground">RecipeVault</h3>
            <p className="text-muted-foreground text-sm">
              Your personal recipe storage solution for the modern kitchen.
            </p>
          </div>

          <div className="text-center">
            <h4 className="font-semibold mb-4 text-foreground">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div className="text-center">
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="border border-border rounded-md pt-8 mt-2 text-center text-sm text-muted-foreground">
          <p className="px-4 pb-6">&copy; 2025 RecipeVault. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
