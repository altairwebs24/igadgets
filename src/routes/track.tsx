import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";

import { formatPrice } from "@/lib/cart";
import { ORDER_STATUSES, trackOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — iGadgets" },
      {
        name: "description",
        content: "Enter your order reference and email to see where your iGadgets order is.",
      },
      { property: "og:title", content: "Track Your Order — iGadgets" },
      {
        property: "og:description",
        content: "Live status for your iGadgets order, from payment to delivery.",
      },
    ],
  }),
  component: TrackPage,
});

type Result = Awaited<ReturnType<typeof trackOrder>>;

function TrackPage() {
  const track = useServerFn(trackOrder);
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await track({ data: { reference, email } }));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const timeline = ORDER_STATUSES.filter((status) => status !== "cancelled");
  const activeIndex = result ? timeline.indexOf(result.status as (typeof timeline)[number]) : -1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-black uppercase tracking-tight">Track your order</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Use the order reference from your confirmation page together with the email you checked out
        with.
      </p>

      <form onSubmit={onSubmit} className="mt-10 grid gap-4 sm:grid-cols-2">
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Order reference"
          required
          className="h-12 border border-border bg-background px-4 text-sm"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Email address"
          required
          className="h-12 border border-border bg-background px-4 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-12 bg-foreground text-[11px] font-semibold uppercase tracking-[0.3em] text-background disabled:opacity-50 sm:col-span-2"
        >
          {loading ? "Looking up…" : "Track order"}
        </button>
      </form>

      {error && <p className="mt-6 border border-border p-4 text-sm">{error}</p>}

      {result && (
        <div className="mt-12 border border-border">
          <div className="flex flex-wrap justify-between gap-3 border-b border-border p-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em]">
              #{result.id.slice(0, 8)}
            </span>
            <span className="text-sm text-muted-foreground">
              {new Date(result.createdAt).toLocaleDateString("en-ZA")}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em]">
              {result.paymentStatus}
            </span>
          </div>

          <ol className="grid gap-px bg-border sm:grid-cols-5">
            {timeline.map((status, index) => (
              <li key={status} className="bg-background p-4">
                <p
                  className={`text-[10px] font-semibold uppercase tracking-[0.25em] ${
                    index <= activeIndex ? "text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  {status}
                </p>
                <div
                  className={`mt-3 h-1 ${index <= activeIndex ? "bg-foreground" : "bg-border"}`}
                />
              </li>
            ))}
          </ol>

          <ul className="divide-y divide-border border-t border-border">
            {result.items.map((item, index) => (
              <li key={index} className="flex flex-wrap justify-between gap-3 p-4 text-sm">
                <span>
                  {item.name}
                  {item.variantLabel ? ` — ${item.variantLabel}` : ""} × {item.quantity}
                </span>
                <span className="font-semibold">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex justify-between border-t border-border p-5 text-sm">
            <span className="text-muted-foreground">
              Delivery {result.deliveryFee === 0 ? "(free)" : ""}
            </span>
            <span>{formatPrice(result.deliveryFee)}</span>
          </div>
          <div className="flex justify-between border-t border-border p-5 text-base font-black uppercase">
            <span>Total</span>
            <span>{formatPrice(result.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
