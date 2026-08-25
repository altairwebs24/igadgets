import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/cart";
import { productsQuery } from "@/lib/store";

type OrderRow = {
  id: string;
  total: number;
  payment_status: string;
  status: string;
  created_at: string;
  email: string | null;
};

type ItemRow = { name: string; quantity: number; unit_price: number; order_id: string };

export function InsightsAdmin() {
  const { data: products = [] } = useQuery(productsQuery);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["insights-orders"],
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,total,payment_status,status,created_at,email")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const { data: visits = [] } = useQuery({
    queryKey: ["insights-visits"],
    queryFn: async (): Promise<{ session_id: string; created_at: string }[]> => {
      const { data, error } = await supabase
        .from("site_visits")
        .select("session_id,created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["insights-items"],
    queryFn: async (): Promise<ItemRow[]> => {
      const { data, error } = await supabase
        .from("order_items")
        .select("name,quantity,unit_price,order_id");
      if (error) throw error;
      return (data ?? []) as ItemRow[];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading insights…</p>;

  const paid = orders.filter((order) => order.payment_status === "paid");
  const paidIds = new Set(paid.map((order) => order.id));
  const revenue = paid.reduce((sum, order) => sum + Number(order.total), 0);
  const aov = paid.length ? revenue / paid.length : 0;
  const conversion = orders.length ? (paid.length / orders.length) * 100 : 0;

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const revenue30 = paid
    .filter((order) => new Date(order.created_at).getTime() >= since)
    .reduce((sum, order) => sum + Number(order.total), 0);

  const customers = new Set(paid.map((order) => order.email ?? "")).size;

  const bestSellers = Object.entries(
    items
      .filter((item) => paidIds.has(item.order_id))
      .reduce<Record<string, { units: number; revenue: number }>>((acc, item) => {
        const entry = acc[item.name] ?? { units: 0, revenue: 0 };
        entry.units += item.quantity;
        entry.revenue += item.quantity * Number(item.unit_price);
        acc[item.name] = entry;
        return acc;
      }, {}),
  )
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  const lowStock = products
    .filter((product) => product.is_active && product.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const cards = [
    { label: "Revenue (paid)", value: formatPrice(revenue) },
    { label: "Last 30 days", value: formatPrice(revenue30) },
    { label: "Paid orders", value: String(paid.length) },
    { label: "Avg order value", value: formatPrice(aov) },
    { label: "Checkout conversion", value: `${conversion.toFixed(0)}%` },
    { label: "Customers", value: String(customers) },
  ];

  return (
    <div className="space-y-10">
      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-background p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-black">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="border border-border">
          <h3 className="border-b border-border p-4 text-[11px] font-semibold uppercase tracking-[0.3em]">
            Best sellers
          </h3>
          {bestSellers.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No paid orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {bestSellers.map(([name, stat]) => (
                <li key={name} className="flex justify-between gap-4 p-4 text-sm">
                  <span>{name}</span>
                  <span className="text-muted-foreground">{stat.units} sold</span>
                  <span className="font-semibold">{formatPrice(stat.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-border">
          <h3 className="border-b border-border p-4 text-[11px] font-semibold uppercase tracking-[0.3em]">
            Low stock
          </h3>
          {lowStock.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((product) => (
                <li key={product.id} className="flex justify-between gap-4 p-4 text-sm">
                  <span>{product.name}</span>
                  <span className="font-semibold">{product.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="border border-border">
        <h3 className="border-b border-border p-4 text-[11px] font-semibold uppercase tracking-[0.3em]">
          Recent orders
        </h3>
        {orders.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {orders.slice(0, 8).map((order) => (
              <li key={order.id} className="flex flex-wrap justify-between gap-3 p-4 text-sm">
                <span>{order.email ?? "Guest"}</span>
                <span className="text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-ZA")}
                </span>
                <span className="text-muted-foreground uppercase tracking-[0.2em] text-[11px]">
                  {order.payment_status}
                </span>
                <span className="font-semibold">{formatPrice(Number(order.total))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
