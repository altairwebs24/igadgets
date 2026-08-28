import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "7-Day Refund Policy — iGadgets" },
      {
        name: "description",
        content:
          "iGadgets 7-day refund policy: if your iPhone accessory doesn't work, claim a refund or replacement within 7 days of delivery.",
      },
      { property: "og:title", content: "7-Day Refund Policy — iGadgets" },
      {
        property: "og:description",
        content: "Faulty product? Claim a refund or replacement within 7 days of delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RefundPolicyPage,
});

const STEPS = [
  {
    title: "Tell us within 7 days",
    body: "You have 7 days from the day your order is delivered to report a faulty or non-working product.",
  },
  {
    title: "Send your order number",
    body: "Email us your order number (also called your tracking ID) with a short description of the fault, plus a photo or short video if you have one.",
  },
  {
    title: "Return the item",
    body: "Send the item back in its original packaging with all cables and accessories included. Keep proof of postage.",
  },
  {
    title: "Refund or replacement",
    body: "Once we confirm the fault, you choose a full refund to your original payment method or a free replacement. Refunds are processed within 5 business days of the return arriving.",
  },
];

function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        Policy
      </p>
      <h1 className="mt-4 text-4xl font-black uppercase leading-tight tracking-tight sm:text-6xl">
        7-day refund policy
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        If a product bought on iGadgets doesn't work, you're covered for 7 days from delivery. No
        arguments, no restocking fees — a faulty item is our problem, not yours.
      </p>

      <ol className="mt-12 space-y-px bg-border">
        {STEPS.map((step, index) => (
          <li key={step.title} className="bg-background p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Step {index + 1}
            </p>
            <h2 className="mt-3 text-xl font-black uppercase tracking-tight">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-12 border border-border p-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em]">What's not covered</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>Damage from drops, water, or misuse after delivery.</li>
          <li>Items returned without their original packaging or accessories.</li>
          <li>Claims made more than 7 days after delivery.</li>
          <li>Change-of-mind returns on items that work as described.</li>
        </ul>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          to="/track"
          className="inline-flex h-12 items-center bg-foreground px-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-background"
        >
          Find your order number
        </Link>
        <Link
          to="/collections"
          className="inline-flex h-12 items-center border border-foreground px-8 text-[11px] font-semibold uppercase tracking-[0.3em]"
        >
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
