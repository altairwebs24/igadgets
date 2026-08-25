import { createFileRoute } from "@tanstack/react-router";

/**
 * Public, token-free media endpoint.
 * Streams objects out of the private `product-media` bucket so uploaded
 * images and videos work on any deployment without expiring signed URLs.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat;
        if (!path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("product-media").download(path);
        if (error || !data) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(data.stream(), {
          headers: {
            "Content-Type": data.type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
