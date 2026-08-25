import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const trackSchema = z.object({
  reference: z.string().min(6).max(64),
  email: z.string().email(),
});

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

/** Looks up an order by reference + email so shoppers can track it without an account. */
export const trackOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => trackSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const reference = data.reference.trim().toLowerCase().replace(/^#/, "");

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id,status,payment_status,total,delivery_fee,created_at,paid_at,full_name")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    const order = (orders ?? []).find(
      (entry) => entry.id === reference || entry.id.slice(0, 8) === reference,
    );
    if (!order) throw new Error("We couldn't find an order with that reference and email.");

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("name,quantity,unit_price,variant_label")
      .eq("order_id", order.id);

    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
      total: Number(order.total),
      deliveryFee: Number(order.delivery_fee),
      createdAt: order.created_at,
      paidAt: order.paid_at,
      fullName: order.full_name,
      items: (items ?? []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        variantLabel: item.variant_label,
      })),
    };
  });
