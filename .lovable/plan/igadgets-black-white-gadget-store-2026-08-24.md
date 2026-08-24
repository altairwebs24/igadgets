# iGadgets — Black & White Gadget Store

A monochrome storefront for iPhone accessories, with a real product catalog, collections, cart, and an admin panel you control.

## What gets built

**Storefront**

- Home: full-bleed hero with your first video autoplaying muted in the background, logo lockup and headline over it; collection tiles; featured/trending products; a second showcase section with the other video; footer.
- Collections page and per-collection pages (Trending, Just In, Powerbanks, Covers to start).
- Product detail page: image/video gallery, price, description, stock, add-to-cart.
- Cart drawer + `/cart` page: quantities, remove, subtotal. Checkout button shows a "Payments coming soon" state (disabled), ready to swap in a provider later.
- Search across products.

**Admin panel** (`/admin`, login required)

- Sign in with email/password. Only accounts with the admin role get in; `Altairwebs24@gmail.com` will be seeded as admin (you sign up with that email once, then it has full access).
- Products: create/edit/delete — name, slug, description, price, compare-at price, stock, active toggle, collection assignment, sort order.
- Media: upload multiple images and videos per product to public storage; set the primary image; reorder.
- Collections: create/edit/delete/reorder your own collections beyond the four defaults.
- Orders list (populated once payments are live).

**Design**

- Strictly black and white: white background, near-black text, inverted dark sections, no color accents. Sharp corners, wide letter-spaced uppercase labels, large editorial type. Fully responsive, mobile-first.
- Your logo becomes the site logo and the favicon.

## Media handling

- Logo and both videos are uploaded to the Lovable CDN so they serve correctly from the deployed Cloudflare site.
- Videos render with `autoplay muted loop playsinline` and no controls, so they start on their own on desktop and mobile (browsers require muted for autoplay — audio will be off).
- Product media uploaded through admin goes into a public storage bucket, so images/videos are publicly viewable on the live site.

## Technical notes

- Lovable Cloud is enabled for the database, auth, and public media storage.
- Tables: `collections`, `products`, `product_media`, `product_collections`, `orders`, `order_items`, `user_roles` (roles in a separate table with a `has_role` security-definer function — never on the profile).
- Row-level security: public read on active products/collections/media; write access limited to admins. Storage bucket `product-media` is public-read, admin-write.
- Cart lives in browser local storage (no login needed to shop); orders table exists but stays unused until payments are wired.
- Routes: `/`, `/collections`, `/collections/$slug`, `/product/$slug`, `/cart`, `/search`, `/auth`, `/admin` and admin sub-routes. Each public route gets its own SEO metadata.
- Payment integration is deliberately out of scope for this build; the checkout buttonis the single place to plug it in later. Lastly Add to the CSS to globally hide anything with the ID lovable-badge 