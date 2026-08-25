import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const lineSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(200),
  variantLabel: z.string().max(200).nullable().optional(),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(50),
});

const checkoutSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(40),
  address: z.string().min(5).max(500),
  origin: z.string().url(),
  items: z.array(lineSchema).min(1).max(50),
});

const DELIVERY_FEE = 99;

/** Checks whether the shopper has any previous paid order (first order ships free). */
export const checkFirstOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("email", data.email.toLowerCase())
      .eq("payment_status", "paid");
    const isFirstOrder = (count ?? 0) === 0;
    return { isFirstOrder, deliveryFee: isFirstOrder ? 0 : DELIVERY_FEE };
  });

/** Creates the order and a Yoco hosted checkout, returning the redirect URL. */
export const createCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data }) => {
    const secret = process.env["YOCO_SECRET_KEY"];
    if (!secret) throw new Error("Payments are not configured yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    // Re-price from the database — never trust client prices.
    const ids = [...new Set(data.items.map((item) => item.productId))];
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id,name,price,is_active")
      .in("id", ids);
    if (productsError) throw productsError;

    const priced = data.items.map((item) => {
      const product = products?.find((entry) => entry.id === item.productId);
      if (!product || !product.is_active) throw new Error(`${item.name} is no longer available.`);
      // variant price deltas are already reflected in the line price; clamp to product price floor
      const unitPrice = Math.max(Number(product.price), 0) + Math.max(item.price - Number(product.price), 0);
      return { ...item, unitPrice, name: product.name };
    });

    const subtotal = priced.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

    const { count } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .eq("payment_status", "paid");
    const freeDelivery = (count ?? 0) === 0;
    const deliveryFee = freeDelivery ? 0 : DELIVERY_FEE;
    const total = subtotal + deliveryFee;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        email,
        full_name: data.fullName,
        phone: data.phone,
        address: data.address,
        total,
        delivery_fee: deliveryFee,
        free_delivery: freeDelivery,
        status: "pending",
        payment_status: "unpaid",
      })
      .select("id")
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      priced.map((line) => ({
        order_id: order.id,
        product_id: line.productId,
        name: line.name,
        variant_label: line.variantLabel ?? null,
        unit_price: line.unitPrice,
        quantity: line.quantity,
      })),
    );
    if (itemsError) throw itemsError;

    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(total * 100),
        currency: "ZAR",
        successUrl: `${data.origin}/checkout/success?order=${order.id}`,
        cancelUrl: `${data.origin}/cart`,
        failureUrl: `${data.origin}/cart`,
        metadata: { orderId: order.id },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[yoco] checkout failed", response.status, detail);
      throw new Error("We couldn't start the payment. Please try again.");
    }

    const checkout = (await response.json()) as { id: string; redirectUrl: string };
    await supabaseAdmin
      .from("orders")
      .update({ yoco_checkout_id: checkout.id })
      .eq("id", order.id);

    return { orderId: order.id, redirectUrl: checkout.redirectUrl, total, deliveryFee, freeDelivery };
  });

/** Confirms payment with Yoco after the shopper returns from checkout. */
export const confirmOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const secret = process.env["YOCO_SECRET_KEY"];
    if (!secret) throw new Error("Payments are not configured yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id,total,payment_status,yoco_checkout_id,free_delivery")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw error;
    if (!order) throw new Error("Order not found.");
    if (order.payment_status === "paid") {
      return { paid: true, total: Number(order.total), freeDelivery: order.free_delivery };
    }
    if (!order.yoco_checkout_id) return { paid: false, total: Number(order.total), freeDelivery: order.free_delivery };

    const response = await fetch(
      `https://payments.yoco.com/api/checkouts/${order.yoco_checkout_id}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    if (!response.ok) {
      console.error("[yoco] status lookup failed", response.status);
      return { paid: false, total: Number(order.total), freeDelivery: order.free_delivery };
    }

    const checkout = (await response.json()) as {
      status?: string;
      paymentId?: string;
functions: never;
    };
    const paid = (checkout.status ?? "").toLowerCase() === "completed";
    if (paid) {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "paid",
          status: "paid",
          paid_at: new Date().toISOString(),
          yoco_payment_id: checkout.paymentId ?? null,
        })
        .eq("id", order.id);
    }
    return { paid, total: Number(order.total), freeDelivery: order.free_delivery };
  });
