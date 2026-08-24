import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";

import { formatPrice, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — iGadgets" },
      {
        name: "description",
        content: "Review the iPhone accessories in your iGadgets bag before checking out.",
      },
      { property: "og:title", content: "Your Bag — iGadgets" },
      { property: "og:description", content: "Review the items in your iGadgets bag." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQuantity, remove, clear } = useCart();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl">Your bag</h1>

      {items.length === 0 ? (
        <div className="mt-10 border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">Your bag is empty.</p>
          <Link
            to="/collections"
            className="mt-6 inline-flex h-12 items-center bg-foreground px-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-background"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-10 divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.id} className="flex gap-5 py-6">
                <div className="size-24 shrink-0 overflow-hidden border border-border bg-muted">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.slug }}
                      className="font-semibold"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center border border-border">
                        <button
                          className="px-3 py-1"
                          aria-label="Decrease quantity"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          className="px-3 py-1"
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
                  <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-end gap-4">
            <div className="flex w-full max-w-sm items-center justify-between text-lg font-semibold">
              <span className="text-[11px] uppercase tracking-[0.3em]">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <button
              disabled
              className="h-14 w-full max-w-sm cursor-not-allowed border border-border text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground"
            >
              Checkout — payments coming soon
            </button>
            <button
              onClick={clear}
              className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground underline"
            >
              Clear bag
            </button>
          </div>
        </>
      )}
    </div>
  );
}
