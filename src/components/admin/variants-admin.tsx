import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/store";

const emptyVariant = { option_name: "Colour", option_value: "", price_delta: "0", stock: "0" };

export function VariantsAdmin({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(emptyVariant);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("product_variants").insert({
        product_id: product.id,
        option_name: draft.option_name.trim(),
        option_value: draft.option_value.trim(),
        price_delta: Number(draft.price_delta || 0),
        stock: Number(draft.stock || 0),
        sort_order: (product.product_variants ?? []).length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ ...emptyVariant, option_name: draft.option_name });
      invalidate();
      toast.success("Variant added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase.from("product_variants").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Variants (colour, phone model, type…)
      </h3>

      <ul className="mt-3 divide-y divide-border border border-border">
        {(product.product_variants ?? []).map((variant) => (
          <li key={variant.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <span className="min-w-24 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {variant.option_name}
            </span>
            <span className="flex-1 font-medium">{variant.option_value}</span>
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
              +R
              <input
                type="number"
                step="0.01"
                defaultValue={Number(variant.price_delta)}
                onBlur={(event) =>
                  update.mutate({
                    id: variant.id,
                    values: { price_delta: Number(event.target.value) },
                  })
                }
                className="h-9 w-24 border border-border px-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
              Stock
              <input
                type="number"
                defaultValue={variant.stock}
                onBlur={(event) =>
                  update.mutate({ id: variant.id, values: { stock: Number(event.target.value) } })
                }
                className="h-9 w-20 border border-border px-2 text-sm"
              />
            </label>
            <button aria-label="Delete variant" onClick={() => remove.mutate(variant.id)}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {(product.product_variants ?? []).length === 0 && (
          <li className="p-3 text-sm text-muted-foreground">No variants yet.</li>
        )}
      </ul>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          add.mutate();
        }}
        className="mt-3 flex flex-wrap gap-2"
      >
        <input
          required
          value={draft.option_name}
          onChange={(event) => setDraft({ ...draft, option_name: event.target.value })}
          placeholder="Option (Colour)"
          className="h-10 w-40 border border-border px-3 text-sm"
        />
        <input
          required
          value={draft.option_value}
          onChange={(event) => setDraft({ ...draft, option_value: event.target.value })}
          placeholder="Value (Black)"
          className="h-10 w-40 border border-border px-3 text-sm"
        />
        <input
          type="number"
          step="0.01"
          value={draft.price_delta}
          onChange={(event) => setDraft({ ...draft, price_delta: event.target.value })}
          placeholder="Extra R"
          className="h-10 w-28 border border-border px-3 text-sm"
        />
        <input
          type="number"
          value={draft.stock}
          onChange={(event) => setDraft({ ...draft, stock: event.target.value })}
          placeholder="Stock"
          className="h-10 w-24 border border-border px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 bg-foreground px-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-background"
        >
          Add variant
        </button>
      </form>
    </div>
  );
}
