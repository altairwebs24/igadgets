import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { collectionsQuery, slugify, type Collection } from "@/lib/store";

export function CollectionsAdmin() {
  const queryClient = useQueryClient();
  const { data: collections = [] } = useQuery(collectionsQuery);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["collections"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("collections").insert({
        name,
        slug: slugify(name),
        description: description || null,
        sort_order: collections.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      invalidate();
      toast.success("Collection added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Collection> }) => {
      const { error } = await supabase.from("collections").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Collection removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
        className="space-y-3 border border-border p-5"
      >
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em]">New collection</h2>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          className="h-11 w-full border border-border px-3 text-sm outline-none focus:border-foreground"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          rows={3}
          className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="h-11 w-full bg-foreground text-[11px] font-semibold uppercase tracking-[0.3em] text-background"
        >
          Add collection
        </button>
      </form>

      <ul className="divide-y divide-border border border-border">
        {collections.map((collection) => (
          <li key={collection.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="flex-1">
              <input
                defaultValue={collection.name}
                onBlur={(event) =>
                  event.target.value !== collection.name &&
                  update.mutate({ id: collection.id, values: { name: event.target.value } })
                }
                className="w-full border-b border-transparent bg-transparent text-sm font-semibold outline-none focus:border-border"
              />
              <p className="mt-1 text-xs text-muted-foreground">/{collection.slug}</p>
            </div>
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em]">
              <input
                type="checkbox"
                checked={collection.is_active}
                onChange={(event) =>
                  update.mutate({
                    id: collection.id,
                    values: { is_active: event.target.checked },
                  })
                }
              />
              Active
            </label>
            <input
              type="number"
              defaultValue={collection.sort_order}
              onBlur={(event) =>
                update.mutate({
                  id: collection.id,
                  values: { sort_order: Number(event.target.value) },
                })
              }
              className="h-9 w-16 border border-border px-2 text-sm"
              aria-label="Sort order"
            />
            <button
              aria-label="Delete collection"
              onClick={() => remove.mutate(collection.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
