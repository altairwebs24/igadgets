import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice, useCart } from "@/lib/cart";

export function CartDrawer() {
  const { items, isOpen, setOpen, subtotal, setQuantity, remove } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="text-xs font-semibold uppercase tracking-[0.3em]">
            Your bag
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <p className="py-12 text-sm text-muted-foreground">Your bag is empty.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  <div className="size-20 shrink-0 overflow-hidden border border-border bg-muted">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.slug }}
                      onClick={() => setOpen(false)}
                      className="text-sm font-semibold"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm">{formatPrice(item.price)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border border-border">
                        <button
                          className="px-2 py-1"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          className="px-2 py-1"
                          aria-label="Increase quantity"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <button
                        aria-label="Remove item"
                        onClick={() => remove(item.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-6 py-5">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="uppercase tracking-[0.25em]">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Link
            to="/cart"
            onClick={() => setOpen(false)}
            className="mt-4 flex h-12 items-center justify-center bg-foreground text-xs font-semibold uppercase tracking-[0.3em] text-background"
          >
            View bag
          </Link>
          <button
            disabled
            className="mt-2 h-12 w-full cursor-not-allowed border border-border text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground"
          >
            Checkout — coming soon
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
