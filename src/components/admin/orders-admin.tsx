import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";
import { ORDER_STATUSES } from "@/lib/orders.functions";

type OrderRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
};

export function OrdersAdmin() {
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,email,full_name,phone,address,total,status,payment_status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const update = useMutation({
    mutationFn: async (input: { id: string; status?: string; payment_status?: string }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from("orders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["insights-orders"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading orders…</p>;

  if (orders.length === 0) {
    return (
      <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No orders yet — orders appear here once shoppers check out.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border">
      {orders.map((order) => (
        <li key={order.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
          <div className="text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString("en-ZA")}
            </p>
            <p className="mt-2 font-semibold">{order.full_name ?? "Guest"}</p>
            <p className="text-muted-foreground">{order.email}</p>
            {order.phone && <p className="text-muted-foreground">{order.phone}</p>}
            {order.address && <p className="text-muted-foreground">{order.address}</p>}
            <p className="mt-2 text-base font-black">{formatPrice(Number(order.total))}</p>
          </div>

          <div className="flex flex-wrap items-start gap-3">
            <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Status
              <select
                value={order.status}
                onChange={(event) =>
                  update.mutate({ id: order.id, status: event.target.value })
                }
                className="mt-2 block h-11 w-40 border border-border bg-background px-3 text-sm normal-case tracking-normal"
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Payment
              <select
                value={order.payment_status}
                onChange={(event) =>
                  update.mutate({ id: order.id, payment_status: event.target.value })
                }
                className="mt-2 block h-11 w-40 border border-border bg-background px-3 text-sm normal-case tracking-normal"
              >
                {["unpaid", "paid", "refunded"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </li>
      ))}
    </ul>
  );
}
