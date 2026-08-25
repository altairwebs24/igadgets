import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Star } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  collectionsQuery,
  productsQuery,
  slugify,
  uploadProductMedia,
  type Product,
} from "@/lib/store";
import { formatPrice } from "@/lib/cart";
import { VariantsAdmin } from "@/components/admin/variants-admin";

const emptyDraft = {
  name: "",
  description: "",
  price: "",
  compare_at_price: "",
  stock: "0",
};

export function ProductsAdmin() {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery(productsQuery);
  const { data: collections = [] } = useQuery(collectionsQuery);
  const [draft, setDraft] = useState(emptyDraft);
  const [openId, setOpenId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        name: draft.name,
        slug: slugify(draft.name),
        description: draft.description || null,
        price: Number(draft.price || 0),
        compare_at_price: draft.compare_at_price ? Number(draft.compare_at_price) : null,
        stock: Number(draft.stock || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft(emptyDraft);
      invalidate();
      toast.success("Product added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase.from("products").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Product removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleCollection = useMutation({
    mutationFn: async ({
      productId,
      collectionId,
      on,
    }: {
      productId: string;
      collectionId: string;
      on: boolean;
    }) => {
      if (on) {
        const { error } = await supabase
          .from("product_collections")
          .insert({ product_id: productId, collection_id: collectionId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_collections")
          .delete()
          .eq("product_id", productId)
          .eq("collection_id", collectionId);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const mediaMutation = useMutation({
    mutationFn: async ({ product, files }: { product: Product; files: FileList }) => {
      let order = (product.product_media ?? []).length;
      for (const file of Array.from(files)) {
        const uploaded = await uploadProductMedia(file);
        const { error } = await supabase.from("product_media").insert({
          product_id: product.id,
          url: uploaded.url,
          storage_path: uploaded.storage_path,
          media_type: uploaded.media_type,
          alt_text: product.name,
          is_primary: order === 0 && uploaded.media_type === "image",
          sort_order: order,
        });
        if (error) throw error;
        order += 1;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Media uploaded");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setPrimary = useMutation({
    mutationFn: async ({ product, mediaId }: { product: Product; mediaId: string }) => {
      await supabase.from("product_media").update({ is_primary: false }).eq("product_id", product.id);
      const { error } = await supabase
        .from("product_media")
        .update({ is_primary: true })
        .eq("id", mediaId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMedia = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-10">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
        className="grid gap-3 border border-border p-5 sm:grid-cols-2"
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] sm:col-span-2">
          New product
        </h2>
        <input
          required
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          placeholder="Name"
          className="h-11 border border-border px-3 text-sm outline-none focus:border-foreground"
        />
        <input
          required
          type="number"
          step="0.01"
          value={draft.price}
          onChange={(event) => setDraft({ ...draft, price: event.target.value })}
          placeholder="Price (R)"
          className="h-11 border border-border px-3 text-sm outline-none focus:border-foreground"
        />
        <input
          type="number"
          step="0.01"
          value={draft.compare_at_price}
          onChange={(event) => setDraft({ ...draft, compare_at_price: event.target.value })}
          placeholder="Compare-at price (optional)"
          className="h-11 border border-border px-3 text-sm outline-none focus:border-foreground"
        />
        <input
          type="number"
          value={draft.stock}
          onChange={(event) => setDraft({ ...draft, stock: event.target.value })}
          placeholder="Stock"
          className="h-11 border border-border px-3 text-sm outline-none focus:border-foreground"
        />
        <textarea
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          placeholder="Description"
          rows={3}
          className="border border-border px-3 py-2 text-sm outline-none focus:border-foreground sm:col-span-2"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="h-11 bg-foreground text-[11px] font-semibold uppercase tracking-[0.3em] text-background sm:col-span-2"
        >
          Add product
        </button>
      </form>

      <ul className="divide-y divide-border border border-border">
        {products.map((product) => {
          const open = openId === product.id;
          const assigned = new Set(
            (product.product_collections ?? []).map((link) => link.collection_id),
          );
          return (
            <li key={product.id} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  className="flex-1 text-left"
                  onClick={() => setOpenId(open ? null : product.id)}
                >
                  <span className="font-semibold">{product.name}</span>
                  <span className="ml-3 text-sm text-muted-foreground">
                    {formatPrice(Number(product.price))} · {product.stock} in stock
                  </span>
                </button>
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                  <input
                    type="checkbox"
                    checked={product.is_featured}
                    onChange={(event) =>
                      update.mutate({
                        id: product.id,
                        values: { is_featured: event.target.checked },
                      })
                    }
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
                  <input
                    type="checkbox"
                    checked={product.is_active}
                    onChange={(event) =>
                      update.mutate({
                        id: product.id,
                        values: { is_active: event.target.checked },
                      })
                    }
                  />
                  Active
                </label>
                <button
                  aria-label="Delete product"
                  onClick={() => remove.mutate(product.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {open && (
                <div className="mt-5 space-y-5 border-t border-border pt-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      defaultValue={product.name}
                      onBlur={(event) =>
                        update.mutate({ id: product.id, values: { name: event.target.value } })
                      }
                      className="h-11 border border-border px-3 text-sm"
                      aria-label="Name"
                    />
                    <input
                      defaultValue={product.slug}
                      onBlur={(event) =>
                        update.mutate({ id: product.id, values: { slug: event.target.value } })
                      }
                      className="h-11 border border-border px-3 text-sm"
                      aria-label="Slug"
                    />
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={Number(product.price)}
                      onBlur={(event) =>
                        update.mutate({
                          id: product.id,
                          values: { price: Number(event.target.value) },
                        })
                      }
                      className="h-11 border border-border px-3 text-sm"
                      aria-label="Price"
                    />
                    <input
                      type="number"
                      defaultValue={product.stock}
                      onBlur={(event) =>
                        update.mutate({
                          id: product.id,
                          values: { stock: Number(event.target.value) },
                        })
                      }
                      className="h-11 border border-border px-3 text-sm"
                      aria-label="Stock"
                    />
                    <textarea
                      defaultValue={product.description ?? ""}
                      onBlur={(event) =>
                        update.mutate({
                          id: product.id,
                          values: { description: event.target.value || null },
                        })
                      }
                      rows={3}
                      className="border border-border px-3 py-2 text-sm sm:col-span-2"
                      aria-label="Description"
                    />
                  </div>

                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      Collections
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {collections.map((collection) => (
                        <label
                          key={collection.id}
                          className="flex items-center gap-2 border border-border px-3 py-2 text-[11px] uppercase tracking-[0.2em]"
                        >
                          <input
                            type="checkbox"
                            checked={assigned.has(collection.id)}
                            onChange={(event) =>
                              toggleCollection.mutate({
                                productId: product.id,
                                collectionId: collection.id,
                                on: event.target.checked,
                              })
                            }
                          />
                          {collection.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <VariantsAdmin product={product} />

                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                      Media
                    </h3>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      disabled={uploading}
                      onChange={async (event) => {
                        const files = event.target.files;
                        if (!files?.length) return;
                        setUploading(true);
                        await mediaMutation.mutateAsync({ product, files });
                        setUploading(false);
                        event.target.value = "";
                      }}
                      className="mt-3 block text-sm"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      {(product.product_media ?? []).map((media) => (
                        <div key={media.id} className="w-28">
                          <div className="size-28 overflow-hidden border border-border">
                            {media.media_type === "video" ? (
                              <video src={media.url} className="size-full object-cover" muted />
                            ) : (
                              <img src={media.url} alt="" className="size-full object-cover" />
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <button
                              aria-label="Set primary"
                              onClick={() => setPrimary.mutate({ product, mediaId: media.id })}
                            >
                              <Star
                                className={`size-4 ${media.is_primary ? "fill-foreground" : ""}`}
                              />
                            </button>
                            <button
                              aria-label="Delete media"
                              onClick={() => removeMedia.mutate(media.id)}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
