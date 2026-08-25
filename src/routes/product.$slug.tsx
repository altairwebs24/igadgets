import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductCard } from "@/components/product-card";
import { formatPrice, useCart } from "@/lib/cart";
import { primaryImage, productQuery, productsQuery, variantGroups } from "@/lib/store";

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
  const navigate = useNavigate();
  const { data: product, isLoading } = useQuery(productQuery(slug));
  const { data: allProducts = [] } = useQuery(productsQuery);
  const { add, setOpen } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selection, setSelection] = useState<Record<string, string>>({});

  const groups = useMemo(() => (product ? variantGroups(product) : []), [product]);

  const related = useMemo(() => {
    if (!product) return [];
    const collectionIds = new Set(
      (product.product_collections ?? []).map((entry) => entry.collection_id),
    );
    const others = allProducts.filter((entry) => entry.id !== product.id);
    const sameCollection = others.filter((entry) =>
      (entry.product_collections ?? []).some((link) => collectionIds.has(link.collection_id)),
    );
    return [...sameCollection, ...others.filter((entry) => !sameCollection.includes(entry))].slice(
      0,
      4,
    );
  }, [product, allProducts]);

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

  const selectedVariants = groups
    .map((group) => group.options.find((option) => option.option_value === selection[group.name]))
    .filter((option): option is NonNullable<typeof option> => Boolean(option));
  const priceDelta = selectedVariants.reduce((sum, option) => sum + Number(option.price_delta), 0);
  const unitPrice = Number(product.price) + priceDelta;
  const variantLabel =
    selectedVariants.length > 0
      ? selectedVariants.map((option) => `${option.option_name}: ${option.option_value}`).join(" / ")
      : null;
  const missingSelection = groups.some((group) => !selection[group.name]);

  function addToBag() {
    if (!product) return false;
    if (missingSelection) {
      toast.error("Choose all options first");
      return false;
    }
    add({
      id: `${product.id}${variantLabel ? `|${variantLabel}` : ""}`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: unitPrice,
      image: primaryImage(product),
      variantLabel,
    });
    return true;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
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
            <span className="text-2xl font-semibold">{formatPrice(unitPrice)}</span>
            {product.compare_at_price ? (
              <span className="text-base text-muted-foreground line-through">
                {formatPrice(Number(product.compare_at_price))}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {soldOut ? "Sold out" : `${product.stock} in stock`}
          </p>

          {groups.map((group) => (
            <div key={group.name} className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em]">{group.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const isActive = selection[group.name] === option.option_value;
                  const unavailable = option.stock <= 0;
                  return (
                    <button
                      key={option.id}
                      disabled={unavailable}
                      onClick={() =>
                        setSelection((prev) => ({ ...prev, [group.name]: option.option_value }))
                      }
                      className={`border px-4 py-2 text-xs uppercase tracking-[0.15em] ${
                        isActive ? "border-foreground bg-foreground text-background" : "border-border"
                      } ${unavailable ? "cursor-not-allowed line-through opacity-40" : ""}`}
                    >
                      {option.option_value}
                      {Number(option.price_delta) !== 0
                        ? ` (+${formatPrice(Number(option.price_delta))})`
                        : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              disabled={soldOut}
              onClick={() => {
                if (addToBag()) {
                  setOpen(true);
                  toast.success("Added to your bag");
                }
              }}
              className="h-14 border border-foreground text-[11px] font-semibold uppercase tracking-[0.25em] disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground"
            >
              Add to cart
            </button>
            <button
              disabled={soldOut}
              onClick={() => {
                if (addToBag()) navigate({ to: "/checkout" });
              }}
              className="h-14 bg-foreground text-[11px] font-semibold uppercase tracking-[0.25em] text-background disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
            >
              Buy now
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Free delivery on your first order
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em]">You might like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((entry) => (
              <ProductCard key={entry.id} product={entry} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
