import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DELIVERY_FEE, formatPrice, useCart } from "@/lib/cart";
import { checkFirstOrder, createCheckout } from "@/lib/checkout.functions";

export const Route = createFileRoute("/checkout/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Checkout — iGadgets" },
      { name: "description", content: "Secure Yoco checkout for your iGadgets order." },
      { property: "og:title", content: "Checkout — iGadgets" },
      { property: "og:description", content: "Pay securely with Yoco." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal } = useCart();
  const startCheckout = useServerFn(createCheckout);
  const lookupFirstOrder = useServerFn(checkFirstOrder);

  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "" });
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setDeliveryFee(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await lookupFirstOrder({ data: { email } });
        if (!cancelled) setDeliveryFee(result.deliveryFee);
      } catch {
        if (!cancelled) setDeliveryFee(DELIVERY_FEE);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.email, lookupFirstOrder]);

  const shipping = deliveryFee ?? DELIVERY_FEE;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">Your bag is empty</h1>
        <Link
          to="/collections"
          className="mt-8 inline-flex h-12 items-center bg-foreground px-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-background"
        >
          Shop the store
        </Link>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await startCheckout({
        data: {
          ...form,
          origin: window.location.origin,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            variantLabel: item.variantLabel,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      });
      window.location.href = result.redirectUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tight">Checkout</h1>
        <form onSubmit={submit} className="mt-8 space-y-3">
          <input
            required
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            placeholder="Full name"
            className="h-12 w-full border border-border px-4 text-sm outline-none focus:border-foreground"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="Email"
            className="h-12 w-full border border-border px-4 text-sm outline-none focus:border-foreground"
          />
          <input
            required
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            placeholder="Phone"
            className="h-12 w-full border border-border px-4 text-sm outline-none focus:border-foreground"
          />
          <textarea
            required
            rows={3}
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
            placeholder="Delivery address"
            className="w-full border border-border px-4 py-3 text-sm outline-none focus:border-foreground"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full bg-foreground text-[11px] font-semibold uppercase tracking-[0.3em] text-background disabled:opacity-60"
          >
            {loading ? "Redirecting…" : `Pay ${formatPrice(total)} with Yoco`}
          </button>
        </form>
      </div>

      <div className="border border-border p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em]">Order summary</h2>
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-sm">
              <span>
                {item.name}
                {item.variantLabel ? (
                  <span className="block text-xs text-muted-foreground">{item.variantLabel}</span>
                ) : null}
                <span className="text-muted-foreground"> × {item.quantity}</span>
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{shipping === 0 ? "Free — first order" : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
        {deliveryFee === null && (
          <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Enter your email to check for free first-order delivery
          </p>
        )}
      </div>
    </div>
  );
}
