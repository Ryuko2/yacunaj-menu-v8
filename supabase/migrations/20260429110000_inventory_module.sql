-- Inventory MVP extensions (Prompt 10). Tablas base ya existen en 20260427100000;
-- aquí: columnas faltantes, tabla `purchases`, vistas surtido, trigger de movimientos.

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers (id) ON DELETE SET NULL;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS reorder_qty NUMERIC(14, 4) NOT NULL DEFAULT 0;

ALTER TABLE public.inventory_movements
  ADD COLUMN IF NOT EXISTS reference TEXT;

CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers (id) ON DELETE SET NULL,
  invoice TEXT,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_received ON public.purchases (supplier_id, received_at DESC);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchases_mgr_all ON public.purchases;
CREATE POLICY purchases_mgr_all ON public.purchases FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.active = true AND p.role IN ('owner', 'manager')
  )
);

CREATE OR REPLACE VIEW public.v_inventory_status AS
SELECT
  i.id,
  i.sku,
  i.nombre AS name,
  i.base_unit AS unit,
  i.category,
  i.supplier_id,
  i.avg_unit_cost AS cost_per_unit,
  i.stock_actual AS stock_qty,
  i.stock_min AS reorder_point,
  i.reorder_qty,
  i.active,
  (i.stock_actual <= i.stock_min) AS needs_reorder,
  GREATEST(
    COALESCE(i.reorder_qty, 0)::numeric,
    GREATEST(0::numeric, (i.stock_min - i.stock_actual))
  )::numeric(14, 4) AS suggested_qty
FROM public.inventory_items i;

CREATE OR REPLACE VIEW public.v_supplier_purchases AS
SELECT
  s.id,
  s.nombre AS name,
  COALESCE(SUM(p.total), 0)::numeric(12, 2) AS total_30d
FROM public.suppliers s
LEFT JOIN public.purchases p ON p.supplier_id = s.id AND p.received_at >= (now() - interval '30 days')
GROUP BY s.id, s.nombre;

GRANT SELECT ON public.v_inventory_status, public.v_supplier_purchases TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_apply_inventory_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.inventory_items
  SET
    stock_actual = stock_actual + NEW.qty_signed,
    updated_at = now()
  WHERE id = NEW.inventory_item_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_movements_apply ON public.inventory_movements;
CREATE TRIGGER trg_inventory_movements_apply
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_apply_inventory_movement();

INSERT INTO public.inventory_items (sku, nombre, base_unit, category, stock_actual, stock_min, reorder_qty, avg_unit_cost, active)
SELECT v.sku, v.nombre, v.unit, v.cat, v.st, v.rp, v.rq, v.cost, true
FROM (
  VALUES
    ('SEED-CAFE-1KG', 'Café en grano 1kg', 'g', 'cafe', 0::numeric, 500::numeric, 1000::numeric, 280::numeric),
    ('SEED-LECHE-1L', 'Leche entera 1L', 'ml', 'leche', 0::numeric, 2::numeric, 12::numeric, 28::numeric),
    ('SEED-VASO-12OZ', 'Vasos 12oz', 'pza', 'empaque', 0::numeric, 50::numeric, 200::numeric, 1.5::numeric)
) AS v(sku, nombre, unit, cat, st, rp, rq, cost)
WHERE NOT EXISTS (SELECT 1 FROM public.inventory_items LIMIT 1);
