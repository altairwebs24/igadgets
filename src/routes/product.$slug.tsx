import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { formatPrice, useCart } from "@/lib/cart";
import { primaryImage, productQuery } from "@/lib/store";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const label = params.slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    return {
      meta: [
        { title: `${label} — iGadgets` },
        {
          name: "description",
          content: `${label} at iGadgets — iPhone accessories built for daily use.`,
        },
        { property: "og:title", content: `${label} — iGadgets` },
        { property: "og:description", content: `${label} at iGadgets.` },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { add, setOpen } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);

  if (isLoading) {
    return <p className="mx-auto max-w-7xl px-4 py-20 text-sm text-muted-foreground">Loading…</p>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <h1 className="text-3xl font-black uppercase">Product not found</h1>
        <Link to="/collections" className="mt-4 inline-block text-sm underline">
          Back to the store
        </Link>
      </div>
    );
  }

  const media = [...(product.product_media ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const active = media[activeIndex] ?? media[0];
  const soldOut = product.stock <= 0;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden border border-border bg-muted">
          {active ? (
            active.media_type === "video" ? (
              <video
                src={active.url}
                className="size-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={active.url}
                alt={active.alt_text ?? product.name}
                className="size-full object-cover"
              />
            )
          ) : (
            <div className="flex size-full items-center justify-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              No media
            </div>
          )}
        </div>
        {media.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {media.map((entry, index) => (
              <button
                key={entry.id}
                onClick={() => setActiveIndex(index)}
                className={`size-20 overflow-hidden border ${
                  index === activeIndex ? "border-foreground" : "border-border"
                }`}
                aria-label={`View media ${index + 1}`}
              >
                {entry.media_type === "video" ? (
                  <video src={entry.url} className="size-full object-cover" muted />
                ) : (
                  <img src={entry.url} alt="" className="size-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lg:pl-6">
        <h1 className="text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl">
          {product.name}
        </h1>
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-semibold">{formatPrice(Number(product.price))}</span>
          {product.compare_at_price ? (
            <span className="text-base text-muted-foreground line-through">
              {formatPrice(Number(product.compare_at_price))}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {soldOut ? "Sold out" : `${product.stock} in stock`}
        </p>

        {product.description && (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <button
          disabled={soldOut}
          onClick={() => {
            add({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: Number(product.price),
              image: primaryImage(product),
            });
            setOpen(true);
            toast.success("Added to your bag");
          }}
          className="mt-8 h-14 w-full bg-foreground text-[11px] font-semibold uppercase tracking-[0.3em] text-background disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {soldOut ? "Sold out" : "Add to bag"}
        </button>
        <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Checkout / payments coming soon
        </p>
      </div>
    </div>
  );
}
