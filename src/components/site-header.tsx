import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { collectionsQuery } from "@/lib/store";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const { data: collections = [] } = useQuery(collectionsQuery);
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <button
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2">
          <img src={/logo.jpg} alt="iGadgets" className="h-9 w-auto dark:invert" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {collections.slice(0, 5).map((collection) => (
            <Link
              key={collection.id}
              to="/collections/$slug"
              params={{ slug: collection.slug }}
              className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-foreground"
            >
              {collection.name}
            </Link>
          ))}
          <Link
            to="/collections"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/70 transition-colors hover:text-foreground"
          >
            All
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/search" aria-label="Search">
            <Search className="size-5" />
          </Link>
          <button aria-label="Open cart" className="relative" onClick={() => setOpen(true)}>
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                to="/collections/$slug"
                params={{ slug: collection.slug }}
                onClick={() => setMenuOpen(false)}
                className="text-xs font-semibold uppercase tracking-[0.2em]"
              >
                {collection.name}
              </Link>
            ))}
            <Link
              to="/collections"
              onClick={() => setMenuOpen(false)}
              className="text-xs font-semibold uppercase tracking-[0.2em]"
            >
              All collections
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
