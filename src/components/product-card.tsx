import { Link } from "@tanstack/react-router";

import { formatPrice } from "@/lib/cart";
import { primaryImage, type Product } from "@/lib/store";

export function ProductCard({ product }: { product: Product }) {
  const image = primaryImage(product);

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block border border-border"
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 border-t border-border p-4">
        <div>
          <h3 className="text-sm font-semibold">{product.name}</h3>
          {product.stock <= 0 && (
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Sold out
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">{formatPrice(Number(product.price))}</p>
          {product.compare_at_price ? (
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(Number(product.compare_at_price))}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
