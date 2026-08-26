import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/store";

const IPHONE_MODELS = [
  "iPhone XR",
  "iPhone XS",
  "iPhone XS Max",
  "iPhone 11",
  "iPhone 11 Pro",
  "iPhone 11 Pro Max",
  "iPhone 12 mini",
  "iPhone 12",
  "iPhone 12 Pro",
  "iPhone 12 Pro Max",
  "iPhone 13 mini",
  "iPhone 13",
  "iPhone 13 Pro",
  "iPhone 13 Pro Max",
  "iPhone 14",
  "iPhone 14 Plus",
  "iPhone 14 Pro",
  "iPhone 14 Pro Max",
  "iPhone 15",
  "iPhone 15 Plus",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "iPhone 16e",
  "iPhone 16",
  "iPhone 16 Plus",
  "iPhone 16 Pro",
  "iPhone 16 Pro Max",
  "iPhone 17",
  "iPhone 17 Air",
  "iPhone 17 Pro",
  "iPhone 17 Pro Max",
];

const COLOURS = [
  "Black",
  "White",
  "Clear",
  "Grey",
  "Navy",
  "Blue",
  "Green",
  "Red",
  "Pink",
  "Purple",
  "Beige",
  "Brown",
  "Gold",
  "Silver",
  "Orange",
  "Yellow",
];

const PRESETS = [
  { name: "Phone model", options: IPHONE_MODELS },
  { name: "Colour", options: COLOURS },
];

export function VariantsAdmin({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [custom, setCustom] = useState({ option_name: "Type", option_value: "" });

  const existing = product.product_variants ?? [];
  const has = (name: string, value: string) =>
    existing.some((v) => v.option_name === name && v.option_value === value);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["product"] });
  };

  const addMany = useMutation({
    mutationFn: async ({ name, values }: { name: string; values: string[] }) => {
      const rows = values.map((value, index) => ({
        product_id: product.id,
        option_name: name,
        option_value: value,
        price_delta: 0,
        stock: 0,
        sort_order: existing.length + index,
      }));
      if (rows.length === 0) return;
      const { error } = await supabase.from("product_variants").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      setSelected((prev) => ({ ...prev, [variables.name]: new Set() }));
      setCustom((prev) => ({ ...prev, option_value: "" }));
      invalidate();
      toast.success("Variations added");
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
    mutationFn: async ({ id, price_delta }: { id: string; price_delta: number }) => {
      const { error } = await supabase
        .from("product_variants")
        .update({ price_delta })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  function toggle(name: string, value: string) {
    setSelected((prev) => {
      const next = new Set(prev[name] ?? []);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [name]: next };
    });
  }

  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Variations
      </h3>

      {PRESETS.map((preset) => {
        const picked = selected[preset.name] ?? new Set<string>();
        const available = preset.options.filter((option) => !has(preset.name, option));
        return (
          <div key={preset.name} className="mt-4 border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em]">{preset.name}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelected((prev) => ({ ...prev, [preset.name]: new Set(available) }))
                  }
                  className="text-[10px] uppercase tracking-[0.2em] underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setSelected((prev) => ({ ...prev, [preset.name]: new Set() }))}
                  className="text-[10px] uppercase tracking-[0.2em] underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {available.map((option) => {
                const on = picked.has(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(preset.name, option)}
                    className={`border px-3 py-1.5 text-xs ${
                      on ? "border-foreground bg-foreground text-background" : "border-border"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
              {available.length === 0 && (
                <p className="text-xs text-muted-foreground">All added.</p>
              )}
            </div>
            <button
              type="button"
              disabled={picked.size === 0 || addMany.isPending}
              onClick={() => addMany.mutate({ name: preset.name, values: [...picked] })}
              className="mt-3 h-9 bg-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-background disabled:bg-muted disabled:text-muted-foreground"
            >
              Add {picked.size > 0 ? `${picked.size} ` : ""}
              {preset.name.toLowerCase()}
            </button>
          </div>
        );
      })}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!custom.option_value.trim()) return;
          addMany.mutate({
            name: custom.option_name.trim() || "Option",
            values: [custom.option_value.trim()],
          });
        }}
        className="mt-4 flex flex-wrap gap-2"
      >
        <input
          value={custom.option_name}
          onChange={(event) => setCustom({ ...custom, option_name: event.target.value })}
          placeholder="Custom option (Type)"
          className="h-10 w-44 border border-border px-3 text-sm"
        />
        <input
          value={custom.option_value}
          onChange={(event) => setCustom({ ...custom, option_value: event.target.value })}
          placeholder="Value"
          className="h-10 w-44 border border-border px-3 text-sm"
        />
        <button
          type="submit"
          className="h-10 border border-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.25em]"
        >
          Add
        </button>
      </form>

      <ul className="mt-4 divide-y divide-border border border-border">
        {existing.map((variant) => (
          <li key={variant.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <span className="min-w-28 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
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
                  update.mutate({ id: variant.id, price_delta: Number(event.target.value) })
                }
                className="h-9 w-24 border border-border px-2 text-sm"
              />
            </label>
            <button aria-label="Delete variant" onClick={() => remove.mutate(variant.id)}>
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {existing.length === 0 && (
          <li className="p-3 text-sm text-muted-foreground">No variations yet.</li>
        )}
      </ul>
    </div>
  );
}
