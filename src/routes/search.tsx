import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ProductCard } from "@/components/product-card";
import { productsQuery } from "@/lib/store";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — iGadgets" },
      {
        name: "description",
        content: "Search iGadgets for iPhone cases, powerbanks, cables and accessories.",
      },
      { property: "og:title", content: "Search — iGadgets" },
      { property: "og:description", content: "Find the iPhone accessory you need." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [term, setTerm] = useState("");
  const { data: products = [] } = useQuery(productsQuery);

  const query = term.trim().toLowerCase();
  const results = query
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description ?? "").toLowerCase().includes(query),
      )
    : products;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-black uppercase tracking-tight sm:text-6xl">Search</h1>
      <input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder="Search products"
        className="mt-8 h-14 w-full border border-border bg-background px-4 text-sm outline-none focus:border-foreground"
      />
      {results.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No matches.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
