-- Cost & margin views (Prompt 11). Depende de public.v_sales_items (Prompt 9).

CREATE OR REPLACE VIEW public.v_item_margins AS
SELECT
  mi.id,
  mi.name,
  mi.category_id,
  mi.price,
  mi.estimated_cost,
  CASE
    WHEN mi.price IS NULL OR mi.price = 0 THEN NULL
    ELSE ROUND(((mi.price - COALESCE(mi.estimated_cost, 0)) / mi.price) * 100, 2)
  END AS margin_pct,
  (mi.price - COALESCE(mi.estimated_cost, 0))::numeric(12, 2) AS margin_abs
FROM public.menu_items mi
WHERE mi.active = true;

CREATE OR REPLACE VIEW public.v_sales_costs_daily AS
SELECT
  (o.created_at AT TIME ZONE 'America/Mexico_City')::date AS day,
  SUM(((item->>'finalPrice')::numeric) * ((item->>'quantity')::numeric))::numeric(12, 2) AS revenue,
  SUM(COALESCE(mi.estimated_cost, 0) * ((item->>'quantity')::numeric))::numeric(12, 2) AS cogs,
  (SUM(((item->>'finalPrice')::numeric) * ((item->>'quantity')::numeric))
    - SUM(COALESCE(mi.estimated_cost, 0) * ((item->>'quantity')::numeric)))::numeric(12, 2) AS gross_profit
FROM public.orders o,
  jsonb_array_elements(o.items) AS item
LEFT JOIN public.menu_items mi ON mi.id::text = (item->>'id')
GROUP BY 1;

CREATE OR REPLACE VIEW public.v_top_margin_items AS
SELECT
  si.item_id,
  si.item_name,
  SUM(si.qty)::int AS qty,
  SUM(si.revenue)::numeric(12, 2) AS revenue,
  SUM(si.qty * COALESCE(mi.estimated_cost, 0))::numeric(12, 2) AS cogs,
  SUM(si.revenue - si.qty * COALESCE(mi.estimated_cost, 0))::numeric(12, 2) AS gross_profit
FROM public.v_sales_items si
LEFT JOIN public.menu_items mi ON mi.id::text = si.item_id
GROUP BY 1, 2;

GRANT SELECT ON public.v_item_margins, public.v_sales_costs_daily, public.v_top_margin_items TO authenticated;
