import { supabase } from "@/integrations/supabase/client";

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type ProductMedia = {
  id: string;
  product_id: string;
  url: string;
  media_type: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  option_name: string;
  option_value: string;
  price_delta: number;
  stock: number;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  product_media: ProductMedia[];
  product_variants?: ProductVariant[];
  product_collections?: { collection_id: string }[];
};

const PRODUCT_SELECT =
  "id,name,slug,description,price,compare_at_price,stock,is_featured,is_active,sort_order,product_media(id,product_id,url,media_type,alt_text,is_primary,sort_order),product_variants(id,product_id,option_name,option_value,price_delta,stock,sort_order),product_collections(collection_id)";

export function primaryImage(product: Pick<Product, "product_media">) {
  const media = [...(product.product_media ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return media.find((entry) => entry.media_type === "image")?.url ?? media[0]?.url ?? null;
}

/** Groups flat variant rows into option groups, e.g. Colour -> [Black, White]. */
export function variantGroups(product: Pick<Product, "product_variants">) {
  const groups = new Map<string, ProductVariant[]>();
  for (const variant of [...(product.product_variants ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )) {
    const existing = groups.get(variant.option_name) ?? [];
    existing.push(variant);
    groups.set(variant.option_name, existing);
  }
  return [...groups.entries()].map(([name, options]) => ({ name, options }));
}

export const collectionsQuery = {
  queryKey: ["collections"],
  queryFn: async (): Promise<Collection[]> => {
    const { data, error } = await supabase
      .from("collections")
      .select("id,name,slug,description,sort_order,is_active")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
};

export const productsQuery = {
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
};

export function productQuery(slug: string) {
  return {
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as Product) ?? null;
    },
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Uploads to the private bucket and returns a permanent, token-free URL served
 * by /api/public/media/* so media keeps working on every deployment.
 */
export async function uploadProductMedia(file: File) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("product-media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  return {
    url: `/api/public/media/${path}`,
    storage_path: path,
    media_type: file.type.startsWith("video") ? "video" : "image",
  };
}
