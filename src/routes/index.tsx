import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import heroVideo from "@/assets/hero-video.asset.json";
import showcaseVideo from "@/assets/showcase-video.asset.json";
import logo from "@/assets/logo.asset.json";
import { AutoVideo } from "@/components/auto-video";
import { ProductCard } from "@/components/product-card";
import { collectionsQuery, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "iGadgets — iPhone Cases, Powerbanks & Accessories" },
      {
        name: "description",
        content:
          "Shop iPhone accessories at iGadgets: trending gear, new arrivals, powerbanks and covers in clean black and white.",
      },
      { property: "og:title", content: "iGadgets — The iPhone Accessory Store" },
      {
        property: "og:description",
        content: "Trending gear, new arrivals, powerbanks and covers for your iPhone.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: collections = [] } = useQuery(collectionsQuery);
  const { data: products = [] } = useQuery(productsQuery);

  const featured = products.filter((product) => product.is_featured).slice(0, 8);
  const latest = (featured.length ? featured : products).slice(0, 8);

  return (
    <div>
      <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-foreground">
        <AutoVideo
          src={heroVideo.url}
          className="absolute inset-0 size-full object-cover opacity-60"
        />
        <div className="relative z-10 flex size-full flex-col items-center justify-center px-6 text-center">
          <img src={logo.url} alt="iGadgets" className="h-24 w-auto invert sm:h-32" />
          <h1 className="mt-6 max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-tight text-background sm:text-6xl">
            Gear that keeps up with your iPhone
          </h1>
          <p className="mt-4 max-w-xl text-sm text-background/70">
            Covers, powerbanks and everyday accessories — no colour, no clutter.
          </p>
          <Link
            to="/collections"
            className="mt-8 inline-flex h-12 items-center border border-background px-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-background transition-colors hover:bg-background hover:text-foreground"
          >
            Shop the store
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Collections
        </h2>
        <div className="mt-6 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to="/collections/$slug"
              params={{ slug: collection.slug }}
              className="group bg-background p-8 transition-colors hover:bg-foreground hover:text-background"
            >
              <h3 className="text-2xl font-black uppercase tracking-tight">{collection.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground group-hover:text-background/70">
                {collection.description}
              </p>
              <span className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.3em]">
                Shop →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Featured
          </h2>
          <Link
            to="/collections"
            className="text-[11px] font-semibold uppercase tracking-[0.3em] underline"
          >
            View all
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="mt-6 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No products yet — add your first product from the admin panel.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-20 grid items-stretch gap-px bg-border md:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden bg-foreground">
          <AutoVideo src={showcaseVideo.url} className="absolute inset-0 size-full object-cover" />
        </div>
        <div className="flex flex-col justify-center bg-background p-10 sm:p-16">
          <h2 className="text-3xl font-black uppercase leading-tight tracking-tight sm:text-5xl">
            Built for daily use
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Every item in the store is picked for one reason: it survives real life. Drops,
            commutes, long days off the charger.
          </p>
          <Link
            to="/collections"
            className="mt-8 inline-flex h-12 w-fit items-center bg-foreground px-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-background"
          >
            Browse everything
          </Link>
        </div>
      </section>
    </div>
  );
}
