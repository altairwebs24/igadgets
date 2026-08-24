import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/product-card";
import { collectionsQuery, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/collections/$slug")({
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
          content: `Shop the ${label} collection at iGadgets: iPhone accessories picked for daily use.`,
        },
        { property: "og:title", content: `${label} — iGadgets` },
        {
          property: "og:description",
          content: `Shop the ${label} collection at iGadgets.`,
        },
      ],
    };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const { data: collections = [] } = useQuery(collectionsQuery);
  const { data: products = [], isLoading } = useQuery(productsQuery);

  const collection = collections.find((entry) => entry.slug === slug);
  const items = collection
    ? products.filter((product) =>
        (product.product_collections ?? []).some(
          (link) => link.collection_id === collection.id,
        ),
      )
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Link
        to="/collections"
        className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground"
      >
        ← All collections
      </Link>
      <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-6xl">
        {collection?.name ?? slug}
      </h1>
      {collection?.description && (
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">{collection.description}</p>
      )}

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nothing in this collection yet.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
