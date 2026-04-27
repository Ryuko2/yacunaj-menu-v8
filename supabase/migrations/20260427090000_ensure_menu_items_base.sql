-- Proyectos nuevos o sin migraciones 20250305: Phase 1 hace ALTER en menu_items.
-- Esta migración es idempotente y corre antes de 20260427100000_*.

CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2),
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'variable')),
  category TEXT NOT NULL DEFAULT 'comida',
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active menu items" ON public.menu_items;
CREATE POLICY "Public read active menu items" ON public.menu_items
  FOR SELECT USING (active = true);
