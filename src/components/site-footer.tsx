import { Link } from "@tanstack/react-router";
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <img src="/logo.jpg" alt="iGadgets" className="h-12 w-auto invert" />
          <p className="mt-4 max-w-xs text-sm text-background/70">
            The iPhone accessory store. Cases, power and cables built to last.
          </p>
        </div>
        <div className="text-sm">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-background/50">
            Shop
          </h2>
          <ul className="mt-4 space-y-2">
            <li>
              <Link to="/collections">All collections</Link>
            </li>
            <li>
              <Link to="/search">Search</Link>
            </li>
            <li>
              <Link to="/cart">Cart</Link>
            </li>
            <li>
              <Link to="/track">Track your order</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-background/50">
            Store
          </h2>
          <ul className="mt-4 space-y-2">
            <li>Payments coming soon</li>
            <li>
              <Link to="/auth">Staff login</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/20 px-4 py-6 text-center text-[11px] uppercase tracking-[0.25em] text-background/50">
        © {new Date().getFullYear()} iGadgets
      </div>
    </footer>
  );
}
