import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { CollectionsAdmin } from "@/components/admin/collections-admin";
import { ProductsAdmin } from "@/components/admin/products-admin";
import { InsightsAdmin } from "@/components/admin/insights-admin";
import { OrdersAdmin } from "@/components/admin/orders-admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — iGadgets" },
      { name: "description", content: "Manage the iGadgets catalogue, collections and media." },
      { property: "og:title", content: "Admin — iGadgets" },
      { property: "og:description", content: "iGadgets store administration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TABS = ["insights", "products", "collections", "orders"] as const;
type Tab = (typeof TABS)[number];

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("insights");

  const { data: session, isLoading } = useQuery({
    queryKey: ["admin-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return { user: null, isAdmin: false };
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });
      return { user: data.user, isAdmin: Boolean(isAdmin) };
    },
  });

  useEffect(() => {
    if (!isLoading && session && !session.user) {
      navigate({ to: "/auth" });
    }
  }, [isLoading, session, navigate]);


  if (isLoading) {
    return <p className="mx-auto max-w-7xl px-4 py-20 text-sm text-muted-foreground">Loading…</p>;
  }

  if (!session?.isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl font-black uppercase">No admin access</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This account isn't an administrator of the store.
        </p>
        <button
          onClick={async () => {
            await queryClient.cancelQueries();
            queryClient.clear();
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="mt-8 h-12 w-full bg-foreground text-[11px] font-semibold uppercase tracking-[0.3em] text-background"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-black uppercase tracking-tight">Admin</h1>
        <button
          onClick={async () => {
            await queryClient.cancelQueries();
            queryClient.clear();
            await supabase.auth.signOut();
            navigate({ to: "/auth", replace: true });
          }}
          className="border border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em]"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8 flex gap-2 border-b border-border">
        {TABS.map((entry) => (
          <button
            key={entry}
            onClick={() => setTab(entry)}
            className={`-mb-px border-b-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.25em] ${
              tab === entry ? "border-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            {entry}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === "insights" && <InsightsAdmin />}
        {tab === "products" && <ProductsAdmin />}
        {tab === "collections" && <CollectionsAdmin />}
        {tab === "orders" && <OrdersAdmin />}
      </div>
    </div>
  );
}
