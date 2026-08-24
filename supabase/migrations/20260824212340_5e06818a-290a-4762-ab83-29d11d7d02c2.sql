REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY "public read collections" ON public.collections;
CREATE POLICY "anon read active collections" ON public.collections FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "auth read collections" ON public.collections FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(),'admin'));

DROP POLICY "public read products" ON public.products;
CREATE POLICY "anon read active products" ON public.products FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "auth read products" ON public.products FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(),'admin'));