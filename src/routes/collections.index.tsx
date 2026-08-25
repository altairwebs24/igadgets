import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/product-card";
import { collectionsQuery, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "All Collections — iGadgets" },
      {
        name: "description",
        content:
          "Browse every iGadgets collection: trending accessories, new arrivals, powerbanks and iPhone covers.",
      },
      { property: "og:title", content: "All Collections — iGadgets" },
      {
        property: "og:description",
        content: "Every iPhone accessory in the iGadgets store, in one place.",
      },
    ],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data: collections = [] } = useQuery(collectionsQuery);
  const { data: products = [], isLoading } = useQuery(productsQuery);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl">Collections</h1>

      <div className="mt-8 flex flex-wrap gap-2">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            to="/collections/$slug"
            params={{ slug: collection.slug }}
            className="border border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] transition-colors hover:bg-foreground hover:text-background"
          >
            {collection.name}
          </Link>
        ))}
      </div>

      <h2 className="mt-14 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        All products
      </h2>
      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : products.length === 0 ? (
        <p className="mt-6 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No products yet.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
