import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { formatPrice, useCart } from "@/lib/cart";
import { confirmOrder } from "@/lib/checkout.functions";

export const Route = createFileRoute("/checkout/success")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Order Confirmed — iGadgets" },
      { name: "description", content: "Your iGadgets order has been received." },
      { property: "og:title", content: "Order Confirmed — iGadgets" },
      { property: "og:description", content: "Thanks for shopping with iGadgets." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const confirm = useServerFn(confirmOrder);
  const { clear } = useCart();
  const [state, setState] = useState<{ paid: boolean; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("order");
    if (!orderId) {
      setError("Missing order reference.");
      return;
    }
    confirm({ data: { orderId } })
      .then((result) => {
        setState({ paid: result.paid, total: result.total });
        if (result.paid) clear();
      })
      .catch((cause: Error) => setError(cause.message));
  }, [confirm, clear]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      {error ? (
        <>
          <h1 className="text-3xl font-black uppercase">Something went wrong</h1>
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        </>
      ) : !state ? (
        <p className="text-sm text-muted-foreground">Confirming your payment…</p>
      ) : state.paid ? (
        <>
          <h1 className="text-4xl font-black uppercase">Order confirmed</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            We received {formatPrice(state.total)}. You'll get delivery details by email shortly.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-black uppercase">Payment pending</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            We haven't received confirmation yet. If money left your account, it will reflect
            shortly.
          </p>
        </>
      )}
      <Link
        to="/collections"
        className="mt-10 inline-flex h-12 items-center bg-foreground px-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-background"
      >
        Continue shopping
      </Link>
    </div>
  );
}
